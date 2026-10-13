'use strict';
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ serviceWorkers: 'block' });
    page.on('console', msg => console.log(msg.type() + ': ' + msg.text()));
    page.on('pageerror', error => console.log('ERROR: ' + error.stack));
    page.on('requestfailed', request => console.log('FAILED: ' + request.url() + ' ' + request.failure().errorText));
    await page.goto('http://localhost:8410'+(process.argv[2]||'/'));
    await page.waitForTimeout(12000);
    console.log(await page.evaluate(() => ({title: document.title, text: document.body.innerText.slice(0,1800), client: !!window.Nightscout, loading: document.querySelector('#container')?.className, font:getComputedStyle(document.body).fontFamily, dads:getComputedStyle(document.documentElement).getPropertyValue('--dads-font-sans'),app:getComputedStyle(document.documentElement).getPropertyValue('--app-font-sans')})));
  } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exitCode=1;});
