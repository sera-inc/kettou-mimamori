'use strict';

var should = require('should');
var benv = require('./fixtures/benv-loader');

describe('clock client', function() {
  var $, clockClient;

  function setupClockClient(done) {
    benv.setup(function() {
      $ = require('jquery');
      global.$ = $;

      global.localStorage = {
        getItem: function() {
          return null;
        }
      };

      $('body').html('<div id="inner" data-face="bn0-sg40-dt14-ag6-ar25"></div>');

      delete require.cache[require.resolve('../lib/client/clock-client')];
      clockClient = require('../lib/client/clock-client');

      done();
    });
  }

  function teardownClockClient(done) {
    delete require.cache[require.resolve('../lib/client/clock-client')];
    delete global.$;
    delete global.localStorage;
    clockClient = null;
    benv.teardown(true);
    done();
  }

  function renderProperties(serverUnits, browserUnits, properties) {
    window.serverSettings = {
      settings: {
        units: serverUnits
        , showClockDelta: true
        , showClockLastTime: false
      }
    };

    clockClient.settings = {
      units: browserUnits
      , thresholds: {
        bgHigh: 260
        , bgLow: 55
        , bgTargetBottom: 80
        , bgTargetTop: 180
      }
      , timeFormat: 12
    };
    clockClient.unitMismatch = browserUnits !== serverUnits;

    $.ajax = function(url, opts) {
      should(url).equal('/api/v2/properties');
      opts.success(properties);
    };

    clockClient.query();
  }

  function propertiesWithUnits(scaledBg, deltaDisplay) {
    return {
      bgnow: {
        sgvs: [{
          mgdl: 100
          , scaled: scaledBg
          , mills: Date.now()
          , direction: 'Flat'
        }]
      }
      , delta: {
        mgdl: 5
        , display: deltaDisplay
      }
    };
  }

  [
    {name:'legacy raw hash',stored:'abcdef0123456789abcdef0123456789abcdef0123',expected:'abcdef0123456789abcdef0123456789abcdef0123'},
    {name:'JSON-serialized hash',stored:JSON.stringify('abcdef0123456789abcdef0123456789abcdef0123'),expected:'abcdef0123456789abcdef0123456789abcdef0123'},
    {name:'numeric legacy hash without precision loss',stored:'1234567890123456789012345678901234567890',expected:'1234567890123456789012345678901234567890'},
    {name:'missing stored authentication',stored:null,expected:''}
  ].forEach(function(example) {
    it('uses '+example.name+' for clock property authentication',function() {
      const previousLocation=global.location;
      global.location={search:''};
      global.localStorage.getItem=function(key){key.should.equal('apisecrethash');return example.stored;};
      try {
        clockClient.readApiSecret().should.equal(example.expected);
        let called=false;
        $.ajax=function(url){url.should.equal('/api/v2/properties'+(example.expected?'?secret='+example.expected:''));called=true;};
        clockClient.query();called.should.equal(true);
      } finally {if(previousLocation===undefined)delete global.location;else global.location=previousLocation;}
    });
  });

  beforeEach(setupClockClient);
  afterEach(teardownClockClient);

  [{minutes:0,text:'たった今'},{minutes:1,text:'1分前'},{minutes:17,text:'17分前'}].forEach(function(example) {
    it('renders Japanese elapsed measurement text for '+example.minutes+' minutes without changing the reading', function() {
      $('#inner').attr('data-face','by0-sg40-dt14-ag6-ar25');
      var properties=propertiesWithUnits('100','+5');
      properties.bgnow.sgvs[0].mills=Date.now()-example.minutes*60000;
      renderProperties('mg/dl','mg/dl',properties);
      clockClient.settings.language='ja';clockClient.render();
      $('.ag').text().should.equal(example.text);
      $('.sg').text().should.equal('100');$('.dt').text().should.equal('+5');
    });
  });

  [{}, {bgnow:{}}, {bgnow:{sgvs:[]}}, {bgnow:{sgvs:null}}, null].forEach(function(properties,index) {
    it('shows an empty state for missing measurement variant '+index+' and recovers on new data',function() {
      renderProperties('mg/dl','mg/dl',properties);
      $('#errorMessage').attr('role').should.equal('status');
      $('#errorMessage').text().should.containEql('血糖データはまだありません');
      $('#inner').css('display').should.equal('none');
      renderProperties('mg/dl','mg/dl',propertiesWithUnits('100','+5'));
      $('.sg').text().should.equal('100');
      $('#errorMessage').css('display').should.equal('none');
      $('#inner').css('display').should.not.equal('none');
    });
  });

  it('constructs every supported face component with bounded numeric sizing', function() {
    $('#inner').attr('data-face', 'bn0-sg40-dt14-nl-ar25-ag6-tm10-em40');

    renderProperties('mg/dl', 'mg/dl', propertiesWithUnits('100', '+5'));

    $('#inner').children().map(function() {
      return this.className;
    }).get().should.deepEqual(['sg', 'dt', 'nl', 'ar', 'ag', 'tm', 'em']);
    $('.sg')[0].style.fontSize.should.equal('40vmin');
    $('.dt')[0].style.fontSize.should.equal('14vmin');
    $('.nl')[0].style.fontSize.should.equal('');
    $('.ar')[0].style.height.should.equal('25vmin');
  });

  it('does not interpret face configuration as markup, classes, or styles', function() {
    $('#inner')
      .attr('data-face', 'config')
      .attr('data-face-config', 'cy10-sg40-xx99-sg40" onclick="alert(1)-ar25;background:red-<img src=x onerror=alert(1)>-tm10');

    renderProperties('mg/dl', 'mg/dl', propertiesWithUnits('100', '+5'));

    $('#inner').children().map(function() {
      return this.className;
    }).get().should.deepEqual(['sg', 'tm']);
    $('#inner').find('img, script, [onclick], [onerror]').length.should.equal(0);
    $('.sg')[0].style.fontSize.should.equal('40vmin');
    $('.tm')[0].style.fontSize.should.equal('10vmin');
    $('#inner').text().should.not.match(/alert|onerror|onclick/);
  });

  it('should render browser mmol preference when server units are mg/dl', function() {
    renderProperties('mg/dl', 'mmol', propertiesWithUnits(100, '+5'));

    $('.sg').html().should.equal('5.6');
    $('.dt').html().should.equal('+0.3');
  });

  it('should render browser mg/dl preference when server units are mmol', function() {
    renderProperties('mmol', 'mg/dl', propertiesWithUnits('5.6', '+0.3'));

    $('.sg').html().should.equal('100');
    $('.dt').html().should.equal('+5');
  });

  it('should use server-scaled values when browser and server units match', function() {
    renderProperties('mmol', 'mmol', propertiesWithUnits('5.6', '+0.3'));

    $('.sg').html().should.equal('5.6');
    $('.dt').html().should.equal('+0.3');
  });
});
