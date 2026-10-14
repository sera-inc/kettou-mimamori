'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const out=path.resolve('../sera-inc-public-site/docs/verification/kettou-mimamori');
const base=process.env.KETTOU_LP_BASE || 'http://127.0.0.1:8411';
const target='/healthcare/products/kettou-mimamori';
(async()=>{
  fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,channel:'chrome'});
  const results=[],errors=[],writes=[];
  try{
    for(const [size,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
      const context=await browser.newContext({viewport,locale:'ja-JP',serviceWorkers:'block'}),page=await context.newPage();
      page.on('pageerror',e=>errors.push(e.message));
      page.on('request',r=>{if(r.method()==='POST'&&(/send-contact|google-analytics|clarity|\/collect/.test(r.url())))writes.push(r.url());});
      const structure=[];
      for(const route of ['/real-estate/products/sumai-desk','/real-estate/products/sumai-sketch',target]){
        assert.equal((await page.goto(base+route+'?sera_internal=1')).status(),200);
        await page.waitForSelector('.sumai-lp #pricing',{state:'attached'});
        await page.waitForSelector('html[data-analytics-excluded="true"]');
        const decline=page.getByRole('button',{name:'許可しない',exact:true});
        if(await decline.isVisible())await decline.click();
        const sections=await page.locator('.sumai-lp #main-content > section, .sumai-lp #main-content > .mobile-page-body > .mobile-full-content > section').evaluateAll(elements=>elements.map(el=>({id:el.id,classes:el.className})));
        const headings=await page.locator('.sumai-lp h1').all();
        assert.equal((await Promise.all(headings.map(heading=>heading.isVisible()))).filter(Boolean).length,1,'One visible page heading; the reference retains a hidden mobile variant');
        structure.push({route,sections});
      }
      assert.deepEqual(structure[2].sections,structure[0].sections,'Every ordered main information section must match Sumai Desk');
      assert.deepEqual(structure[2].sections,structure[1].sections,'Every ordered main information section must match Sumai Sketch');
      const media=[];
      for(const group of ['workflows','reports']){
        const gallery=page.locator('[data-kettou-gallery="'+group+'"]'),buttons=gallery.locator('button');
        assert.equal(await buttons.count(),group==='reports'?11:14);
        for(let i=0;i<await buttons.count();i++){
          await buttons.nth(i).click();assert.equal(await buttons.nth(i).getAttribute('aria-pressed'),'true');
          await gallery.locator('img').scrollIntoViewIfNeeded();
          await gallery.locator('img').evaluate(img=>img.complete&&img.naturalWidth?Promise.resolve():new Promise((resolve,reject)=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',reject,{once:true});}));
          const loaded=await gallery.locator('img').evaluate(img=>({src:img.getAttribute('src'),width:img.naturalWidth,height:img.naturalHeight}));assert(loaded.width>0&&loaded.height>0);media.push(loaded);
        }
      }
      const videos=[];
      for(const video of await page.locator('video').all()){
        await video.evaluate(el=>el.load());await video.evaluate(el=>el.readyState>=1?Promise.resolve():new Promise((resolve,reject)=>{el.addEventListener('loadedmetadata',resolve,{once:true});el.addEventListener('error',reject,{once:true});}));
        const metadata=await video.evaluate(el=>{const caption=document.getElementById('kettou-video-caption');return {duration:el.duration,width:el.videoWidth,height:el.videoHeight,autoplay:el.autoplay,controls:el.controls,caption:caption?.textContent,nativeTracks:el.textTracks.length,captionBelowVideo:caption.getBoundingClientRect().top>=el.getBoundingClientRect().bottom-1};});
        assert(metadata.duration>10&&metadata.width===1440&&metadata.height===1000&&metadata.controls&&!metadata.autoplay&&metadata.caption);
        assert.equal(metadata.nativeTracks,0,'Captions must not overlay the video');
        assert(metadata.captionBelowVideo,'Caption stays below the complete video frame');
        await video.evaluate(async el=>{await el.play();});await page.waitForTimeout(700);assert(await video.evaluate(el=>el.currentTime>0));await video.evaluate(el=>el.pause());videos.push(metadata);
      }
      assert.equal(videos.length,1);
      assert.equal(await page.locator('#usecases img').count(),0,'Role cards must use icons rather than cropped screenshots');
      assert.equal(await page.locator('#usecases svg').count(),4,'Four role icons');
      const displayedText=await page.locator('body').innerText();
      assert(!displayedText.includes('利用者・権限・保存した記録を管理')&&!displayedText.includes('接続・共有・使いやすさ'));
      await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
      const audit=await page.evaluate(async()=>{const r=await axe.run(document);return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,html:n.html,failureSummary:n.failureSummary}))})),incomplete:r.incomplete.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))};});
      fs.writeFileSync(path.join(out,size+'-a11y.json'),JSON.stringify(audit,null,2));
      assert.deepEqual(audit.violations,[],'All enabled axe rules on the complete LP');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      const text=await page.locator('body').innerText();assert(text.includes('990円')&&text.includes('9,900円')&&text.includes('3,300円')&&text.includes('info@sera-inc.co.jp'));
      assert(!/Nightscout|nightscout|合成データ|お申し込み後すぐに利用できます|Features|Use Cases|Get Started/.test(text));
      await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(out,size+'-hero.png')});
      await page.locator('#pricing').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,size+'-pricing.png')});
      await page.locator('#features').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,size+'-features.png')});
      results.push({viewport:size,structure,informationStructureMatchPercent:100,definition:'Same number, order, IDs and layout classes of all ten full-content sections in the shared Sumai template. The reference mobile summary wrapper is excluded explicitly; this product shows the full content on mobile. Copy and additional feature media are product-specific.',media,videos,axeViolations:audit.violations.length,noHorizontalOverflow:true});
      await page.goto(base+'/healthcare?sera_internal=1#products');await page.waitForSelector('html[data-analytics-excluded="true"]');await page.waitForSelector('#products a[href="'+target+'"]');assert.equal(await page.locator('#products a[href="'+target+'"]').count(),1);
      await context.close();
    }
    assert.deepEqual(errors,[]);assert.deepEqual(writes,[]);
    fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({generatedAt:new Date().toISOString(),base,results,pageErrors:errors,contactAndAnalyticsPosts:writes},null,2));
    console.log('PASS: PC/mobile, exact ordered Sumai section structure, 25 actual screen choices, one playable complete-frame video, four role icon cards, removed extra blocks, whole-page axe, prices and healthcare card.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
