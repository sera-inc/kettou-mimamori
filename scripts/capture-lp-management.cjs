'use strict';
const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const { chromium } = require('playwright');
const base = 'http://localhost:8410', out = 'docs/verification/lp-management';
const hash = crypto.createHash('sha1').update(fs.readFileSync('.env.local', 'utf8').match(/^API_SECRET=(.+)$/m)[1].trim()).digest('hex');
async function records(group) {
  const response = await fetch(base + '/api/v2/authorization/' + group, { headers: { 'api-secret': hash } });
  assert.equal(response.status, 200); return response.json();
}
(async () => {
  const subjects = await records('subjects'), roles = await records('roles');
  assert.equal(subjects.length, 0, 'Only capture the isolated demo without any subject credentials');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const evidence = { generatedAt: new Date().toISOString(), database: 'kettou_demo', scope: 'Actual complete UI frames; default permission groups, unsaved input forms and public API v3 explanation; no subject credentials, no response substitution, no API writes', screenshots: [], apiWrites: [], pageErrors: [], axe: [] };
  try {
    fs.mkdirSync(out, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block' });
    await page.addInitScript(value => localStorage.setItem('apisecrethash', JSON.stringify(value)), hash);
    page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/') && request.method() !== 'GET') evidence.apiWrites.push(request.method()); });
    page.on('pageerror', error => evidence.pageErrors.push(error.message));
    page.on('dialog', async dialog => { await dialog.dismiss(); throw Error('Capture must not invoke destructive actions'); });
    async function shot(name, route) {
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => !window.$ || (window.$.active === 0 && window.$(':animated').length === 0));
      assert(!(await page.locator('body').innerText()).includes(hash));
      assert(await page.locator('input,textarea').evaluateAll((elements, secret) => elements.every(element => !element.value.includes(secret)), hash));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const violations = await page.evaluate(async () => (await axe.run()).violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) })));
      evidence.axe.push({ name, violations }); assert.deepEqual(violations, []);
      const file = out + '/' + name + '.png';
      await page.screenshot({ path: file, fullPage: true });
      evidence.screenshots.push({ name, route, file, fullPage: true, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') });
    }
    await page.goto(base + '/admin'); await page.waitForSelector('#admin_roles_table th');
    await shot('admin-desktop', '/admin');
    await page.locator('button.adminButton[plugin="roles"]').click(); await page.waitForSelector('#editroledialog:visible');
    await page.locator('#edrole_name').fill('医療チームの閲覧');
    await page.locator('#edrole_permissions').fill('api:entries:read api:status:read api:treatments:read');
    await page.locator('#edrole_notes').fill('血糖・治療記録を閲覧する権限');
    await shot('role-settings-desktop', '/admin'); await page.keyboard.press('Escape');
    await page.locator('button.adminButton[plugin="subjects"]').click(); await page.waitForSelector('#editsubjectdialog:visible');
    await page.locator('#edsub_name').fill('担当スタッフ'); await page.locator('#edsub_roles').fill('readable');
    await page.locator('#edsub_notes').fill('記録を閲覧する担当者');
    await shot('subject-settings-desktop', '/admin'); await page.keyboard.press('Escape');
    await page.locator('#admin_daterange_start').fill('2026-09-01'); await page.locator('#admin_daterange_end').fill('2026-09-07');
    await shot('maintenance-desktop', '/admin');
    await page.goto(base + '/api3-docs/'); await page.getByRole('heading', { name: 'APIの説明', exact: true }).waitFor();
    await page.locator('.opblock-summary-control').first().click();
    await page.getByRole('button', { name: '入力を有効にする', exact: true }).first().waitFor();
    await shot('api-docs-desktop', '/api3-docs/');
    assert.deepEqual(await records('subjects'), subjects); assert.deepEqual(await records('roles'), roles);
    assert.deepEqual(evidence.apiWrites, []); assert.deepEqual(evidence.pageErrors, []);
    fs.writeFileSync(out + '/results.json', JSON.stringify(evidence, null, 2) + '\n');
    console.log('PASS: five actual full-frame management/API captures; no credentials or saved changes.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
