'use strict';

var htmlUtils = require('../utils/html');

var init = function init () {

//for the tests window isn't the global object
var $ = window.$;
var Nightscout = window.Nightscout;
var client = Nightscout.client;

client.init(function loaded () {
  var translate = client.translate;

  var foodrec_template = {
      _id: ''
    , type: 'food'
    , category: ''
    , subcategory: ''
    , name: ''
    , portion: 0
    , carbs: 0
    , fat: 0 // in grams
    , protein: 0 // in grams
    , energy: 0 // in kJ
    , gi: 2
    , unit: 'g'
  };

  var foodunits = ['g', 'ml', 'pcs', 'oz'];

  var foodrec = JSON.parse(JSON.stringify(foodrec_template));

  var HIDDEN = 99999;
  var quickpickrec_template = {
      _id: ''
    , type: 'quickpick'
    , name: ''
    , foods: []
    , carbs: 0
    , hideafteruse: true
    , hidden: false
    , position: HIDDEN
  };

  var filter = {
      category: ''
    , subcategory: ''
    , name: ''
  };

  //https://www.iconfinder.com/iconsets/musthave
  //var icon_add = '/brand/icons/plus.svg';
  var icon_remove = '/brand/icons/trash-empty.svg';
  var icon_edit = '/brand/icons/edit.svg';
  var icon_up = '/brand/icons/up.svg';

  var foodlist = [];
  var foodquickpick = [];
  var foodquickpicktodelete = [];
  var showhidden = false;
  var categories = Object.create(null);

  function restoreBoolValue(record,key) {
    if (typeof record[key] !== 'undefined') {
      record[key] = record[key] === 'true';
    }
  }

  // Fetch data from mongo
  $('#fe_status').hide().text(translate('Loading food database ...')).fadeIn('slow');
  $.ajax('/api/v1/food.json', {
    headers: client.headers()
    , success: function ajaxSuccess(records) {
      records.forEach(function processRecords(r) {
        restoreBoolValue(r,'hidden');
        restoreBoolValue(r,'hideafteruse');
        if (r.type === 'food') {
          foodlist.push(r);
          if (r.category && !Object.prototype.hasOwnProperty.call(categories, r.category)) {
            categories[r.category] = Object.create(null);
          }
          if (r.category && r.subcategory) {
            categories[r.category][r.subcategory] = true;
          }
        } else if (r.type === 'quickpick') {
          calculateCarbs(foodquickpick.push(r)-1);
          console.log('Loaded quick pick: ',r);
        } else {
          console.log('Unknown food database record');
        }
      });
      $('#fe_status').hide().text(translate('Database loaded')).fadeIn('slow');
      foodquickpick.sort(function compare(a,b) { return cmp(parseInt(a.position),parseInt(b.position)) });
    }
    , error: function ajaxError() {
      $('#fe_status').hide().text(translate('Error: Database failed to load')).fadeIn('slow');
    }
  }).done(initeditor);

  function initeditor() {
    // Add handlers for gui
    $('#fe_editcreate').click(foodSubmit);
    $('#fe_clear').click(clearRec);
    $('#fe_id').change(updateSaveButton);
    $('#fe_quickpick_add').click(quickpickCreateRecord);
    $('#fe_quickpick_save').click(quickpickSave);
    $('#fe_filter_category').change(fillFilterSubcategories);
    $('#fe_filter_subcategory').change(doFilter);
    $('#fe_quickpick_showhidden').change(showHidden);
    $('#fe_filter_name').on('input',doFilter);
    $('#fe_category_list').change(function categoryListChange(event) {
      $('#fe_category').val($('#fe_category_list').val());
      fillEditSubcategories(event);
    });
    $('#fe_subcategory_list').change(function subcategoryListChange(event) {
      $('#fe_subcategory').val($('#fe_subcategory_list').val());
      event.preventDefault();
    });
    $('#fe_unit').empty();
    for (var u=0; u<foodunits.length; u++) {
      $('#fe_unit').append(new Option(translate(foodunits[u]),foodunits[u]));
    }

    // Set values from profile to html
    fillForm();
    // show proper submit button
    updateSaveButton();

    console.log('Done initeditor()');
  }

  function updateSaveButton(event) {
    if($('#fe_id').val()==='') {
      $('#fe_editcreate').text(translate('Create new record'));
    } else {
      $('#fe_editcreate').text(translate('Save record'));
    }
     maybePreventDefault(event);
  }

  function fillFilterSubcategories(event) {
    var s;
    maybePreventDefault(event,GUIToObject);

    filter.subcategory = '';
    $('#fe_filter_subcategory').empty().append(new Option(translate('(none)'),''));
    if (filter.category !== '') {
      for (s in categories[filter.category]) {
        if (Object.prototype.hasOwnProperty.call(categories[filter.category],s)) {
          $('#fe_filter_subcategory').append(new Option(htmlUtils.toTextContent(s),s));
        }
      }
    }
    doFilter();
  }

  function fillEditSubcategories(event) {
    maybePreventDefault(event,GUIToObject);

    var s;
    foodrec.subcategory = '';
    $('#fe_subcategory_list').empty().append(new Option(translate('(none)'),''));
    if (foodrec.category !== '') {
      for (s in categories[foodrec.category]) {
        if (Object.prototype.hasOwnProperty.call(categories[foodrec.category],s)) {
          $('#fe_subcategory_list').append(new Option(htmlUtils.toTextContent(s),s));
        }
      }
    }
    $('#fe_subcategory').val('');
  }

  function doEdit(event) {
    var index = $(this).attr('index');
    foodrec = JSON.parse(JSON.stringify(foodlist[index]));
    objectToGUI();
    updateSaveButton();
    maybePreventDefault(event);
    return false;
  }

  function updateFoodArray(newrec) {
    for (var i=0; i<foodlist.length; i++) {
      if (foodlist[i]._id === newrec._id) {
        foodlist[i] = JSON.parse(JSON.stringify(newrec));
        if (newrec.category && !Object.prototype.hasOwnProperty.call(categories, newrec.category)) {
          categories[newrec.category] = Object.create(null);
        }
        if (newrec.category && newrec.subcategory) {
          categories[newrec.category][newrec.subcategory] = true;
        }
        return;
      }
    }
  }

  function fillForm(event) {
    $('#fe_filter_category').empty().append(new Option(translate('(none)'),''));
    $('#fe_category_list').empty().append(new Option(translate('(none)'),''));
    for (var s in categories) {
      if (Object.prototype.hasOwnProperty.call(categories,s)) {
        $('#fe_filter_category').append(new Option(htmlUtils.toTextContent(s),s));
        $('#fe_category_list').append(new Option(htmlUtils.toTextContent(s),s));
      }
    }
    fillFilterSubcategories();
    drawQuickpick();

    objectToGUI();
    maybePreventDefault(event);
    return false;
  }

  function doFilter(event) {
    if (event) {
      GUIToObject();
    }

    $('#fe_data_header')
      .empty()
      .append($('<span>').attr('class','width50px'))
      .append($('<span>').attr('class','width200px').append(translate('Name')))
      .append($('<span>').attr('class','width150px').css('text-align','center').append(translate('Portion')))
      .append($('<span>').attr('class','width50px').css('text-align','center').append(translate('Unit')))
      .append($('<span>').attr('class','width100px').css('text-align','center').append(translate('Carbs')))
      .append($('<span>').attr('class','width100px').css('text-align','center').append(translate('GI')+' [1-3]'))
      .append($('<span>').attr('class','width150px').append(translate('Category')))
      .append($('<span>').attr('class','width150px').append(translate('Subcategory')))
      .append($('<span>').attr('class','width100px').append(translate('Fat [g]')))
      .append($('<span>').attr('class','width100px').append(translate('Protein [g]')))
      .append($('<span>').attr('class','width100px').append(translate('Energy [kJ]')));

    $('#fe_data').empty();

    for (var i=0; i<foodlist.length; i++) {
      if (filter.category !== '' && foodlist[i].category !== filter.category) { continue; }
      if (filter.subcategory !== '' && foodlist[i].subcategory !== filter.subcategory) { continue; }
      if (filter.name !== '' && foodlist[i].name.toLowerCase().indexOf(filter.name.toLowerCase()) < 0) { continue; }

      $('#fe_data')
        .append($('<div>').attr('index',i).addClass('draggablefood')
          .append($('<span>').addClass('width50px')
            .append($('<img>').attr('title',translate('Edit record')).attr('src',icon_edit).attr('index',i).attr('class','fe_editimg'))
            .append($('<img>').attr('title',translate('Delete record')).attr('src',icon_remove).attr('index',i).attr('class','fe_removeimg'))
          )
          .append($('<span>').addClass('width200px').text(htmlUtils.toTextContent(foodlist[i].name)))
          .append($('<span>').addClass('width150px').css('text-align','center').text(htmlUtils.toTextContent(foodlist[i].portion)))
          .append($('<span>').addClass('width50px').css('text-align','center').text(htmlUtils.toTextContent(foodlist[i].unit)))
          .append($('<span>').addClass('width100px').css('text-align','center').text(htmlUtils.toTextContent(foodlist[i].carbs)))
          .append($('<span>').addClass('width100px').css('text-align','center').text(htmlUtils.toTextContent(foodlist[i].gi)))
          .append($('<span>').addClass('width150px').text(htmlUtils.toTextContent(foodlist[i].category)))
          .append($('<span>').addClass('width150px').text(htmlUtils.toTextContent(foodlist[i].subcategory)))
          .append($('<span>').addClass('width100px').text(htmlUtils.toTextContent(foodlist[i].fat)))
          .append($('<span>').addClass('width100px').text(htmlUtils.toTextContent(foodlist[i].protein)))
          .append($('<span>').addClass('width100px').text(htmlUtils.toTextContent(foodlist[i].energy)))
        );
    }

    $('.fe_editimg').click(doEdit);
    $('.fe_removeimg').click(deleteFoodRecord);

    $('.draggablefood').draggable({
      helper: function keepDraggedSize(){
        return $(this).clone().width($(this).width()).height($(this).height());
      },
      scope: 'foodlist',
      revert: 'invalid'
    });
    maybePreventDefault(event);
  }

  function deleteQuickpickRecord(event) {
    var index = $(this).attr('index');
    foodquickpicktodelete.push(foodquickpick[index]._id);
    foodquickpick.splice(index,1);
    drawQuickpick();
    maybePreventDefault(event);
    return false;
  }

  function deleteFoodRecord(event) {
    var index = $(this).attr('index');
    deleteRecord(foodlist[index]._id);
    foodlist.splice(index,1);
    fillForm();
    maybePreventDefault(event);
    return false;
  }

  function showHidden(event) {
    GUIToObject();
    drawQuickpick();
    maybePreventDefault(event);
    return false;
  }

  function drawQuickpick() {

    function addHeaderOrHint(q,i) {
      if (q.foods.length) {
        $('#fe_qpfieldset_'+i)
          .append($('<span>').addClass('width50px'))
          .append($('<span>').addClass('width200px').append(translate('Name')))
          .append($('<span>').addClass('width150px').css('text-align','center').append(translate('Portion')))
          .append($('<span>').addClass('width100px').css('text-align','center').append(translate('Carbs')))
          .append($('<br>'));
      } else {
        $('#fe_qpfieldset_'+i)
          .append($('<i>').append('-&gt; ' + translate('Drag&drop food here')));
      }
    }

    function addHiddenCount(hiddentotal) {
      $('#fe_quickpick_hiddencount').text(hiddentotal ? (' ('+hiddentotal+')') : '');
    }

    var hiddentotal = 0;
    $('#fe_picklist').empty();
    for (var i=0; i<foodquickpick.length; i++) {
      var q = foodquickpick[i];
      if (showhidden === false && q.hidden) { hiddentotal++; continue; }
      $('#fe_picklist')
        .append($('<fieldset>').attr('id','fe_qpfieldset_'+i).addClass('sortablequickpick').attr('index',i).attr('_id',q._id)
          .append($('<legend>')
            .append($('<img>').attr('title',translate('Move to the top')).attr('src',icon_up).attr('index',i).addClass('fe_qpupimg'))
            .append(' | ')
            .append($('<img>').attr('title',translate('Delete record')).attr('src',icon_remove).attr('index',i).addClass('fe_qpremoveimg'))
            .append(' | ' + translate('Name') + ': ')
            .append($('<input type="text">').addClass('fe_qpname').attr('index',i).val(htmlUtils.toTextContent(q.name)))
            .append($('<input type="checkbox">').addClass('fq_hidden').attr('index',i).prop('checked',q.hidden))
            .append(translate('Hidden'))
            .append($('<input type="checkbox">').addClass('fq_hideafteruse').attr('index',i).prop('checked',q.hideafteruse))
            .append(translate('Hide after use'))
            .append(' | ' + translate('Carbs') + ': ' + q.carbs.toFixed(0) + ' g')
          )
        );

      addHeaderOrHint(q,i);

      for (var j=0;j<q.foods.length; j++) {
        var r = q.foods[j];
        $('#fe_qpfieldset_'+i)
          .append($('<div>').attr('id','fqp_food_'+i+'_'+j).addClass('fe_foodinsideqp')
            .append($('<span>').addClass('width50px')
              .append($('<img>').attr('title',translate('Delete record')).attr('src',icon_remove).attr('index',i).attr('findex',j).addClass('fe_qpfoodremoveimg'))
            )
            .append($('<span>').addClass('width200px').text(htmlUtils.toTextContent(r.name)))
            .append($('<span>').addClass('width150px').css('text-align','center').text(htmlUtils.toTextContent(r.portion)))
            .append($('<span>').addClass('width100px').css('text-align','center').text(htmlUtils.toTextContent(r.carbs)))
            .append(translate('Portions')+': ')
            .append($('<input type="text">').attr('id','fq_portions_'+q._id+'_'+j).attr('index',i).attr('findex',j).attr('value',r.portions).addClass('fe_qpportions'))
          );
      }
    }

    $('.fe_qpupimg').click(quickpickMoveToTop);
    $('.fe_qpremoveimg').click(deleteQuickpickRecord);
    $('.fe_qpfoodremoveimg').click(deleteQuickpickFood);
    $('.fe_qpportions').change(savePortions);

    addHiddenCount(hiddentotal);

    $('.fe_qpname').change(function nameChange(event) {
      var index = $(this).attr('index');
      foodquickpick[index].name = $(this).val();
      event.preventDefault();
    });
    $('.fq_hidden').change(function hiddenChange(event) {
      var index = $(this).attr('index');
      foodquickpick[index].hidden = this.checked;
      if (!this.checked) {
        foodquickpick.splice(0, 0, foodquickpick.splice(index, 1)[0]);
      }
      drawQuickpick();
      event.preventDefault();
    });

    $('.fq_hideafteruse').change(function hideAfterUseChange(event) {
      var index = $(this).attr('index');
      foodquickpick[index].hideafteruse = this.checked;
      event.preventDefault();
    });

    $('.sortablequickpick').droppable({
      hoverClass: 'ui-state-hover',
      drop: dropFood,
      scope: 'foodlist',
      greedy: true
    });
    $('#fe_picklist').sortable({
        revert: true
      , axis: 'y'
      , placeholder: 'highlight'
      , update: resortArray
    });
  }

  function savePortions(event) {
    var index = $(this).attr('index');
    var findex = $(this).attr('findex');
    var val = parseFloat($(this).val().replace(/,/g,'.'));
    foodquickpick[index].foods[findex].portions=val;
    calculateCarbs(index);
    drawQuickpick();
    event.preventDefault();
    return false;
  }

  function deleteQuickpickFood(event) {
    var index = $(this).attr('index');
    var findex = $(this).attr('findex');
    foodquickpick[index].foods.splice(findex,1);
    calculateCarbs(index);
    drawQuickpick();
    event.preventDefault();
    return false;
  }

  function dropFood(event,ui) {

    var item = ui.draggable;
    var fi = foodlist[item.attr('index')];

    var qi = $(this).attr('index');
    var q = foodquickpick[qi];

    fi.portions = 1;
    q.foods.push(fi);
    calculateCarbs(qi);

    drawQuickpick();
  }

  function calculateCarbs(index) {
    var qp = foodquickpick[index];
    qp.carbs = 0;
    if (qp.foods) {
      for (var j=0;j<qp.foods.length; j++) {
        qp.carbs += qp.foods[j].carbs * qp.foods[j].portions;
      }
    } else {
      qp.foods = [];
    }
  }

  function resortArray(event,ui) {
    var oldArrayIndex = Number(ui.item.attr('index'));
    // Hidden quick picks are absent from the DOM. Use an adjacent record's
    // array index so pointer and keyboard sorting preserve those records.
    var nextItem = ui.item.nextAll('.sortablequickpick').first();
    var previousItem = ui.item.prevAll('.sortablequickpick').first();
    var anchorIndex = nextItem.length ? Number(nextItem.attr('index'))
      : previousItem.length ? Number(previousItem.attr('index')) + 1 : oldArrayIndex;
    var newHtmlIndex = anchorIndex > oldArrayIndex ? anchorIndex - 1 : anchorIndex;
    var draggeditem = foodquickpick.splice(oldArrayIndex, 1)[0];
    foodquickpick.splice(newHtmlIndex, 0, draggeditem);
    event.stopPropagation();
    drawQuickpick();
    console.log(foodquickpick);
    return;
  }

  function quickpickMoveToTop(event) {
    var index = $(this).attr('index');
    foodquickpick.splice(0, 0, foodquickpick.splice(index, 1)[0]);
    drawQuickpick();
    maybePreventDefault(event);
    return false;
  }

  // fill GUI with values from object
  function objectToGUI() {
    $('#fe_filter_category').val(filter.category);
    $('#fe_filter_subcategory').val(filter.subcategory);
    $('#fe_filter_name').val(filter.name);

    $('#fe_id').val(foodrec._id);
    $('#fe_category').val(foodrec.category);
    $('#fe_subcategory').val(foodrec.subcategory);
    $('#fe_name').val(foodrec.name);
    $('#fe_portion').val(foodrec.portion ? foodrec.portion : '');
    $('#fe_unit').val(foodrec.unit);
    $('#fe_carbs').val(foodrec.carbs ? foodrec.carbs : '')
    $('#fe_gi').val(foodrec.gi)
    $('#fe_fat').val(foodrec.fat ? foodrec.fat : '')
    $('#fe_protein').val(foodrec.protein ? foodrec.protein : '')
    $('#fe_energy').val(foodrec.energy ? foodrec.energy : '');

    $('#fe_quickpick_showhidden').prop('checked',showhidden);

    console.info(JSON.stringify(foodrec));
  }

  function GUIToObject() {
    // Grab values from html GUI to object
    filter.category = $('#fe_filter_category').val();
    filter.subcategory = $('#fe_filter_subcategory').val();
    filter.name = $('#fe_filter_name').val();

    foodrec._id = $('#fe_id').val();
    foodrec.category = $('#fe_category').val();
    foodrec.subcategory = $('#fe_subcategory').val();
    foodrec.name = $('#fe_name').val();
    foodrec.portion = parseInt($('#fe_portion').val());
    foodrec.portion = foodrec.portion || 0;
    foodrec.unit = $('#fe_unit').val();
    foodrec.carbs = parseInt($('#fe_carbs').val());
    foodrec.carbs = foodrec.carbs || 0;
    foodrec.fat = parseInt($('#fe_fat').val());
    foodrec.fat = foodrec.fat || 0;
    foodrec.protein = parseInt($('#fe_protein').val());
    foodrec.protein = foodrec.protein || 0;
    foodrec.energy = parseInt($('#fe_energy').val());
    foodrec.energy = foodrec.energy || 0;
    foodrec.gi = parseInt($('#fe_gi').val());

    showhidden = $('#fe_quickpick_showhidden').is(':checked');
  }

  function clearRec(event) {
    foodrec = JSON.parse(JSON.stringify(foodrec_template));
    objectToGUI();
    updateSaveButton();
    maybePreventDefault(event);
    return false;
  }

  function foodSubmit(event) {
    GUIToObject();

    if (!client.hashauth.isAuthenticated()) {
      alert(translate('Your device is not authenticated yet'));
      maybePreventDefault(event);
      return false;
    }

    if ($('#fe_editcreate').text().indexOf(translate('Create new record'))>-1) {

      // remove _id when creating new record
      delete foodrec._id;

      $.ajax({
        method: 'POST',
        url: '/api/v1/food/',
        data: foodrec,
        headers: client.headers()
      }).done(function success (response) {
        $('#fe_status').hide().text(translate('Record saved')).fadeIn('slow');
        foodrec._id = response[0]._id;
        foodlist.push(foodrec);
        if (foodrec.category && !Object.prototype.hasOwnProperty.call(categories, foodrec.category)) {
          categories[foodrec.category] = Object.create(null);
        }
        if (foodrec.category && foodrec.subcategory) {
          categories[foodrec.category][foodrec.subcategory] = true;
        }
        clearRec();
        fillForm();
       }).fail(function fail() {
        $('#fe_status').hide().text(translate('Error')).fadeIn('slow');
      });
    } else {
      // Update record
      $.ajax({
        method: 'PUT',
        url: '/api/v1/food/',
        data: foodrec,
        headers: client.headers()
      }).done(function success () {
        $('#fe_status').hide().text(translate('Record saved')).fadeIn('slow');
        updateFoodArray(foodrec);
        clearRec();
        fillForm();
       }).fail(function fail() {
        $('#fe_status').hide().text(translate('Error')).fadeIn('slow');
      });
    }
    maybePreventDefault(event);
    return false;
  }

  function deleteRecord(_id) {
    if (!client.hashauth.isAuthenticated()) {
      alert(translate('Your device is not authenticated yet'));
      maybePreventDefault(event);
      return false;
    }

    $.ajax({
      method: 'DELETE',
      url: '/api/v1/food/'+_id,
      data: foodrec,
      headers: client.headers()
    }).done(function success () {
      $('#fe_status').hide().text(translate('Record removed')).fadeIn('slow');
     }).fail(function fail() {
      $('#fe_status').hide().text(translate('Error')).fadeIn('slow');
    });

    return false;
  }

  function updateRecord(foodrec) {
    if (!client.hashauth.isAuthenticated()) {
      alert(translate('Your device is not authenticated yet'));
      maybePreventDefault(event);
      return false;
    }

    $.ajax({
      method: 'PUT',
      url: '/api/v1/food/',
      data: foodrec,
      headers: client.headers()
    }).done(function success (response) {
      console.log('Updated record: ',response);
    });
  }

  function quickpickCreateRecord(event) {
    var newrec = JSON.parse(JSON.stringify(quickpickrec_template));

    if (!client.hashauth.isAuthenticated()) {
      alert(translate('Your device is not authenticated yet'));
      maybePreventDefault(event);
      return false;
    }

    // remove _id when creating new record
    delete newrec._id;

    $.ajax({
      method: 'POST',
      url: '/api/v1/food/',
      data: newrec,
      headers: client.headers()
    }).done(function success (response) {
      $('#fe_status').hide().text(translate('Record saved')).fadeIn('slow');
      newrec._id = response[0]._id;
      foodquickpick.unshift(newrec);
      drawQuickpick();
    }).fail(function fail() {
      $('#fe_status').hide().text(translate('Error')).fadeIn('slow');
    });

    maybePreventDefault(event);
    return false;
  }

  function quickpickSave(event) {
    if (!client.hashauth.isAuthenticated()) {
      alert(translate('Your device is not authenticated yet'));
      return false;
    }

    for (var i=0; i<foodquickpicktodelete.length; i++) {
      deleteRecord(foodquickpicktodelete[i]);
    }

    for (i=0; i<foodquickpick.length; i++) {
      var fqp = foodquickpick[i];
      if (fqp.hidden) {
        fqp.position = HIDDEN;
      } else {
        fqp.position = i;
      }
      updateRecord(fqp);
    }
    maybePreventDefault(event);
    return false;
  }

  function cmp(v1,v2){
    return (v1<v2?-1:(v1>v2?1:0));
  }

  function maybePreventDefault(event,after) {
    if (event) {
      event.preventDefault();
    }
    if (after) {
      after();
    }
  }
});
};

module.exports = init;
