'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{const hash=crypto.createHash('sha1').update(fs.readFileSync('.env.local','utf8').match(/^API_SECRET=(.+)$/m)[1].trim()).digest('hex'),results=[];
  const browser=await chromium.launch({channel:'chrome',headless:true});try{
    for(const format of ['json','raw','absent'])for(const route of ['/clock/config','/clock/cy10-sg40-ar30-tm10']){
      const page=await browser.newPage({viewport:{width:1440,height:1000}}),responses=[],errors=[];
      await page.addInitScript(({format,hash})=>{if(format==='json')localStorage.setItem('apisecrethash',JSON.stringify(hash));else if(format==='raw')localStorage.setItem('apisecrethash',hash);},{format,hash});
      page.on('response',response=>{const pathname=new URL(response.url()).pathname;if(['/api/v1/status.js','/api/v2/properties'].includes(pathname))responses.push({path:pathname,status:response.status()});});page.on('pageerror',error=>errors.push(error.message));
      await page.goto('http://localhost:8410'+route);
      if(route.endsWith('/config')){await page.waitForSelector('#cfg_sg');await page.locator('#cfg_sg').click();await page.locator('#cfg_ar').click();await page.locator('#cfg_tm').click();}
      await page.waitForFunction(()=>/^\d+(?:\.\d+)?$/.test(document.querySelector('.sg')?.textContent||''));
      assert(responses.some(response=>response.path==='/api/v1/status.js'&&response.status===200));assert(responses.some(response=>response.path==='/api/v2/properties'&&response.status===200));assert(responses.every(response=>response.status===200));assert.deepEqual(errors,[]);
      assert(await page.locator('.ar img').isVisible());assert(await page.locator('.tm').innerText());results.push({format,route,responses,reading:await page.locator('.sg').innerText(),arrowAndClockVisible:true,pageErrors:errors});await page.close();
    }
    fs.writeFileSync('docs/verification/clock-auth.json',JSON.stringify({generatedAt:new Date().toISOString(),scope:'Actual status/properties endpoints and rendered clocks with JSON-string storage, legacy raw storage and default read-only anonymous role; no response substitution or API writes',results},null,2));console.log('PASS: all six actual clock authentication/rendering paths.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
