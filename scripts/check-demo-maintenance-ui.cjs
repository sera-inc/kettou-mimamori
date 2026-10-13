'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {MongoClient}=require('mongodb'),{chromium}=require('playwright');
const out='docs/verification/demo-maintenance-ui',base='http://localhost:8410';
const seed=JSON.parse(fs.readFileSync('docs/verification/demo-data.json'));assert.equal(seed.database,'kettou_demo');assert.equal(seed.synthetic,true);
const hash=crypto.createHash('sha1').update(fs.readFileSync('.env.local','utf8').match(/^API_SECRET=(.+)$/m)[1].trim()).digest('hex');
(async()=>{
  fs.mkdirSync(out,{recursive:true});const mongo=new MongoClient('mongodb://127.0.0.1:27118/kettou_demo');await mongo.connect();const db=mongo.db('kettou_demo');
  const browser=await chromium.launch({headless:true,channel:'chrome'}),results=[],errors=[];
  const marker='maintenance-'+crypto.randomUUID(),collections=['entries','treatments','devicestatus'];
  async function snapshot(){const result={};for(const col of collections)result[col]=crypto.createHash('sha256').update(JSON.stringify(await db.collection(col).find({demoMaintenance:{$ne:marker}}).sort({_id:1}).toArray())).digest('hex');return result;}
  const baseline=await snapshot();
  try{
    for(const [size,viewport]of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
      const iso='2001-01-01T03:00:00.000Z',records={entries:{date:Date.parse(iso),dateString:iso,sgv:120,type:'sgv',device:marker},treatments:{created_at:iso,eventType:'Note',notes:marker},devicestatus:{created_at:iso,device:marker,uploader:{battery:80}}};
      for(const col of collections){assert.equal(await db.collection(col).countDocuments(col==='entries'?{date:{$gte:Date.parse('2000-12-31T15:00Z'),$lt:Date.parse('2001-01-01T15:00Z')}}:{created_at:{$gte:'2000-12-31T15:00:00.000Z',$lt:'2001-01-01T15:00:00.000Z'}}),0,'Test date must contain no pre-existing records');await db.collection(col).insertOne({...records[col],demoMaintenance:marker});}
      const futureIso=new Date(Date.now()+365*86400000).toISOString();assert.equal(await db.collection('treatments').countDocuments({created_at:{$gt:new Date().toISOString()}}),0,'Future removal must target only owned test records');await db.collection('treatments').insertOne({created_at:futureIso,eventType:'Note',notes:marker,demoMaintenance:marker});
      const page=await browser.newPage({viewport,locale:'ja-JP',serviceWorkers:'block'}),deletes=[],dialogs=[];let decision='cancel';
      page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='DELETE')deletes.push(new URL(r.url()).pathname+new URL(r.url()).search);});
      page.on('dialog',async d=>{assert(/[ぁ-んァ-ヶ一-龯]/.test(d.message()),'Validation and confirmation must be Japanese');dialogs.push({type:d.type(),accepted:decision==='accept'});if(d.type()==='confirm'&&decision==='accept')await d.accept();else await d.dismiss();});
      await page.addInitScript(value=>localStorage.setItem('apisecrethash',JSON.stringify(value)),hash);await page.goto(base+'/admin');await page.waitForFunction(()=>window.$.active===0&&window.$(':animated').length===0&&document.querySelector('#admin_daterange_start'));
      await page.locator('#admin_daterange_collection').selectOption('all');await page.locator('#admin_daterange_start').fill('2001-01-02');await page.locator('#admin_daterange_end').fill('2001-01-01');
      await page.locator('button.adminButton[plugin="daterangedelete"]').click();assert.equal(deletes.length,0);
      await page.locator('#admin_daterange_start').fill('2001-01-01');await page.locator('#admin_daterange_preview').click();await page.waitForFunction(()=>window.$.active===0&&window.$(':animated').length===0);assert.match(await page.locator('#admin_daterange_preview_count').innerText(),/1.*1.*1/);
      await page.locator('button.adminButton[plugin="daterangedelete"]').click();assert.equal(deletes.length,0,'Cancelled confirmation does not delete records');
      decision='accept';await page.locator('button.adminButton[plugin="daterangedelete"]').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>window.$.active===0&&/3/.test(document.getElementById('admin_daterangedelete_0_status').textContent));
      for(const col of collections)assert.equal(await db.collection(col).countDocuments({demoMaintenance:marker,...(col==='treatments'?{created_at:iso}:{})}),0);
      assert.equal(deletes.length,3);for(const url of deletes){const params=new URL(base+url).searchParams;if(url.includes('/entries/')){assert.equal(Number(params.get('find[date][$gte]')),Date.parse('2000-12-31T15:00Z'));assert.equal(Number(params.get('find[date][$lte]')),Date.parse('2001-01-01T14:59:59.999Z'));}else{assert.equal(params.get('find[created_at][$gte]'),'2000-12-31T15:00:00.000Z');assert.equal(params.get('find[created_at][$lte]'),'2001-01-01T14:59:59.999Z');}}
      assert.match(await page.locator('#admin_futureitems_0_html').innerText(),new RegExp(marker));await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
      const audit=await page.evaluate(async()=>{const r=await axe.run(document);return r.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}));});fs.writeFileSync(out+'/'+size+'-a11y.json',JSON.stringify(audit,null,2));assert.deepEqual(audit,[]);
      await page.locator('button.adminButton[plugin="futureitems"][action="0"]').click();await page.waitForFunction(()=>window.$.active===0&&window.$(':animated').length===0);assert.equal(await db.collection('treatments').countDocuments({demoMaintenance:marker}),0);assert.equal(deletes.length,4);
      assert.deepEqual(await snapshot(),baseline,'Every pre-existing entry, treatment and device record is preserved');
      results.push({viewport:size,pass:true,invalidRangeRejected:true,cancelPreservedData:true,allThreeCollectionsPreviewed:true,profileTimezone:'Asia/Tokyo',exactInclusiveDayFilters:true,dateRangeDeleted:3,futureTreatmentDeleted:1,allPreExistingRecordsUnchanged:true,axeViolations:0,dialogs});await page.close();
    }
    assert.deepEqual(errors,[]);fs.writeFileSync(out+'/results.json',JSON.stringify({generatedAt:new Date().toISOString(),scope:'Real isolated DB maintenance UI; owned past-date/future records only, invalid/cancel/confirm paths, exact Tokyo day boundaries and full pre-existing collection digests',results,pageErrors:errors},null,2));console.log('PASS: desktop/mobile maintenance UI, exact day filters and all pre-existing records preserved.');
  }finally{try{for(const col of collections)await db.collection(col).deleteMany({demoMaintenance:marker});assert.deepEqual(await snapshot(),baseline);}finally{await browser.close();await mongo.close();}}
})().catch(e=>{console.error(e);process.exitCode=1;});
