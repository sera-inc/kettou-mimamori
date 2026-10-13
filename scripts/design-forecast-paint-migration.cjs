'use strict';
const fs = require('node:fs');const crypto = require('node:crypto');const assert = require('node:assert/strict');const acorn = require('acorn');
const planFile = 'docs/design-forecast-paint-plan.json', file = 'lib/client/renderer.js';
const rows = [
  {original: "var html = require('../utils/html');", replacement: "var html = require('../utils/html');\nvar forecastPaint = require('./forecast-paint');"},
  {original: 'return !client.latestSGV ? 1 : chart().futureOpacity(d.mills - client.latestSGV.mills);', replacement: 'return !client.latestSGV ? 1 : forecastPaint.opacity(d, chart().futureOpacity(d.mills - client.latestSGV.mills));'},
  {original: 'return (d.type === \'mbg\' ? "var(--app-text)" : d.color);', replacement: 'return (d.type === \'mbg\' ? "var(--app-text)" : forecastPaint.color(d));'}
];
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
function ast(source) {const parsed = acorn.parse(source, {ecmaVersion: 'latest'});function strip(value) {if (value && typeof value === 'object') {delete value.start;delete value.end;delete value.raw;for (const child of Object.values(value)) strip(child);}}strip(parsed);return sha(JSON.stringify(parsed));}
function reverse(source, plan) {for (const row of plan.rows.slice().reverse()) {assert.equal(source.split(row.replacement).length - 1, 1);source = source.replace(row.replacement, row.original);}return source;}
module.exports = {reverse};
if (require.main === module) {
  const mode = process.argv[2];let source = fs.readFileSync(file, 'utf8');
  if (mode === 'plan') {
    assert(!fs.existsSync(planFile), 'Do not replace a reviewed plan');
    for (const row of rows) assert.equal(source.split(row.original).length - 1, 1);
    fs.writeFileSync(planFile, JSON.stringify({file, beforeSHA256: sha(source), beforeAST: ast(source), scope: 'Only default forecast SVG stroke and positive opacity; model records, custom colors, noFade, transparent/negative sentinels, coordinates, values, protocols and notification algorithms retained', rows}, null, 2));
    console.log('Planned three reviewed forecast paint boundaries.');
  } else {
    const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
    if (mode === 'apply') {
      assert.equal(sha(source), plan.beforeSHA256);
      for (const row of plan.rows) {assert.equal(source.split(row.original).length - 1, 1);source = source.replace(row.original, row.replacement);}
      acorn.parse(source, {ecmaVersion: 'latest'});fs.writeFileSync(file, source);console.log('Applied forecast paint boundaries.');
    } else if (mode === 'verify') {
      source = reverse(source, plan);assert.equal(sha(source), plan.beforeSHA256);assert.equal(ast(source), plan.beforeAST);
      fs.writeFileSync('docs/verification/forecast-paint-invariants.json', JSON.stringify({generatedAt: new Date().toISOString(), file, pass: true, scope: plan.scope, reversedSourceSHA256: sha(source), reversedASTSHA256: ast(source)}, null, 2));console.log('PASS: complete renderer source/AST match before forecast paint migration.');
    } else throw Error('Use plan, apply or verify');
  }
}
