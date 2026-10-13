'use strict';
const fs=require('fs');
const glob=require('glob');
const postcss=require('postcss');
const {tokenFor}=require('./design-token-migration.cjs');
const planPath='docs/design-template-plan.json';
if (process.argv[2]==='plan') {
  const regions=[];
  const rows=[];
  const geometry=new Map();
  for(const file of [...glob.sync('views/*.html'),...glob.sync('views/partials/*.ejs')].map(file=>file.replace(/\\/g,'/'))) {
    const text=fs.readFileSync(file,'utf8');
    const matches=[...text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi),...text.matchAll(/\bstyle=("|')([\s\S]*?)\1/gi)];
    for(const match of matches) {
      const block=match[0].startsWith('<style');
      const original=block?match[1]:match[2];
      const offset=match.index+(block?match[0].indexOf('>')+1:match[0].indexOf('=')+2);
      const root=postcss.parse(block?original:'.inline{'+original+'}');
      root.walkDecls(decl=>{
        const mapping=tokenFor(decl);
        if (!mapping) return;
        rows.push({file,selector:decl.parent.selector,property:decl.prop,original:decl.value,...mapping});
        for(const token of mapping.tokens||[]) if(token.value) geometry.set(token.target,token.value);
        decl.value=mapping.replacement;
      });
      const replacement=block?root.toString():root.first.nodes.map(decl=>decl.toString()).join(';');
      if(original!==replacement) regions.push({file,offset,original,replacement});
    }
  }
  fs.writeFileSync(planPath,JSON.stringify(regions,null,2));
  fs.writeFileSync('docs/template-mapping.md','# テンプレート内スタイルの対応表\n\nユーザーから委任された選定。イベント、ID、入力値は維持。\n\n|ファイル|項目|元の値|対応|\n|---|---|---|---|\n'+rows.map(row=>`|${row.file}|${row.selector} ${row.property}|\`${row.original}\`|${row.target} ※統合|`).join('\n')+'\n');
  fs.writeFileSync('static/design-system/template-geometry.css',':root{\n'+[...geometry].map(([key,value])=>`  ${key}: ${value};`).join('\n')+'\n}\n');
  console.log(`${rows.length} declarations in ${regions.length} template regions.`);
} else if(process.argv[2]==='apply') {
  const file=process.argv[3];
  const regions=JSON.parse(fs.readFileSync(planPath,'utf8')).filter(row=>row.file===file).sort((a,b)=>b.offset-a.offset);
  if(!regions.length) throw new Error('No reviewed regions for '+file);
  let text=fs.readFileSync(file,'utf8');
  for(const region of regions) {
    if(text.slice(region.offset,region.offset+region.original.length)!==region.original) throw new Error('Reviewed source changed: '+file);
    text=text.slice(0,region.offset)+region.replacement+text.slice(region.offset+region.original.length);
  }
  fs.writeFileSync(file,text);
  console.log('Applied reviewed regions to '+file);
} else throw new Error('Use plan or apply <one template>');
