'use strict';

var browserSettings = require('./browser-settings');
var normalizeDirection = require('../direction-normalizer').normalizeDirection;
var units = require('../units')();
var toTextContent = require('../utils/html').toTextContent;
var client = {};
var latestProperties = {};

function appendClockFaceParam ($inner, faceParam) {
  // Clock faces support a fixed set of components and optional sizes from
  // 0-99. Keep DOM-derived face configuration out of HTML, class lists, and
  // CSS unless it matches that complete grammar.
  if (!/^(?:ag|ar|dt|em|nl|sg|tm)[0-9]{0,2}$/.test(faceParam)) {
    return;
  }

  let faceClass = faceParam.substr(0, 2);
  let faceDiv = document.createElement('div');
  faceDiv.className = faceClass;

  let sizeText = faceParam.substr(2);
  let size = Number(sizeText);
  const sizeUnit = $inner.closest('.app-clock-preview').length && window.CSS && window.CSS.supports('font-size', '1cqmin') ? 'cqmin' : 'vmin';
  if (sizeText && size > 0) {
    if (faceClass === 'ar') {
      faceDiv.style.height = size + sizeUnit;
    } else {
      faceDiv.style.fontSize = size + sizeUnit;
    }
  }

  $inner.append(faceDiv);
}

client.readApiSecret = function readApiSecret () {
  var stored = typeof localStorage !== 'undefined' ? localStorage.getItem('apisecrethash') : '';
  if (!stored) return '';
  // Browser storage serializes strings as JSON; legacy raw hashes remain valid.
  try {
    var parsed = JSON.parse(stored);
    return typeof parsed === 'string' ? parsed : stored;
  } catch (err) {
    return stored;
  }
};

client.query = function query () {
  var parts = (location.search || '?').substring(1).split('&');
  var token = '';
  parts.forEach(function(val) {
    if (val.startsWith('token=')) {
      token = val.substring('token='.length);
    }
  });

  var secret = client.readApiSecret();
  var src = '/api/v2/properties'; // Use precalculated data from the backend

  if (secret) {
    var s = '?secret=' + secret;
    src += s;
  } else if (token) {
    var s2 = '?token=' + token;
    src += s2;
  }

  $.ajax(src, {
    error: function gotError (err) {
      console.error(err);
    }
    , success: function gotData (data) {
      latestProperties = data;
      client.render();
    }
  });
};

client.render = function render () {

  let records = latestProperties && latestProperties.bgnow && latestProperties.bgnow.sgvs;
  let rec = Array.isArray(records) ? records[0] : null;
  let deltaDisplayValue;

  if (latestProperties && latestProperties.delta) {
    if (client.unitMismatch) {
      var rawDelta = latestProperties.delta.mgdl;
      var scaledDelta = (client.settings.units === 'mmol') ? units.mgdlToMMOL(rawDelta) : String(rawDelta);
      deltaDisplayValue = (rawDelta >= 0 ? '+' : '') + scaledDelta;
    } else {
      deltaDisplayValue = latestProperties.delta.display;
    }
  }

  let $errorMessage = $('#errorMessage');
  let $inner = $('#inner');

  // Missing measurements must not become a zero reading or crash the clock.
  if (!rec) {
    if (!$errorMessage.length) {
      $inner.after('<div id="errorMessage" class="app-empty-state" data-variant="no-data" role="status"><p class="app-empty-state-title">血糖データはまだありません</p><p class="app-empty-state-description">測定データを受信すると、時計表示を更新します。</p></div>');
    } else {
      $errorMessage.show();
    }
    $inner.hide();
    return;
  } else {
    $errorMessage.length && $errorMessage.hide();
    $inner.show();
  }

  //Parse face parameters
  let face = String($inner.attr('data-face') || '').toLowerCase();

  // Backward compatible
  if (face === 'clock-color') {
    face = 'c' + (window.serverSettings.settings.showClockLastTime ? 'y' : 'n') + '13-sg35-' + (window.serverSettings.settings.showClockDelta ? 'dt14-' : '') + 'nl-ar25-nl-ag6';
  } else if (face === 'clock') {
    face = 'bn0-sg40';
  } else if (face === 'bgclock') {
    face = 'b' + (window.serverSettings.settings.showClockLastTime ? 'y' : 'n') + '13-sg35-' + (window.serverSettings.settings.showClockDelta ? 'dt14-' : '') + 'nl-ar25-nl-ag6';
  } else if (face === 'config') {
    face = String($inner.attr('data-face-config') || '').toLowerCase();
    $inner.empty();
  }

  let faceParams = face.split('-');
  let bgColor = false;
  let staleMinutes = 13;
  let alwaysShowTime = false;

  let clockCreated = ($inner.children().length > 0);

  for (let param in faceParams) {
    if (param === '0') {
      /* eslint-disable-next-line security/detect-object-injection */ // verified false positive
      let faceParam = faceParams[param];
      bgColor = (faceParam.substr(0, 1) === 'c'); // do we want colorful background?
      alwaysShowTime = (faceParam.substr(1, 1) === 'y'); // always show "stale time" text?
      staleMinutes = (faceParam.substr(2, 2) - 0 >= 0) ? faceParam.substr(2, 2) : 13; // threshold value (0=never)
    } else if (!clockCreated) {
      /* eslint-disable-next-line security/detect-object-injection */ // verified false positive
      let faceParam = faceParams[param];
      appendClockFaceParam($inner, faceParam);
    }
  }

  let displayValue = client.unitMismatch
    ? (client.settings.units === 'mmol' ? units.mgdlToMMOL(rec.mgdl) : String(rec.mgdl))
    : rec.scaled;

  // Insert the delta value text.
  $('.dt').text(toTextContent(deltaDisplayValue));

  let bgNum = parseFloat(rec.mgdl);
  let $surface = $inner.closest('.app-clock-preview');
  if (!$surface.length) $surface = $('body');

  // Color background
  if (bgColor) {

    let red = 'var(--app-danger-bg)';
    let yellow = 'var(--app-warning-bg)';
    let green = 'var(--app-success-bg)';
    let blue = 'var(--app-primary-bg)';

    // Threshold values
    let bgHigh = client.settings.thresholds.bgHigh;
    let bgLow = client.settings.thresholds.bgLow;
    let bgTargetBottom = client.settings.thresholds.bgTargetBottom;
    let bgTargetTop = client.settings.thresholds.bgTargetTop;

    // Threshold background coloring.
    if (bgNum < bgLow) {
      $surface.css('background-color', red);
    }
    if ((bgLow <= bgNum) && (bgNum < bgTargetBottom)) {
      $surface.css('background-color', blue);
    }
    if ((bgTargetBottom <= bgNum) && (bgNum < bgTargetTop)) {
      $surface.css('background-color', green);
    }
    if ((bgTargetTop <= bgNum) && (bgNum < bgHigh)) {
      $surface.css('background-color', yellow);
    }
    if (bgNum >= bgHigh) {
      $surface.css('background-color', red);
    }

  } else {
    $surface.css('background-color', 'var(--app-text)');
  }

  // Time before data considered stale.
  let threshold = 1000 * 60 * staleMinutes;

  var elapsedms = Date.now() - rec.mills;
  let elapsedMins = Math.floor((elapsedms / 1000) / 60);
  let thresholdReached = (elapsedms > threshold) && threshold > 0;

  // Insert the BG value text, toggle stale if necessary.
  $('.sg').toggleClass('stale', thresholdReached).text(toTextContent(displayValue));

  var em;  
  if (thresholdReached) {
    em='🤷';
  } else if (bgNum <= 40) { //2,2
    em='❌';
  } else if (bgNum <= 54) { //3
    em='🥶';
  } else if (bgNum <= 72) { //4
    em='😱';
  } else if (bgNum <= 97) {  //5,4
    em='😊';
  } else if (displayValue == '100' || displayValue == '5.5') { //5,5
    em='🦄';
  } else if (bgNum <= 101) { //5,6 
    em='🥇';
  } else if (bgNum <= 108) { //6
    em='😎';
  } else if (bgNum <= 126) { //7
    em='🥳';
  } else if (bgNum <= 144) { //8
    em='🤔';
  } else if (bgNum <= 162) { //9
    em='😳';
  } else if (bgNum <= 180) { //10
    em='😵‍💫';
  } else if (bgNum <= 198) { //11
    em='🎃';
  } else if (bgNum <= 216) { //12
    em='🙀';
  } else if (bgNum <= 234) { //13
    em='🔥';
  } else if (bgNum <= 252) { //14
    em='😬';
  } else if (bgNum <= 270) { //15
    em='😡';
  } else if (bgNum <= 288) { //16
    em='🤬';
  } else if (bgNum <= 306) { //17
    em='🥵';
  } else if (bgNum <= 324) { //18
    em='🫣';
  } else if (bgNum <= 342) { //19
    em='😩';
  } else if (bgNum <= 360) { //20
    em='🤯';
  } else {
    em='👿';
  }
  $('.em').text(em);

  if (thresholdReached || alwaysShowTime) {
    let staleTimeText;
    const japanese = String(client.settings.language || '').startsWith('ja');
    if (elapsedMins === 0) {
      staleTimeText = japanese ? 'たった今' : 'Just now';
    } else if (elapsedMins === 1) {
      staleTimeText = japanese ? '1分前' : '1 minute ago';
    } else {
      staleTimeText = elapsedMins + (japanese ? '分前' : ' minutes ago');
    }

    $('.ag').text(staleTimeText);
  } else {
    $('.ag').text('');
  }

  // Insert the trend arrow.
  let direction = normalizeDirection(rec.direction);
  let arrow = $('<img alt="血糖値の変化方向">').attr('src', '/images/' + (!direction || direction === 'NOT COMPUTABLE' ? 'NONE' : direction) + '.svg');

  // Restyle body bg
  if (thresholdReached) {
    $surface.css('background-color', 'var(--app-surface-sunken)').css('color', 'var(--app-text)');
    $('.ar').css('filter', 'brightness(0%)').html(arrow);
  } else {
    $surface.css('color', bgColor ? 'var(--app-text)' : 'var(--app-surface)');
    $('.ar').css('filter', bgColor ? 'brightness(0%)' : 'brightness(100%)').html(arrow);
  }

  updateClock();
  
};

function updateClock () {
  let timeDivisor = parseInt(client.settings.timeFormat ? client.settings.timeFormat : 12, 10);
  let today = new Date()
    , h = today.getHours() % timeDivisor;
  if (timeDivisor === 12) {
    h = (h === 0) ? 12 : h; // In the case of 00:xx, change to 12:xx for 12h time
  }
  if (timeDivisor === 24) {
    h = (h < 10) ? ("0" + h) : h; // Pad the hours with a 0 in 24h time
  }
  let m = today.getMinutes();
  if (m < 10) m = "0" + m;
  $('.tm').text(h + ":" + m);
}

client.init = function init () {

  console.log('Initializing clock');
  client.settings = browserSettings(client, window.serverSettings, $);
  client.unitMismatch = client.settings.units && window.serverSettings.settings.units &&
    client.settings.units !== window.serverSettings.settings.units;
  client.query();
  setInterval(client.query, 20 * 1000); // update every 20 seconds

  // time update
  setInterval(updateClock, 1000);
};

module.exports = client;
