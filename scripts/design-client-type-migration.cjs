'use strict';
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const acorn = require('acorn');
const planFile = 'docs/design-client-type-plan.json';
const specs = [
  ['lib/client/chart.js', '.style("font-size", "16px")', '.style("font-size", "var(--app-text-body-size)")', 4],
  ['lib/client/renderer.js', ".style('font-size', 15)", ".style('font-size', 'var(--app-text-body-size)')", 3],
  ['lib/client/renderer.js', ".attr('font-size', 15)", ".attr('font-size', 'var(--app-text-body-size)')", 3],
  ['lib/client/renderer.js', 'return fontSize;', "return 'calc(var(--app-text-body-size) * ' + (fontSize / 16) + ')';", 1],
  ['lib/client/renderer.js', ".style('text-shadow', '0px 0px 10px rgba(0, 0, 0, 1)')", ".style('text-shadow', 'none')", 1],
  ['lib/client/boluscalc.js', 'float:right;margin-right:20px;font-size:12px', 'float:right;margin-right:1.25rem;font-size:var(--app-text-body-size)', 1]
];
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const ast = value => {
  const tree = acorn.parse(value, {ecmaVersion: 'latest'});
  function clean(node) {if (node && typeof node === 'object') {delete node.start; delete node.end; delete node.raw; for (const child of Object.values(node)) clean(child);}}
  clean(tree); return sha(JSON.stringify(tree));
};
const mode = process.argv[2];
if (mode === 'plan') {
  assert(!fs.existsSync(planFile), 'Do not replace a reviewed plan');
  const files = [...new Set(specs.map(row => row[0]))].map(file => {
    const before = fs.readFileSync(file, 'utf8');
    const rows = specs.filter(row => row[0] === file).map(([, original, replacement, count]) => {
      assert.equal(before.split(original).length - 1, count, file + ' exact declaration count');
      return {original, replacement, count};
    });
    return {file, beforeSHA256: sha(before), beforeAST: ast(before), rows};
  });
  fs.writeFileSync(planFile, JSON.stringify({scope: 'Only client display typography and shadow; clinical values, treatment label scaling arithmetic, coordinates, protocols and interaction callbacks retained. The divisor 16 converts the original pixel geometry into multiples of the reviewed body token.', files}, null, 2));
  console.log('Planned 13 reviewed display declarations in three existing client modules.');
} else {
  const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
  if (mode === 'apply') {
    const item = plan.files.find(item => item.file === process.argv[3]);
    assert(item, 'Apply one explicitly reviewed module');
    let source = fs.readFileSync(item.file, 'utf8');
    assert.equal(sha(source), item.beforeSHA256, 'Reviewed source must match before mutation');
    for (const row of item.rows) {assert.equal(source.split(row.original).length - 1, row.count); source = source.split(row.original).join(row.replacement);}
    acorn.parse(source, {ecmaVersion: 'latest'});
    fs.writeFileSync(item.file, source);
    console.log('Applied reviewed display declarations to ' + item.file);
  } else if (mode === 'verify') {
    const results = plan.files.map(item => {
      let source = fs.readFileSync(item.file, 'utf8');
      if (fs.existsSync('docs/japanese-ui-source-plan.json')) source = require('./migrate-japanese-ui-source.cjs').reverse(item.file, source);
      // Chain the separately reviewed later forecast paint migration before
      // verifying this earlier typography snapshot.
      if (item.file === 'lib/client/renderer.js' && fs.existsSync('docs/design-forecast-paint-plan.json') && source.includes("var forecastPaint = require('./forecast-paint');")) {
        source = require('./design-forecast-paint-migration.cjs').reverse(source, JSON.parse(fs.readFileSync('docs/design-forecast-paint-plan.json', 'utf8')));
      }
      for (const row of item.rows.slice().reverse()) {assert.equal(source.split(row.replacement).length - 1, row.count); source = source.split(row.replacement).join(row.original);}
      assert.equal(sha(source), item.beforeSHA256);
      assert.equal(ast(source), item.beforeAST);
      return {file: item.file, pass: true, replacements: item.rows.reduce((sum, row) => sum + row.count, 0), scope: 'Entire source and AST equal the reviewed pre-change source after reversing only typography/shadow declarations'};
    });
    fs.writeFileSync('docs/verification/client-type-invariants.json', JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } else throw Error('Use plan, apply <one reviewed module>, or verify');
}
