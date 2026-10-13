'use strict';
(() => {
  const container=document.getElementById('container');
  const reading=document.querySelector('.bgButton');
  const silence=document.getElementById('silenceBtn');
  const forecast=document.getElementById('viewMenu');
  const forecastTrigger=document.querySelector('.focus-range li:not([data-hours]) button');
  if(!container||!reading||!silence||!forecast||!forecastTrigger)return;
  const alarmTrigger=document.createElement('button');
  alarmTrigger.type='button';alarmTrigger.id='app-alarm-menu-toggle';alarmTrigger.dataset.type='outline';alarmTrigger.textContent='警報の停止時間';
  const alarmHost=document.createElement('div');alarmHost.className='app-popover';silence.before(alarmHost);alarmHost.append(alarmTrigger,silence);
  const forecastHost=forecastTrigger.closest('li');
  const definitions=[{panel:silence,trigger:alarmTrigger,label:'警報を停止する時間を選択',open:()=>reading.click()},{panel:forecast,trigger:forecastTrigger,label:'グラフの予測表示',open:()=>forecastHost.click()}];
  let active=null;let forecastFocus=null;let lastForecastType=null;
  const items=panel=>Array.from(panel.querySelectorAll('[role="menuitem"],[role="menuitemcheckbox"]')).filter(item=>!item.disabled);
  function focusItem(panel,index){const controls=items(panel);for(const control of controls)control.tabIndex=-1;if(controls[index]){controls[index].tabIndex=0;controls[index].focus();}}
  function close(definition,restore){definition.panel.style.visibility='hidden';definition.trigger.setAttribute('aria-expanded','false');if(active===definition)active=null;if(restore)definition.trigger.focus();}
  function positionPanel(definition){
    const rect=definition.trigger.getBoundingClientRect(),panel=definition.panel;
    const gap=Number.parseFloat(getComputedStyle(panel).marginTop)||0;
    const left=Math.max(gap,Math.min(rect.left,window.innerWidth-panel.offsetWidth-gap));
    const top=rect.bottom+gap+panel.offsetHeight<=window.innerHeight?rect.bottom+gap:Math.max(gap,rect.top-panel.offsetHeight-gap);
    if(panel.style.left!==left+'px')panel.style.left=left+'px';if(panel.style.top!==top+'px')panel.style.top=top+'px';
  }
  function enhance(){
    alarmTrigger.setAttribute('aria-disabled',String(!container.classList.contains('alarming')));
    alarmTrigger.title=container.classList.contains('alarming')?'警報を停止する時間を選びます':'警報があるときに操作できます';
    for(const anchor of silence.querySelectorAll('a[data-snooze-time]')){
      const button=document.createElement('button');button.type='button';button.className='app-dropdown-menu__item';button.dataset.snoozeTime=anchor.dataset.snoozeTime;button.textContent=anchor.textContent;button.setAttribute('role','menuitem');button.tabIndex=-1;anchor.replaceWith(button);
    }
    for(const checkbox of forecast.querySelectorAll('input[type="checkbox"]')){if(checkbox.getAttribute('role')!=='menuitemcheckbox')checkbox.tabIndex=-1;checkbox.setAttribute('role','menuitemcheckbox');checkbox.setAttribute('aria-checked',String(checkbox.checked));}
    for(const definition of definitions){
      for(const li of definition.panel.querySelectorAll('li'))li.setAttribute('role','presentation');
      const visible=getComputedStyle(definition.panel).visibility==='visible';definition.trigger.setAttribute('aria-expanded',String(visible));
      if(visible&&active!==definition){if(active)close(active,false);active=definition;focusItem(definition.panel,0);}else if(!visible&&active===definition)active=null;
      if(visible)positionPanel(definition);
    }
    if(active?.panel===forecast&&!forecast.contains(document.activeElement))forecastFocus=forecastFocus||lastForecastType;
    if(forecastFocus&&active?.panel===forecast){const control=items(forecast).find(input=>input.dataset.forecastType===forecastFocus);if(control)focusItem(forecast,items(forecast).indexOf(control));forecastFocus=null;}
  }
  for(const definition of definitions){
    const {panel,trigger}=definition;
    panel.classList.add('app-popover__panel');panel.setAttribute('role','menu');panel.setAttribute('aria-label',definition.label);
    trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-controls',panel.id);trigger.setAttribute('aria-expanded','false');
    trigger.addEventListener('click',event=>{event.stopPropagation();if(trigger.getAttribute('aria-disabled')==='true')return;if(active===definition){close(definition,true);return;}definition.open();enhance();});
    trigger.addEventListener('keydown',event=>{if(['ArrowDown','ArrowUp'].includes(event.key)){event.preventDefault();if(active!==definition)trigger.click();if(active===definition)focusItem(panel,event.key==='ArrowUp'?items(panel).length-1:0);}});
    panel.addEventListener('keydown',event=>{
      const controls=items(panel),index=controls.indexOf(document.activeElement);let next;
      if(event.key==='ArrowDown')next=(index+1)%controls.length;else if(event.key==='ArrowUp')next=(index-1+controls.length)%controls.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=controls.length-1;
      if(next!==undefined){event.preventDefault();focusItem(panel,next);}else if(event.key==='Tab'){close(definition,true);}
    });
    panel.addEventListener('click',event=>{event.stopPropagation();if(panel===silence&&event.target.closest('[role="menuitem"]'))close(definition,true);});
    new MutationObserver(enhance).observe(panel,{childList:true,subtree:true,attributes:true,attributeFilter:['style']});
  }
  forecast.addEventListener('change',event=>{if(event.target.matches('input[data-forecast-type]')){forecastFocus=event.target.dataset.forecastType;event.target.setAttribute('aria-checked',String(event.target.checked));}},true);
  forecast.addEventListener('focusin',event=>{if(event.target.matches('input[data-forecast-type]'))lastForecastType=event.target.dataset.forecastType;});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&active){event.preventDefault();event.stopPropagation();close(active,true);}});
  document.addEventListener('click',event=>{if(active&&!active.panel.contains(event.target)&&!active.trigger.contains(event.target)&&!reading.contains(event.target))close(active,false);});
  window.addEventListener('resize',()=>{if(active)positionPanel(active);});window.addEventListener('scroll',()=>{if(active)positionPanel(active);},true);
  new MutationObserver(enhance).observe(container,{attributes:true,attributeFilter:['class']});enhance();
})();
