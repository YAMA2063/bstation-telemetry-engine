const crypto = require('crypto');

function generateBuvid() {
  const hex = crypto.randomBytes(16).toString('hex');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}${Math.floor(Math.random()*90000+10000)}infoc`;
}

async function sendPureView(aid = '4800360994708480') {
  const buvid3 = generateBuvid();
  const stime = Math.floor(Date.now() / 1000);
  console.log(`Menguji kirim view untuk AID: ${aid} dengan buvid3: ${buvid3.substring(0, 20)}...`);

  // 1. Request Playurl
  const playurlRes = await fetch(`https://api.bilibili.tv/intl/gateway/web/playurl?s_locale=id_ID&platform=web&aid=${aid}&tk=&qn=64&type=0&device=wap&tf=0&spm_id=bstar-web.ugc-video-detail.0.0&from_spm_id=`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      'Cookie': `buvid3=${buvid3}; bstar-web-lang=id;`,
      'Referer': `https://www.bilibili.tv/id/video/${aid}`
    }
  });
  console.log('Playurl Status:', playurlRes.status);

  // 2. Report Click
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

  const clickRes = await fetch('https://api.bilibili.tv/intl/gateway/web/data/report/click?s_locale=id_ID&platform=web', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      'Cookie': `buvid3=${buvid3}; bstar-web-lang=id;`,
      'Referer': `https://www.bilibili.tv/id/video/${aid}`,
      'Origin': 'https://www.bilibili.tv'
    },
    body: formClick
  });
  const clickJson = await clickRes.json();
  console.log('Report Click Response:', clickJson);

  // 3. Report Heartbeat Start
  const formHb = new FormData();
  formHb.append('user_status', '0');
  formHb.append('spmid', 'bstar-web.ugc-video-detail.0.0');
  formHb.append('from_spmid', '');
  formHb.append('s_locale', 'id');
  formHb.append('network_type', '1');
  formHb.append('timezone', 'Asia/Jakarta');
  formHb.append('mobi_app', 'bstar_w');
  formHb.append('detail_play_time', '0');
  formHb.append('list_play_time', '0');
  formHb.append('sub_type', '0');
  formHb.append('play_type', '0');
  formHb.append('plat', '0');
  formHb.append('cookie_sid', '0');
  formHb.append('session', '0');
  formHb.append('epid', '');
  formHb.append('sid', '');
  formHb.append('quality', '2');
  formHb.append('aid', aid);
  formHb.append('type', '3');
  formHb.append('business', 'ugc');
  formHb.append('stime', String(stime));
  formHb.append('action', 'start');
  formHb.append('incr_pause_time', '0');
  formHb.append('incr_play_time', '0');
  formHb.append('total_time', '0');
  formHb.append('paused_time', '0');
  formHb.append('played_time', '0');
  formHb.append('current_progress', '0');
  formHb.append('last_play_progress_time', '0');
  formHb.append('max_play_progress_time', '0');
  formHb.append('video_duration', '105');

  const hbRes = await fetch('https://api.bilibili.tv/intl/gateway/web/data/report/heartbeat?s_locale=id_ID&platform=web', {
    method: 'POST',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
      'Cookie': `buvid3=${buvid3}; bstar-web-lang=id;`,
      'Referer': `https://www.bilibili.tv/id/video/${aid}`,
      'Origin': 'https://www.bilibili.tv'
    },
    body: formHb
  });
  const hbJson = await hbRes.json();
  console.log('Report Heartbeat Start Response:', hbJson);
}

sendPureView();
