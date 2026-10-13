'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const planFile='docs/japanese-populated-source-plan.json';const addonFile='docs/japanese-ui-source-addon-plan.json';
const sha=source=>crypto.createHash('sha256').update(source).digest('hex');
if(process.argv[2]==='plan'){
  assert(!fs.existsSync(planFile),'Keep the original populated UI plan');const files=new Map(),rows=[];
  function add(file,before,after){let source=files.has(file)?files.get(file):fs.readFileSync(file,'utf8');if(source.includes('\r\n')){before=before.replace(/(?<!\r)\n/g,'\r\n');after=after.replace(/(?<!\r)\n/g,'\r\n');}assert.equal(source.split(before).length-1,1,file);rows.push({file,beforeSourceSHA256:sha(source),before,after,reason:'Localize populated report labels only; original event/measurement identifiers, raw/calibration numbers, calculations and timezone values remain unchanged'});files.set(file,source.replace(before,after));}
  const cal='lib/report_plugins/calibrations.js';
  add(cal,"var translate = require('../language')().translate;\n",'');
  add(cal,'var report_plugins = Nightscout.report_plugins;','var report_plugins = Nightscout.report_plugins;\n  var translate = Nightscout.client.translate;');
  add(cal,"'<b style=\"padding-left:2em\">MBG</b>: '","'<b style=\"padding-left:2em\">' + translate('MBG') + '</b>: '");
  add(cal,"' Raw: '","' ' + translate('Raw') + ': '");
  add(cal,"'<b style=\"padding-left:4em\">CAL</b>: '","'<b style=\"padding-left:4em\">' + translate('CAL') + '</b>: '");
  add(cal,"' Scale: '","' ' + translate('Calibration scale') + ': '");
  add(cal,"' Intercept: '","' ' + translate('Calibration intercept') + ': '");
  add(cal,"' Slope: '","' ' + translate('Calibration slope') + ': '");
  add('lib/report_plugins/profiles.js','textAsHtml(record.timezone)',"textAsHtml(client.language && typeof client.language.timezoneName === 'function' ? client.language.timezoneName(record.timezone) : record.timezone)");
  fs.writeFileSync(planFile,JSON.stringify(rows,null,2));console.log('Planned '+rows.length+' populated display expressions.');
}else if(process.argv[2]==='apply'){
  const rows=JSON.parse(fs.readFileSync(planFile,'utf8')),addons=JSON.parse(fs.readFileSync(addonFile,'utf8'));assert(!addons.some(addon=>addon.file==='lib/report_plugins/calibrations.js'),'Apply once');
  for(const row of rows){const source=fs.readFileSync(row.file,'utf8');assert.equal(sha(source),row.beforeSourceSHA256,row.file);fs.writeFileSync(row.file,source.replace(row.before,row.after));}
  fs.writeFileSync(addonFile,JSON.stringify(addons.concat(rows),null,2));console.log('Applied reviewed populated display expressions.');
}else throw Error('Use plan or apply');
