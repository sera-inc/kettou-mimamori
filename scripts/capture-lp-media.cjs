'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const base = 'http://localhost:8410';
const out = 'docs/verification/lp-media';
const hash = crypto.createHash('sha1').update(fs.readFileSync('.env.local', 'utf8').match(/^API_SECRET=(.+)$/m)[1].trim()).digest('hex');
const evidence = {generatedAt: new Date().toISOString(), source: base, database: 'kettou_demo', scope: 'Actual browser rendering and native UI interactions, original complete frames, no response interception, no API writes, no clock replacement', screenshots: [], videos: [], pageErrors: [], apiWrites: []};
async function shot(page, name, route) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(650);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name + ' must fit viewport');
  const file = out + '/' + name + '.png';
  await page.screenshot({path: file, fullPage: true});
  evidence.screenshots.push({name, route, file, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
}
async function pause(page, ms = 2200) {await page.waitForTimeout(ms);}
(async () => {
  const seed = JSON.parse(fs.readFileSync('docs/verification/demo-data.json'));
  assert.equal(seed.synthetic, true);assert.equal(seed.database, 'kettou_demo');
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  try {
    for (const name of ['overview', 'records']) {
      const context = await browser.newContext({viewport: {width: 1440, height: 1000}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block', recordVideo: {dir: out + '/raw', size: {width: 1440, height: 1000}}});
      await context.addInitScript(value => localStorage.setItem('apisecrethash', JSON.stringify(value)), hash);
      const page = await context.newPage();
      page.on('pageerror', error => evidence.pageErrors.push(error.message));
      page.on('request', request => {if (request.url().includes('/api/') && request.method() !== 'GET') evidence.apiWrites.push(request.method());});
      if (name === 'overview') {
        await page.goto(base);await page.waitForFunction(() => document.getElementById('container').getAttribute('aria-busy') === 'false' && Nightscout.client.hashauth.isAuthenticated());
        assert(Number.isFinite(Number(await page.locator('.currentBG').innerText())));
        await shot(page, 'dashboard-desktop', '/');await pause(page);
        for (const hours of [1, 3, 6, 24]) {await page.locator('.focus-range li[data-hours="' + hours + '"] button').click();await pause(page);}
        await page.locator('#drawerToggle').click();await shot(page, 'settings-desktop', '/');await pause(page);
        await page.locator('#drawer').evaluate(el => el.scrollTo(0, el.scrollHeight / 2));await pause(page);
        await page.keyboard.press('Escape');
        await page.locator('#treatmentDrawerToggle').click();await page.locator('#eventType').selectOption('Meal Bolus');
        await page.locator('#carbsGiven').fill('45');await page.locator('#insulinGiven').fill('3');await page.locator('#glucoseValue').fill('120');
        await page.locator('#notes').fill('食事と記録を確認');await shot(page, 'record-entry-desktop', '/');await pause(page);
        await page.keyboard.press('Escape');
        await page.locator('#boluscalcDrawerToggle').click();await shot(page, 'calculator-desktop', '/');await pause(page);
        await page.locator('#bc_addfromdatabase').click();await page.waitForSelector('.ui-dialog:visible');await shot(page, 'food-picker-desktop', '/');await pause(page);
        await page.keyboard.press('Escape');await page.keyboard.press('Escape');
      } else {
        await page.goto(base + '/food');await page.waitForSelector('.fe_editimg');await shot(page, 'food-desktop', '/food');await pause(page);
        await page.locator('#fe_filter_name').fill('ごはん');await pause(page);await page.locator('#fe_filter_name').fill('');await pause(page);
        await page.goto(base + '/profile');await page.waitForSelector('#pe_basal_val_0');assert.equal(Number(await page.locator('#pe_basal_val_0').inputValue()), 0.6);
        await shot(page, 'profile-desktop', '/profile');await pause(page);
        await page.goto(base + '/clock/config');await page.waitForSelector('#cfg_sg');
        await page.locator('#cfg_sg').click();await page.locator('#cfg_ar').click();await page.locator('#cfg_tm').click();
        await page.waitForFunction(()=>/^\d+(?:\.\d+)?$/.test(document.querySelector('.sg')?.textContent||''));
        await shot(page, 'clock-settings-desktop', '/clock/config');await pause(page);
        const clockPath = await page.locator('#clocklink').getAttribute('href');assert(clockPath.startsWith('/clock/'));
        await page.goto(base + clockPath);await page.waitForFunction(()=>/^\d+(?:\.\d+)?$/.test(document.querySelector('.sg')?.textContent||''));
        assert(await page.locator('.ar img').isVisible());assert(await page.locator('.tm').innerText());await pause(page);await shot(page, 'clock-desktop', clockPath);
      }
      const video = page.video();await context.close();
      const file = path.resolve(out, name + '.webm');await video.saveAs(file);
      evidence.videos.push({name, file, bytes: fs.statSync(file).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});
      console.log('Captured complete frames and original UI video: ' + name);
    }
    const context = await browser.newContext({viewport: {width: 390, height: 844}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    await context.addInitScript(value => localStorage.setItem('apisecrethash', JSON.stringify(value)), hash);
    const page = await context.newPage();page.on('pageerror', error => evidence.pageErrors.push(error.message));
    await page.goto(base);await page.waitForFunction(() => document.getElementById('container').getAttribute('aria-busy') === 'false');await shot(page, 'dashboard-mobile', '/');
    await context.close();
    assert.deepEqual(evidence.pageErrors, []);assert.deepEqual(evidence.apiWrites, []);
    fs.writeFileSync(out + '/results.json', JSON.stringify(evidence, null, 2));
    console.log('PASS: recorded real UI, no clinical record writes or page errors.');
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode = 1;});
