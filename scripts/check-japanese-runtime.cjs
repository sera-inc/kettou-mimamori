'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const out='docs/verification/japanese/runtime';
const secret=fs.readFileSync('.env.local','utf8').match(/^API_SECRET=(.+)$/m)[1].trim();
const hashed=crypto.createHash('sha1').update(secret).digest('hex');
(async()=>{
  fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,channel:'chrome'});const results=[];
  try{
    for(const [size,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
      for(const scenario of [{name:'default',language:null,time:null,expectedTime:'13:05'},{name:'stored-twelve',language:'ja',time:12,expectedTime:'1:05 午後'},{name:'dictionary-fallback',language:'ja',time:24,failDictionary:true,expectedTime:'13:05'},{name:'explicit-english',language:'en',time:12,expectedTime:'1:05 pm'}]){
        const page=await browser.newPage({viewport,locale:'ja-JP',timezoneId:'Asia/Tokyo',serviceWorkers:'block'});const errors=[],writes=[];
        page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/')&&r.method()!=='GET')writes.push(r.method());});
        await page.addInitScript(({hashed,scenario})=>{localStorage.setItem('apisecrethash',JSON.stringify(hashed));if(scenario.language&&localStorage.getItem('language')===null)localStorage.setItem('language',JSON.stringify(scenario.language));if(scenario.time&&localStorage.getItem('timeFormat')===null)localStorage.setItem('timeFormat',JSON.stringify(scenario.time));},{hashed,scenario});
        if(scenario.failDictionary)await page.route('**/translations/ja_JP.json',r=>r.fulfill({status:503,body:'isolated language fallback verification'}));
        await page.goto('http://localhost:8410/?mute=true');await page.waitForFunction(()=>document.getElementById('container').getAttribute('aria-busy')==='false');
        const initial=await page.evaluate(()=>{const c=window.Nightscout.client;return {language:c.settings.language,timeFormat:c.settings.timeFormat,time:c.formatTime(new Date(2026,9,13,13,5)),auth:c.translate('Device authentication'),directions:c.translate('Flat')};});
        assert.equal(initial.language,scenario.language||'ja');assert.equal(initial.timeFormat,scenario.time||24);assert.equal(initial.time,scenario.expectedTime);assert(!initial.time.includes('%'));
        assert.equal(initial.auth,scenario.language==='en'?'Device authentication':'この端末を認証');
        await page.locator('#drawerToggle').click();await page.waitForFunction(()=>document.getElementById('drawer').getAttribute('aria-modal')==='true');
        const options=await page.locator('#language option').evaluateAll(options=>options.map(option=>({value:option.value,text:option.textContent})));
        assert.equal(options.length,30);assert.equal(new Set(options.map(option=>option.value)).size,30);
        if(scenario.language!=='en')assert(options.every(option=>/[ぁ-んァ-ヶ一-龯]/.test(option.text)),'All language choices have Japanese names');
        if(scenario.name==='stored-twelve'){
          await page.locator('input[name="timeformat-browser"][value="24"]').check();
          await Promise.all([page.waitForEvent('framenavigated',frame=>frame===page.mainFrame()),page.locator('#save').click()]);
          await page.waitForFunction(()=>document.getElementById('container').getAttribute('aria-busy')==='false');
          assert.equal(await page.evaluate(()=>window.Nightscout.client.settings.timeFormat),24,'The saved setting survives an actual reload');
          assert.equal(await page.evaluate(()=>window.Nightscout.client.formatTime(new Date(2026,9,13,13,5))),'13:05');
        }
        assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);results.push({viewport:size,scenario:scenario.name,pass:true,initial,languageOptions:options.length,apiWrites:writes});await page.close();
        console.log(size+' '+scenario.name+': passed');
      }
    }
    fs.writeFileSync(out+'/results.json',JSON.stringify({generatedAt:new Date().toISOString(),scope:'Real desktop/mobile default and stored language/time settings, failed dictionary request with bundled Japanese, explicit English compatibility, native settings save/reload, no API writes',results},null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
