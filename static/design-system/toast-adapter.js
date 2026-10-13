'use strict';
(() => {
  if(!window.KettouToastStore)return;
  const store=window.KettouToastStore.createToastStore();
  const region=document.createElement('section');region.id='app-toast-region';region.className='app-toast-region';region.setAttribute('aria-label','通知');
  const polite=document.createElement('div');polite.setAttribute('role','status');polite.setAttribute('aria-live','polite');
  const urgent=document.createElement('div');urgent.setAttribute('role','alert');urgent.setAttribute('aria-live','assertive');region.append(polite,urgent);document.body.append(region);
  const cards=new Map();const targets=new Map();
  region.addEventListener('mouseenter',()=>store.pause('hover'));region.addEventListener('mouseleave',()=>store.resume('hover'));
  region.addEventListener('focusin',()=>store.pause('focus'));region.addEventListener('focusout',event=>{if(!region.contains(event.relatedTarget))store.resume('focus');});
  function dismiss(id){const card=cards.get(id);const restore=card?.contains(document.activeElement);const target=targets.get(id);store.dismiss(id);if(restore&&target?.isConnected)target.focus();targets.delete(id);}
  function render() {
    const items=store.getToasts();const ids=new Set(items.map(item=>item.id));
    for(const [id,card] of cards)if(!ids.has(id)){card.remove();cards.delete(id);targets.delete(id);}
    for(const item of items) {
      if(cards.has(item.id))continue;
      const card=document.createElement('div');card.className='app-toast';card.dataset.variant=item.variant;card.dataset.toastId=item.id;
      const icon=document.createElement('span');icon.className='app-toast__icon';icon.setAttribute('aria-hidden','true');icon.textContent={info:'ⓘ',success:'✓',warning:'⚠',error:'!'}[item.variant];
      const body=document.createElement('div');body.className='app-toast__body';const title=document.createElement('p');title.className='app-toast__title';title.textContent=item.title;body.append(title);
      if(item.description){const description=document.createElement('p');description.className='app-toast__description';description.textContent=item.description;body.append(description);}
      if(item.legacyHTML){const description=document.createElement('p');description.className='app-toast__description';description.append(safeContent(item.legacyHTML));body.append(description);}
      if(item.action){const action=document.createElement('button');action.type='button';action.className='app-toast__action';action.textContent=item.action.label;action.addEventListener('click',()=>{item.action.onClick();dismiss(item.id);});body.append(action);}
      const close=document.createElement('button');close.type='button';close.className='app-toast__close';close.setAttribute('aria-label','通知を閉じる');close.textContent='×';close.addEventListener('click',()=>dismiss(item.id));card.append(icon,body,close);
      (item.variant==='error'?urgent:polite).append(card);cards.set(item.id,card);
    }
  }
  store.subscribe(render);
  function show(options){const target=document.activeElement;const id=store.show(options);targets.set(id,target);return id;}
  function safeContent(note){
    const template=document.createElement('template');template.innerHTML=String(note);
    for(const element of template.content.querySelectorAll('script,style,iframe,object'))element.remove();
    for(const element of template.content.querySelectorAll('*')){
      if(!['A','B','STRONG','I','EM','CODE','SPAN','BR'].includes(element.tagName)){element.replaceWith(document.createTextNode(element.textContent));continue;}
      const href=element.getAttribute('href');const target=element.getAttribute('target');for(const attribute of [...element.attributes])element.removeAttribute(attribute.name);
      if(element.tagName==='A'&&href){try{const url=new URL(href,location.href);if(['http:','https:','mailto:'].includes(url.protocol)){element.href=url.href;if(target==='_blank'){element.target='_blank';element.rel='noopener noreferrer';}}}catch{}}
    }
    return template.content;
  }
  window.KettouToast={show,dismiss,clear(){for(const id of [...targets.keys()])dismiss(id);},showLegacy(note,type){const variant={info:'info',warn:'warning',success:'success',urgent:'error'}[type]||'error';return show({variant,title:{info:'お知らせ',success:'完了しました',warning:'確認してください',error:'確認が必要です'}[variant],legacyHTML:note,action:{label:'通知を閉じる',onClick(){}}});}};
})();
