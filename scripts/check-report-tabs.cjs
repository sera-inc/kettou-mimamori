'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const out = 'docs/verification/report-tabs';
const origin = process.env.PREVIEW_URL || 'http://localhost:8410';
const results = [];
(async () => {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({headless: true, channel: 'chrome'});
  const errors = [], writes = [];
  try {
    for (const [size, viewport] of [['desktop', {width: 1440, height: 1000}], ['mobile', {width: 390, height: 844}]]) {
      const page = await browser.newPage({viewport, locale: 'ja-JP', serviceWorkers: 'block'});
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {if (request.url().includes('/api/') && request.method() !== 'GET') writes.push(request.method());});
      await page.goto(origin + '/report');
      await page.waitForSelector('#tabnav [role="tab"][aria-selected="true"]');
      const ids = await page.locator('#tabnav [role="tab"]').evaluateAll(tabs => tabs.map(tab => tab.id));
      assert.equal(ids.length, 11, 'All eleven original report types must remain available');
      await page.locator('#rp_from').fill('2026-10-01');
      await page.locator('#rp_to').fill('2026-10-12');
      await page.locator('#rp_targetlow').fill('80');
      await page.locator('#rp_targethigh').fill('180');
      await page.locator('#rp_notes').fill('確認用の条件');
      await page.locator('#rp_enablenotes').check();
      const filters = () => page.evaluate(() => Object.fromEntries(['rp_from', 'rp_to', 'rp_targetlow', 'rp_targethigh', 'rp_notes', 'rp_enablenotes'].map(id => {const input = document.getElementById(id); return [id, input.type === 'checkbox' ? input.checked : input.value];})));
      const before = await filters();
      async function verify(index) {
        await page.waitForFunction(id => document.getElementById(id).getAttribute('aria-selected') === 'true', ids[index]);
        assert.equal(await page.locator('#tabnav [aria-selected="true"]').count(), 1);
        assert.equal(await page.locator('#tabnav [tabindex="0"]').count(), 1);
        assert.equal(await page.locator(':focus').getAttribute('id'), ids[index]);
        const panel = page.locator('#' + ids[index] + '-placeholder');
        assert(await panel.isVisible());
        assert.equal(await panel.getAttribute('aria-labelledby'), ids[index]);
        assert.equal(await panel.getAttribute('tabindex'), '0');
        for (const id of ids.filter(id => id !== ids[index])) assert(!(await page.locator('#' + id + '-placeholder').isVisible()), id);
        const style = await page.locator('#' + ids[index]).evaluate(tab => {const css = getComputedStyle(tab); return {height: tab.getBoundingClientRect().height, outline: css.outlineStyle, width: parseFloat(css.outlineWidth), weight: Number(css.fontWeight), visible: tab.matches(':focus-visible')};});
        assert(style.height >= 44 && style.visible && style.outline === 'solid' && style.width >= 3 && style.weight >= 700, JSON.stringify(style));
        assert.deepEqual(await filters(), before, 'Switching report types must preserve dates, targets and notes');
      }
      await page.locator('#' + ids[0]).focus();
      await page.keyboard.press('Home');
      await verify(0);
      for (let i = 1; i < ids.length; i++) {await page.keyboard.press('ArrowRight'); await verify(i);}
      await page.keyboard.press('ArrowRight'); await verify(0);
      await page.keyboard.press('ArrowLeft'); await verify(ids.length - 1);
      await page.keyboard.press('Home'); await verify(0);
      await page.keyboard.press('End'); await verify(ids.length - 1);
      await page.keyboard.press('Enter'); await verify(ids.length - 1);
      await page.keyboard.press('Space'); await verify(ids.length - 1);
      await page.keyboard.press('Tab');
      assert.equal(await page.locator(':focus').getAttribute('id'), 'rp_enabledate', 'Tab exits the roving tablist and reaches report filters');
      await page.locator('#' + ids[0]).focus(); await page.keyboard.press('Home'); await verify(0);
      await page.screenshot({path: out + '/' + size + '.png', fullPage: true});
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Report tabs wrap within the page');
      results.push({viewport: size, reportTypes: ids, pass: true, assertions: ['all eleven types by keyboard', 'Home/End and wrapped arrows', 'Enter/Space', 'visible focus and selected indicator', 'one active panel and roving stop', 'Tab exits to filters', 'dates/targets/notes remain exact', 'no horizontal page overflow']});
      await page.close();
    }
    assert.deepEqual(errors, []); assert.deepEqual(writes, []);
    fs.writeFileSync(out + '/results.json', JSON.stringify({generatedAt: new Date().toISOString(), results, pageErrors: errors, apiWrites: writes}, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
