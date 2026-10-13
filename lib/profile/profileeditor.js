'use strict';

// Phase 5b: pure profile-editor logic lives in lib/client-core/profile-editor/.
// This adapter still owns the jQuery/ajax/window glue but delegates record,
// profile, range, and migration operations to the pure modules below.
var coreProfileEditor = require('../client-core').profileEditor;
var coreRecords  = coreProfileEditor.records;
var coreProfiles = coreProfileEditor.profiles;
var coreRanges   = coreProfileEditor.ranges;
var coreMigrate  = coreProfileEditor.migrate;
var coreTime     = coreProfileEditor.timeUtils;
var coreBuildDefaultProfile = coreProfileEditor.buildDefaultProfile;
var toTextContent = require('../utils/html').toTextContent;

var init = function init () {
  //for the tests window isn't the global object
  var $ = window.$;
  var Nightscout = window.Nightscout;
  var client = Nightscout.client;

  var c_profile = null;

  //some commonly used selectors
  var peStatus = $('.pe_status');
  var timezoneInput = $('#pe_timezone');
  var databaseRecords = $('#pe_databaserecords');
  var timeInput = $('#pe_time');
  var dateInput = $('#pe_date');

  client.init(function loaded () {

  console.log("LOADING CLIENT INIT");
  if (c_profile !== null) {
      return; // already loaded so don't load again
  }

  var translate = client.translate;
  var cloneDeep = client.utils.cloneDeep;

  var defaultprofile = coreBuildDefaultProfile();

//  , 'startDate': new Date()
//  defaultprofile.startDate.setSeconds(0);
//  defaultprofile.startDate.setMilliseconds(0);

  var icon_add = '/brand/icons/plus.svg';
  var icon_remove = '/brand/icons/trash-empty.svg';
  //var icon_clone = '/brand/icons/copy.svg';
  //var icon_apply = '/brand/icons/check.svg';

  var mongorecords = [];
  var currentrecord = 0;
  var currentprofile = null;
  var dirty = false;

  // Fetch data from mongo
  peStatus.hide().text(translate('Loading profile records ...')).fadeIn('slow');
  $.ajax('/api/v1/profile.json?count=20', {
    headers: client.headers()
    , success: function (records) {
      if (!records.length) {
        records.push(defaultprofile);
      }
      client.profilefunctions.loadData(records); // do a conversion if needed
      mongorecords = cloneDeep(client.profilefunctions.data);
      // create new profile to be edited from last record
      if (mongorecords.length) {
        mongorecords.forEach(function eachMongoProfile (mongoprofile) {
          var migrationResult = coreMigrate.migrateRecordStore(mongoprofile, defaultprofile);
          migrationResult.mismatchedProfiles.forEach(function () {
            window.alert(translate('Time ranges of target_low and target_high don\'t  match. Values are restored to defaults.'));
          });
        });

        peStatus.hide().text(translate('Values loaded.')).fadeIn('slow');
      } else {
        mongorecords.push({
          defaultProfile: 'Default'
          , store : {
            'Default': cloneDeep(defaultprofile)
          }
          , startDate: new Date().toISOString()
        });
        peStatus.hide().text(translate('Default values used.')).fadeIn('slow');
      }
    }
    , error: function () {
      mongorecords.push({
        defaultProfile: 'Default'
        , store : {
          'Default': cloneDeep(defaultprofile)
        }
        , startDate: new Date().toISOString()
      });
      peStatus.hide().text(translate('Error. Default values used.')).fadeIn('slow');
    }
  }).done(initeditor);

  function initeditor() {
    $('#pe_history').toggle(client.settings.extendedSettings.profile && client.settings.extendedSettings.profile.history);
    $('#pe_multiple').toggle(client.settings.extendedSettings.profile && client.settings.extendedSettings.profile.multiple);

    // Load timezones
    timezoneInput.empty();
    client.ctx.timezones.forEach(function addTz(tz) {
      timezoneInput.append($('<option>').val(tz).text(client.language && typeof client.language.timezoneName === 'function' ? client.language.timezoneName(tz) : tz));
    });

    $('#pe_form').find('button').click(profileSubmit);

    $('#pe_profiles').unbind().bind('change', profileChange);
    $('#pe_profile_add').unbind().bind('click', profileAdd);
    $('#pe_profile_remove').unbind().bind('click', profileRemove);
    $('#pe_profile_clone').unbind().bind('click', profileClone);

    $('#pe_databaserecords').unbind().bind('change',recordChange);
    $('#pe_records_add').unbind().bind('click', recordAdd);
    $('#pe_records_remove').unbind().bind('click', recordRemove);
    $('#pe_records_clone').unbind().bind('click', recordClone);

    // Add handler for style switching
    $('#pe_perGIvalues').unbind().on('change', switchStyle);

    // display status
    $('#pe_units').text(client.settings.units);
    $('#pe_timeformat').text(client.settings.timeFormat+'h');
    $('#pe_title').text(client.settings.customTitle);

    currentprofile = mongorecords[currentrecord].defaultProfile;

    // prepare basal profiles
    initRecord();
    // hide unused style of ratios
    switchStyle();

    console.log('Done initeditor()');
  }

  function initRecord() {
    databaseRecords.empty();
    for (var r = 0; r < mongorecords.length; r++ ) {
      databaseRecords.append('<option value="' + r + '">' + translate('Valid from:') + ' ' + new Date(mongorecords[r].startDate).toLocaleString() + '</option>');
    }
    databaseRecords.val(currentrecord);

    timeInput.val(client.ctx.moment(mongorecords[currentrecord].startDate).format('HH:mm'));
    dateInput.val(client.ctx.moment(mongorecords[currentrecord].startDate).format('YYYY-MM-DD'));

    initProfile();
  }

  function timeDiffMinutes(time1, time2)
  {
    var minutes1 = toMinutesFromMidnight(time1);
    var minutes2 = toMinutesFromMidnight(time2);
    if (minutes2 <= minutes1) {
      minutes2 += 24*60;
    }
    return minutes2-minutes1;
  }
  function refreshTotalBasal()
  {
    GUIToObject();
    var total = 0;
    for (var i=0, len=c_profile['basal'].length; i<len; i++) {
      var time1 = c_profile['basal'][i].time;
      var time2 = c_profile['basal'][(i+1)%len].time;
      var value = c_profile['basal'][i].value;
      total += timeDiffMinutes(time1,time2) * value / 60
    }
    $('#pe_basalTotal_placeholder').html(Math.round(total*1000)/1000);
  }

  function initProfile() {
    var record = mongorecords[currentrecord];
    // fill profilenames
    $('#pe_profiles').empty();

    for (var key in record.store) {
      if (Object.prototype.hasOwnProperty.call(record.store,key)) {
        $('#pe_profiles').append($('<option>').val(key).text(toTextContent(key)));
      }
    }

    $('#pe_profiles').val(currentprofile);
    $('#pe_profile_name').val(currentprofile);

    c_profile = mongorecords[currentrecord].store[currentprofile];
    mongorecords[currentrecord].defaultProfile = currentprofile;
    // Set values from profile to html
    fillTimeRanges();
    refreshTotalBasal();
  }

  // Handling of record list box change
  function recordChange (event) {
    if (dirty && window.confirm(translate('Save current record before switching to new?'))) {
      profileSubmit();
    }
    currentrecord = databaseRecords.val();
    currentprofile = mongorecords[currentrecord].defaultProfile;
    initRecord();
    dirty = false;
    maybePreventDefault(event);
  }

  function recordAdd (event) {
    if (dirty && window.confirm(translate('Save current record before switching to new?'))) {
      profileSubmit();
    }
    var res = coreRecords.addRecord(mongorecords, defaultprofile);
    currentrecord = res.currentIndex;
    currentprofile = res.currentProfile;
    initRecord();
    dirty = true;
    maybePreventDefault(event);
  }

  function recordRemove (event) {
    if (mongorecords.length > 1 && window.confirm(translate('Delete record')+'?')) {
      if (mongorecords[currentrecord]._id) {
        $.ajax({
          method: 'DELETE'
          , url: '/api/v1/profile/'+mongorecords[currentrecord]._id
          , headers: client.headers()
        }).done(function postSuccess () {
          console.info('profile deleted');
          peStatus.hide().text(translate('Record removed')).fadeIn('slow');
          var res = coreRecords.removeRecord(mongorecords, currentrecord);
          currentrecord = res.currentIndex;
          currentprofile = res.currentProfile;
          initRecord();
          dirty = false;
        }).fail(function(xhr, status, errorThrown)  {
          console.error('Profile not removed', status, errorThrown);
          peStatus.hide().text(translate('Record removal failed')).fadeIn('slow');
        });
      } else {
        var res = coreRecords.removeRecord(mongorecords, currentrecord);
        currentrecord = res.currentIndex;
        currentprofile = res.currentProfile;
        initRecord();
        dirty = false;
      }
    }
    maybePreventDefault(event);
    return false;
  }

  function recordClone (event) {
    if (dirty && window.confirm(translate('Save current record before switching to new?'))) {
      profileSubmit();
    }
    GUIToObject();
    var res = coreRecords.cloneRecord(mongorecords, currentrecord);
    currentrecord = res.currentIndex;
    currentprofile = res.currentProfile;
    initRecord();
    dirty = true;

    maybePreventDefault(event);
  }

  // Handling of profile list box change
  function profileChange (event) {
    var record = mongorecords[currentrecord];
    var newpr = $('#pe_profiles').val();
    // copy values from html to c_profile
    GUIToObject();

    var newname = $('#pe_profile_name').val();
    if (!isNaN(newname)) newname = 'Profile' + newname;

    if (currentprofile !== newname) {
      // rename if already exists
      while (record.store[newname]) {
        newname += '1';
      }
      record.store[newname] = record.store[currentprofile];
      delete record.store[currentprofile];
      dirty = true;
    }
    if (newpr === currentprofile) { // fake call to update values
      newpr = newname;
    }
    currentprofile = newpr;
    initProfile();

    maybePreventDefault(event);
    return false;
  }

  function profileAdd (event) {
    var record = mongorecords[currentrecord];
    var res = coreProfiles.addProfile(record, defaultprofile);
    currentprofile = res.currentProfile;
    dirty = true;

    initProfile();
    maybePreventDefault(event);
    return false;
  }

  function profileRemove (event) {
    var record = mongorecords[currentrecord];
    var res = coreProfiles.removeProfile(record, currentprofile);
    if (res.removed) {
      currentprofile = res.currentProfile;
      initProfile();
      dirty = true;
    }

    maybePreventDefault(event);
    return false;
  }

  function profileClone (event) {
    GUIToObject();
    var record = mongorecords[currentrecord];
    var base = $('#pe_profile_name').val();
    var res = coreProfiles.cloneProfile(record, currentprofile, base);
    currentprofile = res.currentProfile;
    dirty = true;

    initProfile();
    maybePreventDefault(event);
    return false;
  }

  // Handling html events and setting/getting values
  function switchStyle(event) {
    if (!$('#pe_perGIvalues').is(':checked')) {
      $('#pe_simple').show('slow');
      $('#pe_advanced').hide('slow');
    } else {
      $('#pe_simple').hide('slow');
      $('#pe_advanced').show('slow');
    }
    maybePreventDefault(event);
  }

  function fillTimeRanges(event) {
    if (event) {
      GUIToObject();
    }

    function shouldAddTime(i, time, array) {
      if (i === 0 && time === 0) {
        return true;
      } else if (i === 0) {
        return false;
      } else {
        var minutesFromMidnight = toMinutesFromMidnight(c_profile[array][i - 1].time);
        return !isNaN(minutesFromMidnight) && minutesFromMidnight < time * 30;
      }
    }

    function addSingleLine(e,i) {
      var tr = $('<tr>');
      var select = $('<select>').attr('class','pe_selectabletime').attr('id',e.prefix+'_from_'+i);
      var lowest = -1;
      for (var t=0;t<48;t++) {
        if (shouldAddTime(i, t, e.array)) {
          if (lowest === -1) { lowest = t*30; }
          select.append('<option value="' + toTimeString(t*30) + '">' + toDisplayTime(t*30) + '</option>');
        }
      }
      var selectedValue = toMinutesFromMidnight(c_profile[e.array][i].time) * 30;
      select.val(selectedValue);

      tr.append($('<td>').append(translate('From') + ': ').append(select));
      tr.append($('<td>').append(e.label).append($('<input type="text">').attr('id',e.prefix+'_val_'+i).attr('value',c_profile[e.array][i].value).attr('class', e.prefix + '_value')));
      var icons_td = $('<td>').append($('<img>').attr('class','addsingle').attr('style','cursor:pointer').attr('title',translate('Add new interval before')).attr('src',icon_add).attr('array',e.array).attr('pos',i));
      if (c_profile[e.array].length>1) {
        icons_td.append($('<img>').attr('class','delsingle').attr('style','cursor:pointer').attr('title',translate('Delete interval')).attr('src',icon_remove).attr('array',e.array).attr('pos',i));
      }
      tr.append(icons_td);

      if (lowest>toMinutesFromMidnight(c_profile[e.array][i].time)) {
        c_profile[e.array][i].time = toTimeString(lowest);
      }
      return tr[0].outerHTML;
    }    // Fill dropdown boxes
    [{prefix:'pe_basal', array:'basal', label: translate('Basal rate') + ' : '},
     {prefix:'pe_ic', array:'carbratio', label: translate('I:C') + ' : '},
     {prefix:'pe_isf', array:'sens', label: translate('ISF') + ' : '}
    ].forEach(function (e) {
      var html = '<table>';
      for (var i=0; i<c_profile[e.array].length; i++) {
        html += addSingleLine(e,i);
      }
      html += '<tr><td></td><td></td><td><img class="addsingle" style="cursor:pointer" title="' + translate('Add new interval before') + '" src="'+icon_add+'" array="'+e.array+'" pos="'+i+'" href="#"></td></tr>';
      html += '</table>';
      $('#'+e.prefix+'_placeholder').html(html);
    });
    $('.pe_basal_value').on('change keyup paste', refreshTotalBasal);
    $('.addsingle').click(function addsingle_click() {
      var array = $(this).attr('array');
      var pos = $(this).attr('pos');
      GUIToObject();
      coreRanges.addRangeStop(c_profile[array], pos);
      var retVal = fillTimeRanges();
      refreshTotalBasal();
      return retVal;
    });

    $('.delsingle').click(function delsingle_click() {
      var array = $(this).attr('array');
      var pos = $(this).attr('pos');
      GUIToObject();
      coreRanges.removeRangeStop(c_profile[array], pos);
      var retVal = fillTimeRanges();
      refreshTotalBasal();
      return retVal;
    });

    function addBGLine(i) {
      var tr = $('<tr>');
      var select = $('<select>').attr('class','pe_selectabletime').attr('id','pe_targetbg_from_'+i);
      var lowesttime=-1;
      for (var t=0;t<48;t++) {
        if (shouldAddTime(i, t, 'target_low')) {
          if (lowesttime === -1) { lowesttime = t*30; }
          select.append('<option value="' + toTimeString(t*30) + '">' + toDisplayTime(t*30) + '</option>');
        }
      }
      var selectedValue = toMinutesFromMidnight(c_profile.target_low[i].time) * 30;
      select.val(selectedValue);
      tr.append($('<td>').append(translate('From') + ': ').append(select));
      tr.append($('<td>').append(translate('Low') + ' : ').append($('<input type="text">').attr('id','pe_targetbg_low_'+i).attr('value',c_profile.target_low[i].value)));
      tr.append($('<td>').append(translate('High') + ' : ').append($('<input type="text">').attr('id','pe_targetbg_high_'+i).attr('value',c_profile.target_high[i].value)));
      var icons_td = $('<td>').append($('<img>').attr('class','addtargetbg').attr('style','cursor:pointer').attr('title',translate('Add new interval before')).attr('src',icon_add).attr('pos',i));
      if (c_profile.target_low.length>1) {
        icons_td.append($('<img>').attr('class','deltargetbg').attr('style','cursor:pointer').attr('title',translate('Delete interval')).attr('src',icon_remove).attr('pos',i));
      }
      tr.append(icons_td);

      // Fix time to correct value after add or change
      if (lowesttime>toMinutesFromMidnight(c_profile.target_low[i].time)) {
        c_profile.target_low[i].time = toTimeString(lowesttime);
      }
      return tr[0].outerHTML;
    }


    // target BG
    var html = '<table>';
    for (var i=0; i<c_profile.target_low.length; i++) {
      html += addBGLine(i);
    }
    html += '<tr><td></td><td></td><td></td><td><img class="addtargetbg" style="cursor:pointer" title="' + translate('Add new interval before') + '" src="'+icon_add+'" pos="'+i+'" href="#"></td></tr>';
    html += '</table>';
    $('#pe_targetbg_placeholder').html(html);

    $('.addtargetbg').click(function addtargetbg_click() {
      var pos = $(this).attr('pos');
      GUIToObject();
      coreRanges.addTargetStop(c_profile.target_low, c_profile.target_high, pos);
      dirty = true;
      return fillTimeRanges();
    });

    $('.deltargetbg').click(function deltargetbg_click() {
      var pos = $(this).attr('pos');
      GUIToObject();
      coreRanges.removeTargetStop(c_profile.target_low, c_profile.target_high, pos);
      dirty = true;
      return fillTimeRanges();
    });

    $('.pe_selectabletime').unbind().on('change', fillTimeRanges).on('change', refreshTotalBasal);

    objectToGUI();
    maybePreventDefault(event);
    return false;
  }

  // fill GUI with values from c_profile object
  function objectToGUI() {

    $('#pe_dia').val(c_profile.dia);
    $('#pe_hr').val(c_profile.carbs_hr);
    $('#pe_perGIvalues').prop('checked', c_profile.perGIvalues);
    $('#pe_hr_high').val(c_profile.carbs_hr_high);
    $('#pe_hr_medium').val(c_profile.carbs_hr_medium);
    $('#pe_hr_low').val(c_profile.carbs_hr_low);
    $('#pe_delay_high').val(c_profile.delay_high);
    $('#pe_delay_medium').val(c_profile.delay_medium);
    $('#pe_delay_low').val(c_profile.delay_low);

    // find the right zone regardless of string case

    var foundCase = c_profile.timezone;

    if (foundCase != "") {
      var lcZone = c_profile.timezone.toLowerCase();

      client.ctx.timezones.forEach(function testCase(tz) {
        if (tz.toLowerCase() == lcZone) foundCase = tz;
      });
    }

    timezoneInput.val(foundCase);

    var index;
    [ { prefix:'pe_basal', array:'basal' },
      { prefix:'pe_ic',    array:'carbratio' },
      { prefix:'pe_isf',   array:'sens' }
    ].forEach(function (e) {
      for (index=0; index<c_profile[e.array].length; index++) {
        $('#'+e.prefix+'_from_'+index).val(c_profile[e.array][index].time);
        $('#'+e.prefix+'_val_'+index).val(c_profile[e.array][index].value);
      }
    });

    for (index=0; index<c_profile.target_low.length; index++) {
      $('#pe_targetbg_from_'+index).val(c_profile.target_low[index].time);
      $('#pe_targetbg_low_'+index).val(c_profile.target_low[index].value);
      $('#pe_targetbg_high_'+index).val(c_profile.target_high[index].value);
    }
    //console.info(JSON.stringify(c_profile));
  }

  // Grab values from html GUI to object
  function GUIToObject() {
    var oldProfile = cloneDeep(c_profile);

    c_profile.units = client.settings.units;

    c_profile.dia = parseFloat($('#pe_dia').val());
    c_profile.carbs_hr = parseInt($('#pe_hr').val());
    c_profile.delay = 20;
    c_profile.perGIvalues = $('#pe_perGIvalues').is(':checked');
    c_profile.carbs_hr_high = parseInt($('#pe_hr_high').val());
    c_profile.carbs_hr_medium = parseInt($('#pe_hr_medium').val());
    c_profile.carbs_hr_low = parseInt($('#pe_hr_low').val());
    c_profile.delay_high = parseInt($('#pe_delay_high').val());
    c_profile.delay_medium = parseInt($('#pe_delay_medium').val());
    c_profile.delay_low = parseInt($('#pe_delay_low').val());

    // If the zone in the profile matches the editor profile
    // but case is different, preserve case

    var zone = timezoneInput.val();

    if (c_profile.timezone.toLowerCase() == timezoneInput.val().toLowerCase()) zone = c_profile.timezone;

    c_profile.timezone = zone;

    var index;
    [ { prefix:'pe_basal', array:'basal' },
      { prefix:'pe_ic',    array:'carbratio' },
      { prefix:'pe_isf',   array:'sens' }
    ].forEach(function (e) {
      for (index=0; index<c_profile[e.array].length; index++) {
        c_profile[e.array][index].time = $('#'+e.prefix+'_from_'+index).val();
        c_profile[e.array][index].value = parseFloat($('#'+e.prefix+'_val_'+index).val());
      }
    });

    for (index=0; index<c_profile.target_low.length; index++) {
      var input = $('#pe_targetbg_from_' + index);
      c_profile.target_low[index].time = input.val();
      c_profile.target_low[index].value = parseFloat($('#pe_targetbg_low_'+index).val());
      c_profile.target_high[index].time = input.val();
      c_profile.target_high[index].value = parseFloat($('#pe_targetbg_high_'+index).val());
    }
    if (JSON.stringify(oldProfile) !== JSON.stringify(c_profile)) {
      dirty = true;
    }
  }
  /**
   * @param {string} time
   * @returns {number}
   */
  function toMinutesFromMidnight(time) {
    return coreTime.toMinutesFromMidnight(time);
  }

  function toTimeString(minfrommidnight) {
    return coreTime.toTimeString(minfrommidnight);
  }

  function toDisplayTime (minfrommidnight) {
    var time = client.ctx.moment.utc().startOf('day').add(minfrommidnight,'minutes'); // using utc to avoid daylight saving offset
    return client.settings.timeFormat === 24 ? time.format('HH:mm') : time.format('h:mm A');
  }

  function profileSubmit(event) {
    if (!client.hashauth.isAuthenticated()) {
      window.alert(translate('Your device is not authenticated yet'));
      return false;
    }

    profileChange(event);
    var record = mongorecords[currentrecord];
    record.startDate = new Date(client.utils.mergeInputTime(timeInput.val(), dateInput.val())).toISOString( );
    record.created_at = new Date().toISOString( );
    record.srvModified = new Date().getTime(); // remove when switching to v3 API

    var adjustedRecord = cloneDeep(record);

    for (var key in adjustedRecord.store) {
      if (Object.prototype.hasOwnProperty.call(adjustedRecord.store,key)) {
        var profile = adjustedRecord.store[key];
        if (!profile?.perGIvalues) {
          delete profile.perGIvalues;
          delete profile.carbs_hr_high;
          delete profile.carbs_hr_medium;
          delete profile.carbs_hr_low;
          delete profile.delay_high;
          delete profile.delay_medium;
          delete profile.delay_low;
        }
      }
    }
    adjustedRecord.defaultProfile = currentprofile;
    adjustedRecord.units = client.settings.units;

    delete record.convertedOnTheFly;
    delete adjustedRecord.convertedOnTheFly;

    console.info('saving profile');
    peStatus.hide().text(translate('Saving profile')).fadeIn('slow');

    // Hide the form until the ajax PUT is done.
    // This is a crude way of preventing the user from changing the inputs whilst waiting.
    // If the user was able to make changes, they'd be lost when the done callback redraws anyway.
    $('#pe_form').hide();
    var headers = client.headers();
    headers['Content-Type'] = 'application/json';
    $.ajax({
      method: 'PUT'
      , url: '/api/v1/profile/'
      , data: JSON.stringify(adjustedRecord)
      , headers: headers
    }).done(function postSuccess (data) {
      console.info('profile saved', data);
      $('#pe_form').show(); // allow edits again
      peStatus.hide().text(translate('Record saved')).fadeIn('slow');
      record._id = data._id;
      initRecord();
      dirty = false;
    }).fail(function(xhr, status, errorThrown)  {
      console.error('Profile not saved', status, errorThrown);
      $('#pe_form').show(); // allow edits again
      peStatus.hide().text(translate('Record save failed')).fadeIn('slow');
    });
    return false;
  }

  function maybePreventDefault (event) {
    if (event) {
      event.preventDefault();
    }
  }
  });
};

module.exports = init;
