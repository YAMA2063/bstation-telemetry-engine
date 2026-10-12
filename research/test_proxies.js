const { fetch, ProxyAgent } = require('undici');
const https = require('https');

async function getProxies() {
  return new Promise((resolve) => {
    https.get('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=8000&country=ID&ssl=all&anonymity=all', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const list = data.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        resolve(list);
      });
    }).on('error', () => resolve([]));
  });
}

async function testProxy(ipPort) {
  const proxyUrl = `http://${ipPort}`;
  const dispatcher = new ProxyAgent(proxyUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch('http://ip-api.com/json', {
      dispatcher,
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    return {
      proxy: proxyUrl,
      ip: json.query,
      country: json.country,
      regionName: json.regionName,
      city: json.city,
      isp: json.isp,
      org: json.org
    };
  } catch (err) {
    clearTimeout(timeout);
    return null;
  }
}

async function main() {
  console.log('Fetching Indonesian proxy list...');
  const list = await getProxies();
  console.log(`Found ${list.length} proxies. Testing concurrency...`);

  const working = [];
  for (let i = 0; i < list.length && working.length < 5; i += 5) {
    const batch = list.slice(i, i + 5);
    const results = await Promise.all(batch.map(p => testProxy(p)));
    for (const r of results) {
      if (r) {
        console.log(`[WORKING] ${r.proxy} -> ${r.city}, ${r.regionName} (${r.isp})`);
        working.push(r);
        if (working.length >= 3) break;
      }
    }
  }

  console.log('\n--- FINAL WORKING INDONESIA PROXIES ---');
  console.log(JSON.stringify(working, null, 2));
}

main();
