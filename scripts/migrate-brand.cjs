'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const planFile='docs/brand-source-plan.json',sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function reverse(file,source){source=require('./migrate-title-japanese.cjs').reverse(file,source);source=require('./migrate-clock-auth.cjs').reverse(file,source);if(fs.existsSync('docs/japanese-clock-source-plan.json'))source=require('./migrate-clock-japanese.cjs').reverse(file,source);if(!fs.existsSync(planFile))return source;const rows=JSON.parse(fs.readFileSync(planFile)).filter(r=>r.file===file);if(!rows.length||sha(source)===rows[0].beforeSHA256)return source;for(const row of rows.reverse()){assert.equal(source.split(row.after).length-1,row.count);source=source.split(row.after).join(row.before);assert.equal(sha(source),row.beforeSHA256);}return source;}
module.exports={reverse};
if(require.main===module){
  if(process.argv[2]==='verify'){for(const file of new Set(JSON.parse(fs.readFileSync(planFile)).map(r=>r.file)))reverse(file,fs.readFileSync(file,'utf8'));console.log('PASS: brand images/icon URLs and decorative markup reverse to recorded full source; calculations, payloads and click handlers unchanged.');}
  else if(process.argv[2]==='apply'){
    assert(!fs.existsSync(planFile));const rows=[];
    function change(file,before,after){let s=fs.readFileSync(file,'utf8');const count=s.split(before).length-1;assert(count>0,file);rows.push({file,before,after,count,beforeSHA256:sha(s)});fs.writeFileSync(file,s.split(before).join(after));}
    const iconMap={'16157c38971f':'plus','54a3ea6e0868':'trash-empty','ad52c4484172':'copy','2e21e79daf47':'check','2d739c3dd5af':'edit','5ced0cad64d1':'up'};
    for(const file of ['lib/profile/profileeditor.js','lib/food/food.js','lib/report_plugins/treatments.js','lib/admin_plugins/roles.js','lib/admin_plugins/subjects.js']){
      for(const before of new Set(fs.readFileSync(file,'utf8').match(/data:image\/png;base64,[a-zA-Z0-9+/=]+/g)||[])){const prefix=sha(before).slice(0,12),name=iconMap[prefix];assert(name,'Reviewed image mapping missing');change(file,before,'/brand/icons/'+name+'.svg');}
    }
    change('views/partials/toolbar.ejs','<a class="app-brand" href="/">','<a class="app-brand" href="/"><img class="app-brand-mark" src="/brand/mark.svg" width="32" height="32" alt="" aria-hidden="true">');
    change('views/index.html','<details class="app-service-license">','<img class="app-care-illustration" src="/brand/care-connection.png" width="1774" height="887" alt="血糖記録を確認する人と医療スタッフのイラスト" loading="lazy">\n        <details class="app-service-license">');
    change('lib/client/clock-client.js','<img alt="arrow">','<img alt="血糖値の変化方向">');
    change('static/design-system/index.css',"@import './service.css';","@import './service.css';\n@import './icons.css';\n@import './brand.css';");
    change('views/service-worker.js',"    '/images/logo2.png'","    '/images/logo2.png',\n    '/brand/mark.svg',\n    '/brand/icon-192.png',\n    '/brand/icon-512.png',\n    '/brand/care-connection.png',\n    '/design-system/icons.css',\n    '/design-system/brand.css'");
    fs.writeFileSync(planFile,JSON.stringify(rows,null,2));
  }else throw Error('Use apply or verify');
}
