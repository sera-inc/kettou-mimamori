'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright'),displayAge=require('../lib/utils/display-age');
const out='docs/verification/demo-localization';
(async()=>{
  fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true}),results=[],writes=[],errors=[];
  const hash=crypto.createHash('sha1').update(fs.readFileSync('.env.local','utf8').match(/^API_SECRET=(.+)$/m)[1].trim()).digest('hex');
  try{
    for(const [size,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
      const page=await browser.newPage({viewport,locale:'ja-JP',serviceWorkers:'block'});
      page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/')&&r.method()!=='GET')writes.push(r.method());});
      await page.addInitScript(value=>localStorage.setItem('apisecrethash',JSON.stringify(value)),hash);
      await page.goto('http://localhost:8410/');await page.waitForFunction(()=>document.getElementById('container').getAttribute('aria-busy')==='false');
      const ages=await page.evaluate(()=>{const p=Nightscout.client.sbx.properties;return {cage:p.cage.display,iage:p.iage.display,sage:p.sage[p.sage.min].display};});
      for(const [name,value]of Object.entries(ages))assert.equal(await page.locator('.pill.'+name+' em').innerText(),displayAge(name,value,'ja'));
      await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
      const mainA11y=await page.evaluate(async()=>{const r=await axe.run(document);return r.violations;});assert.deepEqual(mainA11y,[]);
      assert.deepEqual((await require('./japanese-ui-text.cjs')(page)).candidates,[]);
      await page.locator('#boluscalcDrawerToggle').click();await page.locator('#bc_addfromdatabase').click();await page.waitForSelector('#bc_data option',{state:'attached'});
      const options=await page.locator('#bc_data option').evaluateAll(items=>items.map(item=>({value:item.value,text:item.textContent})));
      assert.equal(options.length,2);assert(options.every(option=>option.text.includes('一食分:')&&option.text.includes('炭水化物:')&&!/Portion|Carbs/.test(option.text)));
      assert.deepEqual((await require('./japanese-ui-text.cjs')(page)).candidates,[]);
      const dialogA11y=await page.evaluate(async()=>{const r=await axe.run(document);return r.violations;});assert.deepEqual(dialogA11y,[]);
      const rice=options.find(option=>option.text.startsWith('ごはん（確認用）'));assert(rice);
      await page.locator('#bc_data').selectOption(rice.value);await page.locator('#bc_addportions').fill('2');await page.locator('.ui-dialog:visible .ui-dialog-buttonset button').first().click();
      assert.equal(Number(await page.locator('#bc_carbs').inputValue()),110,'Two actual server-stored rice portions retain the original nutrient calculation');
      await page.screenshot({path:out+'/'+size+'-food-calculation.png',fullPage:false});
      results.push({viewport:size,pass:true,originalModelDisplays:ages,japaneseAgeDisplays:Object.fromEntries(Object.entries(ages).map(([name,value])=>[name,displayAge(name,value,'ja')])),foodOptions:options,selectedPortions:2,carbs:110,mainAxeViolations:0,dialogAxeViolations:0});
      await page.close();
    }
    assert.deepEqual(writes,[]);assert.deepEqual(errors,[]);
    fs.writeFileSync(out+'/results.json',JSON.stringify({generatedAt:new Date().toISOString(),scope:'Actual seeded age pill properties preserved with Japanese DOM text; real food picker labels/units and two portions = 110g; whole-document axe and visible Japanese text; no interception or saves',results,apiWrites:writes,pageErrors:errors},null,2));console.log('PASS: actual Japanese age/food displays, nutrient calculations and four axe scans.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
