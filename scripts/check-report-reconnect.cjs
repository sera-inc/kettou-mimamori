'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const out = 'docs/verification/report-reconnect';
(async () => {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({headless: true, channel: 'chrome'});
  const results = [];
  try {
    for (const [name, viewport] of [['desktop', {width: 1440, height: 1000}], ['mobile', {width: 390, height: 844}]]) {
      const page = await browser.newPage({viewport, locale: 'ja-JP', serviceWorkers: 'block'});
      const errors = [], writes = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {if (request.url().includes('/api/') && request.method() !== 'GET') writes.push(request.method());});
      await page.goto('http://localhost:8410/report');
      await page.waitForSelector('#tabnav .menutab[aria-selected="true"]');
      await page.waitForFunction(() => window.Nightscout.report_plugins && window.Nightscout.client.socket.connected);
      await page.locator('#rp_from').fill('2026-09-29');
      await page.locator('#rp_to').fill('2026-10-12');
      await page.locator('#rp_targetlow').fill('75');
      await page.locator('#rp_targethigh').fill('170');
      await page.locator('#rp_notes').fill('再接続後にも条件を保持');
      await page.locator('#hourlystats').click();
      await page.evaluate(() => {
        const client = window.Nightscout.client;
        window.reportOriginalPlugins = window.Nightscout.report_plugins;
        window.reportAuthorizations = 0;
        window.reportShowHandlers = window.$._data(document.getElementById('rp_show'), 'events').click.length;
        const emit = client.socket.emit;
        client.socket.emit = function (event, ...args) {
          if (event === 'authorize') {
            const complete = args[args.length - 1];
            args[args.length - 1] = function (...values) {complete(...values); window.reportAuthorizations++;};
          }
          return emit.call(this, event, ...args);
        };
      });
      // Exercise the actual acknowledgement path, then a real transport reconnect.
      for (const operation of ['reauthorize', 'reconnect']) {
        const count = await page.evaluate(() => window.reportAuthorizations);
        await page.evaluate(operation => {
          const client = window.Nightscout.client;
          if (operation === 'reauthorize') client.authorizeSocket();
          else {client.socket.disconnect(); client.socket.connect();}
        }, operation);
        await page.waitForFunction(count => window.reportAuthorizations > count && window.Nightscout.client.socket.connected, count);
        const state = await page.evaluate(() => ({
          from: document.getElementById('rp_from').value,
          to: document.getElementById('rp_to').value,
          low: document.getElementById('rp_targetlow').value,
          high: document.getElementById('rp_targethigh').value,
          notes: document.getElementById('rp_notes').value,
          selected: document.querySelector('.menutab.selected').id,
          samePlugins: window.reportOriginalPlugins === window.Nightscout.report_plugins,
          handlers: window.$._data(document.getElementById('rp_show'), 'events').click.length,
          originalHandlers: window.reportShowHandlers
        }));
        assert.deepEqual({...state, handlers: undefined, originalHandlers: undefined}, {
          from: '2026-09-29', to: '2026-10-12', low: '75', high: '170',
          notes: '再接続後にも条件を保持', selected: 'hourlystats', samePlugins: true,
          handlers: undefined, originalHandlers: undefined
        });
        assert.equal(state.handlers, state.originalHandlers, 'Reconnect must not duplicate the Show handler');
        results.push({viewport: name, operation, pass: true, ...state});
      }
      assert.deepEqual(errors, []);
      assert.deepEqual(writes, []);
      await page.close();
    }
    fs.writeFileSync(out + '/results.json', JSON.stringify({generatedAt: new Date().toISOString(), scope: 'Actual authorization acknowledgements and socket transport reconnects; filters, active report, plugin identity and Show handler count; no API writes', results}, null, 2));
    console.log('PASS: report filters and handlers survive reauthorization and transport reconnect on desktop/mobile.');
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
