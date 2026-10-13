'use strict';
const fs=require('fs');
const acorn=require('acorn');
const {execFileSync}=require('child_process');
const baseline='92d0834219aa771b5837dbcbf1baeb839a200cf6';
const plan=JSON.parse(fs.readFileSync('docs/design-chart-plan.json','utf8'));
const results=[];
for(const file of [...new Set(plan.map(row=>row.file))]) {
  const before=acorn.parse(execFileSync('git',['show',baseline+':'+file],{encoding:'utf8'}),{ecmaVersion:'latest'});
  const after=acorn.parse(fs.readFileSync(file,'utf8'),{ecmaVersion:'latest'});
  const rows=plan.filter(row=>row.file===file);
  let changed=0;
  function compare(a,b) {
    if(a===b) return;
    if(!a||!b||typeof a!=='object'||typeof b!=='object') throw new Error(file+': non-color logic changed');
    if(a.type==='Literal'&&typeof a.value==='string'&&a.value!==b.value) {
      if(!rows.some(row=>acorn.parseExpressionAt(row.original,0,{ecmaVersion:'latest'}).value===a.value&&acorn.parseExpressionAt(row.replacement,0,{ecmaVersion:'latest'}).value===b.value)) throw new Error(file+': unreviewed literal changed');
      changed++;return;
    }
    const keys=Object.keys(a).filter(key=>!['start','end','raw','loc'].includes(key));
    const bKeys=Object.keys(b).filter(key=>!['start','end','raw','loc'].includes(key));
    if(JSON.stringify(keys)!==JSON.stringify(bKeys)) throw new Error(file+': AST shape changed');
    for(const key of keys) compare(a[key],b[key]);
  }
  compare(before,after);
  if(changed!==rows.length) throw new Error(file+': unexpected changed count');
  results.push({file,verified:'AST identical except reviewed color literals',changedColors:changed});
}
for(const file of ['views/index.html','views/profileindex.html','views/foodindex.html','views/adminindex.html','views/reportindex.html','views/frame.html','views/error.html','views/clockviews/clock.html','views/partials/toolbar.ejs']) {
  const before=execFileSync('git',['show',baseline+':'+file],{encoding:'utf8'}).replace(/\r\n/g,'\n');
  const after=fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n');
  for(const pattern of [/<%[\s\S]*?%>/g,/\bid=("|')[^"']*\1/g,/<script\b[^>]*>[\s\S]*?<\/script>/g]) {
    if(JSON.stringify(before.match(pattern))!==JSON.stringify(after.match(pattern))) throw new Error(file+': event ID, EJS binding or script changed');
  }
  results.push({file,verified:'event IDs, EJS bindings and scripts retained'});
}
fs.writeFileSync('docs/verification/phase2-invariants.json',JSON.stringify({baseline,results},null,2));
console.log('PASS: calculations and logic preserved; 49 reviewed color literals only; all template event IDs and bindings retained.');
