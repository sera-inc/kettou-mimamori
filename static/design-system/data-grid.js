'use strict';
(() => {
  const main=document.querySelector('#app-main');
  if(!main) return;
  const captions={pe_basal_placeholder:'基礎インスリンの時間帯',pe_ic_placeholder:'糖質比の時間帯',pe_isf_placeholder:'インスリン感受性の時間帯',pe_targetbg_placeholder:'目標血糖の時間帯',admin_subjects_table:'利用者と機器の一覧',admin_roles_table:'権限グループの一覧'};
  function enhance() {
    // Flot uses tables to lay out chart legends. They are presentation, and
    // wrapping them as full-width data grids obscures the plotted readings.
    for(const table of main.querySelectorAll('.legend table'))table.setAttribute('role','presentation');
    for(const [position,table] of Array.from(main.querySelectorAll('table:not([role="presentation"])')).entries()) {
      const title=captions[table.id]||captions[table.parentElement.id]||table.closest('fieldset')?.querySelector('legend')?.textContent.trim().slice(0,160)||'記録の一覧';
      const dayChart=table.querySelector('div[id^="daytodaychart-"]')||table.parentElement?.closest('table')?.querySelector('div[id^="daytodaychart-"]');
      const regionTitle=dayChart?'日別レポート：'+dayChart.id.slice('daytodaychart-'.length)+(table.contains(dayChart)?'、推移':'、集計'):title+'：'+(position+1);
      if(!table.classList.contains('app-data-grid__table')) {
        const region=document.createElement('div');region.className='app-data-grid';region.tabIndex=0;region.setAttribute('role','region');region.setAttribute('aria-label',regionTitle);
        table.before(region);region.append(table);table.classList.add('app-data-grid__table');
      }
      if(table.parentElement.classList.contains('app-data-grid'))table.parentElement.setAttribute('aria-label',regionTitle);
      if(!table.caption){const caption=table.createCaption();caption.className='app-data-grid__caption';caption.textContent=title;}
      for(const th of table.querySelectorAll('th'))if(!th.hasAttribute('scope'))th.scope='col';
    }
    const header=document.querySelector('#fe_data_header');const data=document.querySelector('#fe_data');
    if(header&&data) {
      header.setAttribute('role','row');data.setAttribute('role','rowgroup');
      for(const [i,cell] of Array.from(header.children).entries()){cell.setAttribute('role','columnheader');if(i===0)cell.setAttribute('aria-label','操作');}
      for(const row of data.children){row.setAttribute('role','row');for(const [i,cell] of Array.from(row.children).entries()){cell.setAttribute('role','cell');if([2,4,5,8,9,10].includes(i))cell.setAttribute('data-numeric','');}}
    }
    // Keep the original jQuery handlers on the image; native buttons add keyboard access.
    for(const image of main.querySelectorAll('img.addsingle,img.delsingle,img.addtargetbg,img.deltargetbg,.fe_editimg,.fe_removeimg,.fe_qpupimg,.fe_qpremoveimg,.fe_qpfoodremoveimg,.editTreatment,.deleteTreatment,#admin_roles_table img,#admin_subjects_table img,#fe_quickpick_add,#pe_records_add,#pe_records_remove,#pe_records_clone,#pe_profile_add,#pe_profile_remove,#pe_profile_clone')) {
      if(image.parentElement.matches('button.app-data-grid__icon-button')) {
        const label=image.title||'記録を操作';
        if(image.parentElement.getAttribute('aria-label')!==label)image.parentElement.setAttribute('aria-label',label);
        continue;
      }
      const button=document.createElement('button');button.type='button';button.className='app-data-grid__icon-button';button.setAttribute('aria-label',image.title||'記録を操作');
      image.before(button);button.append(image);image.alt='';
      button.addEventListener('click',event=>{if(event.target!==image){
        event.preventDefault();
        const restore=document.activeElement===button;
        const interval=image.matches('.addsingle,.delsingle,.addtargetbg,.deltargetbg');
        const prefix=image.matches('.addtargetbg,.deltargetbg')?'pe_targetbg':{basal:'pe_basal',carbratio:'pe_ic',sens:'pe_isf'}[image.getAttribute('array')];
        const position=Number(image.getAttribute('pos'));
        image.click();
        if(restore&&interval&&prefix)queueMicrotask(()=>{enhance();const inputs=Array.from(document.querySelectorAll('[id^="'+prefix+'_from_"]'));inputs[Math.min(position,inputs.length-1)]?.focus();});
      }});
    }
  }
  new MutationObserver(enhance).observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['title']});enhance();
})();
