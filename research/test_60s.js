const { sendSingleView, getLiveViews } = (function() {
  const fs = require('fs');
  const code = fs.readFileSync('experiment.js', 'utf-8');
  // Re-use logic
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
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/129.0.0.0 Safari/537.36'
  ];

  async function getViews(aid = '4800360994708480') {
    try {
      const res = await fetch(`https://www.bilibili.tv/id/video/${aid}`, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }
      });
      const html = await res.text();
      const m = html.match(/([0-9,.]+\s*Ditonton|[0-9,.]+\s*Views)/gi) || [];
      return m[0] || 'Unknown';
    } catch (e) { return 'Err'; }
  }

  async function send(aid = '4800360994708480') {
    const buvid3 = generateBuvid();
    const buvid4 = generateBuvid4();
    const ua = USER_AGENTS[randomInt(0, USER_AGENTS.length - 1)];
    const stime = Math.floor(Date.now() / 1000);
    const dur = randomInt(40, 70);

    const cookieHeader = `buvid3=${buvid3}; buvid4=${buvid4}; bstar-web-lang=id;`;
    await fetch(`https://api.bilibili.tv/intl/gateway/web/playurl?s_locale=id_ID&platform=web&aid=${aid}&tk=&qn=64&type=0&device=wap&tf=0&spm_id=bstar-web.ugc-video-detail.0.0&from_spm_id=`, {
      headers: { 'User-Agent': ua, 'Cookie': cookieHeader, 'Referer': `https://www.bilibili.tv/id/video/${aid}` }
    });

    const formClick = new FormData();
    formClick.append('user_status', '0');
    formClick.append('spmid', 'bstar-web.ugc-video-detail.0.0');
    formClick.append('s_locale', 'id');
    formClick.append('timezone', 'Asia/Jakarta');
    formClick.append('mobi_app', 'bstar_w');
    formClick.append('aid', aid);
    formClick.append('stime', String(stime));
    await fetch('https://api.bilibili.tv/intl/gateway/web/data/report/click?s_locale=id_ID&platform=web', {
      method: 'POST',
      headers: { 'User-Agent': ua, 'Cookie': cookieHeader, 'Referer': `https://www.bilibili.tv/id/video/${aid}` },
      body: formClick
    });

    const formHb = new FormData();
    formHb.append('user_status', '0');
    formHb.append('spmid', 'bstar-web.ugc-video-detail.0.0');
    formHb.append('s_locale', 'id');
    formHb.append('mobi_app', 'bstar_w');
    formHb.append('aid', aid);
    formHb.append('stime', String(stime));
    formHb.append('action', 'start');
    formHb.append('video_duration', '105');
    await fetch('https://api.bilibili.tv/intl/gateway/web/data/report/heartbeat?s_locale=id_ID&platform=web', {
      method: 'POST',
      headers: { 'User-Agent': ua, 'Cookie': cookieHeader, 'Referer': `https://www.bilibili.tv/id/video/${aid}` },
      body: formHb
    });

    await new Promise(r => setTimeout(r, 1500));

    const formEnd = new FormData();
    formEnd.append('user_status', '0');
    formEnd.append('spmid', 'bstar-web.ugc-video-detail.0.0');
    formEnd.append('s_locale', 'id');
    formEnd.append('mobi_app', 'bstar_w');
    formEnd.append('aid', aid);
    formEnd.append('stime', String(stime + 2));
    formEnd.append('action', 'heartbeat');
    formEnd.append('played_time', String(dur));
    formEnd.append('current_progress', String(dur));
    formEnd.append('video_duration', '105');
    await fetch('https://api.bilibili.tv/intl/gateway/web/data/report/heartbeat?s_locale=id_ID&platform=web', {
      method: 'POST',
      headers: { 'User-Agent': ua, 'Cookie': cookieHeader, 'Referer': `https://www.bilibili.tv/id/video/${aid}` },
      body: formEnd
    });

    return { dur };
  }

  return { sendSingleView: send, getLiveViews: getViews };
})();

async function runTest60() {
  const aid = '4800360994708480';
  console.log('=== TEST INTERVAL TEPAT 60 DETIK (3 PUTARAN) ===');
  const start = await getLiveViews(aid);
  console.log(`[AWAL] Live Views: ${start}\n`);

  for (let i = 1; i <= 3; i++) {
    const time = new Date().toLocaleTimeString('id-ID');
    process.stdout.write(`[${time}] Sesi #${i} terkirim... `);
    const { dur } = await sendSingleView(aid);
    await new Promise(r => setTimeout(r, 3000));
    const views = await getLiveViews(aid);
    console.log(`(Durasi tonton: ${dur}s) => Live Views: [${views}]`);

    if (i < 3) {
      console.log('   ⏳ Menunggu jeda 60 detik...');
      await new Promise(r => setTimeout(r, 60000));
    }
  }

  const finalViews = await getLiveViews(aid);
  console.log(`\n[AKHIR] Live Views: ${finalViews}`);
}

runTest60();
