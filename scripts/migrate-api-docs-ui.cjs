'use strict';
const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const plan = 'docs/api-docs-ui-source-plan.json';
const aliasPlan = 'docs/api-docs-alias-source-plan.json';
const sha = source => crypto.createHash('sha256').update(source).digest('hex');
function reversePlan(planFile, file, source) {
  if (!fs.existsSync(planFile)) return source;
  const rows = JSON.parse(fs.readFileSync(planFile)).filter(row => row.file === file);
  if (!rows.length || sha(source) === rows[0].beforeSHA256) return source;
  for (const row of rows.reverse()) {
    if (row.after === '') {
      const binding = JSON.parse(fs.readFileSync(plan)).find(item => item.file === file && item.before.includes("app.use('/api3-docs'"));
      assert(binding, 'Recorded insertion anchor required for deleted legacy alias');
      assert.equal(source.split(binding.before).length - 1, 1);
      source = source.replace(binding.before, binding.before + row.before);
    } else {
      assert.equal(source.split(row.after).length - 1, 1);
      source = source.replace(row.after, row.before);
    }
    assert.equal(sha(source), row.beforeSHA256, 'Only the documentation presentation and legacy documentation alias change');
  }
  return source;
}
function reverse(file, source) {
  return reversePlan(plan, file, reversePlan(aliasPlan, file, source));
}
module.exports = { reverse };
if (require.main === module) {
  if (process.argv[2] === 'apply') {
    assert(!fs.existsSync(plan), 'Preserve the reviewed API docs binding plan');
    const file = 'lib/server/app.js', rows = [];
    const changes = [
      ['const swaggerUseSchema = schema => (...args) => swaggerUi.setup(schema)(...args);',
        "const swaggerUseSchema = schema => (...args) => swaggerUi.setup(schema, {\n    customSiteTitle: '血糖みまもり APIの説明',\n    customfavIcon: '/brand/mark.svg',\n    customCssUrl: '/design-system/api-docs.css',\n    customJs: '/api-docs-ja.js'\n  })(...args);"],
      ["  app.use('/api3-docs', swaggerUi.serve, swaggerUseSchema(swaggerDocumentApiV3));",
        "  app.use('/api3-docs', swaggerUi.serve, swaggerUseSchema(swaggerDocumentApiV3));\n\n  app.get('/api-docs.html', function(req, res) {\n    res.redirect(307, '/api-docs');\n  });"]
    ];
    for (const [before, rawAfter] of changes) {
      const source = fs.readFileSync(file, 'utf8');
      const after = source.includes('\r\n') ? rawAfter.replace(/\n/g, '\r\n') : rawAfter;
      assert.equal(source.split(before).length - 1, 1);
      rows.push({ file, before, after, beforeSHA256: sha(source) });
      fs.writeFileSync(file, source.replace(before, after));
    }
    fs.writeFileSync(plan, JSON.stringify(rows, null, 2) + '\n');
    console.log('API documentation options and legacy alias applied.');
  } else if (process.argv[2] === 'apply-alias') {
    assert(!fs.existsSync(aliasPlan), 'Preserve the reviewed alias ordering plan');
    const file = 'lib/server/app.js', rows = [];
    for (const [rawBefore, rawAfter] of [
      ["\n\n  app.get('/api-docs.html', function(req, res) {\n    res.redirect(307, '/api-docs');\n  });", ''],
      ["  // serve the static content\n  app.use(staticFiles);", "  app.get('/api-docs.html', function(req, res) {\n    res.redirect(307, '/api-docs');\n  });\n\n  // serve the static content\n  app.use(staticFiles);"]
    ]) {
      const source = fs.readFileSync(file, 'utf8');
      const normalize = value => source.includes('\r\n') ? value.replace(/\n/g, '\r\n') : value;
      const before = normalize(rawBefore), after = normalize(rawAfter);
      assert.equal(source.split(before).length - 1, 1);
      rows.push({ file, before, after, beforeSHA256: sha(source) });
      fs.writeFileSync(file, source.replace(before, after));
    }
    fs.writeFileSync(aliasPlan, JSON.stringify(rows, null, 2) + '\n');
    console.log('Legacy docs redirect ordered before static content.');
  } else if (process.argv[2] === 'verify') {
    for (const file of new Set(JSON.parse(fs.readFileSync(plan)).map(row => row.file))) reverse(file, fs.readFileSync(file, 'utf8'));
    console.log('PASS: full server source reverses; API middleware, authentication, requests and storage unchanged.');
  } else throw Error('Use apply or verify');
}
