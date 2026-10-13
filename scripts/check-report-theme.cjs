'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const source = fs.readFileSync('lib/report/theme.js', 'utf8');
(async () => {
  const browser = await chromium.launch({headless: true, channel: 'chrome'});
  try {
    const page = await browser.newPage({viewport: {width: 1440, height: 1000}});
    await page.goto('http://localhost:8410/report');
    await page.waitForSelector('#tabnav .menutab');
    await page.addScriptTag({content: 'window.reportThemeCheck = (() => { const module = {exports: {}};\n' + source + '\nreturn module.exports; })();'});
    const result = await page.evaluate(() => {
      const theme = window.reportThemeCheck;
      const background = theme.color('--app-surface');
      function rgb(color) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.fillStyle = color;context.fillRect(0, 0, 1, 1);
        return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
      }
      function luminance(color) {return rgb(color).map(value => {const scaled = value / 255;return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;}).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);}
      function contrast(ink, surface) {const first = luminance(ink), second = luminance(surface);return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);}
      const palettes = [];
      for (let index = 1; index <= 12; index++) {
        const ink = theme.color('--app-chart-cal-ink-' + index), surface = theme.color('--app-chart-cal-bg-' + index);
        palettes.push({category: 'calibration ' + index, ink, surface, onWhite: contrast(ink, background), onSurface: contrast(ink, surface)});
      }
      for (let index = 1; index <= 7; index++) {
        const ink = theme.color('--app-chart-day-' + index);
        palettes.push({category: 'weekday ' + index, ink, surface: background, onWhite: contrast(ink, background), onSurface: contrast(ink, background)});
      }
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const circle = document.createElementNS(svg.namespaceURI, 'circle');svg.append(circle);document.body.append(svg);
      const classifications = ['darkgreen', 'red', 'gray', 'purple', 'transparent', 'var(--app-chart-day-1)'].map(value => {
        const paint = theme.readingColor(value);circle.style.fill = paint;
        return {classification: value, paint, computedFill: getComputedStyle(circle).fill};
      });
      svg.remove();
      const rejected = ['#fff', '--dads-color-white', '--app-does-not-exist'].map(token => {try {theme.color(token);return {token, rejected: false};} catch (error) {return {token, rejected: true, message: error.message};}});
      return {palettes, classifications, rejected};
    });
    fs.writeFileSync('docs/verification/report-styles/theme-observation.json', JSON.stringify({generatedAt: new Date().toISOString(), ...result}, null, 2));
    const contrastFailures = result.palettes.filter(item => item.onWhite < 3 || item.onSurface < 4.5);
    assert.deepEqual(contrastFailures, [], 'Category ink must meet graphical and text contrast on its surfaces');
    assert.equal(new Set(result.palettes.slice(0, 12).map(item => item.ink)).size, 12, 'All twelve calibration inks remain distinct');
    assert.equal(new Set(result.palettes.slice(12).map(item => item.ink)).size, 7, 'All seven weekday inks remain distinct');
    assert(result.rejected.every(item => item.rejected), 'Never silently fall back to a raw/default color');
    for (const item of result.classifications.slice(0, 4)) assert(/^var\(--app-/.test(item.paint) && /^rgb\(/.test(item.computedFill), 'Visible reading classification must resolve to semantic ink');
    assert.equal(result.classifications[4].paint, 'transparent');assert.equal(result.classifications[4].computedFill, 'rgba(0, 0, 0, 0)');
    assert.equal(result.classifications[5].paint, 'var(--app-chart-day-1)');
    fs.writeFileSync('docs/verification/report-styles/theme.json', JSON.stringify({generatedAt: new Date().toISOString(), pass: true, ...result}, null, 2));
    console.log('PASS: 12 calibration and 7 weekday inks, computed semantic reading paint, contrast, and invalid-token rejection.');
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode = 1;});
