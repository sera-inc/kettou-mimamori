'use strict';

// These keys identify upstream prediction defaults, not new protocol values.
// Keep custom colors and invisible sentinels exactly as supplied by the model.
var defaults = new Map([
  ['cyan', '--app-chart-forecast-ar2']
  , ['#ff00ff', '--app-chart-forecast-value']
  , ['#1e88e5', '--app-chart-forecast-iob']
  , ['#fb8c00', '--app-chart-forecast-cob']
  , ['#00d2d2', '--app-chart-forecast-zt']
  , ['#c9bd60', '--app-chart-forecast-uam']
]);

function token (entry) {
  if (!entry || entry.type !== 'forecast' || typeof entry.color !== 'string') return null;
  var color = entry.color.trim().toLowerCase();
  if (color === '#fb8c00' && entry.forecastType === 'Accel-COB') return '--app-chart-forecast-acob';
  return defaults.get(color) || null;
}

function color (entry) {
  var name = token(entry);
  return name ? 'var(' + name + ')' : entry.color;
}

function opacity (entry, original) {
  // Preserve noFade/null, past readings, invisible points and out-of-range
  // opacity. Limit only positive fading of the reviewed default predictions.
  return token(entry) && !entry.noFade && Number.isFinite(original) && original > 0 ? Math.max(0.7, original) : original;
}

module.exports = {color: color, opacity: opacity};
