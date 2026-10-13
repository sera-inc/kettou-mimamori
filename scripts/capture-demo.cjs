'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const out=process.env.KETTOU_PREVIEW_OUT||'docs/verification/demo-preview',base=process.env.KETTOU_PREVIEW_BASE||'http://localhost:8410';
const secret=fs.readFileSync('.env.local','utf8').match(/^API_SECRET=(.+)$/m)[1].trim();
const hash=crypto.createHash('sha1').update(secret).digest('hex');
(async()=>{
  fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});const results=[],errors=[],writes=[];
  try{
    const latest=(await fetch(base+'/api/v1/entries/sgv.json?count=1').then(r=>r.json()))[0];assert(Number.isFinite(latest.sgv));
    for(const [size,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
      const page=await browser.newPage({viewport,locale:'ja-JP',timezoneId:'Asia/Tokyo',serviceWorkers:'block'});
      page.on('pageerror',error=>errors.push(error.message));page.on('request',r=>{if(r.url().includes('/api/')&&r.method()!=='GET')writes.push(r.method());});
      await page.addInitScript(value=>localStorage.setItem('apisecrethash',JSON.stringify(value)),hash);
      for(const [name,route]of [['dashboard','/'],['food','/food'],['profile','/profile'],['clock','/clock/clock']]){
        assert.equal((await page.goto(base+route)).status(),200);
        if(route==='/'){
          await page.waitForFunction(()=>document.getElementById('container').getAttribute('aria-busy')==='false');
          assert.equal(Number(await page.locator('.currentBG').innerText()),latest.sgv,'Dashboard shows the actual latest server-stored synthetic reading');
          const invalid=await page.locator('#chartContainer svg').evaluateAll(elements=>elements.flatMap(svg=>Array.from(svg.querySelectorAll('*')).flatMap(el=>Array.from(el.attributes).filter(attr=>['transform','cx','cy','d','x','y'].includes(attr.name)&&/NaN|Infinity/.test(attr.value)).map(attr=>({tag:el.tagName,attribute:attr.name,value:attr.value})))));
          assert.deepEqual(invalid,[],'Actual chart coordinates remain finite');
        }else if(route==='/food'){
          await page.waitForSelector('.fe_editimg');assert.equal(await page.locator('.fe_editimg').count(),2);
          assert((await page.locator('#fe_data').innerText()).includes('ごはん（確認用）'));
          assert(await page.locator('#fe_picklist input[type="text"]').evaluateAll(inputs=>inputs.some(input=>input.value==='朝食（確認用）')));
        }else if(route==='/profile'){
          await page.waitForSelector('#pe_basal_val_0');assert.equal(Number(await page.locator('#pe_basal_val_0').inputValue()),0.6);assert.equal(await page.locator('#pe_timezone').inputValue(),'Asia/Tokyo');
        }else await page.waitForTimeout(2000);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(600);
        const file=out+'/'+size+'-'+name+'.png';await page.screenshot({path:file,fullPage:route!=='/'});
        results.push({viewport:size,route,file,pass:true,japanese:await require('./japanese-ui-text.cjs')(page)});
      }
      await page.close();
    }
    assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
    fs.writeFileSync(out+'/results.json',JSON.stringify({generatedAt:new Date().toISOString(),base,scope:'Actual isolated synthetic DB, eight live routes/viewports; finite chart coordinates, latest server reading, persisted food/quickpick/profile, screenshots, no interception or API writes',latestSGV:latest.sgv,results,pageErrors:errors,apiWrites:writes},null,2));
    console.log('PASS: eight actual sample-data preview screenshots and finite chart/profile/food checks.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
