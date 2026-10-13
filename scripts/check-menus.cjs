'use strict';
const fs=require('node:fs');const assert=require('node:assert/strict');const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const out='docs/verification/menus';
(async()=>{
  fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,channel:'chrome'});const results=[];
  try{
    for(const [name,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
      const page=await browser.newPage({viewport,locale:'ja-JP',serviceWorkers:'block'});const errors=[],writes=[];
      page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.url().includes('/api/')&&request.method()!=='GET')writes.push(request.method());});
      await page.goto('http://localhost:8410/?mute=true');await page.waitForFunction(()=>document.getElementById('container').getAttribute('aria-busy')==='false');await page.waitForSelector('#app-alarm-menu-toggle');
      const alarm=page.locator('#app-alarm-menu-toggle');assert.equal(await alarm.getAttribute('aria-disabled'),'true');await alarm.focus();await page.keyboard.press('Enter');assert.equal(await alarm.getAttribute('aria-expanded'),'false');
      await page.evaluate(()=>{
        const client=window.Nightscout.client;window.menuAckCalls=[];
        const original=client.alarmSocket.emit;
        client.alarmSocket.emit=function(event,...args){if(event==='ack'){window.menuAckCalls.push(args);return this;}return original.call(this,event,...args);};
        client.settings.alarmHigh=true;client.settings.alarmHighMins=[15,45,75];client.settings.alarmTimeagoWarn=false;client.settings.alarmTimeagoUrgent=false;
        client.dataUpdate({sgvs:[{mills:Date.now()-605000,mgdl:280,direction:'Flat'},{mills:Date.now()-305000,mgdl:290,direction:'Flat'},{mills:Date.now()-5000,mgdl:300,direction:'Flat'}]},false);
        const notify={level:1,eventName:'high',group:'BG High',title:'検証用の高血糖警報'};window.menuTestAlarm=()=>client.alarmSocket.listeners('alarm').forEach(callback=>callback(notify));window.menuTestAlarm();
      });
      await page.waitForFunction(()=>document.getElementById('app-alarm-menu-toggle').getAttribute('aria-disabled')==='false');
      assert.equal(await page.locator('.currentBG').innerText(),'300');
      await alarm.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='menuitem');
      const items=page.locator('#silenceBtn [role="menuitem"]');const count=await items.count();assert.equal(count,3);assert.deepEqual(await items.evaluateAll(items=>items.map(item=>Number(item.dataset.snoozeTime))),[900000,2700000,4500000]);
      await page.keyboard.press('ArrowUp');assert.equal(await page.locator(':focus').getAttribute('data-snooze-time'),await items.nth(count-1).getAttribute('data-snooze-time'));
      await page.keyboard.press('Home');assert.equal(await page.locator(':focus').getAttribute('data-snooze-time'),await items.first().getAttribute('data-snooze-time'));
      await page.keyboard.press('End');const selectedDuration=Number(await items.nth(count-1).getAttribute('data-snooze-time'));
      assert.equal(await page.locator('#silenceBtn [tabindex="0"]').count(),1);
      const rect=await page.locator('#silenceBtn').boundingBox();assert(rect.x>=0&&rect.x+rect.width<=viewport.width+1&&rect.y>=0&&rect.y+rect.height<=viewport.height+1,'The entire alarm popover must stay on screen');
      assert((await items.first().boundingBox()).height>=44);assert.notEqual(await page.locator(':focus').evaluate(element=>getComputedStyle(element).outlineStyle),'none');
      assert(await items.first().evaluate(element=>{const probe=document.createElement('span');probe.style.color='var(--app-surface)';document.body.append(probe);const surface=getComputedStyle(probe).color;probe.remove();return getComputedStyle(element).backgroundColor===surface;}),'Menu items must use the DDS surface, not inherit the primary action button paint');
      await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const alarmAudit=await page.evaluate(async()=>{const result=await axe.run(document);return {violations:result.violations,incomplete:result.incomplete.map(item=>item.id)};});
      assert.deepEqual(alarmAudit.violations.filter(item=>['critical','serious'].includes(item.impact)),[]);
      await page.screenshot({path:out+'/'+name+'-alarm.png',fullPage:false});await page.keyboard.press('Escape');assert.equal(await alarm.getAttribute('aria-expanded'),'false');assert.equal(await page.locator(':focus').getAttribute('id'),'app-alarm-menu-toggle');assert.deepEqual(await page.evaluate(()=>window.menuAckCalls),[]);
      await page.keyboard.press('Space');await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='menuitem');await page.keyboard.press('End');await page.keyboard.press('Space');
      await page.waitForFunction(()=>!document.getElementById('container').classList.contains('alarming'));
      assert.deepEqual(await page.evaluate(()=>window.menuAckCalls),[[1,'BG High',selectedDuration]]);assert.equal(await page.locator(':focus').getAttribute('id'),'app-alarm-menu-toggle');assert.equal(await alarm.getAttribute('aria-disabled'),'true');assert.equal(await alarm.getAttribute('aria-expanded'),'false');assert.equal(await page.locator('.currentBG').innerText(),'300');
      const trigger=page.locator('.focus-range li:not([data-hours]) button');await trigger.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>document.activeElement?.getAttribute('role')==='menuitemcheckbox');
      const forecast=page.locator('#viewMenu [role="menuitemcheckbox"]');assert(await forecast.count()>0,'Actual synthetic CGM data must produce prediction controls');
      const type=await page.locator(':focus').getAttribute('data-forecast-type');const before=await page.locator(':focus').isChecked();await page.keyboard.press('Space');
      await page.waitForFunction(({type,before})=>{const input=Array.from(document.querySelectorAll('#viewMenu input')).find(input=>input.dataset.forecastType===type);return input?.checked!==before&&document.activeElement===input;},{type,before});
      assert.equal(await page.locator(':focus').getAttribute('aria-checked'),String(!before));assert.equal(await trigger.getAttribute('aria-expanded'),'true');assert.equal(await page.locator('#viewMenu [tabindex="0"]').count(),1);
      const preference=await page.evaluate(()=>window.Nightscout.client.settings.showForecast);assert.equal(preference.split(' ').includes(type),!before);assert.equal(await page.evaluate(()=>localStorage.getItem('showForecast')),preference);
      const forecastRect=await page.locator('#viewMenu').boundingBox();assert(forecastRect.x>=0&&forecastRect.x+forecastRect.width<=viewport.width+1&&forecastRect.y>=0&&forecastRect.y+forecastRect.height<=viewport.height+1);
      const forecastAudit=await page.evaluate(async()=>{const result=await axe.run(document);return {violations:result.violations,incomplete:result.incomplete.map(item=>item.id)};});assert.deepEqual(forecastAudit.violations.filter(item=>['critical','serious'].includes(item.impact)),[]);
      await page.keyboard.press('Space');await page.waitForFunction(({type,before})=>{const input=Array.from(document.querySelectorAll('#viewMenu input')).find(input=>input.dataset.forecastType===type);return input?.checked===before&&document.activeElement===input;},{type,before});
      assert.equal(await page.locator(':focus').getAttribute('aria-checked'),String(before));const restoredPreference=await page.evaluate(()=>window.Nightscout.client.settings.showForecast);assert.equal(restoredPreference.split(' ').includes(type),before);assert.equal(await page.evaluate(()=>localStorage.getItem('showForecast')),restoredPreference);
      await page.screenshot({path:out+'/'+name+'-forecast.png',fullPage:false});await page.keyboard.press('Escape');assert.equal(await trigger.getAttribute('aria-expanded'),'false');assert(await trigger.evaluate(element=>element===document.activeElement));
      await trigger.click();await page.waitForFunction(()=>document.getElementById('viewMenu').style.visibility==='visible');await page.locator('h1').click();assert.equal(await trigger.getAttribute('aria-expanded'),'false');
      assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);results.push({viewport:name,pass:true,reading:300,alarmOptions:count,selectedDuration,ackPayload:[1,'BG High',selectedDuration],ackNetworkIntercepted:true,forecastType:type,forecastPreference:preference,alarmAudit,forecastAudit});await page.close();
    }
    fs.writeFileSync(out+'/results.json',JSON.stringify({generatedAt:new Date().toISOString(),scope:'Actual desktop/mobile native keyboard menus, clinical warning callback, exact intercepted socket ack duration, prediction checkbox and redraw focus/storage; mute=true; no API writes',results},null,2));console.log('PASS: desktop/mobile alarm and prediction menus, exact ack payload, keyboard/focus/viewport/contrast/storage; no saved records.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
