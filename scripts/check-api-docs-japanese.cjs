'use strict';
const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const { chromium } = require('playwright');
const base = 'http://localhost:8410';
(async () => {
  const hash = crypto.createHash('sha1').update(fs.readFileSync('.env.local', 'utf8').match(/^API_SECRET=(.+)$/m)[1].trim()).digest('hex');
  const browser = await chromium.launch({ channel: 'chrome', headless: true }), results = [];
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      for (const route of ['/api-docs/', '/api3-docs/']) {
        const page = await browser.newPage({ viewport }), requests = [], errors = [];
        page.on('request', request => {
          if (new URL(request.url()).pathname.startsWith('/api/')) requests.push({ method: request.method(), path: new URL(request.url()).pathname });
        });
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(base + route);
        await page.getByRole('heading', { name: 'APIの説明', exact: true }).waitFor();
        await page.getByRole('button', { name: '認証情報を設定', exact: true }).first().waitFor();
        assert.equal(await page.locator('html').getAttribute('lang'), 'ja');
        assert.equal(await page.title(), '血糖みまもり APIの説明');
        const controls = page.locator('.opblock-summary-control');
        const first = controls.first();
        await first.focus(); await first.press('Enter');
        await page.getByRole('button', { name: '入力を有効にする', exact: true }).first().waitFor();
        await first.press('Enter'); await first.press('Enter');
        assert.equal(await first.getAttribute('aria-expanded'), 'true');
        const links = page.locator('.app-api-operation-link');
        assert.equal(await links.count(), await controls.count());
        const href = await links.first().getAttribute('href');
        await links.first().focus(); await links.first().press('Enter');
        await page.waitForFunction(expected => location.hash === expected, href);
        assert.equal(await first.getAttribute('aria-expanded'), 'true');
        await page.getByRole('button', { name: '認証情報を設定', exact: true }).first().click();
        await page.getByText('利用できる認証方式', { exact: true }).waitFor();
        if (route === '/api-docs/') {
          await page.locator('.dialog-ux input').first().fill(hash);
          await page.locator('.dialog-ux').getByRole('button', { name: '認証情報を設定', exact: true }).first().click();
        }
        await page.locator('.dialog-ux').getByRole('button', { name: '閉じる', exact: true }).first().click();
        const target = page.locator('.opblock').filter({ has: page.locator('[data-path="' + (route === '/api3-docs/' ? '/version' : '/status') + '"]') }).first();
        const summary = target.locator('.opblock-summary-control');
        if (await summary.getAttribute('aria-expanded') !== 'true') await summary.click();
        await target.getByRole('button', { name: '入力を有効にする', exact: true }).click();
        const responsePromise = page.waitForResponse(response => new URL(response.url()).pathname === (route === '/api3-docs/' ? '/api/v3/version' : '/api/v1/status'));
        await target.getByRole('button', { name: '実行する', exact: true }).click();
        const response = await responsePromise;
        assert.equal(response.status(), 200, 'Read-only API execution');
        const payload = await response.json();
        assert(payload && typeof payload === 'object');
        await target.getByText('サーバーの応答', { exact: true }).waitFor();
        await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
        const accessibility = await page.evaluate(() => axe.run());
        assert.deepEqual(accessibility.violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })), []);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        assert.deepEqual(errors, []);
        assert(requests.every(request => request.method === 'GET'), 'Documentation test must not save or delete API data');
        const pendingMutations = await page.evaluate(async () => {
          await new Promise(resolve => setTimeout(resolve, 250));
          let count = 0;
          const observer = new MutationObserver(records => { count += records.length; });
          observer.observe(document.querySelector('#swagger-ui'), { subtree: true, attributes: true, characterData: true, childList: true });
          await new Promise(resolve => setTimeout(resolve, 400)); observer.disconnect(); return count;
        });
        assert.equal(pendingMutations, 0, 'Translation must settle without a mutation loop');
        const name = (route === '/api-docs/' ? 'v1' : 'v3') + '-' + viewport.width;
        // Capture a fresh, unauthenticated document so request headers never
        // appear in images intended for review or customer-facing materials.
        await page.goto(base + route);
        await page.getByRole('heading', { name: 'APIの説明', exact: true }).waitFor();
        await page.locator('.opblock-summary-control').first().click();
        await page.getByRole('button', { name: '入力を有効にする', exact: true }).first().waitFor();
        assert(!(await page.locator('body').innerText()).includes(hash), 'Screenshot must not contain authentication data');
        await page.screenshot({ path: 'docs/verification/api-docs-' + name + '.png' });
        results.push({ route, viewport, operations: await controls.count(), deepLinks: await links.count(), japaneseControls: true, serverResponse: response.status(), payloadKeys: Object.keys(payload), requests, axeViolations: 0, overflow: false, pageErrors: errors, idleMutations: pendingMutations });
        console.log('PASS:', route, viewport.width, 'read-only API, keyboard links and axe');
        await page.close();
      }
    }
    const alias = await fetch(base + '/api-docs.html', { redirect: 'manual' });
    assert.equal(alias.status, 307); assert.equal(alias.headers.get('location'), '/api-docs');
    fs.writeFileSync('docs/verification/api-docs-japanese.json', JSON.stringify({ generatedAt: new Date().toISOString(), scope: 'Actual v1/v3 documentation, keyboard controls, authenticated v1 status/public v3 version reads and zero API writes; technical names/code values preserved', legacyAlias: 307, results }, null, 2) + '\n');
    console.log('PASS: four actual API documentation and read-only request cases.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
