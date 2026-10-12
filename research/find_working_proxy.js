const { HttpsProxyAgent } = require('https-proxy-agent');

async function testProxy(proxyUrl) {
  try {
    const agent = new HttpsProxyAgent(proxyUrl);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('https://api.bilibili.tv/intl/gateway/web/v2/login/config?s_locale=id_ID&platform=web', {
      agent,
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    clearTimeout(timeout);

    if (res.status === 200) {
      const json = await res.json();
      if (json.code === 0) return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

async function findWorkingProxies() {
  console.log('Mencari daftar proxy gratis yang aktif...');
  const sources = [
    'https://api.proxyscrape.com/v3/free-proxy-list/get?request=displayproxies&protocol=http&timeout=2500&country=all&ssl=yes',
    'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
    'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt'
  ];

  let proxyList = [];
  for (const src of sources) {
    try {
      const res = await fetch(src);
      const text = await res.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.includes(':'));
      proxyList.push(...lines);
      if (proxyList.length > 50) break;
    } catch (e) {}
  }

  console.log(`Ditemukan ${proxyList.length} calon proxy. Menguji koneksi ke server Bstation...`);

  const working = [];
  for (const p of proxyList.slice(0, 35)) {
    const proxyUrl = `http://${p}`;
    process.stdout.write(`Menguji ${p}... `);
    const ok = await testProxy(proxyUrl);
    if (ok) {
      console.log('✅ AKTIF & TEMBUS KE BSTATION!');
      working.push(proxyUrl);
      if (working.length >= 2) break;
    } else {
      console.log('❌ Gagal / Timeout');
    }
  }

  console.log('\nHASIL PROXY AKTIF:', working);
  return working;
}

findWorkingProxies();
