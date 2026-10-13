'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),yaml=require('js-yaml');
const planFile='docs/company-api-contact-plan.json';
const parse=(file,source)=>file.endsWith('.yaml')?yaml.load(source):JSON.parse(source);
const sha=object=>crypto.createHash('sha256').update(JSON.stringify(object)).digest('hex');
const contact={name:'株式会社世良',url:'https://sera-inc.co.jp',email:'info@sera-inc.co.jp'};
if(process.argv[2]==='plan'){
  assert(!fs.existsSync(planFile),'Keep original contact plan');const rows=['lib/server/swagger.json','lib/server/swagger.yaml','lib/api3/swagger.yaml'].map(file=>{const source=fs.readFileSync(file,'utf8'),object=parse(file,source);return {file,beforeSemanticSHA256:sha(object),original:object.info.contact??null,replacement:contact};});fs.writeFileSync(planFile,JSON.stringify(rows,null,2));
}else if(process.argv[2]==='apply'||process.argv[2]==='verify'){
  for(const row of JSON.parse(fs.readFileSync(planFile,'utf8'))){let object=parse(row.file,fs.readFileSync(row.file,'utf8'));if(process.argv[2]==='verify')object=require('./migrate-api-japanese.cjs').reverse(row.file,object);
    if(process.argv[2]==='apply'){assert.equal(sha(object),row.beforeSemanticSHA256);object.info.contact=row.replacement;fs.writeFileSync(row.file,row.file.endsWith('.yaml')?yaml.dump(object,{lineWidth:-1,noRefs:true}):JSON.stringify(object,null,2)+'\n');}
    else{assert.deepEqual(object.info.contact,row.replacement);if(row.original===null)delete object.info.contact;else object.info.contact=row.original;assert.equal(sha(object),row.beforeSemanticSHA256,'Every existing API operation/schema/version/path/description remains identical');}}
  console.log('PASS: API JSON/YAML contact fields only; entire specifications reverse to original semantic hashes.');
}else throw Error('Use plan, apply or verify');
