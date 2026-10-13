'use strict';
const fs=require('node:fs');const assert=require('node:assert/strict');const {execFileSync}=require('node:child_process');const acorn=require('acorn');
const baseline='92d0834219aa771b5837dbcbf1baeb839a200cf6';
// Explicitly reverse only reviewed appearance changes and the save-handler
// exclusion. An AST comparison then proves that calculations, field reads,
// validation, confirmations and network payloads are unchanged in these files.
const plans={
 'lib/client/careportal.js':[["button:not([data-drawer-close])","button",1]],
 'lib/client/boluscalc.js':[
  ["button:not([data-drawer-close])","button",1],
  ["css('background-color', 'var(--app-danger-bg)')","css('background-color', 'red')",5],
  ["css('background-color', 'var(--app-info-bg)')","css('background-color', 'blue')",1],
  ["css('box-shadow', 'var(--app-shadow-overlay)')","css('box-shadow', '20px 20px 20px 0px black')",1]
 ],
 'lib/client/adminnotifiesclient.js':[["css('color','var(--app-danger-text)')","css('color','red')",1]]
};
function ast(source){return JSON.parse(JSON.stringify(acorn.parse(source,{ecmaVersion:'latest',sourceType:'script'}),(key,value)=>['start','end','raw'].includes(key)?undefined:value));}
const results=[];
for(const [file,replacements] of Object.entries(plans)){
 let current=fs.readFileSync(file,'utf8');
 for(const [after,before,count] of replacements){assert.equal(current.split(after).length-1,count,file+': reviewed change count');current=current.split(after).join(before);}
 const original=execFileSync('git',['show',baseline+':'+file],{encoding:'utf8',maxBuffer:4*1024*1024});
 assert.deepEqual(ast(current),ast(original),file+': clinical and protocol AST must remain unchanged');
 results.push({file,pass:true,scope:'Complete AST matches upstream after reversing only reviewed color/shadow literals and close-button save exclusion'});
}
fs.writeFileSync('docs/verification/drawer-invariants.json',JSON.stringify({baseline,results},null,2));console.log(JSON.stringify(results,null,2));
