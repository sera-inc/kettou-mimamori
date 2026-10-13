'use strict';
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
function compare(beforeFile, afterFile) {
  // Both snapshots use the same JSON representation: Date becomes ISO text;
  // non-finite numeric values become null. Finite clinical values remain exact.
  const before = JSON.parse(fs.readFileSync(beforeFile, 'utf8'));
  const after = JSON.parse(fs.readFileSync(afterFile, 'utf8'));
  assert.deepEqual(after.reports.map(report => report.id), before.reports.map(report => report.id));
  assert.equal(new Set(after.reports.map(report => report.id)).size, 11, 'All eleven report workflows must be compared');
  const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
  const results = after.reports.map((report, index) => {
    const original = before.reports[index];
    let removedPresentationCaptions = 0, addedHeaderLabels = 0;
    const shape = item => {
      const tables = item.tables.map(table => table.map(row => row.slice()));
      // The original DataGrid adapter inserted a hidden caption into each Flot
      // legend. A parent pie-chart cell's textContent included that caption.
      // Remove only this reviewed presentation caption, validating every actual
      // legend label against the plot series. No clinical cell is normalized.
      if (item.id === 'dailystats') {
        const legendLabels = new Set(item.plots.map(plot => plot.series.map(series => series.label || '').join('')));
        for (const row of tables[0] || []) if (row[0]?.startsWith('記録の一覧') && legendLabels.has(row[0].slice('記録の一覧'.length))) {
          row[0] = row[0].slice('記録の一覧'.length);removedPresentationCaptions++;
        }
      }
      const headerLabel={dailystats:'血糖範囲の分布',hourlystats:'日付',treatments:'操作'}[item.id];
      if(item===report&&headerLabel)for(const [tableIndex,table] of tables.entries()){
        const header=table[0],previous=original.tables[tableIndex]?.[0];
        if(header?.[0]===headerLabel&&previous?.[0]===''&&header.length===previous.length){header[0]='';addedHeaderLabels++;}
      }
      return {plots: item.plots.map(({id, series}) => ({id, series})), svg: item.svg, tables};
    };
    const current = shape(report), previous = shape(original);
    const parts = Object.keys(current).map(part => ({part, beforeSHA256: digest(previous[part]), afterSHA256: digest(current[part])}));
    for (const part of parts) assert.equal(part.afterSHA256, part.beforeSHA256, report.id + ' ' + part.part + ' must match exactly');
    return {id: report.id, pass: true, removedPresentationCaptions, addedHeaderLabels, parts};
  });
  return {generatedAt: new Date().toISOString(), pass: true, scope: 'Exact serialized Flot series/data, SVG geometry, clinical table cells and legend labels; colors, reviewed DataGrid-injected presentation captions, and three explicitly named formerly blank column headers excluded. JSON Date=ISO and nonfinite=null. Independent complete-source AST reversal verifies unchanged clinical math and missing-value handling.', beforeFile, afterFile, reports: results};
}
module.exports = compare;
if (require.main === module) {
  const result = compare(process.argv[2], process.argv[3]);
  fs.writeFileSync(process.argv[4] || 'docs/verification/report-styles/comparison.json', JSON.stringify(result, null, 2));
  console.log('PASS: all eleven reports match in serialized clinical data, SVG geometry and table text.');
}
