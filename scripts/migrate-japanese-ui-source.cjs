'use strict';
const fs=require('node:fs'), assert=require('node:assert/strict'), crypto=require('node:crypto'), acorn=require('acorn');
const planFile='docs/japanese-ui-source-plan.json';
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const ast=value=>sha(JSON.stringify(acorn.parse(value,{ecmaVersion:'latest'}),(key,item)=>['start','end','raw'].includes(key)?undefined:item));
function reverse(file,source){
  source=require('./migrate-report-format.cjs').reverse(file,source);
  if(fs.existsSync('docs/brand-source-plan.json'))source=require('./migrate-brand.cjs').reverse(file,source);
  if(fs.existsSync('docs/admin-remaining-plan.json'))source=require('./migrate-admin-remaining.cjs').reverse(file,source);
  if(fs.existsSync('docs/admin-dialog-plan.json'))source=require('./migrate-admin-design.cjs').reverse(file,source,{skipBrand:true});
  if(fs.existsSync('docs/treatment-editor-plan.json'))source=require('./migrate-treatment-editor.cjs').reverse(file,source);
  if(fs.existsSync('docs/loop-boundary-plan.json'))source=require('./migrate-loop-boundary.cjs').reverse(file,source);
  if(fs.existsSync('docs/company-source-plan.json'))source=require('./migrate-company.cjs').reverse(file,source,{skipBrand:true});
  if(fs.existsSync('docs/japanese-ui-source-addon-plan.json'))for(const addon of JSON.parse(fs.readFileSync('docs/japanese-ui-source-addon-plan.json','utf8')).filter(item=>item.file===file).reverse()){
    if(addon.after===''){
      assert.equal(file,'lib/report_plugins/calibrations.js');assert.equal(addon.before.trim(),"var translate = require('../language')().translate;");
      const anchor="var reportTheme = require('../report/theme');";assert.equal(source.split(anchor).length-1,1);
      const position=source.indexOf(anchor)+anchor.length;assert(/^\r?\n/.test(source.slice(position)));
      const end=position+(source.slice(position).startsWith('\r\n')?2:1);source=source.slice(0,end)+addon.before+source.slice(end);
    }else if(addon.reverseLastOccurrence){const start=source.lastIndexOf(addon.after);assert(start>=0);source=source.slice(0,start)+addon.before+source.slice(start+addon.after.length);}
    else{assert.equal(source.split(addon.after).length-1,1);source=source.replace(addon.after,addon.before);}
    assert.equal(sha(source),addon.beforeSourceSHA256,'Only the reviewed display/compatibility expressions may differ');
  }
  const item=JSON.parse(fs.readFileSync(planFile,'utf8')).find(item=>item.file===file);if(!item)return source;
  let offset=0;const rows=item.rows.map(row=>{const result={...row,start:row.start+offset,end:row.start+offset+row.after.length};offset+=row.after.length-row.before.length;return result;});
  for(const row of rows.reverse()){assert.equal(source.slice(row.start,row.end),row.after,file);source=source.slice(0,row.start)+row.before+source.slice(row.end);}
  assert.equal(sha(source),item.beforeSHA256,file);if(item.beforeAST)assert.equal(ast(source),item.beforeAST,file);return source;
}
module.exports={reverse};
if(require.main===module){
  const mode=process.argv[2];
  if(mode==='plan'){
    assert(!fs.existsSync(planFile),'Keep the reviewed source plan');const files=new Map();
    function add(file,before,after,count=1){
      if(!files.has(file)){const source=fs.readFileSync(file,'utf8');files.set(file,{file,source,beforeSHA256:sha(source),beforeAST:file.endsWith('.js')?ast(source):null,rows:[]});}
      const item=files.get(file);if(item.source.includes('\r\n')){before=before.replace(/(?<!\r)\n/g,'\r\n');after=after.replace(/(?<!\r)\n/g,'\r\n');}assert.equal(item.source.split(before).length-1,count,file+': exact reviewed expression count');
      let from=0;for(let i=0;i<count;i++){const start=item.source.indexOf(before,from);item.rows.push({start,before,after});from=start+before.length;}
    }
    add('views/index.html','aria-label="Chart"','aria-label="血糖値の推移グラフ"');
    add('views/index.html','title="Use IOB in calculation"','title="残存インスリン（IOB）を計算に含める"');
    add('views/index.html','<div>version <span','<div>バージョン <span');
    add('views/index.html','<div>head <span','<div>更新識別子 <span');
    add('views/index.html','<div>License: <a','<div>ライセンス：<a');
    add('views/index.html','Copyright © 2017','著作権 © 2017');
    add('views/index.html','>Nightscout contributors</a>','>Nightscoutの開発貢献者</a>');
    add('views/index.html','>CGM in the Cloud</a>','>CGMのクラウド利用コミュニティー</a>');
    add('lib/client/boluscalc.js',"'Target BG range: ' + targetBGLow", "translate('Target BG range:') + ' ' + targetBGLow");
    add('lib/client/boluscalc.js',"'\\nBG diff: ' + record.bgdiff.toFixed(1)", "'\\n' + translate('BG diff:') + ' ' + record.bgdiff.toFixed(1)");
    add('lib/client/boluscalc.js',"'IC: ' + ic", "translate('IC:') + ' ' + ic");
    add('lib/client/boluscalc.js','width: 640\n      , height: 400','width: 640\n      , height: 400\n      , closeText: client.language.lang === \'ja\' ? \'閉じる\' : \'Close\'');
    add('lib/client/boluscalc.js','title="Delete record"', 'title="\' + htmlUtils.textAsHtml(translate(\'Delete record\')) + \'"');
    add('lib/profile/profileeditor.js',"timezoneInput.append('<option value=\"' + tz + '\">' + tz + '</option>');", "timezoneInput.append($('<option>').val(tz).text(client.language.timezoneName(tz)));");
    add('lib/report_plugins/loopalyzer.js',"'<h2>Loopalyzer&nbsp;&nbsp;<span id=\"loopalyzer-dateinfo\"></span></h2>'", "'<h2>' + translate('Loopalyzer') + '&nbsp;&nbsp;<span id=\"loopalyzer-dateinfo\"></span></h2>'");
    add('lib/report_plugins/glucosedistribution.js',"'Nathan, David M., et al. \"Translating the A1C assay into estimated average glucose values.\" <i>Diabetes care</i> 31.8 (2008): 1473-1478.'", "translate('Nathan et al. (2008): estimated average glucose from HbA1c')");
    add('lib/report_plugins/glucosedistribution.js',"'<tr><th>Out of Range RMS</th><th>GMI</th><th>Revised GMI</th></tr>'", "'<tr><th>' + translate('Out of Range RMS') + '</th><th>GMI</th><th>' + translate('Revised GMI') + '</th></tr>'");
    add('lib/admin_plugins/roles.js',"toTextContent(role.name)", "toTextContent(role._id ? role.name : client.translate(role.name))");
    add('lib/admin_plugins/roles.js',"? '[none]' : role.permissions.join(' ')", "? client.translate('[none]') : role.permissions.join(' ')");
    add('lib/admin_plugins/roles.js',": '[system default]'", ": client.translate('[system default]')");
    for(const file of ['lib/plugins/cannulaage.js','lib/plugins/batteryage.js'])add(file,"'n/a '","translate('n/a') + ' '");
    add('lib/admin_plugins/daterangedelete.js',"col + ': ERROR'", "translate(col) + ': ' + translate('ERROR')");
    add('lib/admin_plugins/daterangedelete.js',"col + ': ≥ '","translate(col) + ': ≥ '");
    add('lib/admin_plugins/daterangedelete.js',"col + ': 0'", "translate(col) + ': 0'");
    add('lib/admin_plugins/daterangedelete.js',"col + ': '", "translate(col) + ': '");
    add('lib/admin_plugins/daterangedelete.js','params: [count, col, collectionsProcessed, collections.length]', 'params: [count, translate(col), collectionsProcessed, collections.length]');
    add('lib/admin_plugins/daterangedelete.js','params: [col]', 'params: [translate(col)]');
    const plans=[...files.values()].map(({source,...item})=>{item.rows.sort((a,b)=>a.start-b.start);for(let i=1;i<item.rows.length;i++)assert(item.rows[i-1].start+item.rows[i-1].before.length<=item.rows[i].start,'No overlapping replacements');return item;});
    fs.writeFileSync(planFile,JSON.stringify(plans,null,2));console.log('Planned '+plans.reduce((n,p)=>n+p.rows.length,0)+' display-only expressions.');
  }else if(mode==='apply'){
    for(const item of JSON.parse(fs.readFileSync(planFile,'utf8'))){let source=fs.readFileSync(item.file,'utf8');assert.equal(sha(source),item.beforeSHA256,item.file);for(const row of item.rows.slice().reverse()){assert.equal(source.slice(row.start,row.start+row.before.length),row.before);source=source.slice(0,row.start)+row.after+source.slice(row.start+row.before.length);}fs.writeFileSync(item.file,source);}
  }else if(mode==='verify'){
    const plans=JSON.parse(fs.readFileSync(planFile,'utf8'));const addons=fs.existsSync('docs/japanese-ui-source-addon-plan.json')?JSON.parse(fs.readFileSync('docs/japanese-ui-source-addon-plan.json','utf8')):[];
    const files=[...new Set(plans.map(item=>item.file).concat(addons.map(item=>item.file)))];
    const results=files.map(file=>{reverse(file,fs.readFileSync(file,'utf8'));return {file,pass:true,displayExpressions:(plans.find(item=>item.file===file)?.rows.length||0)+addons.filter(item=>item.file===file).length,exactSource:true,astCheckedByOriginalPlan:Boolean(plans.find(item=>item.file===file)?.beforeAST)};});
    fs.writeFileSync('docs/verification/japanese/ui-source-invariants.json',JSON.stringify(results,null,2));console.log('PASS: '+results.length+' modules/templates reverse to the reviewed source; clinical computations and request parameters unchanged.');
  }else throw Error('Use plan, apply or verify');
}
