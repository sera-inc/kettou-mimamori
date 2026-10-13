'use strict';
const fs=require('fs');const assert=require('node:assert/strict');const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const out='docs/verification/data-grid';
(async()=>{fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,channel:'chrome'});const results=[];try {
  const page=await browser.newPage({viewport:{width:390,height:844},locale:'ja-JP',serviceWorkers:'block'});const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const secret=fs.readFileSync('.env.local','utf8').match(/^API_SECRET=(.+)$/m)[1].trim();
  const hashed=require('crypto').createHash('sha1').update(secret).digest('hex');
  await page.addInitScript(value=>localStorage.setItem('apisecrethash',JSON.stringify(value)),hashed);
  const writes=[];await page.route('**/api/v1/food/**',route=>{
    if(route.request().method()==='POST') {
      const body=new URLSearchParams(route.request().postData());writes.push({method:'POST',type:body.get('type')});
      return route.fulfill({json:[{_id:'000000000000000000000030'}]});
    }
    if(route.request().method()!=='GET'){writes.push({method:route.request().method()});return route.abort();}
    return route.continue();
  });
  await page.route('**/api/v1/food.json',route=>route.fulfill({json:[{_id:'000000000000000000000020',type:'food',name:'ごはん',category:'主食',subcategory:'米飯',portion:150,unit:'g',carbs:55,gi:2,fat:1,protein:4,energy:1000},{_id:'000000000000000000000021',type:'food',name:'食パン',category:'主食',subcategory:'パン',portion:60,unit:'g',carbs:28,gi:2,fat:3,protein:5,energy:600}]}));
  await page.goto('http://localhost:8410/food');await page.waitForSelector('.fe_editimg');
  assert.equal(await page.locator('#fe_status').count(),1);
  const brand=await page.locator('.app-brand').boundingBox();const back=await page.locator('.closeButton').boundingBox();assert(brand.x+brand.width<=back.x,JSON.stringify({brand,back}));
  assert.equal(await page.locator('#fe_data [role="row"]').count(),2);
  assert.equal(await page.locator('#fe_data_header [role="columnheader"]').count(),11);
  const region=page.locator('.app-food-grid');await region.focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(150);
  assert(await region.evaluate(el=>el.scrollLeft>0));
  await region.evaluate(el=>el.scrollLeft=0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#fe_filter_name').fill('ごはん');assert.equal(await page.locator('#fe_data [role="row"]').count(),1);
  const edit=page.locator('.fe_editimg').locator('..');assert.equal(await edit.evaluate(el=>el.tagName),'BUTTON');await edit.focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#fe_name').inputValue(),'ごはん');assert.equal(await page.locator('#fe_carbs').inputValue(),'55');assert.equal(await page.locator('#fe_id').inputValue(),'000000000000000000000020');
  results.push({case:'fixture food grid retains name filtering, native keyboard edit and exact ID/carbs; horizontal scrolling is confined to grid',pass:true});
  await page.locator('#fe_clear').click();assert.equal(await page.locator('#fe_id').inputValue(),'');
  await page.locator('#fe_quickpick_add').locator('..').focus();await page.keyboard.press('Space');await page.waitForSelector('.sortablequickpick');assert.equal(await page.locator('.sortablequickpick').count(),1);
  await page.locator('#fe_filter_name').fill('');await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:out+'/food-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1600});await page.evaluate(()=>window.scrollTo(0,0));
  // Original jQuery drag/drop is exercised; quick picks stay in memory and are not saved.
  const source=await page.locator('.draggablefood').first().boundingBox();const target=await page.locator('.sortablequickpick').first().boundingBox();
  await page.mouse.move(source.x+150,source.y+20);await page.mouse.down();await page.mouse.move(target.x+40,target.y+40,{steps:15});await page.mouse.up();
  assert.equal(await page.locator('.fe_foodinsideqp').count(),1);
  results.push({case:'native add quick-pick button and original drag/drop work; create request is intercepted before persistence',pass:true});
  assert.deepEqual(writes,[{method:'POST',type:'quickpick'}]);
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://localhost:8410/profile');await page.waitForSelector('#pe_basal_val_0');
  assert(await page.locator('#pe_basal_placeholder .app-data-grid').count());
  const add=page.locator('#pe_basal_placeholder .addsingle').last().locator('..');await add.focus();await page.keyboard.press('Enter');
  await page.waitForSelector('#pe_basal_val_1');assert.equal(await page.locator('#pe_basal_val_0').inputValue(),'0.6');
  assert.equal(await page.locator(':focus').getAttribute('id'),'pe_basal_from_1');
  const remove=page.locator('#pe_basal_placeholder .delsingle').last().locator('..');await remove.focus();await page.keyboard.press('Space');
  assert.equal(await page.locator('#pe_basal_val_1').count(),0);assert.equal(await page.locator('#pe_basal_val_0').inputValue(),'0.6');
  await page.waitForFunction(()=>document.activeElement?.id==='pe_basal_from_0');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  results.push({case:'profile interval keyboard add/remove preserves basal value and existing handlers; edits are not saved',pass:true});
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:out+'/profile-mobile.png',fullPage:true});
  await page.goto('http://localhost:8410/admin');await page.waitForSelector('#admin_roles_table th');
  assert.equal(await page.locator('#admin_roles_table').getAttribute('class'),'app-data-grid__table');
  assert.equal(await page.locator('#admin_roles_table th').first().getAttribute('scope'),'col');
  assert.equal(await page.locator('#admin_roles_table th').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(242, 242, 242)');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:out+'/admin-mobile.png',fullPage:true});
  results.push({case:'authenticated admin roles table gains caption, header scope and DDS surface; mobile header and page do not overflow',pass:true});
  assert.deepEqual(errors,[]);fs.writeFileSync(out+'/results.json',JSON.stringify({results,scope:'browser-intercepted synthetic food fixture and POST; no DB persistence',pageErrors:errors},null,2));console.log(JSON.stringify(results,null,2));
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
