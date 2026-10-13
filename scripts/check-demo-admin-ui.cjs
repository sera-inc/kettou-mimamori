'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');const {chromium}=require('playwright');
const base='http://localhost:8410',out='docs/verification/demo-admin-ui';
const hash=crypto.createHash('sha1').update(fs.readFileSync('.env.local','utf8').match(/^API_SECRET=(.+)$/m)[1].trim()).digest('hex');
const seed=JSON.parse(fs.readFileSync('docs/verification/demo-data.json'));assert.equal(seed.database,'kettou_demo');assert.equal(seed.synthetic,true);
async function api(path,method='GET',body,token){
  const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{'api-secret':hash})},body:body===undefined?undefined:JSON.stringify(body)});
  const data=await response.json();return {status:response.status,data};
}
function ok(value){assert(value.status>=200&&value.status<300,'Local admin request failed: '+value.status);return value.data;}
(async()=>{
  fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true}),cleanup=[],results=[],errors=[],dialogs=[];
  try{
    for(const [size,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
      const name='管理操作確認-'+size+'-'+crypto.randomUUID(),roleName=name+'権限',subjectName=name+'利用者';
      const page=await browser.newPage({viewport,locale:'ja-JP',serviceWorkers:'block'});page.on('pageerror',e=>errors.push(e.message));
      page.on('dialog',async d=>{if(d.type()==='confirm'&&d.message().includes(name)){dialogs.push({viewport:size,type:d.type(),japanese:/[ぁ-んァ-ヶ一-龯]/.test(d.message())});await d.accept();}else{errors.push('Unexpected admin native dialog');await d.dismiss();}});
      await page.addInitScript(value=>localStorage.setItem('apisecrethash',JSON.stringify(value)),hash);await page.goto(base+'/admin');await page.waitForSelector('#admin_roles_table th');
      await page.locator('button.adminButton[plugin="roles"]').focus();await page.keyboard.press('Enter');await page.waitForSelector('#editroledialog:visible');
      assert.equal(await page.locator('.ui-dialog:visible').getAttribute('aria-modal'),'true');
      await page.locator('#edrole_name').fill(roleName);await page.locator('#edrole_permissions').fill('api:entries:read api:status:read api:treatments:read');await page.locator('#edrole_notes').fill('権限の保存確認');
      await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});async function audit(label){await page.waitForFunction(()=>window.$.active===0&&window.$(":animated").length===0);const violations=await page.evaluate(async()=>{const r=await axe.run(document);return r.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}));});fs.writeFileSync(out+'/'+size+'-'+label+'-a11y.json',JSON.stringify(violations,null,2));assert.deepEqual(violations,[]);}
      await audit('role');const roleCreated=page.waitForResponse(r=>/\/api\/v2\/authorization\/roles\/$/.test(r.url())&&r.request().method()==='POST');await page.locator('.ui-dialog:visible .ui-dialog-buttonset button').first().click();const rResponse=await roleCreated;assert(rResponse.ok());const role=await rResponse.json();assert(role._id);cleanup.push(['/api/v2/authorization/roles/',role._id]);
      assert(ok(await api('/api/v2/authorization/roles')).some(item=>item._id===role._id));
      await page.locator('button.adminButton[plugin="subjects"]').focus();await page.keyboard.press('Enter');await page.waitForSelector('#editsubjectdialog:visible');
      await page.locator('#edsub_name').fill(subjectName);await page.locator('#edsub_roles').fill(roleName);await page.locator('#edsub_notes').fill('利用者の保存確認');await audit('subject');
      const subjectCreated=page.waitForResponse(r=>/\/api\/v2\/authorization\/subjects\/$/.test(r.url())&&r.request().method()==='POST');await page.locator('.ui-dialog:visible .ui-dialog-buttonset button').first().click();const sResponse=await subjectCreated;assert(sResponse.ok());const subject=await sResponse.json();assert(subject._id);cleanup.push(['/api/v2/authorization/subjects/',subject._id]);
      const loaded=ok(await api('/api/v2/authorization/subjects')).find(item=>item._id===subject._id);assert(loaded);assert.equal(loaded.notes,"利用者の保存確認");assert.deepEqual(loaded.roles,[roleName.toLowerCase()]);assert(loaded.accessToken);
      const reader=ok(await api('/api/v2/authorization/request/'+encodeURIComponent(loaded.accessToken)));assert(reader.token);
      assert.equal((await api('/api/v1/entries/sgv.json?count=1','GET',undefined,reader.token)).status,200);
      const note={eventType:'Note',enteredBy:name,notes:name,created_at:new Date().toISOString()};const denied=await api('/api/v1/treatments/','POST',note,reader.token);assert([401,403].includes(denied.status),'Read role must reject treatment creation');
      const roleRow=page.locator('#admin_roles_table tr').filter({hasText:roleName});assert.equal(await roleRow.count(),1);
      const roleEdit=roleRow.locator('button.app-data-grid__icon-button').first();await roleEdit.focus();await page.keyboard.press('Enter');await page.waitForSelector('#editroledialog:visible');
      await page.locator('#edrole_permissions').fill('api:entries:read api:status:read api:treatments:read api:treatments:create api:treatments:update api:treatments:delete');
      const roleUpdated=page.waitForResponse(r=>/\/api\/v2\/authorization\/roles\/$/.test(r.url())&&r.request().method()==='PUT');await page.locator('.ui-dialog:visible .ui-dialog-buttonset button').first().click();assert((await roleUpdated).ok());
      const writer=ok(await api('/api/v2/authorization/request/'+encodeURIComponent(loaded.accessToken)));const created=ok(await api('/api/v1/treatments/','POST',note,writer.token));const treatment=Array.isArray(created)?created[0]:created;assert(treatment._id);cleanup.push(['/api/v1/treatments/',treatment._id]);
      ok(await api('/api/v1/treatments/'+treatment._id,'DELETE',undefined,writer.token));
      assert([401,403].includes((await api('/api/v2/authorization/roles','GET',undefined,writer.token)).status),'Treatment writer does not gain admin access');
      const subjectRow=page.locator('#admin_subjects_table tr').filter({hasText:subjectName});assert.equal(await subjectRow.count(),1);
      await subjectRow.locator('button.app-data-grid__icon-button').first().focus();await page.keyboard.press('Enter');await page.waitForSelector('#editsubjectdialog:visible');assert.equal(await page.locator('#edsub_notes').inputValue(),'利用者の保存確認');await page.locator('#edsub_name').fill(subjectName+'更新');
      const subjectUpdated=page.waitForResponse(r=>/\/api\/v2\/authorization\/subjects\/$/.test(r.url())&&r.request().method()==='PUT');await page.locator('.ui-dialog:visible .ui-dialog-buttonset button').first().click();assert((await subjectUpdated).ok());
      const updatedSubject=ok(await api('/api/v2/authorization/subjects')).find(item=>item._id===subject._id);assert.equal(updatedSubject.name,subjectName+'更新');assert.equal(updatedSubject.notes,'利用者の保存確認');
      const subjectDeleted=page.waitForResponse(r=>r.url().endsWith('/api/v2/authorization/subjects/'+subject._id)&&r.request().method()==='DELETE');await page.locator('#admin_subjects_table tr').filter({hasText:subjectName+'更新'}).locator('button.app-data-grid__icon-button').last().click();assert((await subjectDeleted).ok());
      const roleDeleted=page.waitForResponse(r=>r.url().endsWith('/api/v2/authorization/roles/'+role._id)&&r.request().method()==='DELETE');await roleRow.locator('button.app-data-grid__icon-button').last().click();assert((await roleDeleted).ok());
      assert(!ok(await api('/api/v2/authorization/subjects')).some(item=>item._id===subject._id));assert(!ok(await api('/api/v2/authorization/roles')).some(item=>item._id===role._id));
      results.push({viewport:size,pass:true,roleAndSubjectActualUICrud:true,savedSubjectNotesSurviveReloadAndNameEdit:true,readerCanRead:true,readerWriteRejected:denied.status,writerCanCreateAndDeleteTreatment:true,writerAdminRejected:true,dialogAxeViolations:0});await page.close();
    }
    assert.deepEqual(errors,[]);assert.equal(dialogs.length,4);assert(dialogs.every(d=>d.japanese));
    fs.writeFileSync(out+'/results.json',JSON.stringify({generatedAt:new Date().toISOString(),scope:'Actual isolated DB role/subject UI CRUD, live reader/writer token permissions and denied admin access; owned temporary records only; credential values excluded from artifacts',results,dialogs,pageErrors:errors},null,2));console.log('PASS: desktop/mobile role/subject UI CRUD and live read/write/admin permissions.');
  }finally{try{for(const [path,id]of cleanup)ok(await api(path+id,'DELETE'));}finally{await browser.close();}}
})().catch(error=>{console.error(error);process.exitCode=1;});
