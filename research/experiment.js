const crypto = require('crypto');
const fs = require('fs');

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

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/129.0.0.0 Safari/537.36'
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getLiveViews(aid = '4800360994708480') {
  try {
    const res = await fetch(`https://www.bilibili.tv/id/video/${aid}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'id-ID,id;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });
    const html = await res.text();
    const matches = html.match(/([0-9,.]+\s*Ditonton|[0-9,.]+\s*Views)/gi) || [];
    return matches.length > 0 ? matches[0] : 'Unknown';
  } catch (e) {
    return 'Error: ' + e.message;
  }
}

async function sendSingleView(aid = '4800360994708480') {
  const buvid3 = generateBuvid();
  const buvid4 = generateBuvid4();
  const userAgent = USER_AGENTS[randomInt(0, USER_AGENTS.length - 1)];
  const stime = Math.floor(Date.now() / 1000);
  const playedDuration = randomInt(40, 75);
  const videoDuration = 105;

  const cookieHeader = `buvid3=${buvid3}; buvid4=${buvid4}; bstar-web-lang=id;`;

  // 1. Playurl
  const pRes = await fetch(`https://api.bilibili.tv/intl/gateway/web/playurl?s_locale=id_ID&platform=web&aid=${aid}&tk=&qn=64&type=0&device=wap&tf=0&spm_id=bstar-web.ugc-video-detail.0.0&from_spm_id=`, {
    headers: {
      'User-Agent': userAgent,
      'Cookie': cookieHeader,
      'Referer': `https://www.bilibili.tv/id/video/${aid}`
    }
  });

  // 2. Click
  const formClick = new FormData();
  formClick.append('user_status', '0');
  formClick.append('spmid', 'bstar-web.ugc-video-detail.0.0');
  formClick.append('from_spmid', '');
  formClick.append('s_locale', 'id');
  formClick.append('network_type', '1');
  formClick.append('timezone', 'Asia/Jakarta');
  formClick.append('mobi_app', 'bstar_w');
  formClick.append('detail_play_time', '0');
  formClick.append('list_play_time', '0');
  formClick.append('sub_type', '0');
  formClick.append('play_type', '0');
  formClick.append('plat', '0');
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
  formStart.append('mobi_app', 'bstar_w');
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
    method: 'POST',
    headers: {
      'User-Agent': userAgent,
      'Cookie': cookieHeader,
      'Referer': `https://www.bilibili.tv/id/video/${aid}`,
      'Origin': 'https://www.bilibili.tv'
    },
    body: formStart
  });

  await sleep(1500);

  // 4. Heartbeat Progress
  const formProgress = new FormData();
  formProgress.append('user_status', '0');
  formProgress.append('spmid', 'bstar-web.ugc-video-detail.0.0');
  formProgress.append('from_spmid', '');
  formProgress.append('s_locale', 'id');
  formProgress.append('network_type', '1');
  formProgress.append('timezone', 'Asia/Jakarta');
  formProgress.append('mobi_app', 'bstar_w');
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
    method: 'POST',
    headers: {
      'User-Agent': userAgent,
      'Cookie': cookieHeader,
      'Referer': `https://www.bilibili.tv/id/video/${aid}`,
      'Origin': 'https://www.bilibili.tv'
    },
    body: formProgress
  });

  const hbJson = await hbRes.json();
  return {
    status: hbRes.status,
    code: hbJson.code,
    duration: playedDuration,
    buvid: buvid3.substring(0, 20)
  };
}

async function runExperiment() {
  const aid = '4800360994708480';
  const totalRounds = 10;
  const intervalSeconds = 20;

  console.log(`================================================================`);
  console.log(`🧪 EKSPERIMEN UJI COBA REALITAS FILTER BSTATION (10 SESI @ 20 DETIK)`);
  console.log(`================================================================`);
  
  const startViews = await getLiveViews(aid);
  console.log(`[BASIS AWAL] Views Video Saat Ini: ${startViews}\n`);

  const results = [];

  for (let round = 1; round <= totalRounds; round++) {
    const timeStr = new Date().toLocaleTimeString('id-ID');
    process.stdout.write(`[${timeStr}] Putaran #${round}/${totalRounds} -> Mengirim sinyal... `);

    try {
      const sendRes = await sendSingleView(aid);
      process.stdout.write(`Server Code: ${sendRes.code} (Durasi: ${sendRes.duration}s)... `);

      // Tunggu 3 detik agar server selesai mencatat sebelum cek live view
      await sleep(3000);
      const currentViews = await getLiveViews(aid);
      console.log(`=> Live Views: [${currentViews}]`);

      results.push({
        round,
        time: timeStr,
        serverCode: sendRes.code,
        durationSimulated: sendRes.duration,
        liveViews: currentViews
      });
    } catch (err) {
      console.log(`GAGAL: ${err.message}`);
      results.push({ round, time: timeStr, error: err.message });
    }

    if (round < totalRounds) {
      console.log(`   ⏳ Menunggu jeda ${intervalSeconds} detik...`);
      await sleep(intervalSeconds * 1000);
    }
  }

  console.log(`\n================================================================`);
  console.log(`📊 RINGKASAN HASIL EKSPERIMEN`);
  console.log(`================================================================`);
  console.log(`Views Awal : ${startViews}`);
  const finalViews = await getLiveViews(aid);
  console.log(`Views Akhir: ${finalViews}`);
  console.table(results);

  fs.writeFileSync('experiment_results.json', JSON.stringify({ startViews, finalViews, results }, null, 2));
  console.log(`Data lengkap tersimpan di experiment_results.json`);
}

runExperiment();
