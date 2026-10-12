const crypto = require('crypto');

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

async function addView(aid = '4800360994708480') {
  const buvid3 = generateBuvid();
  const buvid4 = generateBuvid4();
  const userAgent = USER_AGENTS[randomInt(0, USER_AGENTS.length - 1)];
  const stime = Math.floor(Date.now() / 1000);
  const playedDuration = randomInt(35, 75); // Durasi tonton manusia acak (35 - 75 detik)
  const videoDuration = 105;

  console.log(`\n[+] Memulai sesi tonton baru:`);
  console.log(`    Device ID: ${buvid3.substring(0, 25)}...`);
  console.log(`    Simulasi durasi tonton: ${playedDuration} detik`);

  try {
    const cookieHeader = `buvid3=${buvid3}; buvid4=${buvid4}; bstar-web-lang=id;`;

    // 1. Ambil izin stream (playurl)
    const playurlRes = await fetch(`https://api.bilibili.tv/intl/gateway/web/playurl?s_locale=id_ID&platform=web&aid=${aid}&tk=&qn=64&type=0&device=wap&tf=0&spm_id=bstar-web.ugc-video-detail.0.0&from_spm_id=`, {
      headers: {
        'User-Agent': userAgent,
        'Cookie': cookieHeader,
        'Referer': `https://www.bilibili.tv/id/video/${aid}`
      }
    });

    // 2. Kirim sinyal klik play
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

    // 3. Kirim sinyal Heartbeat Start (Mulai menonton)
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

    // Tunggu simulasi kecil sebelum mengirim event progres tonton
    await sleep(2000);

    // 4. Kirim sinyal Heartbeat Progress (Menonton sejumlah detik riil)
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

    const finalRes = await fetch('https://api.bilibili.tv/intl/gateway/web/data/report/heartbeat?s_locale=id_ID&platform=web', {
      method: 'POST',
      headers: {
        'User-Agent': userAgent,
        'Cookie': cookieHeader,
        'Referer': `https://www.bilibili.tv/id/video/${aid}`,
        'Origin': 'https://www.bilibili.tv'
      },
      body: formProgress
    });

    const resJson = await finalRes.json();
    if (resJson.code === 0) {
      console.log(`    [SUKSES] Sinyal tontonan lengkap ${playedDuration}s diterima server Bstation (code: 0)`);
      return true;
    } else {
      console.log(`    [RESPON]`, resJson);
      return false;
    }
  } catch (err) {
    console.error(`    [GAGAL]`, err.message);
    return false;
  }
}

async function runAutoViews(targetCount = 5, minDelay = 25, maxDelay = 60) {
  const aid = '4800360994708480';
  console.log(`===============================================`);
  console.log(`   BSTATION SMART AUTO VIEW (RANDOM DELAY)     `);
  console.log(`===============================================`);
  console.log(`Video AID         : ${aid}`);
  console.log(`Target Sesi       : ${targetCount} sesi`);
  console.log(`Rentang Jeda Acak : ${minDelay} - ${maxDelay} detik per sesi`);
  console.log(`-----------------------------------------------`);

  for (let i = 1; i <= targetCount; i++) {
    console.log(`\n>> Sesi #${i} dari ${targetCount}`);
    await addView(aid);

    if (i < targetCount) {
      const delay = randomInt(minDelay, maxDelay);
      console.log(`⏳ Menunggu jeda acak selama ${delay} detik agar tampak natural...`);
      await sleep(delay * 1000);
    }
  }

  console.log(`\n===============================================`);
  console.log(`Selesai! Seluruh sesi telah dikirimkan.`);
  console.log(`===============================================`);
}

// Menjalankan 1 sesi langsung untuk tes
runAutoViews(1, 20, 40);
