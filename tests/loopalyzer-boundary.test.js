'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), acorn = require('acorn');
const moment = require('moment-timezone');
function functions(source) {
  const wanted = new Set(['getSGVs', 'getEmptyBins', 'addArrayToBins']);
  const found = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'AssignmentExpression' && node.left.object?.name === 'loopalyzer' && wanted.has(node.left.property?.name)) found.push(source.slice(node.start, node.end) + ';');
    for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(visit); else if (value && typeof value === 'object') visit(value);
  }
  visit(acorn.parse(source, {ecmaVersion: 'latest'}));
  assert.equal(found.length, 3);
  const context = vm.createContext({loopalyzer: {}, moment, console});
  vm.runInContext(found.join('\n'), context);
  return context.loopalyzer;
}
const source = fs.readFileSync('lib/report_plugins/loopalyzer.js', 'utf8');
const current = functions(source);
const original = functions(source.replace('!recDate.isBefore(fromDate)', 'recDate.isAfter(fromDate)'));
function profile(zone) {return {parseInTimezone: day => moment.tz(day, 'YYYY-MM-DD', zone), applyTimezone: date => date.tz(zone)};}
function values(model, records, days, zone = 'Asia/Tokyo') {
  return Array.from(model.getSGVs({allstatsrecords: records}, days, profile(zone)), bin => Array.from(bin[1]));
}
function record(date, sgv) {return {displayTime: new Date(date).toISOString(), sgv};}
describe('Loopalyzer five-minute reading intervals', function () {
  for (const zone of ['Asia/Tokyo', 'UTC', 'America/New_York']) {
    it('retains all 288 exact boundary readings in ' + zone, function () {
      const day = '2026-10-05', start = moment.tz(day, zone).valueOf();
      const records = Array.from({length: 288}, (_, i) => record(start + i * 300000, 80 + i % 120));
      assert(values(original, [records[0], records[1], records[287]], [day], zone).every(bin => Number.isNaN(bin[0])), 'Reproduce the old dropped-reading defect');
      assert.deepEqual(values(current, records, [day], zone), records.map(r => [r.sgv]));
    });
  }
  it('includes the start and excludes the end, without duplicating the next midnight', function () {
    const start = Date.parse('2026-10-04T15:00:00Z');
    const result = values(current, [record(start - 1, 90), record(start, 100), record(start + 300000, 110), record(start + 86400000, 120)], ['2026-10-05', '2026-10-06']);
    assert.deepEqual(result[0], [100, 120]);
    assert.equal(result[1][0], 110);
    assert(result[287].every(Number.isNaN));
  });
  it('preserves the original first-match order for multiple readings in one interval', function () {
    const start = Date.parse('2026-10-04T15:00:00Z');
    const records = [record(start + 200000, 145), record(start + 1, 99), record(start + 299999, 101)];
    assert.deepEqual(values(current, records, ['2026-10-05']), values(original, records, ['2026-10-05']));
    assert.equal(values(current, records, ['2026-10-05'])[0][0], 145);
  });
  it('preserves all original interior readings and missing intervals', function () {
    const start = Date.parse('2026-10-04T15:00:00Z');
    const records = Array.from({length: 144}, (_, i) => record(start + i * 600000 + 150000, 100 + i));
    assert.deepEqual(values(current, records, ['2026-10-05']), values(original, records, ['2026-10-05']));
  });
  it('ignores invalid dates and leaves unavailable values missing', function () {
    const result = values(current, [{displayTime: '', sgv: 100}, {displayTime: '2026-13-40', sgv: 120}], ['2026-10-05']);
    assert.equal(result.length, 288);
    assert(result.every(bin => Number.isNaN(bin[0])));
  });
});
