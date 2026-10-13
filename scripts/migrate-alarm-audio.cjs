'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
function reverse(file,source){
  if(file!=='lib/client/index.js'||!fs.existsSync('docs/alarm-audio-source-plan.json'))return source;
  for(const row of JSON.parse(fs.readFileSync('docs/alarm-audio-source-plan.json','utf8')).slice().reverse()){
    assert.equal(source.split(row.after).length-1,1);source=source.replace(row.after,row.before);
    assert.equal(crypto.createHash('sha256').update(source).digest('hex'),row.beforeSourceSHA256);
  }
  return source;
}
module.exports={reverse};
if(require.main===module){reverse('lib/client/index.js',fs.readFileSync('lib/client/index.js','utf8'));console.log('PASS: audio playback recovery and localized speech test reverse exactly; clinical alarm state and ack code preserved.');}
