'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const planFile='docs/admin-dialog-plan.json',sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function reverse(file,source,options={}){
  if(!options.skipBrand&&fs.existsSync('docs/brand-source-plan.json'))source=require('./migrate-brand.cjs').reverse(file,source);
  if(!fs.existsSync(planFile))return source;
  for(const row of JSON.parse(fs.readFileSync(planFile,'utf8')).filter(row=>row.file===file).reverse()){
    assert.equal(source.split(row.after).length-1,row.count);source=source.split(row.after).join(row.before);assert.equal(sha(source),row.beforeSHA256);
  }
  return source;
}
module.exports={reverse};
if(require.main===module){
  if(process.argv[2]==='apply'){
    assert(!fs.existsSync(planFile));const rows=[];
    for(const file of ['lib/admin_plugins/roles.js','lib/admin_plugins/subjects.js']){
      let source=fs.readFileSync(file,'utf8');const newline=source.includes('\r\n')?'\r\n':'\n';
      const replacements=[
        [".css('margin-top', '10px')",".css('margin-top', '0.625rem')"],
        ['    , buttons: [','    , modal: true'+newline+'    , buttons: ['],
        [".css('box-shadow', '20px 20px 20px 0px black')",".css('box-shadow', 'var(--app-shadow-overlay)')"],
        ['style="width:300px"','style="width:18.75rem"'],
        [".css('background-color', '#0f0f0f')",".css('background-color', 'var(--app-surface)')"],
        [".css('background', '#040404')",".css('background', 'var(--app-surface-sunken)')"],
        [".css('width', '100px')",".css('width', '6.25rem')"],
        [".css('width', '150px')",".css('width', '9.375rem')"]
      ];
      if(file.endsWith('roles.js'))replacements.push(['title="Delete this role" class="titletranslate"','title="\' + client.translate(\'Delete this role\') + \'" class="titletranslate"']);
      if(file.endsWith('subjects.js'))replacements.push(["subject.roles ? subject.roles.join(', ') : '[none]'","subject.roles ? subject.roles.join(', ') : client.translate('[none]')"]);
      for(const [before,after]of replacements){const count=source.split(before).length-1;assert(count>0,file+': '+before);rows.push({file,before,after,count,beforeSHA256:sha(source),reason:'Reviewed admin appearance, modal semantics and dynamic label only; role permissions, subject credentials and all save/validation/request handlers unchanged'});source=source.split(before).join(after);}
      fs.writeFileSync(file,source);
    }
    fs.writeFileSync(planFile,JSON.stringify(rows,null,2));
  }else if(process.argv[2]==='verify'){
    for(const file of ['lib/admin_plugins/roles.js','lib/admin_plugins/subjects.js'])reverse(file,fs.readFileSync(file,'utf8'));
    console.log('PASS: reviewed admin display expressions reverse exactly; authorization and payload handling unchanged.');
  }else throw Error('Use apply or verify');
}
