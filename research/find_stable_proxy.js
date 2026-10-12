const { ProxyAgent } = require('undici');

async function testSingleProxy(ipPort) {
  try {
    const client = new ProxyAgent(`http://${ipPort}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://api.bilibili.tv/intl/gateway/web/playurl?s_locale=id_ID&platform=web&aid=4800360994708480&tk=&qn=64&type=0&device=wap&tf=0', {
      dispatcher: client,
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    clearTimeout(timeout);
    return res.status === 200;
  } catch (e) {
    return false;
  }
}

async function findGood() {
  console.log('Mendownload daftar proxy aktif...');
  const res = await fetch('https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt');
  const text = await res.text();
  const list = text.split(/\r?\n/).filter(l => l.includes(':'));
  console.log(`Mengecek 40 proxy teratas...`);

  const valid = [];
  for (const p of list.slice(0, 40)) {
    const ok = await testSingleProxy(p);
    if (ok) {
      console.log(`[OK] Proxy Valid: http://${p}`);
      valid.push(`http://${p}`);
      if (valid.length >= 2) break;
    }
  }
  console.log('HASIL:', valid);
  return valid;
}

findGood();
