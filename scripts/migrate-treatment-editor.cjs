'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file='lib/report_plugins/treatments.js',planFile='docs/treatment-editor-plan.json';
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function reverse(path,source){
  if(path!==file||!fs.existsSync(planFile))return source;
  for(const row of JSON.parse(fs.readFileSync(planFile,'utf8')).slice().reverse()){
    assert.equal(source.split(row.after).length-1,1);source=source.replace(row.after,row.before);assert.equal(sha(source),row.beforeSHA256);
  }
  return source;
}
module.exports={reverse};
if(require.main===module){
  if(process.argv[2]==='apply'){
    assert(!fs.existsSync(planFile),'Keep the reviewed treatment editor plan');let source=fs.readFileSync(file,'utf8');const rows=[];
    const newline=source.includes('\r\n')?'\r\n':'\n';
    for(const [before,after,reason]of [
      ['height: 600','height: 600'+newline+'      , modal: true','Use the existing jQuery UI modal keyboard focus/escape behavior while editing; save values and handler unchanged'],
      [".css('box-shadow', '20px 20px 20px 0px black')",".css('box-shadow', 'var(--app-shadow-overlay)')",'Resolve the editor shadow to the DDS semantic overlay token']
    ]){assert.equal(source.split(before).length-1,1);rows.push({file,before,after,reason,beforeSHA256:sha(source)});source=source.replace(before,after);}
    fs.writeFileSync(planFile,JSON.stringify(rows,null,2));fs.writeFileSync(file,source);
  }else if(process.argv[2]==='verify'){reverse(file,fs.readFileSync(file,'utf8'));console.log('PASS: only the recorded modal behavior and semantic shadow change in the treatment editor source.');}
  else throw Error('Use apply or verify');
}
