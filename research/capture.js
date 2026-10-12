const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://www.bilibili.tv/id/video/4800360994708480';

async function run() {
  console.log('Meluncurkan Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--mute-audio',
      '--window-size=1280,800'
    ]
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36');

  const capturedRequests = [];

  page.on('request', req => {
    const url = req.url();
    const resourceType = req.resourceType();
    if (['xhr', 'fetch'].includes(resourceType) || url.includes('report') || url.includes('heartbeat') || url.includes('event') || url.includes('play') || url.includes('click')) {
      capturedRequests.push({
        timestamp: new Date().toISOString(),
        url: url,
        method: req.method(),
        postData: req.postData(),
        headers: req.headers()
      });
      console.log(`[REQUEST] ${req.method()} ${url.substring(0, 80)}...`);
    }
  });

  console.log(`Membuka ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });

  // Cari tombol persetujuan cookie jika ada
  try {
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Saya mengerti')) {
        await btn.click();
        console.log('Menutup banner cookie...');
        break;
      }
    }
  } catch (e) {}

  // Cari tombol play atau klik video
  try {
    console.log('Mencoba memutar video...');
    await page.evaluate(() => {
      const video = document.querySelector('video');
      if (video) {
        video.muted = true;
        video.play();
      }
    });
  } catch (e) {}

  // Tunggu selama 25 detik agar video berjalan dan heartbeat terkirim
  console.log('Menunggu pemutaran video selama 25 detik untuk menangkap analitik...');
  await new Promise(r => setTimeout(r, 25000));

  // Simpan log request
  const logFile = path.join(__dirname, 'captured_requests.json');
  fs.writeFileSync(logFile, JSON.stringify(capturedRequests, null, 2), 'utf-8');
  console.log(`Berhasil menangkap ${capturedRequests.length} request analitik! Tersimpan di: ${logFile}`);

  await browser.close();
}

run().catch(err => {
  console.error('Terjadi kesalahan:', err);
  process.exit(1);
});
