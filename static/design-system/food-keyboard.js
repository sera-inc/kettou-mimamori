'use strict';
(() => {
  const grid = document.querySelector('.app-food-grid');
  const picks = document.getElementById('fe_picklist');
  if (!grid || !picks) return;
  const tools = document.createElement('div');
  tools.className = 'app-food-keyboard-tools';
  const label = document.createElement('label');
  label.htmlFor = 'app-food-target'; label.textContent = '追加先の食事';
  const target = document.createElement('select'); target.id = 'app-food-target';
  const hint = document.createElement('p'); hint.id = 'app-food-keyboard-hint';
  hint.textContent = '食品の「食事へ追加」で、ドラッグせずに追加できます。変更後は食事一覧の「保存」を押してください。';
  target.setAttribute('aria-describedby', hint.id);
  const status = document.createElement('p'); status.id = 'app-food-keyboard-status'; status.setAttribute('role', 'status');
  tools.append(label, target, hint, status); grid.before(tools);
  const setName = (element, name) => {if (element && element.getAttribute('aria-label') !== name) element.setAttribute('aria-label', name);};
  const byId = id => Array.from(picks.querySelectorAll('.sortablequickpick')).find(pick => pick.getAttribute('_id') === id);
  const title = pick => pick.querySelector('.fe_qpname')?.value || '食事' + (Number(pick.getAttribute('index')) + 1);
  const restore = (id, selector) => requestAnimationFrame(() => {const pick = byId(id);const field = pick?.querySelector(selector);(field && !field.disabled ? field : pick?.querySelector('.app-food-move-controls button:not([disabled])') || pick?.querySelector('.fe_qpname'))?.focus();});
  const button = (text, className, action) => {const element = document.createElement('button');element.type = 'button';element.textContent = text;element.className = className;element.dataset.type = 'outline';element.addEventListener('click', action);return element;};
  function enhance() {
    const list = Array.from(picks.querySelectorAll('.sortablequickpick'));
    const options = list.map(pick => [pick.getAttribute('_id'), title(pick)]);
    const signature = JSON.stringify(options);
    if (target.dataset.options !== signature) {
      const previous = target.value;
      target.replaceChildren(...options.map(([id, name]) => new Option(name, id)));
      if (!options.length) target.append(new Option('食事を先に追加してください', ''));
      if (options.some(([id]) => id === previous)) target.value = previous;
      target.disabled = !options.length; target.dataset.options = signature;
    }
    for (const row of grid.querySelectorAll('.draggablefood')) {
      let add = row.querySelector('.app-food-add');
      const name = row.children[1]?.textContent.trim();
      if (!add) {
        add = button('食事へ追加', 'app-food-add', event => {
          const pick = byId(target.value), jquery = window.jQuery || window.$;
          if (!pick || !jquery?.fn?.droppable) return;
          // The original drop handler owns food lookup, portions and carb math.
          const handler = jquery(pick).droppable('option', 'drop');
          handler.call(pick, event, {draggable: jquery(row)});
          status.textContent = name + 'を「' + title(byId(target.value)) + '」へ追加しました。保存はまだ行っていません。';
          add.focus();
        });
        row.children[0].append(add);
      }
      setName(add, name + 'を選択した食事へ追加'); add.disabled = !list.length;
    }
    for (const [index, pick] of list.entries()) {
      const id = pick.getAttribute('_id'), name = title(pick);
      setName(pick.querySelector('.fe_qpname'), '食事名');
      setName(pick.querySelector('.fq_hidden'), name + 'を非表示にする');
      setName(pick.querySelector('.fq_hideafteruse'), name + 'を使用後に非表示にする');
      for (const [selector, key, text] of [['.fq_hidden', 'Hidden', '非表示にする'], ['.fq_hideafteruse', 'Hide after use', '使用後に非表示にする']]) {
        const input = pick.querySelector(selector);
        if (input && !input.closest('label')) {
          const originalText = input.nextSibling, translated = window.Nightscout?.client?.translate?.(key) || key;
          if (originalText?.nodeType === Node.TEXT_NODE && originalText.textContent.startsWith(translated)) originalText.textContent = originalText.textContent.slice(translated.length);
          const choice = document.createElement('label');choice.className = 'app-food-choice';input.before(choice);choice.append(input, document.createTextNode(text));
        }
      }
      for (const food of pick.querySelectorAll('.fe_foodinsideqp')) setName(food.querySelector('.fe_qpportions'), food.children[1]?.textContent.trim() + 'の食数');
      if (!pick.querySelector('.app-food-move-controls')) {
        const controls = document.createElement('div');controls.className = 'app-food-move-controls';
        for (const [direction, text] of [[-1, '一つ上へ'], [1, '一つ下へ']]) {
          const move = button(text, direction < 0 ? 'app-food-up' : 'app-food-down', event => {
            const current = byId(id), neighbour = direction < 0 ? current?.previousElementSibling : current?.nextElementSibling;
            const jquery = window.jQuery || window.$;if (!neighbour || !jquery?.fn?.sortable) return;
            if (direction < 0) neighbour.before(current); else neighbour.after(current);
            // Reuse the same array reorder callback as pointer sorting.
            jquery(picks).sortable('option', 'update').call(picks, event, {item: jquery(current)});
            status.textContent = '「' + name + '」の順序を変更しました。保存はまだ行っていません。';
            restore(id, direction < 0 ? '.app-food-up' : '.app-food-down');
          }); controls.append(move);
        }
        pick.querySelector('legend').after(controls);
      }
      const up = pick.querySelector('.app-food-up'), down = pick.querySelector('.app-food-down');
      up.disabled = index === 0; down.disabled = index === list.length - 1;
      setName(up, name + 'を一つ上へ移動'); setName(down, name + 'を一つ下へ移動');
    }
  }
  // Existing change handlers redraw the list. Keep keyboard focus on the same
  // record/field instead of dropping it to the body after that redraw.
  picks.addEventListener('change', event => {
    const pick = event.target.closest('.sortablequickpick');if (!pick) return;
    const id = pick.getAttribute('_id');
    if (event.target.matches('.fe_qpportions')) restore(id, '#' + CSS.escape(event.target.id));
    else if (event.target.matches('.fq_hidden')) restore(id, '.fq_hidden');
  }, true);
  new MutationObserver(enhance).observe(picks, {childList: true, subtree: true});
  new MutationObserver(enhance).observe(grid, {childList: true, subtree: true});
  picks.addEventListener('input', enhance); enhance();
})();
