'use strict';
const fs = require('node:fs');const assert = require('node:assert/strict');const acorn = require('acorn');const {execFileSync} = require('node:child_process');
const baseline = '92d0834219aa771b5837dbcbf1baeb839a200cf6';
const changes = {
  'lib/api2/summary/basaldataprocessor.js': [['require("jquery");', 'const { data } = require("jquery");'], ['for (i = 0; i < o3.length; i++)', 'for (var i = 0; i < o3.length; i++)']],
  'lib/api3/alarmSocket.js': [['function resolveFinishForToken (err)', 'function resolveFinishForToken (err, auth)']],
  'lib/api/profile/index.js': [['function query_models (req, res)', 'function query_models (req, res, next)']],
  'lib/server/bootevent.js': [['function migrateBridgeToConnect ()', 'function migrateBridgeToConnect (ctx)']],
  'lib/server/server.js': [["require('./websocket')(env, ctx, server);", "var websocket = require('./websocket')(env, ctx, server);"]],
  'lib/storage/mongo-storage.js': [['for (;;) {', 'while (true) {']]
};
const ast = source => JSON.parse(JSON.stringify(acorn.parse(source, {ecmaVersion: 'latest'}), (key, value) => ['start', 'end', 'raw'].includes(key) ? undefined : value));
const original = file => execFileSync('git', ['show', baseline + ':' + file], {encoding: 'utf8', maxBuffer: 4 * 1024 * 1024});
const results = [];
for (const [file, replacements] of Object.entries(changes)) {
  let current = fs.readFileSync(file, 'utf8');
  for (const [after, before] of replacements) {assert.equal(current.split(after).length - 1, 1, file + ': exact reviewed change');current = current.replace(after, before);}
  assert.deepEqual(ast(current), ast(original(file)), file + ': no unreviewed AST change');
  results.push({file, pass: true, scope: 'Complete AST matches upstream after reversing unused binding/argument removal, function-scoped var redeclaration or equivalent unconditional retry loop. require calls, calculations, returns, authorization and payloads preserved.'});
}
const file = 'lib/profile/profileeditor.js';let upstream = original(file), unused;
function find(node) {if (!node || typeof node !== 'object') return;if (node.type === 'FunctionDeclaration' && node.id.name === 'convertToRanges') unused = node;for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(find);else if (value && typeof value === 'object') find(value);}
find(acorn.parse(upstream, {ecmaVersion: 'latest'}));assert(unused);
assert.equal(upstream.match(/\bconvertToRanges\b/g).length, 2, 'Only the unused wrapper declaration and the pure core method it delegates to existed');
upstream = upstream.slice(0, unused.start) + upstream.slice(unused.end);
assert.deepEqual(ast(fs.readFileSync(file, 'utf8')), ast(upstream));
results.push({file, pass: true, scope: 'Complete AST matches upstream except an unreferenced wrapper; active migrateRecordStore, profile editing and range math remain identical.'});
fs.writeFileSync('docs/verification/lint-invariants.json', JSON.stringify({baseline, results}, null, 2));console.log(JSON.stringify(results, null, 2));
