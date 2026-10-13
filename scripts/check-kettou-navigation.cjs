'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const out=path.resolve('../sera-inc-public-site/docs/verification/kettou-mimamori');
const base=process.env.KETTOU_LP_BASE || 'http://127.0.0.1:8411';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true}),results=[];try{
  for(const [size,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
    const page=await browser.newPage({viewport,locale:'ja-JP'});await page.goto(base+'/healthcare?sera_internal=1');
    await page.waitForSelector('html[data-analytics-excluded="true"]');
    if(size==='desktop'){
      await page.locator('[data-mega-trigger="industry"]').focus();await page.keyboard.press('Enter');
      await page.getByRole('button',{name:'医療',exact:true}).focus();await page.keyboard.press('Enter');
    }else{
      await page.getByRole('button',{name:'メニューを開く',exact:true}).click();
      await page.locator('[data-mobile-group="industry"] > summary').click();
      await page.locator('[data-mobile-group="industry"] > div > details').filter({hasText:'医療機関の業務改善'}).locator(':scope > summary').click();
    }
    const link=page.locator((size==='desktop'?'header':'[data-mobile-group="industry"]')+' a[href="/healthcare/products/kettou-mimamori"]');
    await link.waitFor({state:'visible'});await page.screenshot({path:path.join(out,size+'-industry-menu.png')});
    await link.focus();await page.keyboard.press('Enter');await page.waitForURL('**/healthcare/products/kettou-mimamori');await page.waitForSelector('.sumai-lp #features');
    assert(await page.locator('.sumai-lp').innerText().then(text=>text.includes('血糖みまもり')));
    results.push({viewport:size,industry:'医療',nativeKeyboardLinkReachesProduct:true,analyticsExcluded:await page.locator('html').getAttribute('data-analytics-excluded')});await page.close();
  }
  fs.writeFileSync(path.join(out,'navigation-results.json'),JSON.stringify({generatedAt:new Date().toISOString(),base,results},null,2));console.log('PASS: desktop industry rail and mobile nested industry menu reach the medical LP by native keyboard activation.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
