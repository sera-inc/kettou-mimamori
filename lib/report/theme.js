'use strict';

// Flot's color parser predates CSS custom properties. Resolve only semantic
// tokens at the rendering boundary; do not rewrite readings or classifications.
function color(token) {
  if (!/^--app-[\w-]+$/.test(token)) throw new Error('A report color must use a semantic token');
  var value = window.getComputedStyle(window.document.documentElement).getPropertyValue(token).trim();
  if (!/^(?:#[a-f\d]{3,8}|rgba?\([\d\s.,%]+\))$/i.test(value)) throw new Error('Report color token is not resolved: ' + token);
  return value;
}

function readingColor(classification) {
  var tokens = {darkgreen: '--app-success-text', red: '--app-danger-text', gray: '--app-text-muted', purple: '--app-chart-prediction'};
  if (tokens[classification]) return 'var(' + tokens[classification] + ')';
  // "transparent" is a deliberate invisible sentinel; weekly colors are
  // already semantic token references. Their meaning and filtering stay intact.
  return classification;
}

module.exports = {color: color, readingColor: readingColor};
