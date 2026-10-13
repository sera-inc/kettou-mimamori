'use strict';
(() => {
  const definitions=[['drawer','表示の設定','drawerToggle'],['treatmentDrawer','記録を追加','treatmentDrawerToggle'],['boluscalcDrawer','インスリンの計算','boluscalcDrawerToggle'],['adminNotifiesDrawer','管理者からのお知らせ','adminnotifies']];
  const drawers=definitions.map(([id,title,trigger])=>({element:document.getElementById(id),title,trigger:document.getElementById(trigger)})).filter(item=>item.element);
  if(!drawers.length)return;
  const backdrop=document.createElement('div');backdrop.id='app-drawer-backdrop';backdrop.hidden=true;backdrop.setAttribute('aria-hidden','true');document.body.append(backdrop);
  const background=['app-main','toolbar','app-nav'].map(id=>document.getElementById(id)).filter(Boolean);
  let active=null;let origin=null;
  const focusable=element=>Array.from(element.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el=>el.getClientRects().length);
  function close(){if(active){window.Nightscout?.client?.browserUtils?.closeDrawer('#'+active.element.id);update();}}
  function enhance(item){
    const {element,title,trigger}=item;
    if(trigger){trigger.setAttribute('aria-controls',element.id);trigger.setAttribute('aria-expanded',String(item===active));}
    if(!element.querySelector(':scope>.app-drawer-header')){const header=document.createElement('div');header.className='app-drawer-header';const heading=document.createElement('h2');heading.id=element.id+'-title';heading.textContent=title;
      const button=document.createElement('button');button.type='button';button.className='app-drawer-close';button.dataset.drawerClose='';button.textContent='閉じる';button.setAttribute('aria-label',title+'を閉じる');button.addEventListener('click',close);header.append(heading,button);element.prepend(header);}
    for(const table of element.querySelectorAll('table'))if(!table.parentElement.classList.contains('app-drawer-table')){const region=document.createElement('div');region.className='app-drawer-table';region.tabIndex=0;region.setAttribute('role','region');region.setAttribute('aria-label',title+'の入力と計算');table.before(region);region.append(table);}
  }
  function update(){
    for(const item of drawers)enhance(item);
    const next=drawers.find(item=>getComputedStyle(item.element).display!=='none')||null;
    if(next!==active){
      const previous=active;active=next;
      if(previous){previous.element.removeAttribute('role');previous.element.removeAttribute('aria-modal');previous.trigger?.setAttribute('aria-expanded','false');}
      for(const element of background)element.inert=Boolean(active);
      backdrop.hidden=!active;document.body.classList.toggle('app-drawer-open',Boolean(active));
      if(active){origin=active.trigger||document.activeElement;active.element.setAttribute('role','dialog');active.element.setAttribute('aria-modal','true');active.element.setAttribute('aria-labelledby',active.element.id+'-title');active.trigger?.setAttribute('aria-expanded','true');focusable(active.element)[0]?.focus();}
      else {origin?.focus();origin=null;}
    }else if(active&&!active.element.contains(document.activeElement)&&document.activeElement===document.body)focusable(active.element)[0]?.focus();
  }
  backdrop.addEventListener('click',close);
  document.addEventListener('keydown',event=>{
    if(!active)return;
    // A nested jQuery UI dialog owns its focus trap and Escape while it is open.
    if(Array.from(document.querySelectorAll('.ui-dialog')).some(dialog=>getComputedStyle(dialog).display!=='none'&&dialog.getClientRects().length))return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();return;}
    if(event.key!=='Tab')return;
    const items=focusable(active.element);const first=items[0],last=items[items.length-1];
    if(!items.length){event.preventDefault();return;}
    if(event.shiftKey&&(document.activeElement===first||!active.element.contains(document.activeElement))){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&(document.activeElement===last||!active.element.contains(document.activeElement))){event.preventDefault();first.focus();}
  },true);
  const observer=new MutationObserver(update);for(const item of drawers)observer.observe(item.element,{attributes:true,attributeFilter:['style'],childList:true,subtree:true});update();
})();
