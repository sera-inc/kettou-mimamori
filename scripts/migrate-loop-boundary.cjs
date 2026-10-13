'use strict';
const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const file = 'lib/report_plugins/loopalyzer.js', planFile = 'docs/loop-boundary-plan.json';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
function reverse(path, source) {
  if (path !== file || !fs.existsSync(planFile)) return source;
  const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
  assert.equal(source.split(plan.after).length - 1, 1);
  const original = source.replace(plan.after, plan.before);
  assert.equal(sha(original), plan.beforeSHA256, 'Only the reviewed inclusive start boundary changes');
  return original;
}
module.exports = {reverse};
if (require.main === module) {
  const mode = process.argv[2];
  if (mode === 'apply') {
    assert(!fs.existsSync(planFile), 'Preserve the existing boundary plan');
    const source = fs.readFileSync(file, 'utf8');
    const before = 'if (!found && recDate.isAfter(fromDate) && recDate.isBefore(toDate))';
    const after = 'if (!found && !recDate.isBefore(fromDate) && recDate.isBefore(toDate))';
    assert.equal(source.split(before).length - 1, 1);
    fs.writeFileSync(planFile, JSON.stringify({file, beforeSHA256: sha(source), before, after, reason: 'Use half-open five-minute intervals [start, end) so readings exactly at midnight or five-minute boundaries are retained once.'}, null, 2));
    fs.writeFileSync(file, source.replace(before, after));
  } else if (mode === 'verify') {
    reverse(file, fs.readFileSync(file, 'utf8'));
    console.log('PASS: exact source reversal of the Loopalyzer five-minute start boundary.');
  } else throw Error('Use apply or verify');
}
