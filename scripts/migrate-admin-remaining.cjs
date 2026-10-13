'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const planFile='docs/admin-remaining-plan.json';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function reverse(file,source){
  if(!fs.existsSync(planFile))return source;
  for(const row of JSON.parse(fs.readFileSync(planFile)).filter(r=>r.file===file).reverse()){
    const positions=[];let start=0;while((start=source.indexOf(row.after,start))!==-1){positions.push(start);start+=row.after.length;}
    assert(positions.length>=row.count&&positions.length<=12);
    const matches=[];
    function choose(index,picked){
      if(picked.length===row.count){let candidate=source;for(const position of picked.slice().reverse())candidate=candidate.slice(0,position)+row.before+candidate.slice(position+row.after.length);if(sha(candidate)===row.beforeSHA256)matches.push(candidate);return;}
      for(let i=index;i<positions.length;i++)choose(i+1,picked.concat(positions[i]));
    }
    // Two original inks (gray and #666) share the muted token. The frozen full
    // source digest identifies exactly which occurrences belonged to each row.
    choose(0,[]);assert.equal(matches.length,1);source=matches[0];
  }
  return source;
}
module.exports={reverse};
if(require.main===module){
  const mode=process.argv[2],component=process.argv[3];
  if(mode==='verify'){
    for(const file of new Set(JSON.parse(fs.readFileSync(planFile)).map(r=>r.file)))reverse(file,fs.readFileSync(file,'utf8'));
    console.log('PASS: admin preview/table paint and spacing reverse exactly; date filters, counts and deletion handlers unchanged.');
  }else if(mode==='apply'){
    assert(['futureitems','daterangedelete'].includes(component));const file='lib/admin_plugins/'+component+'.js';
    const rows=fs.existsSync(planFile)?JSON.parse(fs.readFileSync(planFile)):[];assert(!rows.some(r=>r.file===file));let source=fs.readFileSync(file,'utf8');
    const replacements=component==='futureitems'?[
      [".css('background-color', '#0f0f0f')",".css('background-color', 'var(--app-surface)')"],
      [".css('background', '#040404')",".css('background', 'var(--app-surface-sunken)')"],
      ...[['80px','5rem'],['150px','9.375rem'],['50px','3.125rem'],['300px','18.75rem']].map(([before,after])=>[".css('width', '"+before+"')",".css('width', '"+after+"')"]),
      [".css('margin-top', '10px')",".css('margin-top', '0.625rem')"]
    ]:[
      ['margin-top: 10px','margin-top: 0.625rem'],['margin-right: 10px','margin-right: 0.625rem'],['margin-left: 10px','margin-left: 0.625rem'],['margin-top: 5px','margin-top: 0.3125rem'],
      ['color: #666','color: var(--app-text-muted)'],
      ...[['#666','--app-text-muted'],['red','--app-danger-text'],['orange','--app-warning-text'],['gray','--app-text-muted'],['green','--app-success-text']].map(([before,after])=>["color: '"+before+"'","color: 'var("+after+")'"])
    ];
    fs.appendFileSync('docs/mapping.md','\n\n### 管理画面 '+component+' の残存表示値\n\nユーザーから委任されたトークン選定に基づき、下記の同等な表面・状態色とrem換算を適用する。期間境界、件数、削除条件、権限、通信には変更を加えない。\n\n| 元の値 | 適用する表示値 |\n| --- | --- |\n'+replacements.map(([before,after])=>'| `'+before+'` | `'+after+'` |').join('\n')+'\n');
    for(const [before,after]of replacements){const count=source.split(before).length-1;assert(count>0,file+': '+before);rows.push({file,before,after,count,beforeSHA256:sha(source)});source=source.split(before).join(after);}
    fs.writeFileSync(file,source);fs.writeFileSync(planFile,JSON.stringify(rows,null,2));
  }else throw Error('Use apply <futureitems|daterangedelete> or verify');
}
