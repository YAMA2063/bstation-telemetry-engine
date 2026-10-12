package com.bstation.booster;

import android.app.Activity;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import org.json.JSONObject;

public class WebAppInterface {
    private final Activity activity;
    private final WebView webView;
    private final BstationBoosterEngine engine;

    public WebAppInterface(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        this.engine = new BstationBoosterEngine(new BstationBoosterEngine.Listener() {
            @Override
            public void onLog(String message, String type) {
                sendJs("window.onAndroidLog('" + escapeJs(message) + "', '" + escapeJs(type) + "')");
            }

            @Override
            public void onStatusChange(String status, int success, int failed, int completed, int target, String liveViews, String title, String uploader, String aid, int nextRunIn) {
                try {
                    JSONObject obj = new JSONObject();
                    obj.put("status", status);
                    obj.put("successCount", success);
                    obj.put("failCount", failed);
                    obj.put("completedCount", completed);
                    obj.put("targetCount", target);
                    obj.put("currentViews", liveViews);
                    obj.put("videoTitle", title);
                    obj.put("uploader", uploader);
                    obj.put("aid", aid);
                    obj.put("nextRunIn", nextRunIn);
                    obj.put("isRunning", engine.isRunning());
                    sendJs("window.onAndroidState(" + obj.toString() + ")");
                } catch (Exception ignored) {}
            }
        });
    }

    @JavascriptInterface
    public void checkInfo(final String rawUrl) {
        new Thread(() -> {
            BstationBoosterEngine.VideoDetails details = engine.fetchVideoDetails(rawUrl);
            try {
                JSONObject obj = new JSONObject();
                obj.put("aid", details.aid);
                obj.put("title", details.title);
                obj.put("uploader", details.uploader);
                obj.put("views", details.views);
                obj.put("success", details.success);
                sendJs("window.onAndroidVideoInfo(" + obj.toString() + ")");
            } catch (Exception ignored) {}
        }).start();
    }

    @JavascriptInterface
    public void startBoost(String rawUrl, int target, int minDelay, int maxDelay) {
        engine.start(rawUrl, target, minDelay, maxDelay);
    }

    @JavascriptInterface
    public void stopBoost() {
        engine.stop();
    }

    @JavascriptInterface
    public boolean isRunning() {
        return engine.isRunning();
    }

    @JavascriptInterface
    public void showToast(String message) {
        activity.runOnUiThread(() -> Toast.makeText(activity, message, Toast.LENGTH_SHORT).show());
    }

    private void sendJs(String script) {
        activity.runOnUiThread(() -> webView.evaluateJavascript(script, null));
    }

    private String escapeJs(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "");
    }
}
