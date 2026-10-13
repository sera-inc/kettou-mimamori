'use strict';
const fs=require('fs');
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const results=[];
  try {
    const page=await browser.newPage({viewport:{width:390,height:844},locale:'ja-JP',serviceWorkers:'block'});
    await page.goto('http://localhost:8410/design-system/button-preview.html');
    const metrics=await page.locator('#solid').evaluate(button=>({height:button.getBoundingClientRect().height,background:getComputedStyle(button).backgroundColor,color:getComputedStyle(button).color}));
    assert(metrics.height>=44,'button touch target must be at least 44px');
    function luminance(color){const rgb=color.match(/\d+/g).slice(0,3).map(Number).map(value=>{const v=value/255;return v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4;});return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;}
    const a=luminance(metrics.background),b=luminance(metrics.color);
    const contrast=(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
    assert(contrast>=4.5,'button text contrast must pass AA');
    results.push({case:'touch target and text contrast',height:metrics.height,contrast,pass:true});
    const outline=await page.locator('#outline').evaluate(button=>({background:getComputedStyle(button).backgroundColor,color:getComputedStyle(button).color}));
    assert.notEqual(outline.background,metrics.background,'The outline variant must override the solid-fill base rule');
    const oa=luminance(outline.background),ob=luminance(outline.color);const outlineContrast=(Math.max(oa,ob)+0.05)/(Math.min(oa,ob)+0.05);assert(outlineContrast>=4.5);
    results.push({case:'outline variant has a distinct surface and readable text',contrast:outlineContrast,pass:true});
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('id'),'solid');
    const focus=await page.locator('#solid').evaluate(button=>({style:getComputedStyle(button).outlineStyle,width:getComputedStyle(button).outlineWidth}));
    assert.equal(focus.style,'solid');assert(parseFloat(focus.width)>=3);
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#result').innerText(),'実行回数：1');
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#result').innerText(),'実行回数：2');
    results.push({case:'Tab focus, visible focus, Enter and Space activation',focus,pass:true});
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('id'),'outline');
    assert(await page.locator('#disabled').isDisabled());
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').getAttribute('id'),'submit');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#result').innerText(),'保存しました');
    results.push({case:'disabled button skipped, native form submit retained',pass:true});
    fs.mkdirSync('docs/verification/button',{recursive:true});
    await page.screenshot({path:'docs/verification/button/mobile.png'});
    fs.writeFileSync('docs/verification/button/results.json',JSON.stringify(results,null,2));
    console.log(JSON.stringify(results,null,2));
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
