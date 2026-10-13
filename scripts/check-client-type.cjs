'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const out = process.env.TYPE_OUTPUT_DIR || 'docs/verification/client-type/before';
const compare = process.env.TYPE_COMPARE_FILE;
const secret = fs.readFileSync('.env.local', 'utf8').match(/^API_SECRET=(.+)$/m)[1].trim();
const hashed = crypto.createHash('sha1').update(secret).digest('hex');
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
      await page.clock.setFixedTime(new Date('2026-10-13T02:00:00.000Z'));
      await page.addInitScript(value => localStorage.setItem('apisecrethash', JSON.stringify(value)), hashed);
      await page.route('**/api/v1/food/*', route => route.fulfill({json: [{_id: 'client-type-food', type: 'food', name: '確認用のご飯', category: '主食', subcategory: 'ご飯', portion: 150, unit: 'g', carbs: 45, gi: 2}]}));
      await page.goto('http://localhost:8410/?mute=true');
      await page.waitForFunction(() => document.getElementById('container').getAttribute('aria-busy') === 'false' && window.Nightscout.client.hashauth.isAuthenticated());
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => {
        const client = window.Nightscout.client, now = Date.now();
        client.socket.disconnect(); client.alarmSocket.disconnect();
        client.settings.alarmHigh = false; client.settings.alarmLow = false;
        client.dataUpdate({
          sgvs: Array.from({length: 12}, (_, i) => ({mills: now - (11 - i) * 300000, mgdl: 125 + i, direction: 'Flat'})),
          food: [{_id: 'client-type-food', type: 'food', name: '確認用のご飯', category: '主食', subcategory: 'ご飯', portion: 150, unit: 'g', carbs: 45, gi: 2}],
          // Socket treatments have already been assigned a curve glucose value
          // by the server's treatmenttocurve processing.
          treatments: [{_id: 'client-type-meal', eventType: 'Meal Bolus', mills: now - 1800000, created_at: new Date(now - 1800000).toISOString(), mgdl: 130, carbs: 45, insulin: 2.5, enteredBy: '検証用'}]
        }, false);
      });
      await page.waitForFunction(() => Array.from(document.querySelectorAll('#chartContainer .draggable-treatment text')).some(element => element.textContent.trim() && element.getBBox().width > 0));
      // Let the empty/loading adapters finish their mutation-driven layout,
      // then exercise the real resize handler and wait for the D3 transition.
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.evaluate(() => window.dispatchEvent(new Event('resize')));
      await page.waitForTimeout(600);
      const treatmentPositions = await page.locator('#chartContainer .draggable-treatment').evaluateAll(elements => elements.map(element => ({transform: element.getAttribute('transform'), x: element.getBoundingClientRect().x, y: element.getBoundingClientRect().y})));
      assert(treatmentPositions.length > 0 && treatmentPositions.every(item => /^translate\([\d.eE+-]+,\s*[\d.eE+-]+\)$/.test(item.transform)), 'Every actual treatment group must have finite glucose/time coordinates');
      assert.equal(await page.locator('.currentBG').innerText(), '136');
      const chart = await page.locator('#chartContainer svg').evaluate(svg => ({
        layout: Object.fromEntries(['chartContainer', 'container', 'app-main'].map(id => {const rect = document.getElementById(id).getBoundingClientRect(); return [id, {x: rect.x, y: rect.y, width: rect.width, height: rect.height}];})),
        geometry: Array.from(svg.querySelectorAll('[cx],[cy],[d],[points],[transform],text')).map(element => ({tag: element.tagName, attributes: Object.fromEntries(['cx', 'cy', 'r', 'd', 'points', 'x', 'y', 'transform'].filter(key => element.hasAttribute(key)).map(key => [key, element.getAttribute(key)])), text: element.tagName.toLowerCase() === 'text' ? element.textContent : null})),
        fonts: Array.from(svg.querySelectorAll('.axis,.draggable-treatment text')).map(element => ({className: element.getAttribute('class'), declaredStyle: element.style.fontSize, declaredAttribute: element.getAttribute('font-size'), computed: getComputedStyle(element).fontSize}))
      }));
      fs.writeFileSync(out + '/' + name + '-chart-observation.json', JSON.stringify(chart, null, 2));
      if(process.env.TYPE_COMPARE_JAPANESE==='true')chart.timeAxisLabels=await page.locator('#chartContainer svg').evaluate(svg=>Array.from(svg.querySelectorAll('[cx],[cy],[d],[points],[transform],text')).flatMap((element,index)=>element.tagName.toLowerCase()==='text'&&element.closest('.x.axis')?[{index,text:element.textContent,hour:element.__data__.getHours(),minute:element.__data__.getMinutes(),second:element.__data__.getSeconds(),millisecond:element.__data__.getMilliseconds()}]:[]));
      const forecasts = await page.locator('#chartContainer circle.forecast-dot').evaluateAll(elements => elements.map(element => ({stroke: element.getAttribute('stroke'), opacity: element.getAttribute('opacity'), model: {color: element.__data__.color, mills: element.__data__.mills, mgdl: element.__data__.mgdl, type: element.__data__.type}})));
      if (process.env.EXPECT_FORECAST_PAINT === 'true') {
        assert(forecasts.length > 0 && forecasts.every(item => item.stroke === 'var(--app-chart-forecast-ar2)' && item.model.color === 'cyan' && item.model.type === 'forecast'), 'Actual AR2 SVG uses DDS while preserving the model color/type');
        assert(forecasts.every(item => item.opacity === null || Number(item.opacity) <= 0 || Number(item.opacity) >= 0.7), 'Only positive forecast fading is bounded for contrast');
      }
      await page.screenshot({path: out + '/' + name + '-chart.png', fullPage: false});
      let matchedPlotBounds;
      if(compare&&process.env.TYPE_COMPARE_JAPANESE==='true'){
        const original=JSON.parse(fs.readFileSync(compare,'utf8')).results.find(item=>item.viewport===name);
        const currentHeight=await page.locator('#chartContainer').evaluate(element=>element.style.height);
        assert(Number.isFinite(original.chart.layout.chartContainer.height)&&original.chart.layout.chartContainer.height>0);
        const controlledStyle=await page.addStyleTag({content:'#chartContainer {box-sizing:border-box !important;height:'+original.chart.layout.chartContainer.height+'px !important;}'});
        await page.evaluate(()=>{const client=window.Nightscout.client;client.chart.update(false);client.chart.scroll(new Date(client.now));});
        await page.waitForTimeout(600);
        matchedPlotBounds=await page.locator('#chartContainer svg').evaluate(svg=>({width:document.getElementById('chartContainer').getBoundingClientRect().width,height:document.getElementById('chartContainer').getBoundingClientRect().height,geometry:Array.from(svg.querySelectorAll('[cx],[cy],[d],[points],[transform],text')).map(element=>({tag:element.tagName,attributes:Object.fromEntries(['cx','cy','r','d','points','x','y','transform'].filter(key=>element.hasAttribute(key)).map(key=>[key,element.getAttribute(key)])),text:element.tagName.toLowerCase()==='text'?element.textContent:null}))}));
        assert.equal(matchedPlotBounds.width,original.chart.layout.chartContainer.width);assert.equal(matchedPlotBounds.height,original.chart.layout.chartContainer.height,'The comparison uses exactly the original plot bounds');
        await controlledStyle.evaluate(element=>element.remove());
        await page.evaluate(height=>{document.getElementById('chartContainer').style.height=height;const client=window.Nightscout.client;client.chart.update(false);client.chart.scroll(new Date(client.now));},currentHeight);
        await page.waitForTimeout(600);
        assert.equal(await page.locator('#chartContainer').evaluate(element=>element.getBoundingClientRect().height),chart.layout.chartContainer.height,'Restore the actual Japanese layout before further interaction and captures');
      }
      await page.locator('#boluscalcDrawerToggle').click();
      await page.locator('#bc_addfromdatabase').click();
      await page.waitForSelector('#bc_data option', {state: 'attached'});
      await page.locator('#bc_data').selectOption('0');
      await page.locator('#bc_addportions').fill('2');
      await page.locator('.ui-dialog:visible .ui-dialog-buttonset button').first().click();
      await page.waitForSelector('#bc_food table');
      assert.equal(await page.locator('#bc_carbs').inputValue(), '90');
      const calculator = await page.evaluate(() => ({
        carbs: document.getElementById('bc_carbs').value,
        table: Array.from(document.querySelectorAll('#bc_food tr')).map(row => Array.from(row.cells).map(cell => cell.textContent.trim())),
        values: Object.fromEntries(['bc_inzulinbg', 'bc_inzulincarbs', 'bc_iob', 'bc_cobu', 'bc_insulintotal', 'bc_carbsneeded', 'bc_insulinover'].map(id => [id, document.getElementById(id).textContent]))
      }));
      const tableFont = await page.locator('#bc_food table').evaluate(element => ({declared: element.style.fontSize, computed: getComputedStyle(element).fontSize}));
      if (compare) {
        const original = JSON.parse(fs.readFileSync(compare, 'utf8')).results.find(item => item.viewport === name);
        const geometry=JSON.parse(JSON.stringify(matchedPlotBounds?.geometry||chart.geometry));
        if(process.env.TYPE_COMPARE_JAPANESE==='true')for(const tick of chart.timeAxisLabels){
          assert.equal(tick.second,0);assert.equal(tick.millisecond,0);
          const oldText=tick.minute?(tick.hour%12||12)+':'+String(tick.minute).padStart(2,'0'):(tick.hour%12||12)+' '+(tick.hour<12?'AM':'PM');
          const newText=String(tick.hour).padStart(2,'0')+':'+String(tick.minute).padStart(2,'0');
          assert.equal(original.chart.geometry[tick.index].text,oldText,'Original English twelve-hour tick must match the same Date');
          assert.equal(tick.text,newText,'Current Japanese default twenty-four-hour tick must match the same Date');
          geometry[tick.index].text=oldText;
        }
        assert.deepEqual(geometry, original.chart.geometry, name + ' exact glucose/treatment SVG geometry and all text except individually verified localized clock labels');
        assert.deepEqual(calculator, original.calculator, name + ' exact food portions/carbs/calculation values');
        if(process.env.TYPE_COMPARE_JAPANESE==='true')assert.deepEqual(forecasts.map(item=>item.model),original.forecasts.map(item=>item.model),'Actual prediction timestamps, glucose values, type and model color are unchanged at the real viewport');
        assert.equal(tableFont.declared, 'var(--app-text-body-size)');
        assert(chart.fonts.some(font => font.declaredStyle === 'var(--app-text-body-size)'), 'Actual main graph uses the body token');
        assert(chart.fonts.some(font => font.declaredStyle.startsWith('calc(var(--app-text-body-size)')), 'Actual treatment labels retain data-dependent scaling through the token');
      }
      await page.screenshot({path: out + '/' + name + '.png', fullPage: false});
      assert.deepEqual(errors, []); assert.deepEqual(writes, []);
      results.push({viewport: name, pass: true, chart, matchedPlotBounds, forecasts, calculator, tableFont, apiWrites: writes});
      await page.close();
    }
    fs.writeFileSync(out + '/results.json', JSON.stringify({generatedAt: new Date().toISOString(), scope: 'Actual synthetic glucose/treatment rendering and original food picker calculation, two portions=90 g; no API writes. In Japanese comparison mode, preserve real viewport observations/screenshots and compare exact SVG geometry at individually asserted original plot bounds, verifying each changed clock label against the same Date and exact live prediction models/calculator values.', results}, null, 2));
    console.log('PASS: desktop/mobile treatment labels and food calculation' + (compare ? ', exact geometry and values preserved; tokens rendered.' : ' baseline captured.'));
  } finally {await browser.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
