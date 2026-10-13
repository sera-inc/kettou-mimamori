'use strict';
const fs = require('node:fs');const assert = require('node:assert/strict');const {execFileSync} = require('node:child_process');const acorn = require('acorn');
const baseline = '92d0834219aa771b5837dbcbf1baeb839a200cf6', file = 'lib/food/food.js';
const current = require('./migrate-japanese-ui-source.cjs').reverse(file, fs.readFileSync(file, 'utf8')), original = execFileSync('git', ['show', baseline + ':' + file], {encoding: 'utf8', maxBuffer: 4 * 1024 * 1024});
function sortHandler(source) {let handler;function visit(node) {if (!node || typeof node !== 'object') return;if (node.type === 'FunctionDeclaration' && node.id.name === 'resortArray') handler = node;for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit);else if (value && typeof value === 'object') visit(value);}visit(acorn.parse(source, {ecmaVersion: 'latest'}));assert(handler);return handler;}
const after = sortHandler(current), before = sortHandler(original);
const normalized = current.slice(0, after.start) + original.slice(before.start, before.end) + current.slice(after.end);
function ast(source) {return JSON.parse(JSON.stringify(acorn.parse(source, {ecmaVersion: 'latest'}), (key, value) => ['start', 'end', 'raw'].includes(key) ? undefined : value));}
assert.deepEqual(ast(normalized), ast(original), 'All food logic outside the reviewed visible/hidden order fix must be identical to upstream');
const result = {baseline, file, pass: true, scope: 'Complete production AST matches upstream after reversing only resortArray; drop handling, nutrient calculations, edit validation, confirmations, authentication and save payloads unchanged. Sort callback tested separately by check-food-order.cjs.'};
fs.writeFileSync('docs/verification/food-invariants.json', JSON.stringify(result, null, 2));console.log(JSON.stringify(result, null, 2));
