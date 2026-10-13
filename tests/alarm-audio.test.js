'use strict';
const assert = require('node:assert/strict');
const createAlarmAudio = require('../lib/client/alarm-audio');
describe('Alarm audio browser rejection handling', function () {
  it('handles a denied play promise once per blocked episode and allows a user retry', async function () {
    const failures = [], recoveries = [], denied = Object.assign(new Error('User interaction required'), {name: 'NotAllowedError'});
    const audio = createAlarmAudio(error => failures.push(error), () => recoveries.push(true));
    assert.equal(await audio.play({play: () => Promise.reject(denied)}), false);
    assert.equal(await audio.play({play: () => Promise.reject(denied)}), false);
    assert.deepEqual(failures, [denied]);
    assert.equal(await audio.play({play: () => Promise.resolve()}), true);
    assert.deepEqual(recoveries, [true]);
    assert.equal(await audio.play({play: () => Promise.reject(denied)}), false);
    assert.equal(failures.length, 2);
  });
  it('handles synchronous playback errors and legacy void-returning playback', async function () {
    const failures = [], error = new Error('Playback unavailable'), player = createAlarmAudio(value => failures.push(value));
    assert.equal(await player.play({play: () => {throw error;}}), false);
    assert.deepEqual(failures, [error]);
    assert.equal(await player.play({play: () => undefined}), true);
  });
  it('calls the same audio element without changing pause, volume, looping or time', async function () {
    const record = Object.freeze({volume: 0.8, loop: true, currentTime: 15, play() {assert.equal(this, record);return Promise.resolve();}});
    const player = createAlarmAudio(() => assert.fail('A resolved play must not report a failure'));
    assert.equal(await player.play(record), true);
    assert.equal(record.currentTime, 15);assert.equal(record.volume, 0.8);assert.equal(record.loop, true);
  });
});
