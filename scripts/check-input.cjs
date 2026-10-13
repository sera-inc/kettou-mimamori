'use strict';
const fs=require('fs');const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
(async()=>{
const browser=await chromium.launch({headless:true,channel:'chrome'});const results=[];
try {
const page=await browser.newPage({viewport:{width:390,height:844},locale:'ja-JP',serviceWorkers:'block'});
await page.goto('http://localhost:8410/design-system/input-preview.html');
await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').getAttribute('id'),'name');
const focus=await page.locator('#name').evaluate(el=>({outline:getComputedStyle(el).outlineStyle,width:getComputedStyle(el).outlineWidth,height:el.getBoundingClientRect().height}));assert.equal(focus.outline,'solid');assert(parseFloat(focus.width)>=3);assert(focus.height>=44);
await page.locator('#name').fill('朝の記録');await page.locator('#amount').fill('21');await page.locator('#save').click();assert.equal(await page.locator('#result').innerText(),'未保存');assert(await page.locator('#amount').evaluate(el=>el.validity.rangeOverflow));
await page.locator('#amount').fill('0.65');assert(await page.locator('#amount').evaluate(el=>el.validity.stepMismatch));
await page.locator('#amount').fill('0.6');await page.locator('#save').click();assert.equal(await page.locator('#result').innerText(),'朝の記録：0.6');results.push({case:'native required, range and fractional-step validation; exact numeric value submitted',pass:true});
await page.locator('#readonly').focus();await page.keyboard.type('変更');assert.equal(await page.locator('#readonly').inputValue(),'読み取り専用');assert.equal(await page.locator('#readonly').evaluate(el=>getComputedStyle(el).borderStyle),'dashed');assert(await page.locator('#disabled').isDisabled());await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').getAttribute('id'),'invalid');assert.equal(await page.locator('#invalid').getAttribute('aria-describedby'),'error');const invalidState=await page.locator('#invalid').evaluate(el=>({border:getComputedStyle(el).borderColor,expected:getComputedStyle(el).getPropertyValue('--app-danger-border').trim()}));assert.equal(invalidState.border,'rgb(236, 0, 0)');results.push({case:'readonly value and dashed border retained, disabled skipped, error associated and visibly marked',pass:true});
assert.equal(await page.locator('#date').inputValue(),'2026-10-12');assert.equal(await page.locator('#time').inputValue(),'08:30');results.push({case:'date/time values and visible keyboard focus retained',focus,pass:true});
await page.goto('http://localhost:8410/profile');await page.waitForTimeout(8000);const original=await page.locator('#pe_dia').inputValue();await page.locator('#pe_dia').fill('4.5');assert.equal(await page.locator('#pe_dia').inputValue(),'4.5');await page.locator('#pe_dia').fill(original);results.push({case:'existing profile input accepts unchanged decimal representation without saving',pass:true});
fs.mkdirSync('docs/verification/input',{recursive:true});await page.screenshot({path:'docs/verification/input/mobile-profile.png'});fs.writeFileSync('docs/verification/input/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
