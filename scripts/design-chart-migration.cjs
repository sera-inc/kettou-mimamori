'use strict';
const fs=require('fs');
const acorn=require('acorn');
const files=['lib/client/chart.js','lib/client/renderer.js','lib/client/index.js'];
const colors={white:'--app-text',black:'--app-text',grey:'--app-text-muted',gray:'--app-text-muted',lightgray:'--app-border',orange:'--app-warning-text',yellow:'--app-warning-text',red:'--app-danger-text','#4cff00':'--app-success-text','#0099ff':'--app-primary','#777':'--app-border-strong','#111':'--app-primary-bg',Violet:'--app-chart-exercise',Salmon:'--app-chart-note'};
const planPath='docs/design-chart-plan.json';
if(process.argv[2]==='plan') {
  const rows=[];
  for(const file of files) {
    const text=fs.readFileSync(file,'utf8');
    const ast=acorn.parse(text,{ecmaVersion:'latest',locations:true});
    function walk(node) {
      if(!node||typeof node!=='object') return;
      if(node.type==='Literal'&&colors[node.value]) rows.push({file,line:node.loc.start.line,start:node.start,end:node.end,original:text.slice(node.start,node.end),target:colors[node.value],replacement:JSON.stringify('var('+colors[node.value]+')')});
      for(const [key,value] of Object.entries(node)) if(key!=='loc') {if(Array.isArray(value)) value.forEach(walk);else if(value&&typeof value==='object') walk(value);}
    }
    walk(ast);
  }
  fs.writeFileSync(planPath,JSON.stringify(rows,null,2));
  fs.writeFileSync('docs/chart-mapping.md','# グラフの表示色対応表\n\n座標・閾値・時刻・投与量の計算を変更せず、色のリテラルだけを変更。運動・メモの分類は専用Layer 2トークンで維持。\n\n|ファイル・行|元の値|対応|\n|---|---|---|\n'+rows.map(row=>`|${row.file}:${row.line}|${row.original}|${row.target}|`).join('\n')+'\n');
  console.log('Reviewed chart colors: '+rows.length);
} else if(process.argv[2]==='apply') {
  const file=process.argv[3];
  if(!files.includes(file)) throw new Error('One known client file required.');
  const rows=JSON.parse(fs.readFileSync(planPath,'utf8')).filter(row=>row.file===file).sort((a,b)=>b.start-a.start);
  let text=fs.readFileSync(file,'utf8');
  for(const row of rows) {
    if(text.slice(row.start,row.end)!==row.original) throw new Error('Reviewed source changed.');
    text=text.slice(0,row.start)+row.replacement+text.slice(row.end);
  }
  acorn.parse(text,{ecmaVersion:'latest'});
  fs.writeFileSync(file,text);
  console.log('Applied '+rows.length+' chart colors to '+file);
} else throw new Error('Use plan or apply <one client file>');
