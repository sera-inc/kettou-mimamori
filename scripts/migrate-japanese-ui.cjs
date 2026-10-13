'use strict';
const fs = require('node:fs');const assert = require('node:assert/strict');const crypto = require('node:crypto');
const planFiles = ['docs/japanese-ui-dictionary-plan.json', 'docs/japanese-ui-dictionary-additional-plan.json', 'docs/japanese-populated-dictionary-plan.json', 'docs/japanese-event-dictionary-plan.json', 'docs/japanese-save-dictionary-plan.json', 'docs/japanese-audio-dictionary-plan.json'];
const planFile = process.argv[3] || planFiles[0];
const jaFile = 'translations/ja_JP.json', enFile = 'translations/en/en.json';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const slots = value => (value.match(/%[1-9]\d*|\{\d+\}/g) || []).sort();
function reverse(ja) {
  const en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
  let count = 0;
  for (const file of planFiles.slice().reverse().filter(file => fs.existsSync(file))) {
  const plan = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const row of plan.rows) {
    assert.equal(ja[row.key], row.replacement, row.key);assert.equal(en[row.key], row.english, row.key);
    assert.deepEqual(slots(row.replacement), slots(row.english), row.key);
    if (row.originalJapanese === null) delete ja[row.key];else ja[row.key] = row.originalJapanese;
    if (row.originalEnglish === null) delete en[row.key];else en[row.key] = row.originalEnglish;
  }
  assert.deepEqual(Object.keys(ja), plan.japaneseKeys);
  count += plan.rows.length;
  }
  const upstream = JSON.parse(require('node:child_process').execFileSync('git', ['show', '92d0834219aa771b5837dbcbf1baeb839a200cf6:' + enFile], {encoding:'utf8'}));
  assert.deepEqual(en, upstream, 'Existing English values and all protocol keys must match upstream');
  return count;
}
module.exports = {reverse};
if (require.main === module) {
  const mode = process.argv[2];
  assert(planFiles.includes(planFile), 'Use an explicitly named UI translation plan');
  if (mode === 'plan') {
    assert(!fs.existsSync(planFile), 'Keep the reviewed UI dictionary plan');
    const jaSource = fs.readFileSync(jaFile,'utf8'), enSource = fs.readFileSync(enFile,'utf8');
    const ja = JSON.parse(jaSource), en = JSON.parse(enSource);
    const values = JSON.parse(fs.readFileSync(process.argv[4] || 'docs/japanese-ui-translations.json','utf8'));
    const rows = Object.entries(values).map(([key, replacement]) => {
      const english = en[key] || key;assert.deepEqual(slots(replacement), slots(english), key);
      assert(/[ぁ-んァ-ヶ一-龯]/.test(replacement) || ['25%', '75%'].includes(key), key);
      return {key, replacement, english, originalJapanese: ja[key] ?? null, originalEnglish: en[key] ?? null};
    });
    fs.writeFileSync(planFile, JSON.stringify({japaneseBeforeSHA256:sha(jaSource),englishBeforeSHA256:sha(enSource),japaneseKeys:Object.keys(ja),scope:'Add translations for missing UI keys and revise identified mixed-language labels; existing keys, parameters and English fallback preserved',rows},null,2));
    console.log('Planned '+rows.length+' UI translations.');
  } else if (mode === 'apply') {
    const plan = JSON.parse(fs.readFileSync(planFile,'utf8'));
    const jaSource = fs.readFileSync(jaFile,'utf8'), enSource = fs.readFileSync(enFile,'utf8');
    assert.equal(sha(jaSource),plan.japaneseBeforeSHA256);assert.equal(sha(enSource),plan.englishBeforeSHA256);
    const ja=JSON.parse(jaSource),en=JSON.parse(enSource);
    for(const row of plan.rows){ja[row.key]=row.replacement;en[row.key]=row.english;}
    fs.writeFileSync(jaFile,JSON.stringify(ja,null,2)+'\n');fs.writeFileSync(enFile,JSON.stringify(en,null,2)+'\n');
    console.log('Applied reviewed UI translations.');
  } else if (mode === 'verify') {
    const count=reverse(JSON.parse(fs.readFileSync(jaFile,'utf8')));console.log('PASS: '+count+' translations reverse exactly; original English preserved.');
  } else throw Error('Use plan, apply or verify');
}
