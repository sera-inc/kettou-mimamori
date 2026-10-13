'use strict';
const fs=require('node:fs');const path=require('node:path');const assert=require('node:assert/strict');const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const origin=process.env.PREVIEW_URL||'http://localhost:8410';if(!['localhost','127.0.0.1','[::1]'].includes(new URL(origin).hostname))throw Error('Accessibility verification requires an isolated local preview.');
const out=process.env.A11Y_OUTPUT_DIR||'docs/verification/a11y';const scans=[];const errors=[];const writes=[];
const secret=process.env.API_SECRET||(fs.existsSync('.env.local')?fs.readFileSync('.env.local','utf8').match(/^API_SECRET=(.+)$/m)?.[1].trim():null);
if(!secret)throw Error('Set the isolated preview API_SECRET so all authorized controls are included.');
const hashed=require('node:crypto').createHash('sha1').update(secret).digest('hex');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const options={headless:true};if(process.env.PLAYWRIGHT_CHANNEL!=='bundled')options.channel=process.env.PLAYWRIGHT_CHANNEL||'chrome';const browser=await chromium.launch(options);
 async function scan(page,name){
  if(!await page.evaluate(()=>Boolean(window.axe)))await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const result=await page.evaluate(async()=>{
   const result=await window.axe.run(document);const pick=item=>({id:item.id,impact:item.impact,description:item.description,helpUrl:item.helpUrl,nodes:item.nodes.map(node=>({target:node.target,html:node.html,failureSummary:node.failureSummary}))});
   return {version:result.testEngine.version,violations:result.violations.map(pick),incomplete:result.incomplete.map(pick),passes:result.passes.map(item=>({id:item.id,nodeCount:item.nodes.length}))};
  });
  const blocking=result.violations.filter(item=>['critical','serious'].includes(item.impact));
  const japanese = process.env.AUDIT_JAPANESE === 'true' ? await require('./japanese-ui-text.cjs')(page) : undefined;
  scans.push({name,...result,japanese,blockingRuleCount:blocking.length,blockingNodeCount:blocking.reduce((total,item)=>total+item.nodes.length,0)});console.log(name+': '+blocking.length+' critical/serious rules, '+result.violations.length+' total violated rules'+(japanese?' / '+japanese.candidates.length+' English candidates':''));
 }
 try{
  for(const [size,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
   const page=await browser.newPage({viewport,locale:'ja-JP',serviceWorkers:'block'});page.on('pageerror',error=>errors.push(error.message));page.on('request',request=>{if(request.url().includes('/api/')&&request.method()!=='GET')writes.push(request.method());});await page.addInitScript(value=>localStorage.setItem('apisecrethash',JSON.stringify(value)),hashed);
   await page.route('**/api/v1/adminnotifies*',route=>route.fulfill({json:{message:{notifyCount:1,notifies:[{title:'確認用のお知らせ',message:'接続状態を確認するための合成メッセージです。',count:1,lastRecorded:Date.now(),persistent:true}]}}}));
   for(const route of ['/','/report','/profile','/food','/admin','/clock/clock','/clock/config','/split']){
    const response=await page.goto(origin+route);assert.equal(response.status(),200,route+' must load');
    if(route==='/')await page.waitForFunction(()=>document.getElementById('container').getAttribute('aria-busy')==='false');else await page.waitForTimeout(2500);
    await scan(page,size+' '+route);
    if(route==='/report'){
     await page.waitForSelector('#tabnav .menutab');const tabs=await page.locator('#tabnav .menutab').all();assert(tabs.length>0,'Report controls must be rendered before their audit');for(let index=0;index<tabs.length;index++){await tabs[index].click();await page.waitForTimeout(150);await scan(page,size+' report '+await tabs[index].getAttribute('id'));}
    }
   }
   await page.goto(origin+'/');await page.waitForFunction(()=>document.getElementById('container').getAttribute('aria-busy')==='false');
   for(const [id,trigger] of [['drawer','drawerToggle'],['treatmentDrawer','treatmentDrawerToggle'],['boluscalcDrawer','boluscalcDrawerToggle'],['adminNotifiesDrawer','adminnotifies']]){
    await page.locator('#'+trigger).click();await page.waitForFunction(id=>document.getElementById(id).getAttribute('aria-modal')==='true',id);await scan(page,size+' '+id);
    if(id==='boluscalcDrawer'){await page.locator('#bc_addfromdatabase').click();await page.waitForSelector('.ui-dialog:visible');await scan(page,size+' nested food picker');await page.keyboard.press('Escape');}
    await page.locator('#'+id+' [data-drawer-close]').click();
   }
   await page.evaluate(()=>window.Nightscout.client.hashauth.requestAuthentication());await page.waitForSelector('.ui-dialog:visible');await scan(page,size+' authentication dialog');await page.keyboard.press('Escape');
   if(size==='mobile'){await page.locator('#app-nav-toggle').click();await scan(page,'mobile navigation dialog');await page.keyboard.press('Escape');}
   await page.close();
  }
  const blockingRules=scans.reduce((total,scan)=>total+scan.blockingRuleCount,0);const blockingNodes=scans.reduce((total,scan)=>total+scan.blockingNodeCount,0);
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({generatedAt:new Date().toISOString(),scope:'Every enabled axe rule; full document on desktop/mobile, eight routes, every report tab, four visible drawers, nested food picker, authentication, mobile navigation',blockingRules,blockingNodes,pageErrors:errors,apiWrites:writes,scans},null,2));
  assert.deepEqual(writes,[],'The accessibility audit must not save records');assert.deepEqual(errors,[],'No browser exceptions');assert.equal(blockingRules,0,'Critical/serious accessibility violations must be zero');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
