'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');const {chromium}=require('playwright');
const out='docs/verification/company/runtime';
(async()=>{
  fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,channel:'chrome'});const results=[];
  try{
    for(const [size,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
      const page=await browser.newPage({viewport,locale:'ja-JP',serviceWorkers:'block'});const errors=[],writes=[];
      page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('/api/')&&r.method()!=='GET')writes.push(r.method());});
      for(const route of ['/','/report','/profile','/food','/admin','/clock/clock','/clock/config','/split']){
        const response=await page.goto('http://localhost:8410'+route);assert.equal(response.status(),200);
        if(route==='/')await page.waitForFunction(()=>document.getElementById('container').getAttribute('aria-busy')==='false');else await page.waitForTimeout(1500);
        const support=page.locator(route==='/clock/clock'?'.app-clock-support':'.app-service-support');
        if(size==='mobile'&&route!=='/clock/clock')await page.locator('#app-nav-toggle').click();
        await support.waitFor({state:'visible'});assert((await support.innerText()).includes('株式会社世良'));
        const mail=support.locator('a[href^="mailto:"]');assert.equal(await mail.getAttribute('href'),'mailto:info@sera-inc.co.jp');
        await mail.focus();assert(await mail.evaluate(el=>el===document.activeElement),'The support link remains keyboard reachable');
        assert((await page.title()).includes('血糖みまもり'));
        const visible=await require('./japanese-ui-text.cjs')(page);
        assert(!visible.candidates.some(item=>item.value.toLowerCase()==='nightscout'),'The customer-facing product name is replaced');
        const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,elements:Array.from(document.querySelectorAll('body *')).map(element=>{const r=element.getBoundingClientRect();return {tag:element.tagName,id:element.id,className:typeof element.className==='string'?element.className:'',left:r.left,right:r.right,width:r.width};}).filter(r=>r.width&&r.right>innerWidth+1).slice(0,20)}));
        if(overflow.scroll>overflow.width){fs.writeFileSync(out+'/'+size+route.replace(/\//g,'-')+'-overflow.json',JSON.stringify(overflow,null,2));await page.screenshot({path:out+'/'+size+route.replace(/\//g,'-')+'-overflow.png',fullPage:false});}
        assert(overflow.scroll<=overflow.width,size+' '+route+': no horizontal page overflow after support presentation');
        if(size==='mobile'&&route!=='/clock/clock')await page.keyboard.press('Escape');
        if(route==='/'){
          await page.locator('#drawerToggle').click();await page.waitForFunction(()=>document.getElementById('drawer').getAttribute('aria-modal')==='true');
          assert.equal(await page.locator('#about .appName').innerText(),'血糖みまもり');assert.equal(await page.locator('#about a[href^="mailto:"]').getAttribute('href'),'mailto:info@sera-inc.co.jp');
          await page.locator('#about summary').click();assert(await page.locator('#about').innerText().then(text=>text.includes('Nightscoutの開発貢献者')),'Original contributor credit retained');
          await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const a11y=await page.evaluate(async()=>{const r=await axe.run(document);return r.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}));});assert.deepEqual(a11y,[],'Expanded license/contact drawer has no axe violations');
          await page.screenshot({path:out+'/'+size+'-about.png',fullPage:false});await page.locator('#drawer [data-drawer-close]').click();
        }
        results.push({viewport:size,route,pass:true,email:'info@sera-inc.co.jp'});
      }
      assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);await page.close();
    }
    const manifest=await fetch('http://localhost:8410/manifest.json').then(r=>r.json());assert.equal(manifest.name,'血糖みまもり');assert.equal(manifest.lang,'ja');
    const status=await fetch('http://localhost:8410/api/v1/status.json').then(r=>r.json());assert.equal(status.name,'nightscout','Preserve existing integration protocol identity');
    const swagger=await fetch('http://localhost:8410/swagger.json').then(r=>r.json());assert.deepEqual(swagger.info.contact,{name:'株式会社世良',url:'https://sera-inc.co.jp',email:'info@sera-inc.co.jp'});
    const docs=await browser.newPage();await docs.goto('http://localhost:8410/api3-docs');await docs.waitForFunction(()=>window.ui?.getConfigs()?.spec?.info?.contact);assert.deepEqual(await docs.evaluate(()=>window.ui.getConfigs().spec.info.contact),{name:'株式会社世良',url:'https://sera-inc.co.jp',email:'info@sera-inc.co.jp'});await docs.close();
    fs.writeFileSync(out+'/results.json',JSON.stringify({generatedAt:new Date().toISOString(),scope:'Actual desktop/mobile eight routes, keyboard support links, expanded product/license drawer, manifest and API contact metadata; legacy API name and copyright credit retained; no API writes/contact submission',results,legacyAPIName:status.name,apiWrites:[]},null,2));console.log('PASS: sixteen route/viewport cases, company/email/product metadata and original protocol identity.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
