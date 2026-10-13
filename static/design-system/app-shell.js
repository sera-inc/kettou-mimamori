'use strict';
(() => {
  const nav=document.querySelector('#app-nav');
  const toggle=document.querySelector('#app-nav-toggle');
  const closeButton=document.querySelector('#app-nav-close');
  const backdrop=document.querySelector('#app-nav-backdrop');
  const main=document.querySelector('#app-main');
  if(!nav||!toggle) return;
  const mobile=window.matchMedia('(max-width: 767px)');
  const focusable=()=>Array.from(nav.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')).filter(el=>el.getClientRects().length);
  function setOpen(open,restore=true) {
    open=Boolean(open&&mobile.matches);
    nav.dataset.open=String(open);toggle.setAttribute('aria-expanded',String(open));
    document.body.classList.toggle('app-nav-open',open);backdrop.hidden=!open;
    if(main) main.inert=open;
    if(open) {nav.setAttribute('role','dialog');nav.setAttribute('aria-modal','true');nav.setAttribute('aria-label','サービスのメニュー');focusable()[0]?.focus();}
    else {nav.removeAttribute('role');nav.removeAttribute('aria-modal');nav.removeAttribute('aria-label');if(restore&&mobile.matches)toggle.focus();}
  }
  toggle.addEventListener('click',()=>setOpen(nav.dataset.open!=='true'));
  closeButton.addEventListener('click',()=>setOpen(false));backdrop.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',event=>{
    if(nav.dataset.open!=='true') return;
    if(event.key==='Escape'){event.preventDefault();setOpen(false);return;}
    if(event.key!=='Tab') return;
    const items=focusable();const first=items[0],last=items[items.length-1];
    if(event.shiftKey&&(document.activeElement===first||!nav.contains(document.activeElement))){event.preventDefault();last?.focus();}
    else if(!event.shiftKey&&(document.activeElement===last||!nav.contains(document.activeElement))){event.preventDefault();first?.focus();}
  });
  mobile.addEventListener('change',()=>setOpen(false,false));
  // Preserve URL-based access when navigating within the same service.
  const token=new URLSearchParams(window.location.search).get('token');
  if(token) for(const link of document.querySelectorAll('.app-nav-item,.app-brand,.closeButton')) {const url=new URL(link.href,location.href);if(url.origin===location.origin){url.searchParams.set('token',token);link.href=url.href;}}
  const skip=document.querySelector('.app-skip-link');skip?.addEventListener('click',()=>main?.focus());
  function syncRanges(){for(const li of document.querySelectorAll('.focus-range li[data-hours]'))li.querySelector('button')?.setAttribute('aria-pressed',String(li.classList.contains('selected')));}
  const ranges=document.querySelector('.focus-range');if(ranges){new MutationObserver(syncRanges).observe(ranges,{attributes:true,attributeFilter:['class'],subtree:true});syncRanges();}
})();
