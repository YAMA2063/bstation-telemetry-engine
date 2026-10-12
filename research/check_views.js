const https = require('https');

https.get('https://www.bilibili.tv/id/video/4800360994708480', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const matches = data.match(/([0-9,.]+\s*Ditonton|[0-9,.]+\s*Views)/gi) || [];
    console.log('Teks Ditonton ditemukan:', matches);
    const ssrData = data.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s) || data.match(/window\.__INITIAL_STATE__\s*=\s*({.*?});/s);
    if (ssrData) {
      console.log('SSR Data length:', ssrData[1].length);
      const v = ssrData[1].match(/"view":([0-9]+)/) || ssrData[1].match(/"views":([0-9]+)/);
      if (v) console.log('Angka views:', v[0]);
    }
  });
}).on('error', err => console.error(err));
