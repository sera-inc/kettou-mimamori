'use strict';
const fs = require('node:fs');const assert = require('node:assert/strict');const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const paint = require('../lib/client/forecast-paint');
const cases = [
  ['ar2', 'cyan', null], ['value', '#ff00ff', 'Values'], ['iob', '#1e88e5', 'IOB'], ['cob', '#FB8C00', 'COB'], ['acob', '#FB8C00', 'Accel-COB'], ['zt', '#00d2d2', 'Zero-Temp'], ['uam', '#c9bd60', 'UAM']
];
const results = [];
for (const [name, color, forecastType] of cases) {
  const entry = Object.freeze({type: 'forecast', color, forecastType, mills: 123456, mgdl: 142, info: Object.freeze({type: name})});
  assert.equal(paint.color(entry), 'var(--app-chart-forecast-' + name + ')');
  assert.equal(paint.opacity(entry, 0.1), 0.7);assert.equal(paint.opacity(entry, 0.8), 0.8);
  for (const value of [null, 0, -0.1, NaN, undefined, Infinity]) assert(Object.is(paint.opacity(entry, value), value), 'Invisible/past/non-finite opacity must be preserved');
  assert.equal(paint.opacity({...entry, noFade: true}, 0.1), 0.1);
  assert.equal(JSON.stringify(entry), JSON.stringify({type: 'forecast', color, forecastType, mills: 123456, mgdl: 142, info: {type: name}}));
  results.push({case: name, pass: true, color, token: paint.color(entry), modelRecordUnchanged: true});
}
for (const color of ['transparent', '#123456', 'rgb(40, 70, 100)', 'var(--app-primary)', '', undefined]) {
  const entry = Object.freeze({type: 'forecast', color});assert.equal(paint.color(entry), color);assert.equal(paint.opacity(entry, 0.1), 0.1);
}
for (const type of ['sgv', 'mbg', 'rawbg']) {const entry = {type, color: 'cyan'};assert.equal(paint.color(entry), 'cyan');assert.equal(paint.opacity(entry, 0.1), 0.1);}
(async () => {
  const out = 'docs/verification/forecast-paint';fs.mkdirSync(out, {recursive: true});const browser = await chromium.launch({headless: true, channel: 'chrome'});
  try {
    const page = await browser.newPage({serviceWorkers: 'block'});await page.goto('http://localhost:8410/');
    const palette = await page.evaluate(names => {
      const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
      const luminance = values => values.map(value => {value /= 255;return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);}).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
      const probe = document.createElement('span');document.body.append(probe);probe.style.color = 'var(--app-surface)';const surface = rgb(getComputedStyle(probe).color), surfaceLight = luminance(surface);
      const rows = names.map(name => {probe.style.color = 'var(--app-chart-forecast-' + name + ')';const color = getComputedStyle(probe).color, values = rgb(color);const mixed = values.map((value, i) => value * 0.7 + surface[i] * 0.3);const light = luminance(mixed);return {name, color, minimumOpacity: 0.7, surface, minimumContrast: (Math.max(light, surfaceLight) + 0.05) / (Math.min(light, surfaceLight) + 0.05)};});probe.remove();return rows;
    }, cases.map(row => row[0]));
    assert.equal(new Set(palette.map(row => row.color)).size, 7);for (const row of palette) assert(row.minimumContrast >= 3, row.name + ' default forecast stroke must meet 3:1 even at its lowest positive opacity');
    fs.writeFileSync(out + '/results.json', JSON.stringify({generatedAt: new Date().toISOString(), scope: 'Seven known default forecast paints, actual computed DDS colors and alpha-composited contrast; frozen model records, exact custom colors, noFade, transparent/past/out-of-range/nonfinite opacity preserved; no API writes', results, palette}, null, 2));
    console.log('PASS: seven default prediction colors, 3:1 at minimum opacity, immutable data and custom/invisible/noFade behavior.');
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode = 1;});
