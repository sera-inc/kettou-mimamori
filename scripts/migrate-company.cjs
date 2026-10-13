'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const planFile='docs/company-source-plan.json';const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function reverse(file,source,options={}){
  source=require('./migrate-api-docs-ui.cjs').reverse(file,source);
  if(!options.skipBrand&&fs.existsSync('docs/brand-source-plan.json'))source=require('./migrate-brand.cjs').reverse(file,source);
  if(fs.existsSync('docs/alarm-audio-source-plan.json'))source=require('./migrate-alarm-audio.cjs').reverse(file,source);
  if(fs.existsSync('docs/company-landmark-plan.json')){
    const addon=JSON.parse(fs.readFileSync('docs/company-landmark-plan.json','utf8'));
    if(file===addon.file){assert.equal(source.split(addon.after).length-1,1);source=source.replace(addon.after,addon.before);assert.equal(sha(source),addon.beforeSHA256);}
  }
  const plan=JSON.parse(fs.readFileSync(planFile,'utf8')).find(item=>item.file===file);if(!plan)return source;
  for(const row of plan.rows.slice().reverse()){assert.equal(source.split(row.after).length-1,1,file);source=source.replace(row.after,row.before);}
  assert.equal(sha(source),plan.beforeSHA256,file+': only reviewed product/contact presentation may differ');return source;
}
module.exports={reverse};
if(require.main===module){
  if(process.argv[2]==='plan'){
    assert(!fs.existsSync(planFile),'Keep the reviewed company plan');const plans=new Map();
    function add(file,before,after){if(!plans.has(file)){const source=fs.readFileSync(file,'utf8');plans.set(file,{file,beforeSHA256:sha(source),source,rows:[]});}const item=plans.get(file);if(item.source.includes('\r\n')){before=before.replace(/(?<!\r)\n/g,'\r\n');after=after.replace(/(?<!\r)\n/g,'\r\n');}assert.equal(item.source.split(before).length-1,1,file);item.rows.push({before,after});item.source=item.source.replace(before,after);}
    add('lib/settings.js',"customTitle: 'Nightscout'","customTitle: '血糖みまもり'");
    add('tests/settings.test.js',"settings.customTitle.should.equal('Nightscout');","settings.customTitle.should.equal('血糖みまもり');");
    add('lib/client/index.js',"client.settings.customTitle || 'Nightscout'","client.settings.customTitle || '血糖みまもり'");
    add('lib/client/index.js',"$('.appName').text(serverSettings.name);","$('.appName').text('血糖みまもり');");
    add('views/index.html','name="apple-mobile-web-app-title" content="Nightscout"','name="apple-mobile-web-app-title" content="血糖みまもり"');
    add('views/index.html','id="customTitle" value="Nightscout"','id="customTitle" value="血糖みまもり"');
    const index=fs.readFileSync('views/index.html','utf8'),start=index.indexOf('      <fieldset id="about">'),end=index.indexOf('      </fieldset>',start)+'      </fieldset>'.length;
    assert(start>=0&&end>start);
    add('views/index.html',index.slice(start,end),`      <fieldset id="about">
        <legend>サービスについて</legend>
        <div class="appName">血糖みまもり</div>
        <p>運営：株式会社世良</p>
        <p><a href="mailto:info@sera-inc.co.jp">お問い合わせ：info@sera-inc.co.jp</a></p>
        <p><a href="https://sera-inc.co.jp" target="_blank" rel="noopener noreferrer">株式会社世良の会社情報</a></p>
        <details class="app-service-license">
          <summary>バージョンとライセンス</summary>
          <p>バージョン <span class="version"></span></p>
          <p>更新識別子 <span class="head"></span></p>
          <p>ソースコードのライセンス：<a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener noreferrer">AGPL（第3版）</a></p>
          <p>基盤の著作権 © 2017 <a href="https://github.com/nightscout/cgm-remote-monitor/graphs/contributors" target="_blank" rel="noopener noreferrer">Nightscoutの開発貢献者</a></p>
          <p><a href="https://github.com/nightscout/cgm-remote-monitor" target="_blank" rel="noopener noreferrer">基盤のソースコード</a></p>
          <p><a href="https://github.com/nightscout/cgm-remote-monitor/releases" target="_blank" rel="noopener noreferrer">基盤の更新履歴</a></p>
        </details>
      </fieldset>`);
    add('views/partials/toolbar.ejs','</nav></div>',`</nav><div class="app-service-support">
  <p>運営：株式会社世良</p>
  <a href="mailto:info@sera-inc.co.jp">お問い合わせ</a>
  <a href="https://sera-inc.co.jp" target="_blank" rel="noopener noreferrer">会社情報</a>
</div></div>`);
    add('views/clockviews/clock.html','  </main>','  </main>\n  <% if(face!==\'config\') { %><footer class="app-clock-support">血糖みまもり · 株式会社世良 <a href="mailto:info@sera-inc.co.jp">お問い合わせ</a></footer><% } %>');
    add('static/manifest.json','"name": "Nightscout"','"name": "血糖みまもり",\n\t"short_name": "血糖みまもり",\n\t"lang": "ja",\n\t"description": "株式会社世良が提供する、血糖値と治療記録を確認するサービス",\n\t"start_url": "/"');
    fs.writeFileSync(planFile,JSON.stringify([...plans.values()].map(({source,...item})=>item),null,2));console.log('Planned product/contact presentation in '+plans.size+' files; API identifiers and all clinical settings except the reviewed default title remain.');
  }else if(process.argv[2]==='apply'){
    for(const item of JSON.parse(fs.readFileSync(planFile,'utf8'))){let source=fs.readFileSync(item.file,'utf8');assert.equal(sha(source),item.beforeSHA256,item.file);for(const row of item.rows){assert.equal(source.split(row.before).length-1,1);source=source.replace(row.before,row.after);}fs.writeFileSync(item.file,source);}
  }else if(process.argv[2]==='verify'){
    const results=JSON.parse(fs.readFileSync(planFile,'utf8')).map(item=>{reverse(item.file,fs.readFileSync(item.file,'utf8'));return {file:item.file,pass:true,reviewedPresentationExpressions:item.rows.length,exactSourceReversal:true};});
    fs.mkdirSync('docs/verification/company',{recursive:true});fs.writeFileSync('docs/verification/company/invariants.json',JSON.stringify(results,null,2));console.log('PASS: exact reversal of reviewed product/contact changes; existing identifiers and computation source preserved.');
  }else throw Error('Use plan, apply or verify');
}
