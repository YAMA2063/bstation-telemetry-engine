const { fetch, ProxyAgent } = require('undici');

async function getCandidateLists() {
  const sources = [
    'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=ID&ssl=all&anonymity=all',
    'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
    'https://raw.githubusercontent.com/TheSpeedX/SOCKS-List/master/http.txt',
    'https://raw.githubusercontent.com/prxchk/proxy-list/main/http.txt',
    'https://raw.githubusercontent.com/roosterkid/openproxylist/main/HTTPS_RAW.txt',
    'https://raw.githubusercontent.com/elliottophellia/yakumo/master/results/http/global/http_checked.txt'
  ];

  const allIps = new Set();
  for (const url of sources) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const text = await res.text();
        const lines = text.split(/\r?\n/).map(s => s.trim()).filter(s => s.includes(':'));
        for (const line of lines) {
          // Check if likely Indonesian IP or from the country=ID endpoint
          if (url.includes('country=ID') || /^(103\.|36\.|114\.|180\.|182\.|202\.|203\.|125\.|110\.|111\.|43\.252\.|118\.|119\.|175\.|123\.|139\.|140\.)/.test(line)) {
            allIps.add(line);
          }
        }
      }
    } catch (e) {}
  }
  return Array.from(allIps);
}

async function testProxyForBilibili(ipPort) {
  const proxyUrl = 'http://' + ipPort;
  try {
    const dispatcher = new ProxyAgent(proxyUrl, {
      connect: { timeout: 7000 }
    });
    const res = await fetch('https://api.bilibili.tv/intl/gateway/web/playurl?s_locale=id_ID&aid=4800360994708480', {
      dispatcher,
      signal: AbortSignal.timeout(7000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (res.status === 200) {
      // Also verify IP location via ip-api
      let geo = { city: 'Unknown', region: 'Indonesia' };
      try {
        const geoRes = await fetch('http://ip-api.com/json', { dispatcher, signal: AbortSignal.timeout(5000) });
        if (geoRes.ok) {
          const gj = await geoRes.json();
          geo = gj;
        }
      } catch (ge) {}

      return { proxy: proxyUrl, status: res.status, city: geo.city, region: geo.regionName, isp: geo.isp, country: geo.countryCode };
    }
  } catch (err) {}
  return null;
}

async function main() {
  console.log('Fetching Indonesian candidates...');
  const candidates = await getCandidateLists();
  console.log(`Found ${candidates.length} candidates. Scanning...`);

  const working = [];
  const chunkSize = 15;
  for (let i = 0; i < candidates.length; i += chunkSize) {
    const chunk = candidates.slice(i, i + chunkSize);
    const results = await Promise.all(chunk.map(testProxyForBilibili));
    for (const r of results) {
      if (r) {
        console.log('>>> [FOUND WORKING]:', JSON.stringify(r));
        working.push(r);
      }
    }
    if (working.length >= 5) break;
  }

  console.log('\n--- SCAN COMPLETED ---');
  console.log('Total working:', working.length);
  console.log(JSON.stringify(working, null, 2));
}

main();
