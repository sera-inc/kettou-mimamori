'use strict';
const fs = require('fs');
const { spawnSync } = require('child_process');
const glob = require('glob');
const mode = process.argv[2] || 'unit';
const scripts = JSON.parse(fs.readFileSync('package.json', 'utf8')).scripts;
const script = mode === 'all' ? scripts.test : scripts['test:' + mode];
if (!script && mode !== 'selected') throw new Error('Unknown suite: ' + mode);
const files = mode === 'selected' ? process.argv.slice(4) : script.match(/\.\/tests\/\{.*?\}[^ ]*\.js|\.\/tests\/[^ ]*\.js/g).filter(item => item !== './tests/hooks.js');
if (mode === 'selected' && (!files.length || files.some(file => !/^\.\/tests\/[\w.-]+\.test\.js$/.test(file) || !fs.existsSync(file)))) throw new Error('Selected tests must be existing, explicitly named root test files.');
const env = { ...process.env, NODE_ENV: 'test', CI: 'true', INSECURE_USE_HTTP: 'true', API_SECRET: 'abcdefghij123', PORT: '1337', HOSTNAME: 'localhost', AUTH_FAIL_DELAY: '50', MONGO_POOL_SIZE: '5', MONGO_MIN_POOL_SIZE: '1' };
for (const key of ['LANGUAGE', 'CUSTOM_TITLE', 'ENABLE', 'SHOW_PLUGINS', 'DISPLAY_UNITS', 'AUTH_DEFAULT_ROLES', 'ALARM_TYPES']) delete env[key];
if (!/test/.test(env.CUSTOMCONNSTR_mongo || env.MONGO_CONNECTION || '')) throw new Error('An isolated test database is required.');
// Fresh processes preserve every upstream assertion while preventing fixtures from
// leaking global DOM shims or mutated env modules into the next file.
const selected = [...new Set(files.flatMap(pattern => glob.sync(pattern)))].sort();
if (!selected.length) throw new Error('No test files selected.');
const start = new Date();
const report = { stats: {suites:0, tests:0, passes:0, pending:0, failures:0, start:start.toISOString()}, isolation:'one-process-per-test-file', files:[], failures:[] };
for (const file of selected) {
  // The committed pill strings were captured in Pacific time (epoch = 4 PM).
  // Match their capture environment without changing expected output or app TZ.
  const fileEnv = /pill-goldens\.test\.js$/.test(file) ? {...env,TZ:'America/Los_Angeles'} : env;
  const timeout = mode === 'stress' ? '60000' : mode === 'integration' ? '15000' : '5000';
  const result = spawnSync(process.execPath, ['node_modules/mocha/bin/mocha.js', '--timeout', timeout, '--require', 'should', '--require', './tests/hooks.js', '--exit', '--reporter', 'json', file], { env:fileEnv, encoding:'utf8', maxBuffer:32*1024*1024 });
  const pos = result.stdout.indexOf('"stats"');
  if (pos < 0) throw new Error(file + ': no report\n' + result.stderr + result.stdout);
  const item = JSON.parse(result.stdout.slice(result.stdout.lastIndexOf('{',pos)));
  for (const key of ['suites','tests','passes','pending','failures']) report.stats[key] += item.stats[key];
  report.files.push({file, exitCode:result.status, stats:item.stats});
  report.failures.push(...item.failures.map(test => ({fullTitle:test.fullTitle, file, err:test.err})));
  console.error(file + ': ' + item.stats.passes + ' passed, ' + item.stats.failures + ' failed');
}
report.stats.end = new Date().toISOString();
report.stats.duration = Date.now() - start.getTime();
const output = process.argv[3];
if (output) {
  fs.mkdirSync(require('path').dirname(output),{recursive:true});
  fs.writeFileSync(output,JSON.stringify(report,null,2));
}
else console.log(JSON.stringify(report,null,2));
process.exitCode = report.stats.failures ? 1 : 0;
