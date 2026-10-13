'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const yaml = require('js-yaml');
const planFile = 'docs/api-japanese-schema-plan.json';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const semanticSha = value => sha(JSON.stringify(value));
const parse = (file, source) => file.endsWith('.yaml') ? yaml.load(source) : JSON.parse(source);
const format = (file, object) => file.endsWith('.yaml')
  ? yaml.dump(object, { lineWidth: -1, noRefs: true })
  : JSON.stringify(object, null, 2) + '\n';
function parentAt(object, path) {
  let parent = object;
  for (const key of path.slice(0, -1)) parent = parent[key];
  return parent;
}
function reverse(file, object) {
  if (!fs.existsSync(planFile)) return object;
  const record = JSON.parse(fs.readFileSync(planFile)).find(row => row.file === file);
  if (!record) return object;
  const result = JSON.parse(JSON.stringify(object));
  if (semanticSha(result) === record.beforeSemanticSHA256) return result;
  for (const row of record.rows.slice().reverse()) {
    const parent = parentAt(result, row.path), key = row.path.at(-1);
    assert.equal(parent[key], row.after, file + ': reviewed Japanese text');
    parent[key] = row.before;
  }
  assert.equal(semanticSha(result), record.beforeSemanticSHA256,
    file + ': complete original specification after reversing display text only');
  return result;
}
module.exports = { reverse };
if (require.main === module) {
  const command = process.argv[2];
  if (command === 'plan') {
    assert(!fs.existsSync(planFile), 'Retain the frozen reviewed translation plan');
    const records = [];
    for (const version of ['v1', 'v3']) {
      const translations = JSON.parse(fs.readFileSync('docs/api-japanese-' + version + '-translations.json'));
      const map = new Map(translations.rows.map(row => [row.before, row.after]));
      const trimmedMap = new Map(translations.rows.map(row => [row.before.trim(), row.after]));
      for (const file of [version === 'v1' ? 'lib/server/swagger.json' : 'lib/api3/swagger.json',
        version === 'v1' ? 'lib/server/swagger.yaml' : 'lib/api3/swagger.yaml']) {
        const source = fs.readFileSync(file, 'utf8'), object = parse(file, source), rows = [];
        function walk(current, path = []) {
          if (!current || typeof current !== 'object') return;
          for (const [key, value] of Object.entries(current)) {
            if (['title', 'summary', 'description'].includes(key) && typeof value === 'string') {
              const after = map.has(value) ? map.get(value) : trimmedMap.get(value.trim());
              assert.equal(typeof after, 'string', 'Missing reviewed translation: ' + JSON.stringify([...path, key]));
              for (const code of value.match(/`[^`]+`/g) || []) assert(after.includes(code), 'Preserve code: ' + code);
              for (const code of value.match(/<pre>[\s\S]*?<\/pre>/g) || []) assert(after.includes(code), 'Preserve example');
              rows.push({ path: [...path, key], before: value, after });
            } else walk(value, [...path, Array.isArray(current) ? Number(key) : key]);
          }
        }
        walk(object);
        records.push({ file, beforeSourceSHA256: sha(source), beforeSemanticSHA256: semanticSha(object), rows });
      }
    }
    fs.writeFileSync(planFile, JSON.stringify(records, null, 2) + '\n');
    console.log('Frozen display translations:', records.map(row => row.rows.length).join(', '));
  } else if (command === 'apply') {
    for (const record of JSON.parse(fs.readFileSync(planFile))) {
      const source = fs.readFileSync(record.file, 'utf8');
      assert.equal(sha(source), record.beforeSourceSHA256, 'Apply once to the reviewed source');
      const object = parse(record.file, source);
      for (const row of record.rows) {
        const parent = parentAt(object, row.path), key = row.path.at(-1);
        assert.equal(parent[key], row.before); parent[key] = row.after;
      }
      reverse(record.file, object);
      fs.writeFileSync(record.file, format(record.file, object));
    }
    console.log('Japanese API explanations applied; specification semantics preserved.');
  } else if (command === 'verify') {
    const results = JSON.parse(fs.readFileSync(planFile)).map(record => {
      const object = parse(record.file, fs.readFileSync(record.file, 'utf8'));
      for (const row of record.rows) assert.equal(parentAt(object, row.path)[row.path.at(-1)], row.after);
      reverse(record.file, object);
      return { file: record.file, displayFields: record.rows.length, completeSpecificationReversal: true };
    });
    console.log(JSON.stringify({ pass: true, results }));
  } else throw Error('Use plan, apply or verify');
}
