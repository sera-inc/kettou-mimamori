'use strict';
const fs=require('fs');const assert=require('node:assert/strict');const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const out='docs/verification/clock-design';
function luminance(rgb){const values=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;});return values[0]*0.2126+values[1]*0.7152+values[2]*0.0722;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,channel:'chrome'});const results=[];try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'ja-JP',serviceWorkers:'block'});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 let record={mgdl:100,scaled:'100',mills:Date.now(),direction:'Flat'};
 await page.route('**/api/v2/properties*',route=>route.fulfill({json:{bgnow:{sgvs:[record]},delta:{mgdl:5,display:'+5'}}}));
 await page.goto('http://localhost:8410/clock/config');await page.waitForSelector('#facename');await page.waitForFunction(()=>!!window.Nightscout?.client?.settings);
 assert.equal(await page.locator('#app-nav [aria-current="page"]').getAttribute('href'),'/clock/config');
 await page.locator('#cfg_sg').click();await page.waitForSelector('.sg');assert.equal(await page.locator('.sg').innerText(),'100');
 const preview=await page.locator('.app-clock-preview').boundingBox();const fontSize=await page.locator('.sg').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
 assert(fontSize<=Math.min(preview.width,preview.height)*0.41);
 await page.locator('#bgcolor').selectOption('b');await page.locator('#sgage').selectOption('n');await page.locator('#threshold').fill('15');await page.locator('#threshold').press('Tab');
 assert.equal(await page.locator('#clocklink').getAttribute('href'),'/clock/bn15-sg40');
 await page.locator('#cfg_ar_size').fill('100');await page.locator('#cfg_ar').click();assert.equal(await page.locator('#facename').innerText(),'bn15-sg40');
 await page.locator('#cfg_ar_size').fill('30');
 for(const id of ['cfg_dt','cfg_ag','cfg_ar','cfg_tm','cfg_em','cfg_nl'])await page.locator('#'+id).click();
 assert.equal(await page.locator('#facename').innerText(),'bn15-sg40-dt14-ag6-ar30-tm10-em40-nl');
 await page.locator('#cfg_undo').click();assert.equal(await page.locator('#clocklink').getAttribute('href'),'/clock/bn15-sg40-dt14-ag6-ar30-tm10-em40');
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:out+'/config-desktop.png',fullPage:true});results.push({case:'all clock components, size validation, background, age, threshold and undo retain exact face grammar; preview sizes fit panel',preview,fontSize,pass:true});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.scrollTo(0,0));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#app-nav-toggle').click();await page.keyboard.press('Escape');assert.equal(await page.locator(':focus').getAttribute('id'),'app-nav-toggle');
 await page.screenshot({path:out+'/config-mobile.png',fullPage:true});results.push({case:'mobile clock configuration scrolls without page overflow and supports shared keyboard navigation',pass:true});
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://localhost:8410/clock/cy0-sg40-dt14-ar25');await page.waitForSelector('.sg');
 const thresholds=await page.evaluate(()=>window.Nightscout.client.settings.thresholds);
 const cases=[{value:thresholds.bgLow-1,token:'--app-danger-bg'},{value:thresholds.bgLow,token:'--app-primary-bg'},{value:thresholds.bgTargetBottom,token:'--app-success-bg'},{value:thresholds.bgTargetTop,token:'--app-warning-bg'},{value:thresholds.bgHigh,token:'--app-danger-bg'}];
 for(const item of cases){record={...record,mgdl:item.value,scaled:String(item.value),mills:Date.now()};await page.evaluate(()=>window.Nightscout.client.query());await page.waitForFunction(value=>document.querySelector('.sg').textContent===String(value),item.value);
   const colors=await page.evaluate(token=>{const probe=document.createElement('span');probe.style.backgroundColor='var('+token+')';document.body.append(probe);const expected=getComputedStyle(probe).backgroundColor;probe.remove();return {expected,background:getComputedStyle(document.body).backgroundColor,text:getComputedStyle(document.body).color};},item.token);
   assert.equal(colors.background,colors.expected);assert(contrast(colors.text,colors.background)>=4.5);results.push({case:'clinical band boundary '+item.value+' uses '+item.token,contrast:contrast(colors.text,colors.background),pass:true});}
 record={...record,mgdl:100,scaled:'100',mills:Date.now()-20*60000};await page.goto('http://localhost:8410/clock/cy10-sg40-ag6-ar25');await page.waitForSelector('.sg.stale');assert((await page.locator('.ag').innerText()).includes('20'));
 results.push({case:'stale measurements remain struck through with elapsed time',pass:true});
 record={...record,mills:Date.now()};await page.goto('http://localhost:8410/clock/bn0-sg40');await page.waitForSelector('.sg');const dark=await page.evaluate(()=>({background:getComputedStyle(document.body).backgroundColor,text:getComputedStyle(document.body).color}));assert(contrast(dark.text,dark.background)>=4.5);
 await page.locator('#closeButton').focus();assert.equal(await page.locator('#closeButton').evaluate(el=>getComputedStyle(el).opacity),'1');results.push({case:'dark clock retains readable value and a visible keyboard-focused return action',contrast:contrast(dark.text,dark.background),pass:true});
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/results.json',JSON.stringify({results,thresholds,pageErrors:errors},null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
