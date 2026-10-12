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

async function sendSingleView(aid = '4800360994708480') {
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

function parseViewsNum(str) {
  const m = str.match(/([0-9]+)/);
  return m ? parseInt(m[1], 10) : 0;
}

async function testDelay(delaySeconds) {
  const aid = '4800360994708480';
  console.log(`\n==================================================`);
  console.log(`🔎 MENGUJI COOLDOWN: TEPAT ${delaySeconds} DETIK`);
  console.log(`==================================================`);

  // 1. Kirim Sesi Trigger Pertama
  console.log(`[1] Mengirim sesi trigger awal...`);
  await sendSingleView(aid);
  await new Promise(r => setTimeout(r, 3000));
  const v1 = await getLiveViews(aid);
  console.log(`    Live Views saat ini: [${v1}]`);
  const num1 = parseViewsNum(v1);

  // 2. Tunggu persis delaySeconds
  console.log(`[2] Menghitung mundur jeda TEPAT ${delaySeconds} DETIK...`);
  for (let s = delaySeconds; s > 0; s--) {
    if (s % 10 === 0 || s <= 5) process.stdout.write(`${s}s.. `);
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('0s! SELESAI JEDA.');

  // 3. Kirim Sesi Kedua untuk membuktikan apakah jeda delaySeconds tembus
  console.log(`[3] Mengirim sesi kedua persis setelah ${delaySeconds}s...`);
  await sendSingleView(aid);
  await new Promise(r => setTimeout(r, 3500));
  const v2 = await getLiveViews(aid);
  const num2 = parseViewsNum(v2);

  console.log(`[4] Hasil Live Views setelah kirim kedua: [${v2}]`);
  const success = num2 > num1;

  if (success) {
    console.log(`✅ BERHASIL! Jeda ${delaySeconds} detik TERBUKTI MENAMBAH VIEWS (${num1} -> ${num2})!`);
  } else {
    console.log(`❌ GAGAL! Jeda ${delaySeconds} detik masih tertahan (tetap ${num1}).`);
  }

  return { delay: delaySeconds, success, before: num1, after: num2 };
}

async function findSweetSpot() {
  console.log('MEMULAI PENCARIAN DURASI TERCEPAT YANG BISA NEMBUS BSTATION...\n');

  // Tes pertama: 71 Detik
  const res71 = await testDelay(71);

  if (res71.success) {
    console.log('\n>>> Karena 71 DETIK BERHASIL, sekarang kita tes apakah 66 DETIK juga tembus! <<<');
    // Beri jeda 80s agar cooldown bersih sebelum tes 66s
    console.log('Membersihkan cooldown 80 detik...');
    await new Promise(r => setTimeout(r, 80000));
    
    const res66 = await testDelay(66);
    if (res66.success) {
      console.log('\n>>> LUAR BIASA! 66 DETIK JUGA BERHASIL! Kita coba turunkan ke 61 DETIK! <<<');
      console.log('Membersihkan cooldown 80 detik...');
      await new Promise(r => setTimeout(r, 80000));
      await testDelay(61);
    } else {
      console.log('\n>>> KESIMPULAN: 66s gagal, tetapi 71s tembus! Batas tercepat adalah di sekitar 70-71 detik! <<<');
    }
  } else {
    console.log('\n>>> 71 DETIK masih gagal! Kita coba naikkan ke 76 DETIK! <<<');
    console.log('Membersihkan cooldown 80 detik...');
    await new Promise(r => setTimeout(r, 80000));
    await testDelay(76);
  }
}

findSweetSpot();
