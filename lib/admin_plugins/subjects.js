'use strict';

var toTextContent = require('../utils/html').toTextContent;

var subjects = {
  name: 'subjects'
  , label: 'Subjects - People, Devices, etc'
  , pluginType: 'admin'
};

function init () {
  return subjects;
}

module.exports = init;

var $status = null;

subjects.actions = [{
  description: 'Each subject will have a unique access token and 1 or more roles.  Click on the access token to open a new view with the selected subject, this secret link can then be shared.'
  , buttonLabel: 'Add new Subject'
  , init: function init (client, callback) {
    $status = $('#admin_' + subjects.name + '_0_status');
    $status.hide().text(client.translate('Loading database ...')).fadeIn('slow');
    var table = $('<table id="admin_subjects_table">').css('margin-top', '0.625rem');
    $('#admin_' + subjects.name + '_0_html').append(table).append(genDialog(client));
    reload(client, callback);
  }
  , preventClose: true
  , code: function createNewSubject (client, callback) {
    openDialog({}, client, callback);
  }
}];

function createOrSaveSubject (subject, client, callback) {

  var method = !subject?._id ? 'POST' : 'PUT';

  $.ajax({
    method: method
    , url: '/api/v2/authorization/subjects/'
    , headers: client.headers()
    , data: subject
  }).done(function success () {
    reload(client, callback);
  }).fail(function fail (err) {
    console.error('Unable to ' + method + ' Subject', err.responseText);
    window.alert(client.translate('Unable to save Subject'));
    if (callback) {
      callback();
    }
  });
}

function deleteSubject (subject, client, callback) {
  $.ajax({
    method: 'DELETE'
    , url: '/api/v2/authorization/subjects/' + subject._id
    , headers: client.headers()
  }).done(function success () {
    reload(client, callback);
  }).fail(function fail (err) {
    console.error('Unable to delete Subject', err.responseText);
    window.alert(client.translate('Unable to delete Subject'));
    if (callback) {
      callback();
    }
  });
}

function reload (client, callback) {
  $.ajax({
    method: 'GET'
    , url: '/api/v2/authorization/subjects'
    , headers: client.headers()
  }).done(function success (records) {
    subjects.records = records;
    $status.hide().text(client.translate('Database contains %1 subjects', { params: [records.length] })).fadeIn('slow');
    showSubjects(records, client);
    if (callback) {
      callback();
    }
  }).fail(function fail (err) {
    $status.hide().text(client.translate('Error loading database')).fadeIn('slow');
    subjects.records = [];
    if (callback) {
      callback(err);
    }
  });
}

function genDialog (client) {
  var ret =
    '<div id="editsubjectdialog" style="display:none" title="' + client.translate('Edit Subject') + '">' +
    '      <label for="edsub_name">' +
    client.translate('Name') +
    '          <input id="edsub_name" placeholder="' + client.translate('person, device, etc') + '"/>' +
    '      </label>' +
    '      <br>' +
    '      <label for="edsub_roles">' +
    client.translate('Roles') +
    '          <input id="edsub_roles" placeholder="' + client.translate('role1, role2') + '"/>' +
    '      </label>' +
    '      <br>' +
    '      <label for="edsub_notes">' + client.translate('Additional Notes, Comments') + '</label>' +
    '      <textarea id="edsub_notes" style="width:18.75rem"></textarea><br>' +
    '   </div>';

  return $(ret);
}

function openDialog (subject, client) {
  $('#editsubjectdialog').dialog({
    width: 360
    , height: 300
    , modal: true
    , buttons: [
      {
        text: client.translate('Save')
        , class: 'leftButton'
        , click: function() {
          subject.name = $('#edsub_name').val();
          subject.roles =
            $('#edsub_roles').val().toLowerCase().split(/[;, ]/)
            .map(role => role.trim())
            .filter(role => role.length > 0)
            .sort();
          subject.notes = $('#edsub_notes').val();

          var self = this;
          createOrSaveSubject(subject, client, function callback () {
            $(self).dialog('close');
          });
        }
      }
      , {
        text: client.translate('Cancel')
        , click: function() { $(this).dialog('close'); }
      }
    ]
    , open: function() {
      $(this).parent().css('box-shadow', 'var(--app-shadow-overlay)');
      $(this).parent().find('.ui-dialog-buttonset').css({ 'width': '100%', 'text-align': 'right' });
      $(this).parent().find('button:contains("' + client.translate('Save') + '")').css({ 'float': 'left' });
      $('#edsub_name').val(subject.name || '').focus();
      $('#edsub_roles').val(subject.roles ? subject.roles.join(', ') : '');
      $('#edsub_notes').val(subject.notes || '');
    }

  });

}

function showSubject (subject, table, client) {
  var editIcon = $('<img title="' + client.translate('Edit this subject') + '" style="cursor:pointer" src="/brand/icons/edit.svg">');
  editIcon.click(function clicked () {
    openDialog(subject, client);
  });
  var deleteIcon = $('<img title="' + client.translate('Delete this subject') + '" style="cursor:pointer" src="/brand/icons/trash-empty.svg">');
  deleteIcon.click(function clicked () {
    var ok = window.confirm(client.translate('Are you sure you want to delete: ') + subject.name);
    if (ok) {
      deleteSubject(subject, client);
    }
  });
  var token = subject.accessToken || '';
  var tokenLink = $('<a>').attr('href', '/?token=' + encodeURIComponent(token)).attr('target', '_blank').text(toTextContent(token));
  table.append($('<tr>').css('background-color', 'var(--app-surface)')
    .append($('<td>').attr('width', '20%').append(editIcon).append(deleteIcon).append($('<span>').text(toTextContent(subject.name))))
    .append($('<td>').attr('width', '20%').text(toTextContent(subject.roles ? subject.roles.join(', ') : client.translate('[none]'))))
    .append($('<td>').attr('width', '20%').append(tokenLink))
    .append($('<td>').attr('width', '10%').text(toTextContent(subject.notes ? subject.notes : '')))
  );
}

function showSubjects (subjects, client) {
  var table = $('#admin_subjects_table');
  table.empty().append($('<tr>').css('background', 'var(--app-surface-sunken)')
    .append($('<th>').css('width', '6.25rem').attr('align', 'left').append(client.translate('Name')))
    .append($('<th>').css('width', '9.375rem').attr('align', 'left').append(client.translate('Roles')))
    .append($('<th>').css('width', '9.375rem').attr('align', 'left').append(client.translate('Access Token')))
    .append($('<th>').css('width', '9.375rem').attr('align', 'left').append(client.translate('Notes')))
  );
  for (var t = 0; t < subjects.length; t++) {
    showSubject(subjects[t], table, client);
  }
}
