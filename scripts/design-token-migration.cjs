'use strict';
// A plan is generated before any stylesheet changes; apply only one reviewed file per invocation.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {execFileSync}=require('child_process');
const postcss = require('postcss');
const styles = [...['main', 'drawer', 'dropdown', 'sgv', 'profile', 'food', 'report', 'admin', 'jquery.tooltips'].map(name => `static/css/${name}.css`), 'views/clockviews/clock-shared.css', 'views/clockviews/clock-config.css'];
const planPath = 'docs/design-token-plan.json';
function tokenFor(declaration) {
  const prop = declaration.prop;
  const selector = declaration.parent.selector || '';
  const value = declaration.value;
  if (declaration.parent.type === 'atrule' && declaration.parent.name === 'font-face') return null;
  if (/icon/.test(selector) && prop === 'font-family') return null;
  if (prop === 'z-index') {
    const target = /tooltip/.test(selector) ? '--app-z-popover' : /drawer/i.test(selector) ? '--app-z-drawer' : Number(value)>=100 ? '--app-z-toast' : Number(value)>0 ? '--app-z-sticky' : '--app-z-base';
    return {target,replacement:`var(${target})`};
  }
  if (prop === 'font' && /Open Sans|Ubuntu|Arial|Helvetica|verdana/i.test(value)) return {target:'--app-font-weight-normal --app-text-body-size --app-text-body-leading --app-font-sans',replacement:'var(--app-font-weight-normal) var(--app-text-body-size)/var(--app-text-body-leading) var(--app-font-sans)'};
  const isBackground = /background/.test(prop);
  const warning = /(?:^|[^\w]|_)(?:warn|warning|yellow|orange)(?=$|[^\w]|_)/i.test(selector + ' ' + value);
  const danger = /(?:^|[^\w]|_)(?:urgent|invalid|error|danger|red)(?=$|[^\w]|_)/i.test(selector + ' ' + value);
  const success = /(?:^|[^\w]|_)(?:success|green)(?=$|[^\w]|_)/i.test(selector + ' ' + value) || /#4cff00/i.test(value);
  if (/color|background|fill|stroke|border|outline/.test(prop) && /#[a-f\d]{3,8}\b|rgba?\(|\b(?:black|white|grey|gray|red|yellow|green|blue|orange|lightgreen|lightgray)\b/i.test(value)) {
    const semantic = danger ? 'danger' : warning ? 'warning' : success ? 'success' : null;
    const target = semantic ? `--app-${semantic}${isBackground ? '-bg' : '-text'}` :
      /border|stroke/.test(prop) ? '--app-border' :
      isBackground ? /body|container|chartContainer/.test(selector) ? '--app-surface-sunken' : '--app-surface' :
      /\ba(?:[, :]|$)|link/.test(selector) ? '--app-text-link' : '--app-text';
    return { target, replacement: value.replace(/#[a-f\d]{3,8}\b|rgba?\([^)]*\)|\b(?:black|white|grey|gray|red|yellow|green|blue|orange|lightgreen|lightgray)\b/gi, `var(${target})`) };
  }
  if (prop === 'font-family' && !/icon/.test(value)) return { target: '--app-font-sans', replacement: 'var(--app-font-sans)' };
  if (prop === 'font-weight') {
    const target = /bold|[6-9]00/.test(value) ? '--app-font-weight-bold' : '--app-font-weight-normal';
    return {target,replacement:`var(${target})`};
  }
  if (prop === 'line-height' && !/icon/.test(selector)) {
    const target = /currentBG|pill.direction/.test(selector) ? '--app-text-display-leading' : '--app-text-body-leading';
    return {target,replacement:`var(${target})`};
  }
  if (prop === 'letter-spacing') return {target:'--app-text-body-tracking',replacement:'var(--app-text-body-tracking)'};
  if (prop === 'font-size') {
    const size = parseFloat(value);
    const target = size >= 48 ? '--app-text-display-size' : size >= 30 ? '--app-text-display-sm-size' : size >= 24 ? '--app-text-heading-lg-size' : size >= 18 ? '--app-text-heading-sm-size' : '--app-text-body-size';
    return { target, replacement: `var(${target})` };
  }
  if (/^(?:padding|margin|gap|border-radius)(?:-|$)/.test(prop) && /\d+(?:\.\d+)?px/.test(value)) {
    const tokens = [];
    const replacement = value.replace(/(-?\d+(?:\.\d+)?)px/g, (_, raw) => {
      const size = Number(raw);
      if (size < 0 || size > 64) {
        const target = '--app-preserved-geometry-' + crypto.createHash('sha256').update(prop + ':' + raw).digest('hex').slice(0, 8);
        tokens.push({ target, value: `${size / 16}rem`, reason: 'Retain chart/drawer alignment; structural geometry only.' });
        return `var(${target})`;
      }
      const candidates = prop === 'border-radius' ? [[4, 'radius-xs'], [6, 'radius-sm'], [8, 'radius-md'], [12, 'radius-lg']] : [[0, 'space-0'], [4, 'space-05'], [8, 'space-1'], [16, 'space-2'], [24, 'space-3'], [32, 'space-4'], [40, 'space-5'], [48, 'space-6'], [64, 'space-8']];
      const selected = candidates.reduce((a, b) => Math.abs(size - a[0]) <= Math.abs(size - b[0]) ? a : b);
      const target = '--app-' + selected[1];
      tokens.push({ target });
      return `var(${target})`;
    });
    return { target: tokens.map(item => item.target).join(' '), replacement, tokens };
  }
  if (/box-shadow$/.test(prop) && value !== 'none') return { target: '--app-shadow-raised', replacement: 'var(--app-shadow-raised)' };
  if (prop === 'text-shadow' && value !== 'none') return {target:'装飾影を除去',replacement:'none'};
  if (prop === 'outline' && value === 'none') return {target:'--app-focus-ring',replacement:'var(--app-focus-ring-width) solid var(--app-focus-ring)'};
  // Coordinate dimensions are geometry, not design scales. Keep their size in rem.
  if (/\d+(?:\.\d+)?px/.test(value) && !/url\(|\b(?:1|2)px\b/.test(value)) return {target:'保留なし：構造寸法を維持',replacement:value.replace(/(-?\d+(?:\.\d+)?)px/g,(_,n)=>`${Number(n)/16}rem`)};
  return null;
}
module.exports={tokenFor,styles};
if (require.main === module) { if (process.argv[2] === 'plan') {
  const plan = [];
  const previous=fs.existsSync(planPath)?JSON.parse(fs.readFileSync(planPath,'utf8')):[];
  for (const file of styles) {
    // Inventory the immutable upstream baseline, never a partly migrated file.
    const source = execFileSync('git',['show','92d0834219aa771b5837dbcbf1baeb839a200cf6:'+file],{encoding:'utf8'});
    const root = postcss.parse(source);
    let ordinal = 0;
    root.walkDecls(decl => {
      const mapping = tokenFor(decl);
      if (mapping) {
        const prior=previous.find(row=>row.file===file&&row.ordinal===ordinal);
        const previousReplacements=[...new Set([...(prior?.previousReplacements||[]),...(prior&&prior.replacement!==mapping.replacement?[prior.replacement]:[])])];
        plan.push({ file, ordinal, selector: decl.parent.selector, property: decl.prop, original: decl.value, ...mapping, previousReplacements });
      }
      ordinal++;
    });
  }
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2));
  fs.writeFileSync('docs/mapping.md', '# 実装値とトークン対応表\n\n2026-10-12：ユーザーがトークン選定・検証を委任。DADS blueを継承。\n\n第三者のjQuery UI・colorbrewer原本は改変せず、Layer 3のテーマから包む。グラフの計算・形状を維持する構造値は専用Layer 2エイリアスに記録。未解決の値を推測で置換しない。\n\n| ファイル・セレクタ | プロパティ | 元の値 | 対応トークン |\n|---|---|---|---|\n' + plan.map(item => `| ${item.file} ${item.selector || ''} | ${item.property} | \`${item.original.replace(/\|/g, '\\|')}\` | ${item.target} ※統合 |`).join('\n') + '\n');
  const structural = new Map();
  for (const item of plan) for (const token of item.tokens || []) if (token.value) structural.set(token.target, token.value);
  fs.mkdirSync('static/design-system', { recursive: true });
  fs.writeFileSync('static/design-system/product-geometry.css', ':root {\n' + [...structural].map(([key, value]) => `  ${key}: ${value};`).join('\n') + '\n}\n');
  console.log(`Reviewed plan: ${plan.length} declarations; ${structural.size} structural aliases.`);
} else if (process.argv[2] === 'apply') {
  const file = process.argv[3];
  if (!styles.includes(file)) throw new Error('Apply one known stylesheet only.');
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8')).filter(item => item.file === file);
  const source = fs.readFileSync(file, 'utf8');
  const root = postcss.parse(source);
  let ordinal = 0;
  root.walkDecls(decl => {
    const mapping = plan.find(item => item.ordinal === ordinal);
    if (mapping) {
      if (mapping.replacement === decl.value) { ordinal++; return; }
      if (mapping.original !== decl.value && !(mapping.previousReplacements||[]).includes(decl.value)) throw new Error('Reviewed source has changed: ' + file);
      decl.value = mapping.replacement;
    }
    ordinal++;
  });
  root.walkAtRules('import', rule => { if (/fonts.googleapis/.test(rule.params)) rule.remove(); });
  fs.writeFileSync(file, root.toString());
  console.log(`Applied ${plan.length} reviewed declarations to ${file}`);
} else throw new Error('Use plan or apply <one stylesheet>'); }
