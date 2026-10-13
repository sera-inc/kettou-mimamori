'use strict';
const assert = require('assert');
const fs = require('fs');
const d3 = require('d3');
const locales = require('../lib/client/d3locales');
const languageFactory = require('../lib/language');
describe('Japanese product presentation', function () {
  it('keeps scientific units and all dictionary substitution slots', function () {
    const english = JSON.parse(fs.readFileSync('translations/en/en.json', 'utf8'));
    const japanese = JSON.parse(fs.readFileSync('translations/ja_JP.json', 'utf8'));
    assert.deepStrictEqual(Object.keys(japanese).sort(), Object.keys(english).sort());
    for (const key of Object.keys(english)) {
      const slots = value => (value.match(/%[1-9]\d*|\{\d+\}/g) || []).sort();
      assert.deepStrictEqual(slots(japanese[key]), slots(english[key]), key);
      if (!['g', 'ml', '25%', '75%'].includes(key)) assert(/[ぁ-んァ-ヶ一-龯]/.test(japanese[key]), key + ' must have a Japanese label');
    }
    assert.equal(japanese.g, 'g');assert.equal(japanese.ml, 'ml');
  });
  it('formats morning, afternoon, dates and weekdays without changing the Date', function () {
    const locale = d3.timeFormatLocale(locales.locale('ja'));
    const morning = new Date(2026, 9, 13, 0, 5), afternoon = new Date(2026, 9, 13, 13, 5);
    const time = afternoon.getTime();
    assert.equal(locale.format('%p %-I:%M')(morning), '午前 12:05');
    assert.equal(locale.format('%p %-I:%M')(afternoon), '午後 1:05');
    assert.equal(locale.format('%H:%M')(afternoon), '13:05');
    assert.equal(locale.format('%A %x')(afternoon), '火曜日 2026/10/13');
    assert.equal(afternoon.getTime(), time);
  });
  it('keeps explicit English formatting and unknown-locale fallback available', function () {
    assert.equal(d3.timeFormatLocale(locales.locale('en')).format('%p')(new Date(2026, 9, 13, 13)), 'PM');
    assert.equal(locales.locale('unknown'), locales.en_US);
  });
  it('labels every language choice in Japanese while retaining its code/file/speech configuration', function () {
    const language = languageFactory();const original = JSON.stringify(language.languages);
    language.set('ja');for (const entry of language.languages) assert(/[ぁ-んァ-ヶ一-龯]/.test(language.displayName(entry)));
    language.set('en');for (const entry of language.languages) assert.equal(language.displayName(entry), entry.language);
    assert.equal(JSON.stringify(language.languages), original);
  });
  it('labels every timezone while preserving canonical and legacy timezone identifiers', function () {
    const language = languageFactory();const zones = require('moment-timezone').tz.names();
    const original = zones.slice();language.set('ja');
    for (const zone of zones) {
      const label = language.timezoneName(zone);
      assert(label.startsWith('タイムゾーン：'), zone);assert(label.includes(zone), zone);
    }
    assert(language.timezoneName('Asia/Tokyo').includes('日本標準時'));
    assert.equal(language.timezoneName('Invalid/Legacy'), 'タイムゾーン：Invalid/Legacy');
    language.set('en');for(const zone of zones)assert.equal(language.timezoneName(zone),zone);
    assert.deepStrictEqual(zones, original);
  });
});
