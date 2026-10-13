'use strict';
(() => {
  // Explicit names reviewed against the visible fields. IDs and their values,
  // existing validation and event handlers are never replaced by this adapter.
  const names={
    'alarm-timeagowarnmins-browser':'データの経過時間の警告（分）','alarm-timeagourgentmins-browser':'データの経過時間の緊急警告（分）',customTitle:'表示するタイトル',language:'表示言語',scaleY:'血糖グラフの縦軸',basalrender:'基礎インスリンの表示方法',bolusRenderOver:'大きく表示するインスリン量の基準',bolusRenderFormatSmall:'少量のインスリンの表示形式',bolusRenderFormat:'インスリンの表示形式',
    eventDateValue:'記録する日付',eventTimeValue:'記録する時刻',
    rped_glucoseValue:'記録する血糖値',rped_bgfromsensor:'センサーの血糖値',rped_bgfrommeter:'血糖測定器の血糖値',rped_bgmanual:'手入力の血糖値',rped_eventDateValue:'記録する日付',rped_eventTimeValue:'記録する時刻',
    bc_usebg:'血糖値による補正を計算に含める',bc_usecarbs:'糖質による補正を計算に含める',bc_usecob:'残存糖質による補正を計算に含める',bc_useiob:'残存インスリンを計算に含める',bc_useinsulin:'計算結果のインスリン補正を記録に含める',bc_bg:'計算に使用する血糖値',bc_bgfromsensor:'センサーの血糖値を使用',bc_bgfrommeter:'血糖測定器の血糖値を使用',bc_bgmanual:'血糖値を手入力',bc_carbs:'計算に使用する糖質量（グラム）',bc_eventDateValue:'計算する日付',bc_eventTimeValue:'計算する時刻',bc_quickpick:'登録した食事を選択',bc_othercorrection:'その他の補正（単位）',bc_filter_category:'食品の分類で検索',bc_filter_subcategory:'食品の詳細分類で検索',bc_filter_name:'食品名で検索',bc_data:'追加する食品',bc_addportions:'追加する食事の量',
    rp_enabledate:'期間の条件を使用',rp_from:'表示期間の開始日',rp_to:'表示期間の終了日',rp_enablefood:'食品の条件を使用',rp_category:'食品の分類で絞り込む',rp_subcategory:'食品の詳細分類で絞り込む',rp_name:'食品名で絞り込む',rp_food:'記録した食品で絞り込む',rp_enablenotes:'メモの条件を使用',rp_notes:'メモに含まれる文言',rp_enableeventtype:'記録の種類の条件を使用',rp_eventtype:'記録の種類',rp_targetlow:'目標血糖範囲の下限',rp_targethigh:'目標血糖範囲の上限',rp_size:'日別グラフの大きさ',wrp_size:'週間グラフの大きさ',wrp_linear:'週間グラフを線形の縦軸で表示',wrp_log:'週間グラフを対数の縦軸で表示','profiles-databaserecords':'表示するプロフィールの記録',
    rp_loopalyzerprofiles:'プロフィールの表を表示',rp_loopalyzerpredictions:'予測値を表示',rp_loopalyzertimeshift:'食事時刻を揃えて比較',rp_loopalyzermincarbs:'時刻合わせに使う食事の糖質量の下限（グラム）',rp_loopalyzert1:'時刻合わせに使う食事の開始時刻',rp_loopalyzert2:'時刻合わせに使う食事の終了時刻',
    pe_date:'プロフィールの適用開始日',pe_time:'プロフィールの適用開始時刻',pe_databaserecords:'保存されたプロフィールの記録',pe_profiles:'編集するプロフィール',pe_profile_name:'プロフィール名',pe_timezone:'プロフィールのタイムゾーン',pe_dia:'インスリンの作用時間（時間）',pe_hr:'糖質の吸収量（グラム毎時）',pe_hr_high:'高い糖質指数の吸収量（グラム毎時）',pe_hr_medium:'中程度の糖質指数の吸収量（グラム毎時）',pe_hr_low:'低い糖質指数の吸収量（グラム毎時）',pe_delay_high:'高い糖質指数の吸収開始までの時間（分）',pe_delay_medium:'中程度の糖質指数の吸収開始までの時間（分）',pe_delay_low:'低い糖質指数の吸収開始までの時間（分）',
    fe_filter_name:'食品名で検索',fe_filter_category:'食品の分類で検索',fe_filter_subcategory:'食品の詳細分類で検索',fe_id:'食品の記録番号',fe_name:'食品名',fe_portion:'一食分の量',fe_unit:'食品の量の単位',fe_carbs:'食品の糖質量（グラム）',fe_gi:'食品の糖質指数',fe_category:'食品の分類名',fe_category_list:'保存された食品の分類から選択',fe_subcategory:'食品の詳細分類名',fe_subcategory_list:'保存された食品の詳細分類から選択',fe_fat:'食品の脂質量（グラム）',fe_protein:'食品のたんぱく質量（グラム）',fe_energy:'食品のエネルギー量（キロジュール）',fe_quickpick_showhidden:'非表示の食事も表示'
  };
  const ranges={basal:'基礎インスリン（単位毎時）',ic:'糖質比（グラム毎単位）',isf:'インスリン感受性',targetbg:'目標血糖'};
  function enhance(){
    for(const tooltip of document.querySelectorAll('.tooltip')){
      tooltip.setAttribute('role','tooltip');
      if(tooltip.parentElement===document.body){
        let region=document.getElementById('app-tooltip-region');
        if(!region){region=document.createElement('section');region.id='app-tooltip-region';region.setAttribute('aria-label','補足説明');document.body.append(region);}
        region.append(tooltip);
      }
    }
    for(const [id,name] of Object.entries(names)){const input=document.getElementById(id);if(input&&!input.labels?.length&&!input.hasAttribute('aria-labelledby'))input.setAttribute('aria-label',name);}
    for(const input of document.querySelectorAll('#pe_form input[id],#pe_form select[id]')){
      const match=input.id.match(/^pe_(basal|ic|isf|targetbg)_(from|val|low|high)_(\d+)$/);if(!match)continue;
      const suffix={from:'開始時刻',val:'値',low:'下限',high:'上限'}[match[2]];input.setAttribute('aria-label',ranges[match[1]]+'、時間帯'+(Number(match[3])+1)+'、'+suffix);
    }
    for(const dl of document.querySelectorAll('#pe_form dl'))if(!dl.querySelector(':scope>dt,:scope>dd')){
      const heading=dl.querySelector(':scope>b');if(!heading)continue;const dt=document.createElement('dt');heading.before(dt);dt.append(heading);const dd=document.createElement('dd');for(const node of Array.from(dl.childNodes))if(node!==dt)dd.append(node);dl.append(dd);
    }
    for(const close of document.querySelectorAll('.ui-dialog-titlebar-close')){const title=close.closest('.ui-dialog')?.querySelector('.ui-dialog-title')?.textContent.trim();close.setAttribute('aria-label',(title||'この画面')+'を閉じる');}
    for(const dialog of document.querySelectorAll('.ui-dialog')){
      const content=dialog.querySelector('.ui-dialog-content');
      const instance=window.$&&window.$(content).data('ui-dialog');
      if(instance?.options.modal)dialog.setAttribute('aria-modal','true');
    }
    const operationHeader=document.querySelector('#fe_data_header>[role="columnheader"]');if(operationHeader&&!operationHeader.textContent.trim())operationHeader.textContent='操作';
    for(const checkbox of document.querySelectorAll('#glucosedistribution-placeholder input[id]')){const match=checkbox.id.match(/^glucosedistribution-(\d+)$/);if(match)checkbox.setAttribute('aria-label',Number(match[1])+'時から'+(Number(match[1])+1)+'時の血糖データを含める');}
    for(const checkbox of document.querySelectorAll('#calibrations-list .calibrations-checkbox')){const time=checkbox.closest('tr')?.querySelector('td')?.textContent.trim();checkbox.setAttribute('aria-label','校正グラフに含める血糖測定'+(time?'：'+time:''));}
    for(const [selector,name] of [['#dailystats-report','血糖範囲の分布'],['#hourlystats-report','日付'],['#treatments-report','操作']]){const header=document.querySelector(selector+' table th:first-child:empty');if(header){header.textContent=name;header.removeAttribute('aria-label');}}
    const tabnav=document.getElementById('tabnav');if(tabnav){
      tabnav.setAttribute('role','tablist');tabnav.setAttribute('aria-label','レポートの種類');
      const tabs=Array.from(tabnav.querySelectorAll('.menutab'));
      for(const tab of tabs){const selected=tab.classList.contains('selected');tab.setAttribute('role','tab');tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;tab.setAttribute('aria-controls',tab.id+'-placeholder');const panel=document.getElementById(tab.id+'-placeholder');if(panel){panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.tabIndex=0;}}
      if(!tabnav.dataset.semanticTabsReady){
        tabnav.dataset.semanticTabsReady='true';new MutationObserver(enhance).observe(tabnav,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
        tabnav.addEventListener('keydown',event=>{
          const current=event.target.closest('.menutab');if(!current)return;const tabs=Array.from(tabnav.querySelectorAll('.menutab'));const index=tabs.indexOf(current);let next;
          if(event.key==='ArrowRight')next=tabs[(index+1)%tabs.length];else if(event.key==='ArrowLeft')next=tabs[(index+tabs.length-1)%tabs.length];else if(event.key==='Home')next=tabs[0];else if(event.key==='End')next=tabs[tabs.length-1];else if(event.key==='Enter'||event.key===' ')next=current;
          if(next){event.preventDefault();next.focus();next.click();}
        });
      }
    }
  }
  new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});enhance();
})();
