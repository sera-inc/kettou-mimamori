'use strict';
const fs=require('node:fs');const assert=require('node:assert/strict');const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const out='docs/verification/skeleton';
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,channel:'chrome'});const results=[];const errors=[];const writes=[];
 const newPage=async(viewport={width:390,height:844})=>{const page=await browser.newPage({viewport,locale:'ja-JP',serviceWorkers:'block'});page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.url().includes('/api/')&&request.method()!=='GET')writes.push(request.method());});return page;};
 const ready=async page=>{await page.waitForFunction(()=>document.getElementById('container').getAttribute('aria-busy')==='false');assert.equal(await page.locator('#container').getAttribute('aria-busy'),'false');assert.equal(await page.locator('.app-skeleton:visible').count(),0);};
 try{
  for(const [name,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
   const page=await newPage(viewport);let release;const gate=new Promise(resolve=>{release=resolve;});await page.route('**/api/v1/status.json*',async route=>{await gate;await route.continue();});
   await page.goto('http://localhost:8410/',{waitUntil:'domcontentloaded'});await page.waitForSelector('#app-chart-skeleton:visible');
   assert.equal(await page.locator('#container').getAttribute('aria-busy'),'true');assert.equal(await page.locator('.app-skeleton:visible').count(),3);
   for(const skeleton of await page.locator('.app-skeleton').all()){assert.equal(await skeleton.getAttribute('aria-hidden'),'true');const rect=await skeleton.boundingBox();const parent=await skeleton.locator('..').boundingBox();assert(Math.abs(rect.height-parent.height)<=2,JSON.stringify({rect,parent}));}
   assert(!(await page.locator('.currentBG').isVisible()));assert(!(await page.locator('#currentTime').isVisible()));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('#app-chart-skeleton').evaluate(el=>getComputedStyle(el).animationName),'none');
   await page.emulateMedia({forcedColors:'active'});assert.equal(await page.locator('#app-chart-skeleton').evaluate(el=>getComputedStyle(el).borderTopWidth),'1px');await page.emulateMedia({forcedColors:'none',reducedMotion:'no-preference'});
   await page.screenshot({path:out+'/loading-'+name+'.png',fullPage:true});
   if(name==='mobile'){await page.locator('#app-nav-toggle').click();await page.keyboard.press('Escape');assert.equal(await page.locator(':focus').getAttribute('id'),'app-nav-toggle');}
   release();await ready(page);assert.equal(await page.locator('.currentBG').innerText(),'---');assert(await page.locator('#app-chart-empty').isVisible());
   await page.screenshot({path:out+'/ready-'+name+'.png',fullPage:true});
   await page.evaluate(()=>window.Nightscout.client.crashed());await page.waitForFunction(()=>document.getElementById('container').getAttribute('aria-busy')==='true');assert((await page.locator('#loadingMessageText').innerText()).includes('接続が途切れ'));
   assert(!(await page.locator('.currentBG').isVisible()));assert(await page.locator('#app-chart-skeleton').isVisible());await page.reload();await ready(page);
   results.push({case:name+' placeholders occupy actual reading/chart containers, hide unreceived readings, support reduced motion/forced colors, clear on data readiness, recover after connection-error reload',pass:true});await page.close();
  }
  for(const scenario of ['offline','startup','authentication']){
   const page=await newPage();let requests=0;await page.route('**/api/v1/status.json*',async route=>{
    requests++;if(requests!==1)return route.continue();
    if(scenario==='offline')return route.abort('connectionfailed');
    if(scenario==='authentication')return route.fulfill({status:401,json:{status:401,message:'Verification fixture'}});
    const response=await route.fetch();const body=await response.json();body.runtimeState='starting';return route.fulfill({response,json:body});
   });
   await page.goto('http://localhost:8410/');
   if(scenario==='authentication'){
    await page.waitForSelector('.ui-dialog:visible');assert.equal(await page.locator('#centerMessagePanel').isVisible(),false);
    const secret=fs.readFileSync('.env.local','utf8').match(/^API_SECRET=(.+)$/m)[1].trim();await page.locator('#apisecret').fill(secret);await page.locator('#requestauthenticationdialog-btn').click();await page.waitForSelector('.ui-dialog:visible',{state:'hidden'});
   }else await page.waitForFunction(()=>document.getElementById('loadingMessageText').textContent.includes('5秒'));
   await page.waitForTimeout(3000);assert.equal(requests,1,'No immediate or rapid retry in '+scenario);await ready(page);assert.equal(requests,2);
   results.push({case:scenario+' waits five seconds, then recovers through the real status/language/data/authentication flow',pass:true,statusRequests:requests});await page.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);fs.writeFileSync(out+'/results.json',JSON.stringify({results,pageErrors:errors,apiWrites:writes,fixtures:['temporarily held status','one aborted status','one preparing status','one unauthorized status']},null,2));console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
