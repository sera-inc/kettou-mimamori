'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),moment=require('moment-timezone');
const {chromium}=require('playwright');
const base='http://localhost:8410',out='docs/verification/demo-treatment-ui';
const hash=crypto.createHash('sha1').update(fs.readFileSync('.env.local','utf8').match(/^API_SECRET=(.+)$/m)[1].trim()).digest('hex');
const seed=JSON.parse(fs.readFileSync('docs/verification/demo-data.json'));assert.equal(seed.database,'kettou_demo');assert.equal(seed.synthetic,true);
async function treatments(){const response=await fetch(base+'/api/v1/treatments.json?count=1000');assert(response.ok);return response.json();}
async function show(page){await page.locator('#rp_show').click();await page.waitForFunction(()=>document.getElementById('rp_show').style.display!=='none'&&document.getElementById('info').textContent.trim()==='');}
(async()=>{
  fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true}),cleanup=[],results=[],errors=[],dialogs=[];
  try{
    for(const [size,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]])for(const eventType of ['Note','Meal Bolus']){
      const caseName=size+'-'+(eventType==='Note'?'note':'meal');
      const marker='治療操作確認-'+caseName+'-'+crypto.randomUUID(),page=await browser.newPage({viewport,locale:'ja-JP',timezoneId:'Asia/Tokyo',serviceWorkers:'block'});
      page.on('pageerror',error=>errors.push(error.message));
      page.on('dialog',async dialog=>{dialogs.push({viewport:size,type:dialog.type(),message:dialog.message()});if(dialog.type()==='confirm'&&dialog.message().includes(marker))await dialog.accept();else{errors.push('Unexpected native dialog');await dialog.dismiss();}});
      await page.addInitScript(value=>localStorage.setItem('apisecrethash',JSON.stringify(value)),hash);
      await page.goto(base+'/');await page.waitForFunction(()=>document.getElementById('container').getAttribute('aria-busy')==='false'&&Nightscout.client.hashauth.isAuthenticated());
      await page.locator('#treatmentDrawerToggle').focus();await page.keyboard.press('Enter');await page.locator('#eventType').selectOption(eventType);
      await page.locator('#notes').fill(marker);await page.locator('#enteredBy').fill(marker);
      if(eventType==='Meal Bolus'){await page.locator('#carbsGiven').fill('12');await page.locator('#insulinGiven').fill('1');await page.locator('#glucoseValue').fill('130');}
      const createdResponse=page.waitForResponse(r=>r.url().endsWith('/api/v1/treatments/')&&r.request().method()==='POST');
      await page.locator('#treatment-form button:not([data-drawer-close])').focus();await page.keyboard.press('Enter');
      const response=await createdResponse;assert(response.ok());const body=await response.json(),created=Array.isArray(body)?body[0]:body;assert(created._id);cleanup.push(created._id);
      let saved=(await treatments()).find(record=>record._id===created._id);assert(saved);assert.equal(saved.eventType,eventType);assert.equal(saved.notes,marker);assert.equal(saved.enteredBy,marker);
      if(eventType==='Meal Bolus'){assert.equal(Number(saved.carbs),12);assert.equal(Number(saved.insulin),1);assert.equal(Number(saved.glucose),130);}
      await page.goto(base+'/report');await page.waitForSelector('#treatments');const day=moment.tz('Asia/Tokyo').format('YYYY-MM-DD');
      await page.locator('#rp_from').fill(day);await page.locator('#rp_to').fill(day);await page.locator('#treatments').click();await show(page);
      const row=page.locator('#treatments-report tr').filter({hasText:marker});assert.equal(await row.count(),1);
      assert.equal(await row.locator('.editTreatment').locator('..').evaluate(el=>el.tagName),'BUTTON','Treatment edit is a native keyboard control');
      await row.locator('.editTreatment').locator('..').focus();await page.keyboard.press('Enter');await page.waitForSelector('#rp_edittreatmentdialog:visible');
      assert.equal(await page.locator('.ui-dialog:visible').getAttribute('aria-modal'),'true');
      await page.locator('.ui-dialog:visible .ui-dialog-buttonset button').last().focus();await page.keyboard.press('Tab');
      assert(await page.evaluate(()=>Boolean(document.activeElement.closest('.ui-dialog'))),'Tab stays inside the populated modal editor');
      await page.keyboard.press('Shift+Tab');assert(await page.evaluate(()=>Boolean(document.activeElement.closest('.ui-dialog'))));
      await page.keyboard.press('Escape');assert(await row.locator('.editTreatment').locator('..').evaluate(el=>el===document.activeElement),'Escape restores focus to the edit button');
      await page.keyboard.press('Enter');await page.waitForSelector('#rp_edittreatmentdialog:visible');
      await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const audit=await page.evaluate(async()=>{const r=await axe.run(document);return {violations:r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,html:n.html}))})),incomplete:r.incomplete.map(v=>({id:v.id,impact:v.impact}))};});
      fs.writeFileSync(out+'/'+caseName+'-edit-a11y.json',JSON.stringify(audit,null,2));
      await page.screenshot({path:out+'/'+caseName+'-edit.png',fullPage:false});
      assert.deepEqual(audit.violations,[],'Full document including the actual populated treatment editor must have no axe violations');
      assert.deepEqual((await require('./japanese-ui-text.cjs')(page)).candidates.filter(item=>!item.value.includes(marker)),[]);
      assert.equal(await page.locator('#rped_adnotes').inputValue(),marker);assert.equal(await page.locator('#rped_eventType').inputValue(),eventType);
      await page.locator('#rped_adnotes').fill(marker+' 更新');
      if(eventType==='Meal Bolus'){assert.equal(Number(await page.locator('#rped_carbsGiven').inputValue()),12);assert.equal(Number(await page.locator('#rped_insulinGiven').inputValue()),1);await page.locator('#rped_carbsGiven').fill('15');await page.locator('#rped_insulinGiven').fill('1.25');}
      const editedResponse=page.waitForResponse(r=>r.url().endsWith('/api/v1/treatments/')&&r.request().method()==='PUT');
      await page.locator('.ui-dialog:visible .ui-dialog-buttonset button').first().focus();await page.keyboard.press('Enter');assert((await editedResponse).ok());
      saved=(await treatments()).find(record=>record._id===created._id);assert.equal(saved.notes,marker+' 更新');assert.equal(saved.eventType,eventType);
      if(eventType==='Meal Bolus'){assert.equal(Number(saved.carbs),15);assert.equal(Number(saved.insulin),1.25);assert.equal(Number(saved.glucose),130);}
      await show(page);assert((await row.innerText()).includes(marker+' 更新'));
      const deletedResponse=page.waitForResponse(r=>r.url().endsWith('/api/v1/treatments/'+created._id)&&r.request().method()==='DELETE');
      await row.locator('.deleteTreatment').locator('..').focus();await page.keyboard.press('Space');assert((await deletedResponse).ok());
      assert(!(await treatments()).some(record=>record._id===created._id));await show(page);assert.equal(await row.count(),0);
      results.push({viewport:size,pass:true,eventType,actualCreateEditDelete:true,nativeConfirmations:2,editorAxeViolations:0,modalKeyboardAndFocusRestoration:true});await page.close();
    }
    assert.deepEqual(errors,[]);assert.equal(dialogs.length,8);assert(dialogs.every(dialog=>/[ぁ-んァ-ヶ一-龯]/.test(dialog.message)));
    fs.writeFileSync(out+'/results.json',JSON.stringify({generatedAt:new Date().toISOString(),scope:'Actual local synthetic DB; native keyboard main careportal create and populated report editor/save/delete on desktop/mobile; exact owned IDs only; no HTTP response interception',results,dialogs,pageErrors:errors},null,2));console.log('PASS: desktop/mobile actual treatment UI create, edit, delete and confirmations.');
  }finally{
    try {for(const id of cleanup){const response=await fetch(base+'/api/v1/treatments/'+id,{method:'DELETE',headers:{'api-secret':hash}});assert(response.ok);}}
    finally {await browser.close();}
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
