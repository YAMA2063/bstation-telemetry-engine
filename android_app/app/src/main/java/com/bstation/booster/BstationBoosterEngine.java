package com.bstation.booster;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class BstationBoosterEngine {

    public static class VideoDetails {
        public String aid = "";
        public String title = "Video Bstation";
        public String uploader = "Kreator Bstation";
        public String views = "-";
        public boolean success = false;
    }

    public interface Listener {
        void onLog(String message, String type);
        void onStatusChange(String status, int success, int failed, int completed, int target, String liveViews, String title, String uploader, String aid, int nextRunIn);
    }

    private static final String[] USER_AGENTS = {
        "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.70 Mobile Safari/537.36",
        "Mozilla/5.0 (Linux; Android 13; 2201116SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36",
        "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
        "Mozilla/5.0 (Linux; Android 12; M2101K6G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1"
    };

    private final SecureRandom random = new SecureRandom();
    private volatile boolean isRunning = false;
    private Thread workerThread;
    private final Listener listener;

    private int successCount = 0;
    private int failCount = 0;
    private int completedCount = 0;
    private int targetCount = 10;
    private int nextRunIn = 0;
    private String currentViews = "-";
    private String videoTitle = "";
    private String uploader = "";
    private String aid = "";

    public BstationBoosterEngine(Listener listener) {
        this.listener = listener;
    }

    public static String extractAid(String input) {
        if (input == null) return "";
        Matcher m = Pattern.compile("/video/([0-9]+)|([0-9]{10,})").matcher(input);
        if (m.find()) {
            return m.group(1) != null ? m.group(1) : m.group(2);
        }
        return input.trim();
    }

    public VideoDetails fetchVideoDetails(String rawInput) {
        VideoDetails details = new VideoDetails();
        details.aid = extractAid(rawInput);
        if (details.aid.isEmpty()) {
            return details;
        }

        try {
            String pageUrl = "https://www.bilibili.tv/id/video/" + details.aid;
            String html = httpRequest("GET", pageUrl, null, USER_AGENTS[0], "bstar-web-lang=id;", "https://www.bilibili.tv/");

            // Title
            Matcher titleMatcher = Pattern.compile("<title>(.*?)</title>", Pattern.CASE_INSENSITIVE).matcher(html);
            if (titleMatcher.find()) {
                String t = titleMatcher.group(1);
                t = t.replace(" - Bstation", "").replace(" - bilibili", "").trim();
                details.title = t;
            }

            // Views
            Matcher viewMatcher = Pattern.compile("([0-9,.]+\\s*Ditonton|[0-9,.]+\\s*Views)", Pattern.CASE_INSENSITIVE).matcher(html);
            if (viewMatcher.find()) {
                details.views = viewMatcher.group(1);
            }

            // Uploader
            Matcher authorMatcher = Pattern.compile("\"author\":\"(.*?)\"|\"name\":\"(.*?)\"").matcher(html);
            if (authorMatcher.find()) {
                String u = authorMatcher.group(1) != null ? authorMatcher.group(1) : authorMatcher.group(2);
                details.uploader = u;
            }

            details.success = true;
        } catch (Exception e) {
            details.title = "Video #" + details.aid;
            details.views = "Tidak terdeteksi";
        }
        return details;
    }

    public synchronized void start(String inputAidOrUrl, int target, int minDelay, int maxDelay) {
        if (isRunning) return;
        isRunning = true;
        this.aid = extractAid(inputAidOrUrl);
        this.targetCount = target;
        this.successCount = 0;
        this.failCount = 0;
        this.completedCount = 0;
        this.nextRunIn = 0;

        workerThread = new Thread(() -> runLoop(aid, minDelay, maxDelay));
        workerThread.start();
    }

    public synchronized void stop() {
        isRunning = false;
        if (workerThread != null) {
            workerThread.interrupt();
            workerThread = null;
        }
        if (listener != null) {
            listener.onStatusChange("Dihentikan", successCount, failCount, completedCount, targetCount, currentViews, videoTitle, uploader, aid, 0);
            listener.onLog("Booster dihentikan oleh pengguna.", "warning");
        }
    }

    public boolean isRunning() {
        return isRunning;
    }

    private void runLoop(String aid, int minDelay, int maxDelay) {
        log("🚀 Memulai Bstation Boost Engine (Android Native Mode)...", "highlight");
        log("Video AID: " + aid + " | Target: " + targetCount + " sesi", "info");

        // Ambil info video awal
        VideoDetails initial = fetchVideoDetails(aid);
        if (initial.success) {
            this.videoTitle = initial.title;
            this.uploader = initial.uploader;
            this.currentViews = initial.views;
            log("Video: " + initial.title + " | Views Awal: " + initial.views, "success");
        }

        for (int i = 1; i <= targetCount && isRunning; i++) {
            completedCount = i;
            log("Memulai sesi tonton #" + i + " dari " + targetCount + "...", "info");
            updateStatus("Menjalankan sesi #" + i);

            boolean ok = simulateViewSession(aid);
            if (ok) {
                successCount++;
                log("✓ Sesi #" + i + " sukses! View dihitung oleh Bstation.", "success");
            } else {
                failCount++;
                log("✕ Sesi #" + i + " gagal mengirim sinyal.", "error");
            }

            // Periksa views berkala
            if (i % 2 == 0 || i == targetCount) {
                VideoDetails updated = fetchVideoDetails(aid);
                if (updated.success && !updated.views.equals("-") && !updated.views.equals(currentViews)) {
                    log("🎉 Views bertambah! Sekarang: " + updated.views, "highlight");
                    this.currentViews = updated.views;
                }
            }

            updateStatus("Selesai sesi #" + i);

            if (i < targetCount && isRunning) {
                int delaySec = minDelay + random.nextInt(Math.max(1, maxDelay - minDelay + 1));
                log("⏳ Menunggu jeda aman " + delaySec + "s agar tampak alami...", "info");
                try {
                    for (int s = delaySec; s > 0 && isRunning; s--) {
                        this.nextRunIn = s;
                        updateStatus("Jeda: " + s + " detik tersisa");
                        Thread.sleep(1000);
                    }
                    this.nextRunIn = 0;
                } catch (InterruptedException e) {
                    break;
                }
            }
        }

        isRunning = false;
        this.nextRunIn = 0;
        updateStatus("Selesai");
        log("🎉 Selesai! Total sukses: " + successCount + ", gagal: " + failCount + " | Views akhir: " + currentViews, "highlight");
    }

    private String generateBuvid() {
        byte[] bytes = new byte[16];
        random.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        String hex = sb.toString();
        int rNum = 10000 + random.nextInt(90000);
        return hex.substring(0, 8) + "-" + hex.substring(8, 12) + "-" + hex.substring(12, 16) + "-" + hex.substring(16, 20) + "-" + hex.substring(20, 32) + rNum + "infoc";
    }

    private String generateBuvid4() {
        byte[] bytes = new byte[16];
        random.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02X", b));
        String hex = sb.toString();
        int rNum = 10000 + random.nextInt(90000);
        return hex.substring(0, 8) + "-" + hex.substring(8, 12) + "-" + hex.substring(12, 16) + "-" + hex.substring(16, 20) + "-" + hex.substring(20, 32) + rNum + "-026100900-pezxksxcB89WWu4wt88w%2Fw%3D%3D";
    }

    private boolean simulateViewSession(String aid) {
        String buvid3 = generateBuvid();
        String buvid4 = generateBuvid4();
        String ua = USER_AGENTS[random.nextInt(USER_AGENTS.length)];
        long stime = System.currentTimeMillis() / 1000;
        int playedDuration = 81 + random.nextInt(15); // 81 - 95 detik durasi optimal
        int videoDuration = 105;

        String cookie = "buvid3=" + buvid3 + "; buvid4=" + buvid4 + "; bstar-web-lang=id;";
        String referer = "https://www.bilibili.tv/id/video/" + aid;

        try {
            // 1. PlayURL
            String playUrlStr = "https://api.bilibili.tv/intl/gateway/web/playurl?s_locale=id_ID&platform=web&aid=" + aid + "&tk=&qn=64&type=0&device=wap&tf=0&spm_id=bstar-web.ugc-video-detail.0.0&from_spm_id=";
            httpRequest("GET", playUrlStr, null, ua, cookie, referer);

            // 2. Click Report
            Map<String, String> clickParams = new HashMap<>();
            clickParams.put("user_status", "0");
            clickParams.put("spmid", "bstar-web.ugc-video-detail.0.0");
            clickParams.put("s_locale", "id");
            clickParams.put("network_type", "1");
            clickParams.put("timezone", "Asia/Jakarta");
            clickParams.put("mobi_app", "bstar_a");
            clickParams.put("detail_play_time", "0");
            clickParams.put("quality", "2");
            clickParams.put("aid", aid);
            clickParams.put("type", "3");
            clickParams.put("business", "ugc");
            clickParams.put("stime", String.valueOf(stime));
            httpRequest("POST", "https://api.bilibili.tv/intl/gateway/web/data/report/click?s_locale=id_ID&platform=web", buildFormData(clickParams), ua, cookie, referer);

            // 3. Heartbeat Start
            Map<String, String> startParams = new HashMap<>();
            startParams.put("user_status", "0");
            startParams.put("spmid", "bstar-web.ugc-video-detail.0.0");
            startParams.put("s_locale", "id");
            startParams.put("network_type", "1");
            startParams.put("timezone", "Asia/Jakarta");
            startParams.put("mobi_app", "bstar_a");
            startParams.put("quality", "2");
            startParams.put("aid", aid);
            startParams.put("type", "3");
            startParams.put("business", "ugc");
            startParams.put("stime", String.valueOf(stime));
            startParams.put("action", "start");
            startParams.put("played_time", "0");
            startParams.put("video_duration", String.valueOf(videoDuration));
            httpRequest("POST", "https://api.bilibili.tv/intl/gateway/web/data/report/heartbeat?s_locale=id_ID&platform=web", buildFormData(startParams), ua, cookie, referer);

            // Jeda natural tonton
            Thread.sleep(1200);

            // 4. Heartbeat Progress
            Map<String, String> progressParams = new HashMap<>();
            progressParams.put("user_status", "0");
            progressParams.put("spmid", "bstar-web.ugc-video-detail.0.0");
            progressParams.put("s_locale", "id");
            progressParams.put("network_type", "1");
            progressParams.put("timezone", "Asia/Jakarta");
            progressParams.put("mobi_app", "bstar_a");
            progressParams.put("quality", "2");
            progressParams.put("aid", aid);
            progressParams.put("type", "3");
            progressParams.put("business", "ugc");
            progressParams.put("stime", String.valueOf(stime + 2));
            progressParams.put("action", "heartbeat");
            progressParams.put("incr_play_time", String.valueOf(playedDuration));
            progressParams.put("played_time", String.valueOf(playedDuration));
            progressParams.put("current_progress", String.valueOf(playedDuration));
            progressParams.put("video_duration", String.valueOf(videoDuration));

            String res = httpRequest("POST", "https://api.bilibili.tv/intl/gateway/web/data/report/heartbeat?s_locale=id_ID&platform=web", buildFormData(progressParams), ua, cookie, referer);
            JSONObject json = new JSONObject(res);
            return json.optInt("code", -1) == 0;

        } catch (Exception e) {
            log("Error sesi: " + e.getMessage(), "error");
            return false;
        }
    }

    private String buildFormData(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> e : params.entrySet()) {
            if (sb.length() > 0) sb.append("&");
            sb.append(URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8))
              .append("=")
              .append(URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8));
        }
        return sb.toString();
    }

    private String httpRequest(String method, String urlStr, String body, String ua, String cookie, String referer) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod(method);
        conn.setConnectTimeout(15000);
        conn.setReadTimeout(15000);
        conn.setRequestProperty("User-Agent", ua);
        if (cookie != null && !cookie.isEmpty()) conn.setRequestProperty("Cookie", cookie);
        if (referer != null && !referer.isEmpty()) conn.setRequestProperty("Referer", referer);

        if ("POST".equalsIgnoreCase(method) && body != null) {
            conn.setDoOutput(true);
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.getBytes(StandardCharsets.UTF_8));
            }
        }

        int code = conn.getResponseCode();
        InputStream is = (code >= 200 && code < 400) ? conn.getInputStream() : conn.getErrorStream();
        if (is == null) return "{}";

        BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        br.close();
        return sb.toString();
    }

    private void log(String msg, String type) {
        if (listener != null) listener.onLog(msg, type);
    }

    private void updateStatus(String status) {
        if (listener != null) {
            listener.onStatusChange(status, successCount, failCount, completedCount, targetCount, currentViews, videoTitle, uploader, aid, nextRunIn);
        }
    }
}
