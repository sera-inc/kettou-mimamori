'use strict';

module.exports = function displayAge (pluginName, value, language) {
  if (language !== 'ja' || !['cage', 'sage', 'iage', 'bage'].includes(pluginName) || typeof value !== 'string') return value;
  if (value.length > 64) return value;
  // Three fixed unit groups with a bounded input length; no unbounded backtracking input.
  // eslint-disable-next-line security/detect-unsafe-regex
  var match = value.match(/^(?:(\d+(?:\.\d+)?)d)?(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?$/);
  if (!match || !value) return value;
  return (match[1] === undefined ? '' : match[1] + '日') +
    (match[2] === undefined ? '' : match[2] + '時間') +
    (match[3] === undefined ? '' : match[3] + '分');
};
