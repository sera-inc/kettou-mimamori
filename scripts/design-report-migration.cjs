'use strict';
const fs = require('node:fs');const acorn = require('acorn');const crypto = require('node:crypto');const assert = require('node:assert/strict');
const files = fs.readdirSync('lib/report_plugins').filter(name => name.endsWith('.js')).map(name => 'lib/report_plugins/' + name);
const flot = new Set(['dailystats', 'glucosedistribution', 'hourlystats', 'percentile', 'loopalyzer']);
const names = require('color-name');
const ordinary = {black: '--app-text', white: '--app-surface', grey: '--app-border-strong', gray: '--app-text-muted', red: '--app-danger-text', blue: '--app-primary', green: '--app-success-text', darkgreen: '--app-success-text', lightgreen: '--app-success-text', violet: '--app-chart-exercise', salmon: '--app-chart-note', brown: '--app-warning-text', purple: '--app-chart-prediction', '#0099ff': '--app-info-text', '#d6ffd6': '--app-success-bg', '#f88': '--app-danger-text', '#8f8': '--app-success-text', '#ff8': '--app-warning-text', '#dddddd': '--app-border', '#33a0ff': '--app-info-text', '#33aa33': '--app-success-text', '#8e1578': '--app-chart-prediction', '#ff7000': '--app-chart-note', '#23d820': '--app-success-text', '#f3f3f3': '--app-surface-sunken', '#ffffff': '--app-surface', '#000000': '--app-text', '#000055': '--app-info-text', '#a0a0ff': '--app-chart-percentile-outer', '#ffff00': '--app-warning-text', '#ff0000': '--app-danger-text', '#555': '--app-border-strong', '#4caf50': '--app-surface-sunken', '#ccc': '--app-border', '#fcc': '--app-danger-bg', '#cfc': '--app-success-bg', lightgray: '--app-surface-sunken'};
const planFile = 'docs/design-report-plan.json';
ordinary.whitesmoke = '--app-surface-sunken';
ordinary.darkred = '--app-danger-text';
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const astHash = value => digest(JSON.stringify(acorn.parse(value, {ecmaVersion: 'latest'}), (key, item) => ['start', 'end', 'raw'].includes(key) ? undefined : item));
if (process.argv[2] === 'plan') {
  const plans = [];
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8'), plugin = file.split('/').at(-1).replace('.js', '');const rows = [], exceptions = [];
    const add = (start, end, after, reason) => rows.push({start, end, line: source.slice(0, start).split('\n').length, before: source.slice(start, end), after, reason});
    const special = (before, after, reason) => {const start = source.indexOf(before);assert(start >= 0 && source.indexOf(before, start + 1) < 0, file + ': unique reviewed expression');add(start, start + before.length, after, reason);};
    if (plugin === 'calibrations') special("(!e.eventType ? colors[colorindex] : 'White')", '(!e.eventType ? "var(--app-chart-cal-bg-" + (colorindex + 1) + ")" : "var(--app-surface)")', 'Calibration table gets pale category surfaces while plotted ink stays distinct; same twelve indices');
    if (['daytoday', 'weektoweek'].includes(plugin)) special('return d.color;', 'return reportTheme.readingColor(d.color);', 'Resolve paint only; keep gray/raw and transparent classification/filter sentinels');
    if (plugin === 'daytoday') special('.style(\'opacity\', function() { return 0.5 })', '.style(\'opacity\', function() { return 1 })', 'Reading markers use opaque semantic ink for non-text contrast; invisible/raw sentinels and density statistics unchanged');
    if (plugin === 'weektoweek') special('.style(\'opacity\', function() { return 0.5 })', '.style(\'opacity\', function() { return 1 })', 'Weekday reading markers use opaque ink; keep date/weekday grouping and raw masking');
    function embedded(value) {
      return value.replace(/((?:background(?:-color)?|color|border(?:-color)?)\s*:\s*)([^;"'<>}\n]+)/g, (all, prefix, style) => {
        const changed = style.replace(/#[a-f\d]{3,8}\b|\b(?:black|white|grey|gray|red|yellow|green|blue|lightgreen|lightgray)\b/gi, old => {let token = ordinary[old.toLowerCase()];if (plugin === 'loopalyzer' && /^color\s*:/.test(prefix) && old.toLowerCase() === 'white') token = '--app-text';if (!token) throw new Error(file + ': unmapped embedded color ' + old);return 'var(' + token + ')';});return prefix + changed;
      }).replace(/font-weight\s*:\s*(bold|normal)\b/g, (_, weight) => 'font-weight:var(--app-font-weight-' + weight + ')')
        .replace(/((?:margin(?:-[\w-]+)?|padding(?:-[\w-]+)?|width|height|min-width|max-width|min-height|max-height|top|left|right|bottom)\s*:\s*)([^;"'<>}\n]+)/g, (_, prefix, style) => prefix + style.replace(/(-?[\d.]+)px\b/g, (_, px) => Number(px) === 0 ? '0' : Number(px) / 16 + 'rem'));
    }
    let palette = 0, weekday = 0;
    function visit(node, parent, ancestry) {
      if (!node || typeof node !== 'object') return;
      if (!rows.some(row => node.start >= row.start && node.end <= row.end)) {
        if (node.type === 'Literal' && (typeof node.value === 'string' || typeof node.value === 'number')) {
          const value = String(node.value), lower = value.toLowerCase(), paint = typeof node.value === 'string' && (names[lower] || /^#(?:[a-f\d]{3}|[a-f\d]{4}|[a-f\d]{6}|[a-f\d]{8})$/i.test(value) || /^rgb\(/.test(value));
          const call = parent?.type === 'CallExpression' && ['attr', 'style'].includes(parent.callee.property?.name) && parent.arguments[1] === node;
          if (call && parent.arguments[0]?.value === 'font-size') add(node.start, node.end, JSON.stringify('var(--app-text-body-sm-size)'), 'Annotation font size follows DDS dense small type; coordinates unchanged');
          else if (call && parent.arguments[0]?.value === 'font-weight' && ['bold', 'normal'].includes(value)) add(node.start, node.end, JSON.stringify('var(--app-font-weight-' + value + ')'), 'DDS font weight');
          else if (paint) {
            const sentinel = parent?.type === 'BinaryExpression' || parent?.type === 'AssignmentExpression' && parent.left.property?.name === 'color';
            if (sentinel || lower === 'transparent') exceptions.push({line: node.loc.start.line, value, reason: 'Internal reading classification or deliberate invisible paint sentinel; render boundary resolves visible paint'});
            else {
              let token = ordinary[lower], isFlot = flot.has(plugin);
              if (plugin === 'calibrations' && parent?.type === 'ArrayExpression' && node.loc.start.line === 63) {token = '--app-chart-cal-ink-' + (++palette);isFlot = true;}
              if (plugin === 'weektoweek' && node.loc.start.line <= 14) {token = '--app-chart-day-' + (++weekday);isFlot = false;}
              if (plugin === 'glucosedistribution' && parent?.type === 'Property' && ['Low', 'Normal', 'High'].includes(parent.key.name)) {token = {Low: '--app-danger-bg', Normal: '--app-success-bg', High: '--app-warning-bg'}[parent.key.name];isFlot = false;}
              if (plugin === 'hourlystats') {isFlot = false;if (node.loc.start.line > 200 && ['white', 'red', 'lightgreen'].includes(lower)) token = {white: '--app-surface', red: '--app-danger-bg', lightgreen: '--app-success-bg'}[lower];}
              if (!token) throw new Error(file + ':' + node.loc.start.line + ': unmapped color ' + value);
              add(node.start, node.end, isFlot ? 'reportTheme.color(' + JSON.stringify(token) + ')' : JSON.stringify('var(' + token + ')'), token + ' ※統合');
            }
          } else if (typeof node.value === 'string') {const after = embedded(node.value);if (after !== node.value) add(node.start, node.end, JSON.stringify(after), 'Reviewed embedded color/type/geometry declarations');}
        } else if (node.type === 'TemplateElement') {const after = embedded(node.value.raw);if (after !== node.value.raw) add(node.start, node.end, after, 'Reviewed CSS template color/type/geometry declarations');}
      }
      for (const [key, child] of Object.entries(node)) if (key !== 'loc') {if (Array.isArray(child)) child.forEach(item => visit(item, node, [...ancestry, node]));else if (child && typeof child === 'object') visit(child, node, [...ancestry, node]);}
    }
    visit(acorn.parse(source, {ecmaVersion: 'latest', locations: true}), null, []);
    if (plugin === 'calibrations') assert.equal(palette, 12, 'Preserve all twelve calibration category indices');
    if (plugin === 'weektoweek') assert.equal(weekday, 7, 'Preserve all seven weekday indices');
    rows.sort((a, b) => a.start - b.start);for (let i = 1; i < rows.length; i++) assert(rows[i].start >= rows[i - 1].end, 'Reviewed replacements cannot overlap');
    if (rows.length) plans.push({file, beforeSHA256: digest(source), beforeAstSHA256: astHash(source), addThemeRequire: rows.some(row => row.after.includes('reportTheme.')), rows, exceptions});
  }
  fs.writeFileSync(planFile, JSON.stringify({generatedAt: new Date().toISOString(), plans}, null, 2));
  const heading = '\n## レポート描画と埋め込みstyle（2026-10-13追加選定）';
  const previous = fs.readFileSync('docs/mapping.md', 'utf8');fs.writeFileSync('docs/mapping.md', previous.includes(heading) ? previous.slice(0, previous.indexOf(heading)) : previous);
  fs.appendFileSync('docs/mapping.md', heading + '\n\n内部の色分類・灰色raw識別・透明sentinelは維持し、表示境界で解決。Flotには計算済みトークン値、SVG/CSSにはsemantic varを使用。書体はDense、構造pxは等価remへ変換。\n\n|参照箇所|既存の記述|選定した置換|用途|\n|---|---|---|---|\n' + plans.flatMap(plan => plan.rows.map(row => '| ' + plan.file + ':' + row.line + ' | `' + row.before.replace(/\|/g, '&#124;').replace(/\r?\n/g, ' ').slice(0, 180) + '` | `' + row.after.replace(/\|/g, '&#124;').replace(/\r?\n/g, ' ').slice(0, 180) + '` | ' + row.reason + ' |')).join('\n') + '\n');
  console.log(JSON.stringify(plans.map(plan => ({file: plan.file, replacements: plan.rows.length, preservedSentinels: plan.exceptions.length})), null, 2));
} else if (process.argv[2] === 'apply') {
  const file = process.argv[3], plan = JSON.parse(fs.readFileSync(planFile, 'utf8')).plans.find(plan => plan.file === file);assert(plan, 'Apply one reviewed report module');
  let source = fs.readFileSync(file, 'utf8');assert.equal(digest(source), plan.beforeSHA256, 'Source must match reviewed plan');
  for (const row of plan.rows.slice().reverse()) {assert.equal(source.slice(row.start, row.end), row.before);source = source.slice(0, row.start) + row.after + source.slice(row.end);}
  if (plan.addThemeRequire) {assert(source.startsWith("'use strict';"));const at = source.indexOf('\n') + 1;source = source.slice(0, at) + "var reportTheme = require('../report/theme');\n" + source.slice(at);}
  acorn.parse(source, {ecmaVersion: 'latest'});fs.writeFileSync(file, source);console.log('Applied ' + plan.rows.length + ' reviewed appearance replacements to ' + file);
} else if (process.argv[2] === 'verify') {
  const plans = JSON.parse(fs.readFileSync(planFile, 'utf8')).plans, results = [];
  for (const plan of plans) {
    let current = fs.readFileSync(plan.file, 'utf8');
    if(fs.existsSync('docs/japanese-ui-source-plan.json'))current=require('./migrate-japanese-ui-source.cjs').reverse(plan.file,current);
    const addons=JSON.parse(fs.readFileSync('docs/design-report-addon-plan.json','utf8')).addons.filter(addon=>addon.file===plan.file);
    for(const addon of addons){assert.equal(current.split(addon.after).length-1,1,'Additional reviewed appearance replacement must exist exactly once');current=current.replace(addon.after,addon.before);assert.equal(digest(current),addon.sourceSHA256,'Only the reviewed add-on may differ from the 186-replacement source');}
    if (plan.addThemeRequire) {const prefix = "var reportTheme = require('../report/theme');\n";assert.equal(current.split(prefix).length - 1, 1);assert(current.startsWith("'use strict';"));current = current.replace(prefix, '');}
    const transformed = [];let offset = 0;for (const row of plan.rows) {transformed.push({...row, start: row.start + offset, end: row.start + offset + row.after.length});offset += row.after.length - row.before.length;}
    for (const row of transformed.reverse()) {assert.equal(current.slice(row.start, row.end), row.after, plan.file + ': reviewed replacement exact');current = current.slice(0, row.start) + row.before + current.slice(row.end);}
    assert.equal(digest(current), plan.beforeSHA256);assert.equal(astHash(current), plan.beforeAstSHA256);results.push({file: plan.file, pass: true, scope: 'Entire source and AST match pre-migration after reversing the recorded appearance, localization and separately tested Loopalyzer boundary changes; no unrecorded computation or protocol changes.', replacements: plan.rows.length+addons.length});
  }
  fs.writeFileSync('docs/verification/report-styles/invariants.json', JSON.stringify(results, null, 2));console.log(JSON.stringify(results, null, 2));
} else throw new Error('Use plan, apply <one file> or verify');
