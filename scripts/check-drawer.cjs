'use strict';
const fs=require('fs');const assert=require('node:assert/strict');const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');const out='docs/verification/drawer';
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,channel:'chrome'});const results=[];try {
 const page=await browser.newPage({viewport:{width:390,height:844},locale:'ja-JP',serviceWorkers:'block'});const errors=[];const dialogs=[];const writes=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',async dialog=>{dialogs.push(dialog.type());await dialog.accept();});
 const secret=fs.readFileSync('.env.local','utf8').match(/^API_SECRET=(.+)$/m)[1].trim();const hashed=require('crypto').createHash('sha1').update(secret).digest('hex');await page.addInitScript(value=>localStorage.setItem('apisecrethash',JSON.stringify(value)),hashed);
 await page.route('**/api/v1/treatments/**',route=>{if(route.request().method()!=='GET'){writes.push(route.request().method());return route.fulfill({json:{ok:true}});}return route.continue();});
 await page.route('**/api/v1/adminnotifies*',route=>route.fulfill({json:{message:{notifyCount:1,notifies:[{title:'確認用のお知らせ',message:'接続状態の確認用メッセージです。',count:1,lastRecorded:Date.now(),persistent:true}]}}}));
 await page.goto('http://localhost:8410/');await page.waitForFunction(()=>window.Nightscout?.client?.hashauth?.isAuthenticated());
 assert(await page.evaluate(()=>window.Nightscout.client.settings.showPlugins.includes('careportal')&&window.Nightscout.client.settings.showPlugins.includes('boluscalc')),'The demo must enable both record drawers through its normal plugin settings');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'All enabled actions fit the mobile page');
 for(const [id,trigger] of [['drawer','drawerToggle'],['treatmentDrawer','treatmentDrawerToggle'],['boluscalcDrawer','boluscalcDrawerToggle'],['adminNotifiesDrawer','adminnotifies']]) {
   console.log('Verifying '+id);
   await page.locator('#'+trigger).click();await page.waitForFunction(id=>document.getElementById(id).getAttribute('aria-modal')==='true',id);
   const drawer=page.locator('#'+id);assert.equal(await drawer.getAttribute('role'),'dialog');assert(await page.locator('#app-main').evaluate(el=>el.inert));
   const close=drawer.locator('[data-drawer-close]');assert(await close.evaluate(el=>el===document.activeElement));const box=await drawer.boundingBox();assert.equal(Math.round(box.width),390);assert.equal(Math.round(box.height),844);
   await page.keyboard.press('Shift+Tab');assert(await drawer.evaluate(el=>el.contains(document.activeElement)));await page.keyboard.press('Tab');assert(await close.evaluate(el=>el===document.activeElement));
   if(id==='treatmentDrawer'){await page.locator('#eventType').selectOption('Note');await page.locator('#notes').fill('閉じる操作では保存しない確認用メモ');}
   if(id==='boluscalcDrawer'){
     await page.locator('#bc_addfromdatabase').click();await page.waitForSelector('.ui-dialog:visible');await page.keyboard.press('Escape');await page.waitForSelector('.ui-dialog:visible',{state:'hidden'});assert(await drawer.isVisible());
     results.push({case:'nested food picker closes with Escape while insulin drawer stays open',pass:true});
   }
   await drawer.screenshot({path:out+'/'+id+'-mobile.png'});
   await close.focus();await page.keyboard.press('Enter');assert(!(await drawer.isVisible()));assert(!(await page.locator('#app-main').evaluate(el=>el.inert)));assert.equal(await page.locator(':focus').getAttribute('id'),trigger);
   assert.equal(await page.locator('#'+trigger).evaluate(el=>el.tagName),'BUTTON');await page.locator('#'+trigger).focus();await page.keyboard.press('Space');await page.waitForFunction(id=>document.getElementById(id).getAttribute('aria-modal')==='true',id);
   await page.keyboard.press('Escape');assert(!(await drawer.isVisible()));assert.equal(await page.locator('#'+trigger).getAttribute('aria-expanded'),'false');
   results.push({case:id+' supports mobile dimensions, named modal, trapped Tab, native close, Space opening, Escape and trigger focus return',pass:true});
 }
 await page.setViewportSize({width:1440,height:1000});await page.locator('#drawerToggle').click();const box=await page.locator('#drawer').boundingBox();assert.equal(Math.round(box.width),448);await page.locator('#app-drawer-backdrop').click({position:{x:10,y:100}});assert(!(await page.locator('#drawer').isVisible()));
 assert.deepEqual(writes,[]);assert.deepEqual(dialogs,[]);assert.deepEqual(errors,[]);results.push({case:'desktop backdrop dismisses; no record save, native confirmation or page error occurs during any dismissal',pass:true});
 fs.writeFileSync(out+'/results.json',JSON.stringify({results,writeRequests:writes,nativeDialogs:dialogs,pageErrors:errors},null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
