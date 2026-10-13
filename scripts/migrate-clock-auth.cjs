'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const plan='docs/clock-auth-source-plan.json',sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function reverse(file,source){if(!fs.existsSync(plan))return source;const rows=JSON.parse(fs.readFileSync(plan)).filter(row=>row.file===file);if(!rows.length||sha(source)===rows[0].beforeSHA256)return source;for(const row of rows.reverse()){assert.equal(source.split(row.after).length-1,1);source=source.replace(row.after,row.before);assert.equal(sha(source),row.beforeSHA256);}return source;}
module.exports={reverse};
if(require.main===module){
  if(process.argv[2]==='verify'){for(const file of new Set(JSON.parse(fs.readFileSync(plan)).map(row=>row.file)))reverse(file,fs.readFileSync(file,'utf8'));console.log('PASS: only clock stored-secret decoding changes; prior render and request paths reverse exactly.');}
  else if(process.argv[2]==='apply'){
    assert(!fs.existsSync(plan));const rows=[];
    const helper=`client.readApiSecret = function readApiSecret () {
  var stored = typeof localStorage !== 'undefined' ? localStorage.getItem('apisecrethash') : '';
  if (!stored) return '';
  // Browser storage serializes strings as JSON; legacy raw hashes remain valid.
  try {
    var parsed = JSON.parse(stored);
    return typeof parsed === 'string' ? parsed : stored;
  } catch (err) {
    return stored;
  }
};

client.query = function query () {`;
    for(const [file,before,after]of [['lib/client/clock-client.js','client.query = function query () {',helper],['lib/client/clock-client.js',"  var secret = localStorage.getItem('apisecrethash');","  var secret = client.readApiSecret();"],['views/clockviews/clock.html',"    var secret = typeof localStorage !== 'undefined' ? localStorage.getItem('apisecrethash') : '';","    var secret = window.Nightscout.client.readApiSecret();"]]){
      let source=fs.readFileSync(file,'utf8');const replacement=source.includes('\r\n')?after.replace(/\n/g,'\r\n'):after;assert.equal(source.split(before).length-1,1);rows.push({file,before,after:replacement,beforeSHA256:sha(source)});fs.writeFileSync(file,source.replace(before,replacement));
    }
    fs.writeFileSync(plan,JSON.stringify(rows,null,2));
  }else throw Error('Use apply or verify');
}
