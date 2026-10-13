'use strict';
module.exports = async function collect(page) {
  return page.evaluate(() => {
    const candidates = [], retainedIdentifiers = [], seen = new Set();
    const allowed = new Set(['API', 'API_SECRET', 'ID', 'CGM', 'AR2', 'IOB', 'COB', 'ISF', 'DIA', 'GI', 'I:C', 'GVI', 'GMI', 'PGS', 'HbA1c', 'A1c', 'DCCT', 'IFCC', 'OpenAPS', 'Loop', 'Dexcom', 'AAPS', 'Trio', 'mg/dL', 'mg/dl', 'mg/dL/U', 'mmol/L/U', 'mmol/L', 'mmol', 'g', 'ml', 'U', 'kJ', 'MiB', 'UTC', 'GMT', 'IP', 'SSL', 'HTTPS', 'HTTP', 'URL', 'USB', 'JSON', 'AGPL']);
    const visible = element => element && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden' && !element.closest('[hidden],script,style');
    const locator = element => element.id ? '#' + element.id : element.tagName.toLowerCase() + (element.classList.length ? '.' + Array.from(element.classList).slice(0, 2).join('.') : '');
    function add(element, source, value) {
      value = (value || '').replace(/\s+/g, ' ').trim();
      let reason;
      if(element.matches('a[href="mailto:info@sera-inc.co.jp"]') && value==='お問い合わせ：info@sera-inc.co.jp')reason='Japanese support label with the exact requested contact email';
      else if(element.matches('#about a[href="https://github.com/nightscout/cgm-remote-monitor/graphs/contributors"]') && value==='Nightscoutの開発貢献者')reason='Original proper product name in the preserved Japanese copyright attribution';
      else if(element.matches('#pe_timezone option') && value.startsWith('タイムゾーン：') && window.moment.tz.names().includes(element.value) && value.includes(element.value))reason='Japanese timezone label with the exact supported IANA/legacy identifier';
      else if(element.closest('#profiles-chart') && value.startsWith(': タイムゾーン：') && window.moment.tz.names().some(zone=>value.endsWith('（'+zone+'）')||value===': タイムゾーン：'+zone))reason='Japanese profile timezone display with the exact supported IANA/legacy identifier';
      else if(element.tagName==='TH' && /^\(>\d+(?:\.\d+)? (?:mg\/dl|mmol\/l)\/5m\)$/.test(value))reason='Original glucose change threshold with its scientific unit and five-minute interval';
      else if(element.closest('#admin_roles_table') && /^(?:(?:api|\*):(?:activity|treatments|devicestatus|status|\*):(?:read|create|\*)\s*)+$/.test(value))reason='Permission expression; protocol identifier preserved';
      else if(element.id==='facename' && value===document.getElementById('inner').dataset.faceConfig)reason='Current clock configuration identifier used by its URL and undo controls';
      else if(element.id==='explanation' && value.includes('Nathanら（2008年）') && value.includes('Diabetes Care誌'))reason='Original author and journal names within the Japanese source attribution';
      if(reason){retainedIdentifiers.push({locator:locator(element),source,value,reason});return;}
      const words = (value.match(/\b[A-Za-z][A-Za-z0-9_:/+-]*\b/g) || []).filter(word => !allowed.has(word));
      if (!words.length) return;
      const key = source + '\0' + value;if (seen.has(key)) return;seen.add(key);
      candidates.push({locator: locator(element), source, value, words});
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode, element = node.parentElement;
      if (visible(element) || element?.tagName === 'OPTION' && visible(element.closest('select'))) add(element, 'text', node.textContent);
    }
    for (const element of document.querySelectorAll('[title],[placeholder],[alt],[aria-label],input[type=button],input[type=submit]')) {
      if (!visible(element)) continue;
      for (const attribute of ['title', 'placeholder', 'alt', 'aria-label']) if (element.hasAttribute(attribute)) add(element, attribute, element.getAttribute(attribute));
      if (element.matches('input[type=button],input[type=submit]')) add(element, 'button-value', element.value);
    }
    return {title: document.title, language: document.documentElement.lang, candidates, retainedIdentifiers};
  });
};
