const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/download', async (req, res) => {
  const videoUrl = req.body.video_link;
  if (!videoUrl || !videoUrl.includes('tiktok.com')) {
    return res.send('❌ Invalid TikTok URL');
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto('https://ssstik.io/', { waitUntil: 'networkidle2' });

    await page.type('#main_page_text', videoUrl);
    await page.click('#submit');

    await page.waitForSelector('.result_overlay_btns > a', { timeout: 15000 });
    const links = await page.$$eval('.result_overlay_btns > a', anchors =>
      anchors.map(a => ({
        text: a.textContent.trim(),
        href: a.href
      }))
    );

    await browser.close();

    let output = '<h2>Download Links:</h2>';
    links.forEach(link => {
      output += `<p><a href="${link.href}" target="_blank">${link.text}</a></p>`;
    });

    res.send(output);
  } catch (err) {
    res.send('❌ Error fetching video. TikTok or Ssstik may have blocked the request.<br><br>Error: ' + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
