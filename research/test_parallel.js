const crypto = require('crypto');

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
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
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0'
];

async function getLiveViews(aid = '4800360994708480') {
  try {
    const res = await fetch(`https://www.bilibili.tv/id/video/${aid}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }
    });
    const html = await res.text();
    const m = html.match(/([0-9,.]+\s*Ditonton|[0-9,.]+\s*Views)/gi) || [];
    return m[0] || 'Unknown';
  } catch (e) { return 'Err: ' + e.message; }
}

async function sendSingleView(workerName, aid = '4800360994708480') {
  const buvid3 = generateBuvid();
  const buvid4 = generateBuvid4();
  const ua = USER_AGENTS[randomInt(0, USER_AGENTS.length - 1)];
  const stime = Math.floor(Date.now() / 1000);
  const dur = randomInt(40, 70);

  console.log(`[${workerName}] Menembak request dengan Device ID: ${buvid3.substring(0, 18)}...`);

  const cookieHeader = `buvid3=${buvid3}; buvid4=${buvid4}; bstar-web-lang=id;`;
  await fetch(`https://api.bilibili.tv/intl/gateway/web/playurl?s_locale=id_ID&platform=web&aid=${aid}&tk=&qn=64&type=0&device=wap&tf=0&spm_id=bstar-web.ugc-video-detail.0.0&from_spm_id=`, {
    headers: { 'User-Agent': ua, 'Cookie': cookieHeader, 'Referer': `https://www.bilibili.tv/id/video/${aid}` }
  });

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
    headers: { 'User-Agent': ua, 'Cookie': cookieHeader, 'Referer': `https://www.bilibili.tv/id/video/${aid}` },
    body: formClick
  });

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
  formStart.append('video_duration', '105');

  await fetch('https://api.bilibili.tv/intl/gateway/web/data/report/heartbeat?s_locale=id_ID&platform=web', {
    method: 'POST',
    headers: { 'User-Agent': ua, 'Cookie': cookieHeader, 'Referer': `https://www.bilibili.tv/id/video/${aid}` },
    body: formStart
  });

  await new Promise(r => setTimeout(r, 1500));

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
  formProgress.append('incr_play_time', String(dur));
  formProgress.append('total_time', String(dur));
  formProgress.append('paused_time', '0');
  formProgress.append('played_time', String(dur));
  formProgress.append('current_progress', String(dur));
  formProgress.append('last_play_progress_time', String(dur));
  formProgress.append('max_play_progress_time', String(dur));
  formProgress.append('video_duration', '105');

  const hbRes = await fetch('https://api.bilibili.tv/intl/gateway/web/data/report/heartbeat?s_locale=id_ID&platform=web', {
    method: 'POST',
    headers: { 'User-Agent': ua, 'Cookie': cookieHeader, 'Referer': `https://www.bilibili.tv/id/video/${aid}` },
    body: formProgress
  });

  const hbJson = await hbRes.json();
  console.log(`[${workerName}] Respon server: code ${hbJson.code}`);
  return { workerName, code: hbJson.code };
}

async function testParallel() {
  const aid = '4800360994708480';
  console.log(`================================================================`);
  console.log(`🧪 EKSPERIMEN: 1 LAPTOP MENGIRIM 2 REQUEST SECARA BERSAMAAN (PARALEL)`);
  console.log(`================================================================`);

  const basis = await getLiveViews(aid);
  console.log(`[AWAL] Live Views Video Saat Ini: ${basis}\n`);

  console.log(`Menembakkan Jalur-1 dan Jalur-2 BERSAMAAN detik ini juga...`);
  
  // Kirim 2 request di detik yang sama
  const results = await Promise.all([
    sendSingleView('Jalur-1', aid),
    sendSingleView('Jalur-2', aid)
  ]);

  console.log(`\nKedua request selesai dikirim. Menunggu 5 detik agar server memproses...`);
  await new Promise(r => setTimeout(r, 5000));

  const afterViews = await getLiveViews(aid);
  console.log(`\n================================================================`);
  console.log(`HASIL AKHIR:`);
  console.log(`Views Sebelum : ${basis}`);
  console.log(`Views Sesudah : ${afterViews}`);
  console.log(`================================================================`);
}

testParallel();
