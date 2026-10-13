'use strict';
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const results = [];
    for (const route of ['/real-estate/products/sumai-desk', '/healthcare/products/kettou-mimamori']) {
      const page = await browser.newPage(), errors = [], failed = [], responses = [];
      page.on('pageerror', error => errors.push(error.stack));
      page.on('requestfailed', request => failed.push({ url: request.url(), error: request.failure() }));
      page.on('response', response => { if (response.status() >= 400) responses.push({ url: response.url(), status: response.status() }); });
      await page.goto('http://127.0.0.1:8412' + route + '?sera_internal=1');
      try { await page.waitForSelector('.sumai-lp #pricing', { timeout: 15000 }); } catch {}
      results.push({ route, errors, failed, responses, body: (await page.locator('body').innerText()).slice(0, 1500), title: await page.title() });
      await page.close();
    }
    const output = path.resolve('../sera-inc-public-site/docs/verification/kettou-mimamori/built-runtime-diagnostic.json');
    fs.writeFileSync(output, JSON.stringify(results, null, 2)); console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
