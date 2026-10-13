'use strict';
const assert = require('node:assert/strict');
const displayAge = require('../lib/utils/display-age');
describe('Japanese age pill display boundary', function () {
  it('localizes the four age plugins while keeping exact digits', function () {
    for (const plugin of ['cage', 'sage', 'iage', 'bage']) {
      assert.equal(displayAge(plugin, '1d11h', 'ja'), '1日11時間');
      assert.equal(displayAge(plugin, '34h', 'ja'), '34時間');
      assert.equal(displayAge(plugin, '0h', 'ja'), '0時間');
      assert.equal(displayAge(plugin, '1.5h30m', 'ja'), '1.5時間30分');
    }
  });
  it('preserves other languages, plugin values and unavailable data', function () {
    assert.equal(displayAge('sage', '1d11h', 'en'), '1d11h');
    assert.equal(displayAge('sage', '1d11h', 'de'), '1d11h');
    assert.equal(displayAge('iob', '1d11h', 'ja'), '1d11h');
    for (const value of [null, undefined, 24, '', 'データなし', 'n/a', '-1h', '1day', '1d text']) assert.equal(displayAge('sage', value, 'ja'), value);
    const oversized = '1'.repeat(1000) + 'h';assert.equal(displayAge('sage', oversized, 'ja'), oversized);
  });
  it('does not mutate clinical display properties', function () {
    const record = Object.freeze({display: '2d4h', age: 52, days: 2, hours: 4, level: 2});
    assert.equal(displayAge('sage', record.display, 'ja'), '2日4時間');
    assert.deepEqual(record, {display: '2d4h', age: 52, days: 2, hours: 4, level: 2});
  });
});
