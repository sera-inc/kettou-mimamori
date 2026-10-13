'use strict';
const fs = require('node:fs');const assert = require('node:assert/strict');const crypto = require('node:crypto');
const file = 'translations/ja_JP.json';
const inventory = JSON.parse(fs.readFileSync('docs/verification/japanese/dictionary-inventory.json', 'utf8'));
const groups = JSON.parse(fs.readFileSync('docs/japanese-translation-groups.json', 'utf8'));
const planFile = 'docs/japanese-dictionary-plan.json';
const additionalPlanFile = 'docs/japanese-dictionary-additional-plan.json';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const slots = value => (value.match(/%[1-9]\d*|\{\d+\}/g) || []).sort();
const mode = process.argv[2];
if (mode === 'plan-additional') {
  assert(!fs.existsSync(additionalPlanFile), 'Keep the additional reviewed plan');
  const source = fs.readFileSync(file, 'utf8'), dictionary = JSON.parse(source);
  const values = JSON.parse(fs.readFileSync('docs/japanese-additional-translations.json', 'utf8'));
  const rows = Object.entries(values).map(([key, replacement]) => {assert(Object.hasOwn(dictionary, key));assert(/[ぁ-んァ-ヶ一-龯]/.test(replacement));assert.deepEqual(slots(replacement), slots(dictionary[key]), key);return {key, original: dictionary[key], replacement};});
  fs.writeFileSync(additionalPlanFile, JSON.stringify({file, beforeSHA256: sha(source), originalKeys: Object.keys(dictionary), scope: 'Direction names, voice responses and two partly English help strings; exact dictionary keys/placeholders and all clinical values remain', rows}, null, 2));
  console.log('Planned ' + rows.length + ' additional translations.');
} else if (mode === 'plan') {
  assert(!fs.existsSync(planFile), 'Keep the original reviewed plan');
  const source = fs.readFileSync(file, 'utf8'), dictionary = JSON.parse(source), rows = [];
  for (const group of groups) {
    assert.equal(group.start, rows.length, 'Every inventory row must have exactly one translation');
    for (const replacement of group.values) {
      const [key, original] = inventory.untranslated[rows.length];
      assert.equal(dictionary[key], original, key + ' original translation');
      assert(/[ぁ-んァ-ヶ一-龯]/.test(replacement), key + ' must contain Japanese');
      assert.deepEqual(slots(replacement), slots(original), key + ' placeholders must be preserved');
      rows.push({key, original, replacement});
    }
  }
  assert.equal(rows.length, inventory.untranslated.length);
  fs.writeFileSync(planFile, JSON.stringify({file, beforeSHA256: sha(source), originalKeys: Object.keys(dictionary), scope: 'Japanese dictionary values only; exact keys, placeholders, original clinical conditions/counts/units and protocol values preserved. Product/source proper nouns and internationally used units remain where needed.', rows}, null, 2));
  console.log('Planned ' + rows.length + ' exact Japanese dictionary translations.');
} else {
  const plan = JSON.parse(fs.readFileSync(mode === 'apply-additional' ? additionalPlanFile : planFile, 'utf8'));
  if (mode === 'apply' || mode === 'apply-additional') {
    const source = fs.readFileSync(file, 'utf8');assert.equal(sha(source), plan.beforeSHA256);
    const dictionary = JSON.parse(source);
    for (const row of plan.rows) {assert.equal(dictionary[row.key], row.original);dictionary[row.key] = row.replacement;}
    assert.deepEqual(Object.keys(dictionary), plan.originalKeys);
    fs.writeFileSync(file, JSON.stringify(dictionary, null, 2) + '\n');console.log('Applied Japanese dictionary values only.');
  } else if (mode === 'verify') {
    const dictionary = JSON.parse(fs.readFileSync(file, 'utf8'));
    const ui = fs.existsSync('docs/japanese-ui-dictionary-plan.json') ? require('./migrate-japanese-ui.cjs').reverse(dictionary) : 0;
    assert.deepEqual(Object.keys(dictionary), plan.originalKeys);
    let additional = 0;
    if (fs.existsSync(additionalPlanFile)) {
      const added = JSON.parse(fs.readFileSync(additionalPlanFile, 'utf8'));
      for (const row of added.rows) {assert.equal(dictionary[row.key], row.replacement);assert.deepEqual(slots(dictionary[row.key]), slots(row.original));dictionary[row.key] = row.original;}
      additional = added.rows.length;
    }
    for (const row of plan.rows) {assert.equal(dictionary[row.key], row.replacement);assert.deepEqual(slots(dictionary[row.key]), slots(row.original));dictionary[row.key] = row.original;}
    const sourceBefore = JSON.parse(require('node:child_process').execFileSync('git', ['show', '92d0834219aa771b5837dbcbf1baeb839a200cf6:' + file], {encoding: 'utf8'}));
    assert.deepEqual(dictionary, sourceBefore, 'Every value outside the reviewed Japanese translations must be identical to upstream');
    fs.writeFileSync('docs/verification/japanese/dictionary.json', JSON.stringify({generatedAt: new Date().toISOString(), pass: true, changedValues: plan.rows.length + additional, uiTranslationRows: ui, originalTotalKeys: plan.originalKeys.length, totalKeys: Object.keys(JSON.parse(fs.readFileSync(file,'utf8'))).length, existingKeysPreserved: true, exactPlaceholders: true, outsidePlanMatchesUpstream: true, scope: plan.scope}, null, 2));console.log('PASS: Japanese dictionary keys/placeholders and all non-translation values preserved.');
  } else throw Error('Use plan, apply or verify');
}
