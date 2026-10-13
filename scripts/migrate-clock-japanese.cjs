'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const file='lib/client/clock-client.js',plan='docs/japanese-clock-source-plan.json',sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function reverse(filename,s){if(filename!==file||!fs.existsSync(plan))return s;const rows=JSON.parse(fs.readFileSync(plan));if(sha(s)===rows[0].beforeSHA256)return s;s=require('./migrate-clock-auth.cjs').reverse(filename,s);for(const row of rows.slice().reverse()){assert.equal(s.split(row.after).length-1,1);s=s.replace(row.after,row.before);assert.equal(sha(s),row.beforeSHA256);}return s;}
module.exports={reverse};
if(require.main===module){
  if(process.argv[2]==='verify'){reverse(file,fs.readFileSync(file,'utf8'));console.log('PASS: clock elapsed text reverses exactly; stale threshold and elapsed time calculation unchanged.');}
  else if(process.argv[2]==='apply'){
    assert(!fs.existsSync(plan));let s=fs.readFileSync(file,'utf8');const rows=[];
    for(const [before,after]of [
      ['    let staleTimeText;',"    let staleTimeText;\n    const japanese = String(client.settings.language || '').startsWith('ja');"],
      ["staleTimeText = 'Just now';","staleTimeText = japanese ? 'たった今' : 'Just now';"],
      ["staleTimeText = '1 minute ago';","staleTimeText = japanese ? '1分前' : '1 minute ago';"],
      ["staleTimeText = elapsedMins + ' minutes ago';","staleTimeText = elapsedMins + (japanese ? '分前' : ' minutes ago');"]
    ]){const replacement=s.includes('\r\n')?after.replace(/\n/g,'\r\n'):after;assert.equal(s.split(before).length-1,1);rows.push({before,after:replacement,beforeSHA256:sha(s)});s=s.replace(before,replacement);}
    fs.writeFileSync(file,s);fs.writeFileSync(plan,JSON.stringify(rows,null,2));
  }else throw Error('Use apply or verify');
}
