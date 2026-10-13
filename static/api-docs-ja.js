(function () {
  'use strict';
  var words = {
    'Website': '会社サイト', 'Servers': '接続先', 'Server': '接続先',
    'Authorize': '認証情報を設定', 'Authorized': '認証情報を設定済み', 'Logout': '認証情報を解除',
    'Available authorizations': '利用できる認証方式', 'Close': '閉じる', 'Value:': '値：',
    'Username:': '利用者名：', 'Password:': 'パスワード：', 'Scopes': '権限の範囲',
    'Parameters': '入力項目', 'No parameters': '入力項目はありません',
    'Try it out': '入力を有効にする', 'Cancel': '取り消す', 'Execute': '実行する', 'Clear': 'クリア',
    'Name': '名前', 'Description': '説明', 'Required': '必須', 'required': '必須',
    '(path)': '（パス）', '(query)': '（クエリ）', '(header)': '（ヘッダー）', '(cookie)': '（Cookie）',
    'Request body': '送信する本文', 'Edit Value': '値を編集', 'Example Value': '値の例',
    'Examples:': '例：', 'Examples': '例', 'Example': '例', 'Schema': 'データ形式', 'Schemas': 'データ形式一覧',
    'Responses': '応答', 'Server response': 'サーバーの応答', 'Code': '状態コード',
    'Details': '詳細', 'Links': '関連リンク', 'No links': '関連リンクはありません',
    'Media type': 'データ形式', 'Media Type': 'データ形式',
    'Controls Accept header.': 'Acceptヘッダーに指定する形式です。',
    'Controls Content-Type header.': 'Content-Typeヘッダーに指定する形式です。',
    'Request URL': '送信先URL', 'Response body': '応答本文', 'Response headers': '応答ヘッダー',
    'Download': 'ダウンロード', 'Download file': 'ファイルをダウンロード',
    'Curl': '送信コマンド（curl）', 'cURL': '送信コマンド（curl）', 'Request duration': '処理時間',
    'Undocumented': '説明は未登録です', 'Response not documented': '応答の説明は未登録です',
    'No response from server': 'サーバーから応答がありません',
    'Failed to fetch.': '通信に失敗しました。', 'Errors': 'エラー', 'Error': 'エラー',
    'Hide': '閉じる', 'Show': '表示する', 'Loading...': '読み込み中…',
    'Expand operation': '操作の詳細を開く', 'Collapse operation': '操作の詳細を閉じる',
    'Expand Operations': '操作の詳細を開く', 'Collapse Operations': '操作の詳細を閉じる',
    'Copy to clipboard': 'クリップボードにコピー', 'Copy': 'コピー', 'Copied': 'コピーしました',
    'authorization button unlocked': '認証情報を設定する', 'authorization button locked': '認証情報を変更する',
    'auth-bearer-value': '認証トークン', 'Select a definition': 'APIの定義を選択',
    'Default value': '既定値', 'Default value :': '既定値：', 'Available values :': '選択できる値：',
    'Add item': '項目を追加', 'Remove item': '項目を削除', 'Send empty value': '空の値を送信',
    'All': 'すべて', 'Select all': 'すべて選択', 'Select none': '選択を解除',
    'Expand all': 'すべて開く', 'Collapse all': 'すべて閉じる'
  };
  function translate(value) {
    var text = value.trim(), replacement = words[text];
    if (replacement === undefined && /^Send email to /.test(text)) replacement = '株式会社世良へメールで問い合わせ';
    if (replacement === undefined && /^Default value\s*:\s*/.test(text)) replacement = text.replace(/^Default value\s*:\s*/, '既定値：');
    if (replacement === undefined && /^Available values\s*:\s*/.test(text)) replacement = text.replace(/^Available values\s*:\s*/, '選択できる値：');
    if (replacement === undefined && /^Possible values\s*:\s*/.test(text)) replacement = text.replace(/^Possible values\s*:\s*/, '指定できる値：');
    if (replacement === undefined && /^Name\s*:\s*/.test(text)) replacement = text.replace(/^Name\s*:\s*/, '項目名：');
    if (replacement === undefined && /^In\s*:\s*/.test(text)) replacement = text.replace(/^In\s*:\s*/, '指定場所：').replace(/header$/, 'ヘッダー').replace(/query$/, 'クエリ');
    return replacement === undefined ? value : value.replace(text, replacement);
  }
  function refresh() {
    var root = document.querySelector('#swagger-ui');
    if (!root) return;
    if (root.getAttribute('role') !== 'main') root.setAttribute('role', 'main');
    if (root.getAttribute('aria-label') !== 'APIの説明と操作') root.setAttribute('aria-label', 'APIの説明と操作');
    root.querySelectorAll('.opblock-summary-control').forEach(function (button) {
      var path = button.querySelector('.opblock-summary-path');
      if (path) {
        var accessibleName = (button.querySelector('.opblock-summary-method').textContent + ' ' + path.textContent + ' の詳細を開閉').trim();
        if (button.getAttribute('aria-label') !== accessibleName) button.setAttribute('aria-label', accessibleName);
      }
      // Keep the original path node for React. A separate native link retains
      // deep linking without nesting a focusable link inside the expand button.
      var anchor = button.querySelector('.opblock-summary-path a');
      if (!anchor) return;
      var href = anchor.getAttribute('href') || anchor.dataset.appDocHref;
      if (!href) return;
      if (!anchor.dataset.appDocHref) {
        anchor.dataset.appDocHref = href;
        anchor.addEventListener('click', function () { window.location.hash = href.slice(1); });
      }
      anchor.removeAttribute('href');
      anchor.setAttribute('role', 'presentation');
      var summary = button.closest('.opblock-summary');
      if (!summary.querySelector('.app-api-operation-link')) {
        var link = document.createElement('a');
        link.className = 'app-api-operation-link'; link.href = href;
        link.textContent = '操作のリンク';
        link.setAttribute('aria-label', path.textContent + ' の操作へのリンク');
        summary.append(link);
      }
    });
    root.querySelectorAll('input,select,textarea').forEach(function (element) {
      if (element.getAttribute('aria-label') || element.getAttribute('aria-labelledby') || (element.labels && element.labels.length)) return;
      var row = element.closest('tr'), label = row && row.querySelector('.parameter__name');
      var name = element.closest('.servers') ? 'APIの接続先' :
        element.classList.contains('examples-select-element') ? 'データ例を選択' :
        label ? label.textContent.replace(/\*/g, '').trim() + ' の値' :
        element.tagName === 'TEXTAREA' ? '送信する本文' :
        element.getAttribute('placeholder') ? element.getAttribute('placeholder') + ' の値' : '入力する値';
      element.setAttribute('aria-label', name);
    });
    root.querySelectorAll('.copy-to-clipboard button').forEach(function (button) {
      if (button.getAttribute('aria-label') !== 'クリップボードにコピー') button.setAttribute('aria-label', 'クリップボードにコピー');
    });
    root.querySelectorAll('.highlight-code pre,.markdown pre,.curl').forEach(function (block) {
      if (!block.hasAttribute('tabindex')) block.setAttribute('tabindex', '0');
    });
    root.querySelectorAll('.markdown pre').forEach(function (block) {
      // This table describes matching rules; it is not an executable example.
      // Preserve its field names while translating the explanatory phrases.
      if (!/^`(?:devicestatus|entries|food|profile|treatments)` collection/m.test(block.textContent)) return;
      block.textContent = block.textContent.replace(/ collection:\s+equal combination of /g, ' コレクション：次の組み合わせが一致 ')
        .replace(/ collection:\s+equal /g, ' コレクション：次の項目が一致 ')
        .replace(/ and /g, ' と ');
    });
    root.querySelectorAll('[role="region"]').forEach(function (region, index) {
      var operation = region.closest('.opblock');
      if (!operation) return;
      var path = operation.querySelector('.opblock-summary-path'), method = operation.querySelector('.opblock-summary-method');
      var label = method.textContent + ' ' + path.textContent + ' の詳細 ' + (index + 1);
      if (region.getAttribute('aria-label') !== label) region.setAttribute('aria-label', label);
      region.removeAttribute('aria-labelledby');
    });
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest('pre,code,option,input,textarea,script,style')) continue;
      var text = node.data.trim(), next = translate(node.data);
      if (node.parentElement.closest('.opblock-tag') && ['generic', 'other', 'default'].includes(text)) {
        next = node.data.replace(text, text === 'generic' ? '共通操作' : 'その他の操作');
      }
      if (next !== node.data) node.data = next;
    }
    root.querySelectorAll('[aria-label],[title]').forEach(function (element) {
      ['aria-label', 'title'].forEach(function (name) {
        var old = element.getAttribute(name);
        if (!old) return;
        var next = translate(old);
        if (next !== old) element.setAttribute(name, next);
      });
    });
  }
  function start() {
    document.documentElement.lang = 'ja';
    var header = document.createElement('header');
    header.className = 'app-api-header';
    header.innerHTML = '<a class="app-api-brand" href="/"><img src="/brand/mark.svg" width="32" height="32" alt="">血糖みまもり</a>' +
      '<nav aria-label="APIの説明画面"><a href="/api-docs/">API v1</a><a href="/api3-docs/">API v3</a><a href="mailto:info@sera-inc.co.jp">お問い合わせ</a></nav>';
    var skip = document.createElement('a');
    skip.className = 'app-api-skip'; skip.href = '#swagger-ui'; skip.textContent = 'APIの説明へ移動';
    document.body.prepend(header); document.body.prepend(skip);
    var heading = document.createElement('h1');
    heading.className = 'app-api-heading'; heading.textContent = 'APIの説明';
    header.append(heading);
    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(function () { scheduled = false; refresh(); });
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'title'] });
    refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
