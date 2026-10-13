'use strict';
const fs = require('node:fs');const vm = require('node:vm');const assert = require('node:assert/strict');const acorn = require('acorn');
const source = fs.readFileSync('lib/food/food.js', 'utf8');const parsed = acorn.parse(source, {ecmaVersion: 'latest'});
let handler;
function visit(node) {if (!node || typeof node !== 'object') return;if (node.type === 'FunctionDeclaration' && node.id.name === 'resortArray') handler = node;for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit);else if (value && typeof value === 'object') visit(value);}
visit(parsed);assert(handler, 'Exercise the actual production sort callback');
const cases = [
  {name: 'move visible record to beginning', records: ['A', 'B', 'C'], old: 2, next: 0, expected: ['C', 'A', 'B']},
  {name: 'move visible record to end', records: ['A', 'B', 'C'], old: 0, previous: 2, expected: ['B', 'C', 'A']},
  {name: 'hidden first record stays first', records: ['hidden', 'A', 'B'], old: 2, next: 1, expected: ['hidden', 'B', 'A']},
  {name: 'hidden middle record is retained when moving down', records: ['A', 'hidden', 'B'], old: 0, previous: 2, expected: ['hidden', 'B', 'A']},
  {name: 'only visible record stays at its original array position', records: ['hidden1', 'A', 'hidden2'], old: 1, expected: ['hidden1', 'A', 'hidden2']},
  {name: 'move between visible anchors across a hidden record', records: ['A', 'hidden', 'B', 'C'], old: 3, previous: 0, next: 2, expected: ['A', 'hidden', 'C', 'B']}
];
const results = cases.map(test => {
  const records = test.records.map(id => ({_id: id, foods: [{name: '合成食品', carbs: 55, portions: 2}], carbs: 110}));const original = JSON.stringify(records);let drawn = 0, stopped = 0;
  const context = {foodquickpick: records, drawQuickpick() {drawn++;}, console: {log() {}}};
  const neighbour = index => ({first() {return this;}, length: index === undefined ? 0 : 1, attr() {return String(index);}});
  vm.runInNewContext(source.slice(handler.start, handler.end), context);
  context.resortArray({stopPropagation() {stopped++;}}, {item: {attr() {return String(test.old);}, nextAll() {return neighbour(test.next);}, prevAll() {return neighbour(test.previous);}}});
  assert.deepEqual(records.map(record => record._id), test.expected, test.name);assert.equal(drawn, 1);assert.equal(stopped, 1);
  assert.equal(JSON.stringify(records.slice().sort((a, b) => a._id.localeCompare(b._id))), JSON.stringify(JSON.parse(original).sort((a, b) => a._id.localeCompare(b._id))), 'Every record and all nutrient/portion values survive ordering');
  return {case: test.name, pass: true, order: test.expected, recordsAndNutrientsPreserved: true};
});
fs.writeFileSync('docs/verification/food-order.json', JSON.stringify(results, null, 2));console.log(JSON.stringify(results, null, 2));
