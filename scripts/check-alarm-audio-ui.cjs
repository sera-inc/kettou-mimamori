'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const out='docs/verification/alarm-audio-ui';
(async()=>{
  fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true}),results=[],errors=[],writes=[];
  const hash=crypto.createHash('sha1').update(fs.readFileSync('.env.local','utf8').match(/^API_SECRET=(.+)$/m)[1].trim()).digest('hex');
  try{
    for(const [size,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const mute of [false,true]){
      const page=await browser.newPage({viewport,locale:'ja-JP',serviceWorkers:'block'});
      page.on('pageerror',error=>errors.push(error.message));page.on('request',r=>{if(r.url().includes('/api/')&&r.method()!=='GET')writes.push(r.method());});
      await page.addInitScript(value=>{
        localStorage.setItem('apisecrethash',JSON.stringify(value));window.audioTestCalls=0;window.audioTestAllowed=false;
        HTMLMediaElement.prototype.play=function(){window.audioTestCalls++;return window.audioTestAllowed?Promise.resolve():Promise.reject(Object.assign(new Error('Browser requires interaction'),{name:'NotAllowedError'}));};
      },hash);
      await page.goto('http://localhost:8410/'+(mute?'?mute=true':''));await page.waitForFunction(()=>document.getElementById('container').getAttribute('aria-busy')==='false');
      const alarmClass=await page.locator('#container').getAttribute('class');
      await page.locator('#testAlarms').focus();await page.keyboard.press('Enter');await page.waitForTimeout(150);
      const notices=page.locator('.app-toast').filter({hasText:'通知音を再生できませんでした。'});
      if(mute){assert.equal(await page.evaluate(()=>window.audioTestCalls),0);assert.equal(await notices.count(),0);}
      else{
        assert(await page.evaluate(()=>window.audioTestCalls)>0);assert.equal(await notices.count(),1,'Repeated failed audio elements produce one owned notice');
        await page.locator('#testAlarms').click();await page.waitForTimeout(100);assert.equal(await notices.count(),1);
        await page.evaluate(()=>{window.KettouToast.showLegacy('独立した検証通知','info');window.audioTestAllowed=true;});
        await page.locator('#testAlarms').click();await page.waitForTimeout(100);assert.equal(await notices.count(),0);
        assert.equal(await page.locator('.app-toast').filter({hasText:'独立した検証通知'}).count(),1,'Recovery dismisses only the audio notice');
      }
      assert.equal(await page.locator('#container').getAttribute('class'),alarmClass,'Audio retry and mute do not acknowledge or clear the clinical alarm state');
      await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const audit=await page.evaluate(async()=>{const r=await axe.run(document);return r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,html:n.html}))}));});fs.writeFileSync(out+'/'+size+'-'+mute+'-a11y.json',JSON.stringify(audit,null,2));assert.deepEqual(audit,[]);
      results.push({viewport:size,mute,pass:true,clinicalAlarmClass:alarmClass,audioPlayCalls:await page.evaluate(()=>window.audioTestCalls),axeViolations:0});await page.close();
    }
    assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
    fs.writeFileSync(out+'/results.json',JSON.stringify({generatedAt:new Date().toISOString(),scope:'Real UI handlers and clinical alarm class with an explicitly simulated denied/resolved browser media promise; desktop/mobile mute and recovery; only the owned notice dismissed; no API writes; physical speaker output is outside this automatic check',results,pageErrors:errors,apiWrites:writes},null,2));console.log('PASS: four browser media denial/recovery/mute cases, alarm state and independent notices preserved.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
