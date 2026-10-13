'use strict';
const fs = require('node:fs');const path = require('node:path');const acorn = require('acorn');
const named = require('color-name');
const hex = /^#(?:[a-f\d]{3}|[a-f\d]{4}|[a-f\d]{6}|[a-f\d]{8})$/i;
const records = [];
for (const directory of ['lib/report_plugins', 'lib/report']) {
  for (const name of fs.readdirSync(directory).filter(name => name.endsWith('.js')).sort()) {
    const file = directory + '/' + name, source = fs.readFileSync(file, 'utf8');
    function visit(node, parent) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'Literal' && typeof node.value === 'string' || node.type === 'TemplateElement') {
        const value = node.type === 'TemplateElement' ? node.value.raw : node.value;
        if (hex.test(value) || named[value.toLowerCase()] || value.toLowerCase() === 'transparent' || /^rgba?\(/i.test(value)) {
          const reportClassification = file === 'lib/report/reportclient.js' && (parent?.type === 'Property' && parent.key.name === 'color' || parent?.type === 'VariableDeclarator' && parent.id.name === 'color' || parent?.type === 'AssignmentExpression' && parent.left.name === 'color');
          const internal = reportClassification || parent?.type === 'BinaryExpression' || parent?.type === 'AssignmentExpression' && parent.left.property?.name === 'color' || value.toLowerCase() === 'transparent';
          records.push({file, line: node.loc.start.line, type: 'color-literal', value, classification: internal ? 'internal-classification-or-invisible-sentinel' : 'appearance'});
        }
        if (/\b(?:background(?:-color)?|color|border(?:-[\w-]+)?|box-shadow|font(?:-[\w-]+)?)\s*:/.test(value)) {
          const declarations = [...value.matchAll(/\b(background(?:-color)?|color|border(?:-[\w-]+)?|box-shadow|font(?:-[\w-]+)?)\s*:\s*([^;"'<>}]+)/g)].map(match => ({property: match[1], value: match[2].trim()})).filter(item => !/var\(--app-/.test(item.value));
          if (declarations.length) {
            const structural = declarations.every(item => item.property === 'border-collapse' && item.value === 'collapse' || item.property === 'border' && /^0(?:px)?$/.test(item.value));
            records.push({file, line: node.loc.start.line, type: 'embedded-style', declarations, classification: structural ? 'structural-border-no-visible-paint' : 'appearance'});
          }
        }
      }
      if (node.type === 'CallExpression' && ['attr', 'style'].includes(node.callee.property?.name) && /^font(?:-[\w-]+)?$/.test(node.arguments[0]?.value || '') && node.arguments[1]?.type === 'Literal' && !String(node.arguments[1].value).includes('var(--app-')) records.push({file, line: node.loc.start.line, type: 'font-call', property: node.arguments[0].value, value: node.arguments[1].value, classification: 'appearance'});
      for (const child of Object.values(node)) if (Array.isArray(child)) child.forEach(value => visit(value, node));else if (child && typeof child === 'object') visit(child, node);
    }
    visit(acorn.parse(source, {ecmaVersion: 'latest', locations: true}));
  }
}
const files = Object.fromEntries([...new Set(records.map(item => item.file))].map(file => [file, records.filter(item => item.file === file).length]));
fs.mkdirSync('docs/verification/report-styles', {recursive: true});
const output = process.env.INVENTORY_OUTPUT_FILE || path.join('docs/verification/report-styles', 'inventory.json');
const appearance = records.filter(record => record.classification === 'appearance').length;
fs.writeFileSync(output, JSON.stringify({generatedAt: new Date().toISOString(), scope: 'Owned report and report-plugin JavaScript literals using all 148 CSS named colors, embedded literals/templates, and font attr/style calls; an inventory, not proof of migration or accessibility. Third-party Flot source untouched.', count: records.length, appearance, files, records}, null, 2));
console.log(JSON.stringify({count: records.length, appearance, files}, null, 2));
