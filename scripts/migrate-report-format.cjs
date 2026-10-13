'use strict';
const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const plan = 'docs/report-format-source-plan.json';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
function reverse(file, source) {
  if (!fs.existsSync(plan)) return source;
  const rows = JSON.parse(fs.readFileSync(plan)).filter(row => row.file === file);
  if (!rows.length || sha(source) === rows[0].beforeSHA256) return source;
  for (const row of rows.reverse()) {
    assert.equal(source.split(row.after).length - 1, 1);
    source = source.replace(row.after, row.before);
    assert.equal(sha(source), row.beforeSHA256);
  }
  return source;
}
module.exports = { reverse };
if (require.main === module) {
  if (process.argv[2] === 'apply') {
    assert(!fs.existsSync(plan), 'Keep frozen formatting-only plan');
    const file = 'lib/report_plugins/success.js', rows = [], original = fs.readFileSync(file, 'utf8');
    const declarations = source => {
      const css = source.match(/success\.css\s*=\s*`([\s\S]*?)`;/)[1], result = [];
      require('postcss').parse(css).walkDecls(declaration => result.push([declaration.parent.selector, declaration.prop, declaration.value, declaration.important]));
      return result;
    };
    for (const text of ['border: 1px var(--app-border) solid;', 'padding: 0.0625rem;', 'background-color: var(--app-danger-bg);', 'background-color: var(--app-success-bg);']) {
      const source = fs.readFileSync(file, 'utf8'), before = '  \t' + text, after = '    ' + text;
      assert.equal(source.split(before).length - 1, 1);
      rows.push({ file, before, after, beforeSHA256: sha(source) });
      fs.writeFileSync(file, source.replace(before, after));
    }
    assert.deepEqual(declarations(fs.readFileSync(file, 'utf8')), declarations(original), 'All CSS declarations identical');
    fs.writeFileSync(plan, JSON.stringify(rows, null, 2) + '\n');
  } else if (process.argv[2] === 'verify') {
    for (const file of new Set(JSON.parse(fs.readFileSync(plan)).map(row => row.file))) reverse(file, fs.readFileSync(file, 'utf8'));
    console.log('PASS: four indentation-only changes reverse to exact full report source.');
  } else throw Error('Use apply or verify');
}
