'use strict';
const fs = require('node:fs');const assert = require('node:assert/strict');const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const out = process.env.REPORT_OUTPUT_DIR || 'docs/verification/report-styles/before';
const snapshot = process.env.REPORT_COMPARE_FILE;
const realDatabase = process.env.REPORT_USE_DEMO_DB === 'true';
const demo = realDatabase ? JSON.parse(fs.readFileSync('docs/verification/demo-data.json', 'utf8')) : null;
if (demo) {assert.equal(demo.synthetic, true);assert.equal(demo.database, 'kettou_demo');assert(!snapshot, 'Real current database data has a separate verification scope');}
const moment = require('moment-timezone');
const fromDay = demo ? moment.tz(demo.from, 'Asia/Tokyo').format('YYYY-MM-DD') : '2026-09-29';
const toDay = demo ? moment.tz(demo.to, 'Asia/Tokyo').format('YYYY-MM-DD') : '2026-10-12';
const first = Date.parse('2026-09-28T15:00:00.000Z'), end = first + 14 * 86400000;
const entries = [], treatments = [];
// Keep synthetic readings inside each five-minute interval; Loopalyzer's legacy
// interval selection excludes both exact endpoints. Boundary behavior is audited separately.
for (let date = first + 150000, i = 0; date < end; date += 300000, i++) {const sgv = Math.round(130 + 90 * Math.sin(i / 17));entries.push({type: 'sgv', date, dateString: new Date(date).toISOString(), sgv, device: '合成センサー', filtered: sgv * 1000, unfiltered: sgv * 1000 + 100, direction: 'Flat', noise: 1});}
for (let day = 0; day < 14; day++) {
  const date = first + day * 86400000 + 8 * 3600000;
  entries.push({type: 'mbg', date, dateString: new Date(date).toISOString(), mbg: 125, device: '合成測定器'});
  entries.push({type: 'cal', date: date + 1000, dateString: new Date(date + 1000).toISOString(), scale: 1, slope: 1000, intercept: 0});
  for (const [hour, data] of [[2, {eventType: 'Sensor Change'}], [7, {eventType: 'Temp Basal', absolute: 0.8, duration: 30}], [8, {eventType: 'Meal Bolus', carbs: 45, insulin: 2.5}], [12, {eventType: 'Note', notes: '合成データによる表示確認'}], [15, {eventType: 'Exercise', duration: 30}]]) treatments.push({...data, created_at: new Date(first + day * 86400000 + hour * 3600000).toISOString(), enteredBy: '検証用'});
}
function matches(record, params, key, field) {const value = new Date(record[field]).getTime();for (const operation of ['$gte', '$gt', '$lte', '$lt']) {const condition = params.get('find[' + key + '][' + operation + ']');if (condition === null) continue;const limit = /^\d+$/.test(condition) ? Number(condition) : Date.parse(condition);if (operation === '$gte' && value < limit || operation === '$gt' && value <= limit || operation === '$lte' && value > limit || operation === '$lt' && value >= limit) return false;}return true;}
(async () => {
  fs.mkdirSync(out, {recursive: true}); const browser = await chromium.launch({headless: true, channel: 'chrome'});const errors = [], writes = [], reports = [], accessibility = [];
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 1100}, locale: 'ja-JP', timezoneId: 'Asia/Tokyo', serviceWorkers: 'block'});
    const timings = [];
    await page.addInitScript(() => {
      window.reportFilterChanges = [];
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      Object.defineProperty(HTMLInputElement.prototype, 'value', {...descriptor, set(value) {
        if (['rp_from', 'rp_to'].includes(this.id)) window.reportFilterChanges.push({id: this.id, value, stack: new Error().stack});
        return descriptor.set.call(this, value);
      }});
    });
    page.on('console', message => {if (message.text().startsWith('REPORT_TIMING ')) {const timing = JSON.parse(message.text().slice(14));timings.push(timing);console.log(message.text());}});
    // Freeze both new Date() and Date.now(); timers continue normally. Percentile
    // bins otherwise retain the real current seconds/milliseconds.
    if (!realDatabase) await page.clock.setFixedTime(new Date('2026-10-12T16:00:00.000Z'));
    page.on('pageerror', error => {errors.push(error.message);console.error('Browser exception: ' + error.message);});page.on('request', request => {if (request.url().includes('/api/') && request.method() !== 'GET') writes.push(request.method());});
    if (!realDatabase) {
      await page.route('**/api/v1/entries.json*', route => {const params = new URL(route.request().url()).searchParams;return route.fulfill({json: entries.filter(record => matches(record, params, 'date', 'date')).sort((a, b) => b.date - a.date)});});
      await page.route('**/api/v1/treatments.json*', route => {const params = new URL(route.request().url()).searchParams;return route.fulfill({json: treatments.filter(record => matches(record, params, 'created_at', 'created_at') && (!params.has('find[eventType]') || record.eventType === params.get('find[eventType]')))});});
    }
    await page.goto('http://localhost:8410/report');await page.waitForSelector('#tabnav .menutab[aria-selected="true"]');
    await page.evaluate(() => {
      const plugin = window.Nightscout.report_plugins('loopalyzer');
      for (const name of ['report', 'getSGVs', 'getBasals', 'getTempBasalDeltas', 'getIOBs', 'getCOBs']) {
        const original = plugin[name];
        plugin[name] = function (...args) {const start = performance.now();try {return original.apply(this, args);} finally {console.log('REPORT_TIMING ' + JSON.stringify({name, milliseconds: performance.now() - start}));}};
      }
    });
    await page.locator('#rp_from').fill(fromDay);await page.locator('#rp_to').fill(toDay);await page.locator('#rp_targetlow').fill('80');await page.locator('#rp_targethigh').fill('180');
    const ids = await page.locator('#tabnav .menutab').evaluateAll(tabs => tabs.map(tab => tab.id));assert.equal(ids.length, 11);
    const requested = process.env.REPORT_ONLY_IDS ? process.env.REPORT_ONLY_IDS.split(',') : ids;
    assert(requested.length && requested.every(id => ids.includes(id)), 'Only real, explicitly selected report tabs may be tested');
    const targets = ids.filter(id => requested.includes(id));
    for (const id of targets) {
      const range = {from: await page.locator('#rp_from').inputValue(), to: await page.locator('#rp_to').inputValue()};
      if (range.from !== fromDay || range.to !== toDay) {fs.writeFileSync(out + '/filter-changes.json', JSON.stringify(await page.evaluate(() => window.reportFilterChanges), null, 2));throw Error('Report date range changed before ' + id + ': ' + JSON.stringify(range));}
      await page.locator('#' + id).click();await page.locator('#rp_show').click();
      await page.waitForFunction(() => document.getElementById('rp_show').style.display !== 'none' && document.getElementById('info').textContent.trim() === '', null, {timeout: 120000}).catch(async error => {console.error(JSON.stringify({id, info: await page.locator('#info').textContent(), buttonStyle: await page.locator('#rp_show').getAttribute('style'), errors}, null, 2));await page.screenshot({path: out + '/' + id + '-failed.png', fullPage: true});throw error;});
      const result = await page.locator('#' + id + '-placeholder').evaluate(panel => {
        const plots = Array.from(panel.querySelectorAll('*')).map(element => ({element, plot: window.$(element).data('plot')})).filter(item => item.plot?.getData).map(({element, plot}) => ({id: element.id, series: plot.getData().map(series => ({id: series.id || null, label: series.label || null, data: series.data})), colors: plot.getData().map(series => series.color)}));
        const svg = Array.from(panel.querySelectorAll('svg')).filter(svg => svg.getBoundingClientRect().width > 20).map(element => ({id: element.id, width: element.getAttribute('width'), height: element.getAttribute('height'), geometry: Array.from(element.querySelectorAll('[cx],[cy],[d],[points]')).map(node => ({tag: node.tagName, attributes: Object.fromEntries(['cx', 'cy', 'r', 'd', 'points', 'transform'].filter(name => node.hasAttribute(name)).map(name => [name, node.getAttribute(name)]))}))}));
        const tables = Array.from(panel.querySelectorAll('table')).map(table => Array.from(table.querySelectorAll('tr')).map(row => Array.from(row.querySelectorAll(':scope > th,:scope > td')).map(cell => cell.textContent.trim())));
        return {plots, svg, tables, renderedText: panel.textContent.trim().slice(0, 300)};
      });
      if (!result.plots.length && !result.svg.length && !result.tables.some(rows => rows.length > 1)) fs.writeFileSync(out + '/' + id + '-empty-observation.json', JSON.stringify({result, filterChanges: await page.evaluate(() => window.reportFilterChanges), from: await page.locator('#rp_from').inputValue(), to: await page.locator('#rp_to').inputValue(), info: await page.locator('#info').textContent(), errors}, null, 2));
      assert(result.plots.length || result.svg.length || result.tables.some(rows => rows.length > 1), id + ' must actually render data');
      if (id === 'loopalyzer') {
        assert.equal(result.plots.length, 5, 'All five Loopalyzer graphs must render');
        const glucose = result.plots.find(plot => plot.id === 'loopalyzer-bg');
        assert(glucose.series.some(series => series.data.some(point => Number.isFinite(point[1]))), 'The glucose graph must contain real finite readings, not just axes');
      }
      if (process.env.REPORT_A11Y === 'true') {
        if (!await page.evaluate(() => Boolean(window.axe))) await page.addScriptTag({path: require.resolve('axe-core/axe.min.js')});
        const audit = await page.evaluate(async () => {
          const result = await window.axe.run(document);
          const pick = item => ({id: item.id, impact: item.impact, description: item.description, nodes: item.nodes.map(node => ({target: node.target, html: node.html, failureSummary: node.failureSummary}))});
          return {version: result.testEngine.version, violations: result.violations.map(pick), incomplete: result.incomplete.map(pick)};
        });
        accessibility.push({id, ...audit});
        fs.writeFileSync(out + '/a11y-progress.json', JSON.stringify({generatedAt: new Date().toISOString(), complete: false, scans: accessibility}, null, 2));
        console.log(id + ': ' + audit.violations.length + ' axe violations');
      }
      const japanese = process.env.AUDIT_JAPANESE === 'true' ? await require('./japanese-ui-text.cjs')(page) : undefined;
      reports.push({id, ...result, japanese});
      fs.writeFileSync(out + '/progress.json', JSON.stringify({generatedAt: new Date().toISOString(), complete: false, reports, timings, pageErrors: errors, apiWrites: writes}, null, 2));
      const fullPage = await page.evaluate(() => document.documentElement.scrollHeight <= 10000);
      if (!fullPage) await page.locator('#' + id + '-placeholder').scrollIntoViewIfNeeded();
      await page.screenshot({path: out + '/' + id + '.png', fullPage});
      console.log(id + ': ' + result.plots.length + ' Flot plots, ' + result.svg.length + ' SVG charts, ' + result.tables.length + ' tables');
    }
    assert.deepEqual(errors, []);assert.deepEqual(writes, []);
    assert.deepEqual(reports.map(report => report.id), targets, 'Every selected workflow must finish');
    const evidence = {generatedAt: new Date().toISOString(), scope: 'Real report Show workflow with browser-intercepted fourteen-day synthetic entries/treatments, frozen browser Date and Date.now with real timers and real isolated profile; no database writes; SGV samples inside each five-minute bucket', selectedReports: targets, entries: entries.length, treatments: treatments.length, reports, timings, pageErrors: errors, apiWrites: writes};
    if (realDatabase) Object.assign(evidence, {scope: 'Actual HTTP requests and server-stored isolated synthetic sample database; no response interception, fixed browser clock or API writes; five-minute boundary samples', database: demo.database, from: fromDay, to: toDay, entries: demo.entries, treatments: demo.treatments});
    fs.writeFileSync(out + '/results.json', JSON.stringify(evidence, null, 2));
    if (process.env.REPORT_A11Y === 'true') fs.writeFileSync(out + '/a11y.json', JSON.stringify({generatedAt: new Date().toISOString(), scope: 'All enabled axe rules on the whole desktop document after the actual Show workflow with fourteen days of synthetic data; explicitly selected populated panels; incomplete retained for human review', selectedReports: targets, scans: accessibility}, null, 2));
    if (snapshot) {const result = require('./compare-report-rendering.cjs')(snapshot, out + '/results.json');fs.writeFileSync(out + '/comparison.json', JSON.stringify(result, null, 2));console.log('PASS: all serialized report data and geometry match the pre-migration browser snapshot.');}
    if (process.env.REPORT_A11Y === 'true') assert.deepEqual(accessibility.flatMap(audit => audit.violations.filter(item => ['critical', 'serious'].includes(item.impact)).map(item => ({report: audit.id, ...item}))), [], 'No critical/serious violations in populated report workflows');
    if (realDatabase && process.env.REPORT_A11Y === 'true') assert.deepEqual(accessibility.flatMap(audit => audit.violations.map(item => ({report: audit.id, ...item}))), [], 'All axe violations must be resolved in the actual sample DB workflows');
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode = 1;});
