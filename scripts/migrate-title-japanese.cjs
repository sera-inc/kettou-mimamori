'use strict';
const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const plan = 'docs/japanese-title-source-plan.json';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
function reverse(file, source) {
  if (!fs.existsSync(plan)) return source;
  const rows = JSON.parse(fs.readFileSync(plan)).filter(row => row.file === file);
  if (!rows.length || sha(source) === rows[0].beforeSHA256) return source;
  for (const row of rows.reverse()) {
    assert.equal(source.split(row.after).length - 1, 1);
    source = source.replace(row.after, row.before); assert.equal(sha(source), row.beforeSHA256);
  }
  return source;
}
module.exports = { reverse };
if (require.main === module) {
  if (process.argv[2] === 'apply') {
    assert(!fs.existsSync(plan), 'Keep reviewed title presentation plan');
    const file = 'lib/client/index.js', rows = [];
    for (const [before, after] of [
      ["title = s(ago.value) + s(ago.label, ' - ') + title;", "title = s(ago.value) + s(client.translate(ago.label), ' - ') + title;"],
      ["$(document).attr('title', windowTitle || generateTitle() || documentDefaultTitle);", "var activeTitle = windowTitle || generateTitle();\n    $(document).attr('title', activeTitle ? activeTitle + ' | ' + documentDefaultTitle : documentDefaultTitle);"]
    ]) {
      const source = fs.readFileSync(file, 'utf8');
      const replacement = source.includes('\r\n') ? after.replace(/\n/g, '\r\n') : after;
      assert.equal(source.split(before).length - 1, 1);
      rows.push({ file, before, after: replacement, beforeSHA256: sha(source) });
      fs.writeFileSync(file, source.replace(before, replacement));
    }
    fs.writeFileSync(plan, JSON.stringify(rows, null, 2) + '\n');
  } else if (process.argv[2] === 'verify') {
    for (const file of new Set(JSON.parse(fs.readFileSync(plan)).map(row => row.file))) reverse(file, fs.readFileSync(file, 'utf8'));
    console.log('PASS: only document title translation and service label change; source/calculations/alarms reverse exactly.');
  } else throw Error('Use apply or verify');
}
