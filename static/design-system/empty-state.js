'use strict';
(() => {
  const main=document.querySelector('#app-main');if(!main)return;
  function state(parent,id,title,description,show,overlay=false) {
    let element=document.getElementById(id);
    if(!element){element=document.createElement('div');element.id=id;element.className='app-empty-state'+(overlay?' app-chart-empty':'');element.setAttribute('role','status');element.dataset.variant='no-data';
      const heading=document.createElement('p');heading.className='app-empty-state-title';const detail=document.createElement('p');detail.className='app-empty-state-description';element.append(heading,detail);parent.append(element);}
    if(element.children[0].textContent!==title)element.children[0].textContent=title;
    if(element.children[1].textContent!==description)element.children[1].textContent=description;
    element.hidden=!show;
  }
  function update() {
    const chart=main.querySelector('#chartContainer');const client=window.Nightscout?.client;
    if(chart&&client&&!main.querySelector('#container.loading'))state(chart,'app-chart-empty','血糖データはまだありません','測定データを受信すると、ここに推移を表示します。',!client.entries?.length,true);
    const food=main.querySelector('.app-food-grid');const header=main.querySelector('#fe_data_header');
    if(food&&header?.children.length){const filtered=Array.from(main.querySelectorAll('#fe_filter_name,#fe_filter_category,#fe_filter_subcategory')).some(el=>el.value);
      state(food,'app-food-empty',filtered?'条件に一致する食品はありません':'食品はまだ登録されていません',filtered?'検索条件を変更して、もう一度確認してください。':'下の入力欄から食品名や糖質量を登録できます。',!main.querySelector('#fe_data .draggablefood'));document.getElementById('app-food-empty').dataset.variant=filtered?'no-results':'no-data';}
    const subjects=main.querySelector('#admin_subjects_table');if(subjects?.querySelector('th'))state(subjects.parentElement,'app-subjects-empty','利用者や機器はまだ登録されていません','追加ボタンから名前と権限を設定できます。',!subjects.querySelector('td'));
  }
  new MutationObserver(update).observe(main,{childList:true,attributes:true,attributeFilter:['class'],subtree:true});update();
})();
