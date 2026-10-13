'use strict';
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

(async () => {
  const output = path.resolve('docs/verification',process.argv[2] || 'baseline');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'ja-JP', serviceWorkers:'block' });
  const page = await context.newPage();
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  const results = [];
  try { for (const route of ['/', '/report', '/profile', '/food', '/admin', '/clock/sg30,ar20,tm10', '/clock/config', '/split']) {
    const errors = [];
    const onError = error => errors.push(error.message);
    page.on('pageerror', onError);
    const response = await page.goto('http://localhost:8410' + route, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(12000);
    await page.screenshot({ path: path.join(output, (route.replace(/\//g, '-') || 'dashboard') + '.png'), fullPage: false, timeout: 60000 });
    results.push({ route, actualUrl: page.url(), status: response.status(), title: await page.title(), errors });
    page.off('pageerror', onError);
  }
  fs.writeFileSync(path.join(output, 'routes.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
