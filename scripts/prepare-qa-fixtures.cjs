'use strict';
const fs=require('fs');
if (process.cwd() !== '/opt/app') throw new Error('Run only in the disposable QA container.');
for (const source of ['aaps','loop','phone-uploader','trio']) {
  const file='tests/fixtures/captured/'+source+'/pills-golden.json';
  const value=fs.readFileSync(file,'utf8');
  fs.writeFileSync(file,value.replace(/\r\n/g,'\n'));
  console.log(source+': normalized Git text line endings; fixture values unchanged');
}
