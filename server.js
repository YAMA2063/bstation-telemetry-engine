const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ProxyAgent } = require('undici');

const PORT = 3737;

let botState = {
  isRunning: false,
  targetUrl: '',
  aid: '',
  videoTitle: '',
  uploader: '',
  initialViews: null,
  currentViews: null,
  targetCount: 10,
  completedCount: 0,
  successCount: 0,
  failCount: 0,
  minDelay: 81,
  maxDelay: 85,
  nextRunIn: 0,
  currentStatus: 'Siap dijalankan',
  proxies: ['http://91.206.14.55:9877', 'http://185.238.238.169:58080'],
  useProxy: false,
  parallelCount: 1,
  logs: []
};

let cancelRequested = false;

function addLog(message, type = 'info') {
  const time = new Date().toLocaleTimeString('id-ID');
  const entry = { time, message, type };
  botState.logs.unshift(entry);
  if (botState.logs.length > 100) botState.logs.pop();
  console.log(`[${time}] [${type.toUpperCase()}] ${message}`);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateBuvid() {
  const hex = crypto.randomBytes(16).toString('hex');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}${randomInt(10000, 99999)}infoc`;
}

function generateBuvid4() {
  const hex = crypto.randomBytes(16).toString('hex').toUpperCase();
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}${randomInt(10000, 99999)}-026100900-pezxksxcB89WWu4wt88w%2Fw%3D%3D`;
}

const DEVICE_PROFILES = [
  {
    name: '📱 Android Chrome',
    ua: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.70 Mobile Safari/537.36',
    device: 'wap',
    mobiApp: 'bstar_a'
  },
  {
    name: '💻 Windows Chrome',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    device: 'pc',
    mobiApp: 'bstar_w'
  },
  {
    name: '🍎 iPhone Safari',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1',
    device: 'wap',
    mobiApp: 'bstar_i'
  },
  {
    name: '💻 Windows Edge',
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.0.0',
    device: 'pc',
    mobiApp: 'bstar_w'
  },
  {
    name: '📱 Xiaomi Browser',
    ua: 'Mozilla/5.0 (Linux; Android 13; 2201116SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36',
    device: 'wap',
    mobiApp: 'bstar_a'
  },
  {
    name: '🍏 Mac Safari',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    device: 'pc',
    mobiApp: 'bstar_w'
  }
];

function extractAid(input) {
  if (!input) return '';
  const match = input.match(/\/video\/([0-9]+)/) || input.match(/([0-9]{10,})/);
  return match ? match[1] : input.trim();
}

async function fetchVideoDetails(aid) {
  try {
    const url = `https://www.bilibili.tv/id/video/${aid}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'id-ID,id;q=0.9'
      }
    });
    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i) || html.match(/"title":"(.*?)"/);
    let title = titleMatch ? titleMatch[1].replace(' - Bstation', '').replace(' - bilibili', '').trim() : `Video #${aid}`;

    // Extract views
    const viewMatches = html.match(/([0-9,.]+\s*Ditonton|[0-9,.]+\s*Views)/gi) || [];
    const views = viewMatches.length > 0 ? viewMatches[0] : 'Tidak terdeteksi';

    // Extract uploader
    const uploaderMatch = html.match(/"author":"(.*?)"/) || html.match(/"name":"(.*?)"/);
    const uploader = uploaderMatch ? uploaderMatch[1] : 'Kreator Bstation';

    return { title, views, uploader, success: true };
  } catch (err) {
    return { title: `Video #${aid}`, views: 'Error', uploader: '-', success: false };
  }
}

async function executeSingleView(aid, videoDuration = 105, proxyUrl = null, profileIndex = 0, startDelayMs = 0) {
  try {
    if (startDelayMs > 0) {
      await new Promise(r => setTimeout(r, startDelayMs));
    }

    const buvid3 = generateBuvid();
    const buvid4 = generateBuvid4();
    const profile = DEVICE_PROFILES[profileIndex % DEVICE_PROFILES.length];
    const userAgent = profile.ua;
    const stime = Math.floor(Date.now() / 1000);
    const playedDuration = randomInt(81, 95);

    const fetchOpts = {
      signal: AbortSignal.timeout(25000)
    };
    if (proxyUrl) {
      try {
        fetchOpts.dispatcher = new ProxyAgent(proxyUrl);
      } catch (e) {
        return { success: false, error: `Invalid proxy: ${e.message}`, proxy: proxyUrl, deviceName: profile.name, delayMs: startDelayMs };
      }
    }

    const cookieHeader = `buvid3=${buvid3}; buvid4=${buvid4}; bstar-web-lang=id;`;

    // 1. Playurl
    await fetch(`https://api.bilibili.tv/intl/gateway/web/playurl?s_locale=id_ID&platform=web&aid=${aid}&tk=&qn=64&type=0&device=${profile.device}&tf=0&spm_id=bstar-web.ugc-video-detail.0.0&from_spm_id=`, {
      ...fetchOpts,
      headers: {
        'User-Agent': userAgent,
        'Cookie': cookieHeader,
        'Referer': `https://www.bilibili.tv/id/video/${aid}`
      }
    });

    // 2. Click report
    const formClick = new FormData();
    formClick.append('user_status', '0');
    formClick.append('spmid', 'bstar-web.ugc-video-detail.0.0');
    formClick.append('from_spmid', '');
    formClick.append('s_locale', 'id');
    formClick.append('network_type', '1');
    formClick.append('timezone', 'Asia/Jakarta');
    formClick.append('mobi_app', profile.mobiApp);
    formClick.append('detail_play_time', '0');
    formClick.append('list_play_time', '0');
    formClick.append('sub_type', '0');
    formClick.append('play_type', '0');
    formClick.append('plat', profile.device === 'wap' ? '1' : '0');
    formClick.append('cookie_sid', '0');
    formClick.append('session', '0');
    formClick.append('epid', '');
    formClick.append('sid', '');
    formClick.append('quality', '2');
    formClick.append('aid', aid);
    formClick.append('type', '3');
    formClick.append('business', 'ugc');
    formClick.append('stime', String(stime));

    await fetch('https://api.bilibili.tv/intl/gateway/web/data/report/click?s_locale=id_ID&platform=web', {
      ...fetchOpts,
      method: 'POST',
      headers: {
        'User-Agent': userAgent,
        'Cookie': cookieHeader,
        'Referer': `https://www.bilibili.tv/id/video/${aid}`,
        'Origin': 'https://www.bilibili.tv'
      },
      body: formClick
    });

    // 3. Heartbeat Start
    const formStart = new FormData();
    formStart.append('user_status', '0');
    formStart.append('spmid', 'bstar-web.ugc-video-detail.0.0');
    formStart.append('from_spmid', '');
    formStart.append('s_locale', 'id');
    formStart.append('network_type', '1');
    formStart.append('timezone', 'Asia/Jakarta');
    formStart.append('mobi_app', profile.mobiApp);
    formStart.append('quality', '2');
    formStart.append('aid', aid);
    formStart.append('type', '3');
    formStart.append('business', 'ugc');
    formStart.append('stime', String(stime));
    formStart.append('action', 'start');
    formStart.append('incr_pause_time', '0');
    formStart.append('incr_play_time', '0');
    formStart.append('total_time', '0');
    formStart.append('paused_time', '0');
    formStart.append('played_time', '0');
    formStart.append('current_progress', '0');
    formStart.append('video_duration', String(videoDuration));

    await fetch('https://api.bilibili.tv/intl/gateway/web/data/report/heartbeat?s_locale=id_ID&platform=web', {
      ...fetchOpts,
      method: 'POST',
      headers: {
        'User-Agent': userAgent,
        'Cookie': cookieHeader,
        'Referer': `https://www.bilibili.tv/id/video/${aid}`,
        'Origin': 'https://www.bilibili.tv'
      },
      body: formStart
    });

    await new Promise(r => setTimeout(r, 1200));

    // 4. Heartbeat Progress
    const formProgress = new FormData();
    formProgress.append('user_status', '0');
    formProgress.append('spmid', 'bstar-web.ugc-video-detail.0.0');
    formProgress.append('from_spmid', '');
    formProgress.append('s_locale', 'id');
    formProgress.append('network_type', '1');
    formProgress.append('timezone', 'Asia/Jakarta');
    formProgress.append('mobi_app', profile.mobiApp);
    formProgress.append('quality', '2');
    formProgress.append('aid', aid);
    formProgress.append('type', '3');
    formProgress.append('business', 'ugc');
    formProgress.append('stime', String(stime + 2));
    formProgress.append('action', 'heartbeat');
    formProgress.append('incr_pause_time', '0');
    formProgress.append('incr_play_time', String(playedDuration));
    formProgress.append('total_time', String(playedDuration));
    formProgress.append('paused_time', '0');
    formProgress.append('played_time', String(playedDuration));
    formProgress.append('current_progress', String(playedDuration));
    formProgress.append('last_play_progress_time', String(playedDuration));
    formProgress.append('max_play_progress_time', String(playedDuration));
    formProgress.append('video_duration', String(videoDuration));

    const hbRes = await fetch('https://api.bilibili.tv/intl/gateway/web/data/report/heartbeat?s_locale=id_ID&platform=web', {
      ...fetchOpts,
      method: 'POST',
      headers: {
        'User-Agent': userAgent,
        'Cookie': cookieHeader,
        'Referer': `https://www.bilibili.tv/id/video/${aid}`,
        'Origin': 'https://www.bilibili.tv'
      },
      body: formProgress
    });

    const resJson = await hbRes.json();
    return {
      success: resJson.code === 0,
      duration: playedDuration,
      response: resJson,
      proxy: proxyUrl || 'Local IP',
      deviceName: profile.name,
      delayMs: startDelayMs
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      proxy: proxyUrl || 'Local IP',
      deviceName: 'Device',
      delayMs: startDelayMs
    };
  }
}

async function startAutoWorker() {
  if (botState.isRunning) return;
  botState.isRunning = true;
  cancelRequested = false;
  botState.completedCount = 0;
  botState.successCount = 0;
  botState.failCount = 0;
  botState.currentStatus = 'Sedang berjalan...';

  const batchSize = Math.max(1, botState.parallelCount || 1);
  if (batchSize === 1) {
    addLog(`Memulai otomatisasi ${botState.targetCount} views (1 view per putaran, rotasi otomatis multi-device)`, 'info');
  } else {
    addLog(`Memulai otomatisasi ${botState.targetCount} views (${batchSize} device berbeda nonton bersamaan per putaran)`, 'info');
  }

  let sent = 0;
  while (sent < botState.targetCount && !cancelRequested) {
    const currentBatch = Math.min(batchSize, botState.targetCount - sent);
    botState.currentStatus = batchSize === 1 ? `Mengirim sesi #${sent + 1}...` : `Mengirim ${currentBatch} device nonton bersamaan...`;

    const tasks = [];
    for (let b = 0; b < currentBatch; b++) {
      let proxy = null;
      if (botState.useProxy && botState.proxies.length > 0) {
        proxy = botState.proxies[b % botState.proxies.length];
      }
      // slight natural stagger: 0ms for first, ~600-1400ms for subsequent devices
      const stagger = b === 0 ? 0 : (b * randomInt(600, 1400));
      tasks.push(executeSingleView(botState.aid, 105, proxy, sent + b, stagger));
    }

    try {
      const results = await Promise.all(tasks);
      for (const res of results) {
        sent++;
        botState.completedCount = sent;
        if (res.success) {
          botState.successCount++;
          const delayText = res.delayMs > 0 ? ` (+${(res.delayMs/1000).toFixed(1)}s)` : '';
          addLog(`Sesi #${sent} SUKSES [${res.deviceName}]${delayText} (durasi: ${res.duration}s)`, 'success');
        } else {
          botState.failCount++;
          addLog(`Sesi #${sent} GAGAL [${res.deviceName}]: ${res.error || 'Server menolak'}`, 'error');
        }
      }
    } catch (e) {
      sent += currentBatch;
      botState.completedCount = sent;
      botState.failCount += currentBatch;
      addLog(`Batch error: ${e.message}`, 'error');
    }

    // Refresh live views periodically
    if (sent % 2 === 0 || sent >= botState.targetCount) {
      const info = await fetchVideoDetails(botState.aid);
      if (info.views && info.views !== 'Error') {
        const prev = botState.currentViews;
        botState.currentViews = info.views;
        if (prev && prev !== info.views) {
          addLog(`Pemberitahuan: Angka views berubah menjadi ${info.views}!`, 'highlight');
        }
      }
    }

    if (sent < botState.targetCount && !cancelRequested) {
      const delay = randomInt(botState.minDelay, botState.maxDelay);
      botState.currentStatus = `Menunggu jeda acak ${delay} detik...`;
      addLog(`Jeda acak: ${delay} detik sebelum sesi berikutnya...`, 'info');

      for (let sec = delay; sec > 0; sec--) {
        if (cancelRequested) break;
        botState.nextRunIn = sec;
        await new Promise(r => setTimeout(r, 1000));
      }
      botState.nextRunIn = 0;
    }
  }

  // Final check
  const finalInfo = await fetchVideoDetails(botState.aid);
  if (finalInfo.views) botState.currentViews = finalInfo.views;

  botState.isRunning = false;
  botState.currentStatus = cancelRequested ? 'Dihentikan' : 'Selesai!';
  addLog(`Semua proses selesai. Sukses: ${botState.successCount}, Gagal: ${botState.failCount}. Views akhir: ${botState.currentViews}`, 'highlight');
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Static files
  if (pathname === '/' || pathname === '/index.html') {
    const filePath = path.join(__dirname, 'public', 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  if (pathname.startsWith('/public/')) {
    const filePath = path.join(__dirname, pathname);
    const ext = path.extname(filePath);
    const mimeTypes = {
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.png': 'image/png',
      '.svg': 'image/svg+xml'
    };
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      res.end(data);
    });
    return;
  }

  // API Endpoints
  if (pathname === '/api/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(botState));
    return;
  }

  if (pathname === '/api/check-info' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const aid = extractAid(payload.url);
        if (!aid) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Link atau AID video tidak valid' }));
          return;
        }
        const info = await fetchVideoDetails(aid);
        botState.aid = aid;
        botState.targetUrl = payload.url;
        botState.videoTitle = info.title;
        botState.uploader = info.uploader;
        botState.initialViews = info.views;
        botState.currentViews = info.views;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ aid, ...info }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (pathname === '/api/start' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const aid = extractAid(payload.url);
        if (!aid) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Link video tidak valid' }));
          return;
        }

        botState.aid = aid;
        botState.targetCount = parseInt(payload.count, 10) || 150;
        botState.minDelay = parseInt(payload.minDelay, 10) || 81;
        botState.maxDelay = parseInt(payload.maxDelay, 10) || 85;
        botState.useProxy = Boolean(payload.useProxy);
        botState.parallelCount = parseInt(payload.parallelCount, 10) || 1;
        if (Array.isArray(payload.proxies) && payload.proxies.length > 0) {
          botState.proxies = payload.proxies
            .filter(p => p && p.trim())
            .map(p => p.trim().startsWith('http') ? p.trim() : `http://${p.trim()}`);
        }

        // Fetch info if not set
        if (!botState.videoTitle) {
          const info = await fetchVideoDetails(aid);
          botState.videoTitle = info.title;
          botState.uploader = info.uploader;
          botState.initialViews = info.views;
          botState.currentViews = info.views;
        }

        startAutoWorker();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Otomatisasi dimulai!', state: botState }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (pathname === '/api/stop' && req.method === 'POST') {
    cancelRequested = true;
    botState.currentStatus = 'Sedang menghentikan...';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Permintaan penghentian dikirim.' }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`🚀 Bstation Booster Dashboard berjalan di:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`===================================================`);
});
