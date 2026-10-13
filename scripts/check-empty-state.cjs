'use strict';
const fs=require('fs');const assert=require('node:assert/strict');const ejs=require('ejs');const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const out='docs/verification/empty-state';
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,channel:'chrome'});const results=[];try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},locale:'ja-JP',serviceWorkers:'block'});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://localhost:8410/');await page.waitForSelector('#app-chart-empty:not([hidden])');
 assert.equal(await page.locator('#app-chart-empty').getAttribute('role'),'status');assert.equal(await page.locator('.currentBG').innerText(),'---');
 await page.screenshot({path:out+'/dashboard.png'});results.push({case:'live empty database dashboard reports no measurements without displaying zero',pass:true});
 let properties={};await page.route('**/api/v2/properties*',route=>route.fulfill({json:properties}));
 for(const route of ['/clock/clock','/clock/config']) {
   properties={};await page.goto('http://localhost:8410'+route);await page.waitForSelector('#errorMessage');assert(await page.locator('#errorMessage').isVisible());
   assert(!(await page.locator('#inner').isVisible()));
   properties={bgnow:{sgvs:[{mgdl:100,scaled:'100',mills:Date.now(),direction:'Flat'}]},delta:{mgdl:5,display:'+5'}};
   if(route.endsWith('config')) {await page.locator('#cfg_sg').click();assert.equal(await page.locator('#clocklink').getAttribute('href'),'/clock/cy10-sg40');}
   await page.evaluate(()=>window.Nightscout.client.query());await page.waitForSelector('.sg');assert.equal(await page.locator('.sg').innerText(),'100');
   assert(!(await page.locator('#errorMessage').isVisible()));results.push({case:route+' recovers from missing properties on received data; configuration link still builds',pass:true});
 }
 await page.route('**/api/v1/food.json',route=>route.fulfill({json:[]}));await page.goto('http://localhost:8410/food');await page.waitForSelector('#app-food-empty:not([hidden])');
 assert.equal(await page.locator('#app-food-empty').getAttribute('data-variant'),'no-data');await page.locator('#fe_filter_name').fill('存在しない食品');
 await page.waitForFunction(()=>document.querySelector('#app-food-empty').dataset.variant==='no-results');assert((await page.locator('#app-food-empty').innerText()).includes('条件に一致'));
 results.push({case:'food initial empty and zero search results show distinct guidance',pass:true});
 await page.goto('http://localhost:8410/split');assert.equal(await page.locator('iframe').count(),0);assert((await page.locator('.app-empty-state').innerText()).includes('まだ設定'));
 const settings={customTitle:'血糖みまもり'};for(let i=0;i<5;i++){settings['frameUrl'+i]='/clock/clock';settings['frameName'+i]='確認画面'+(i+1);}
 const frame=await ejs.renderFile('views/frame.html',{settings,type:'index',title:'複数の画面',locals:{}});
 await page.route('**/split?fixture=1',route=>route.fulfill({contentType:'text/html',body:frame}));await page.goto('http://localhost:8410/split?fixture=1');
 assert.equal(await page.locator('iframe').count(),5);for(const iframe of await page.locator('iframe').all()){assert.equal(await iframe.getAttribute('src'),'/clock/clock');const title=await iframe.getAttribute('title');assert(title.startsWith('確認画面'),JSON.stringify(title));}
 await page.screenshot({path:out+'/split-configured.png',fullPage:true});results.push({case:'live split empty state and EJS fixture of five configured frames retain every URL/name without phantom frame',pass:true});
 const errorHtml=await ejs.renderFile('views/error.html',{errors:'<dt>確認用の接続エラー</dt><dd>接続先の設定を確認してください。</dd>'});
 await page.route('**/test-boot-error',route=>route.fulfill({contentType:'text/html',body:errorHtml}));await page.goto('http://localhost:8410/test-boot-error');
 assert((await page.locator('[role="alert"]').innerText()).includes('起動できません'));assert((await page.locator('dl').innerText()).includes('接続エラー'));assert.equal(await page.locator('.app-button').getAttribute('href'),'/');
 await page.screenshot({path:out+'/boot-error.png'});results.push({case:'boot error EJS fixture preserves diagnostics and offers retry action',pass:true});
 assert.deepEqual(errors,[]);fs.writeFileSync(out+'/results.json',JSON.stringify({results,pageErrors:errors,fixtures:['clock properties','food GET','configured split EJS','boot error EJS']},null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
