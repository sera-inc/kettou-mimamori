'use strict';
(() => {
  const container=document.getElementById('container');const panel=document.getElementById('centerMessagePanel');
  if(!container||!panel)return;
  const summary=panel.closest('.app-page-summary');const chart=document.getElementById('chartContainer');const primary=container.querySelector('.primary');
  const label=document.getElementById('app-loading-status');const readings=[container.querySelector('.bgSpan'),document.getElementById('currentTime')].filter(Boolean);
  let previous=null;
  function positionChart(){
    if(!container.classList.contains('app-loading-active')||getComputedStyle(chart).position!=='fixed')return;
    const client=window.Nightscout?.client;
    const bottom=typeof client?.bottomOfPills==='function'?client.bottomOfPills():primary.getBoundingClientRect().bottom+window.scrollY;
    const top=bottom+5;chart.style.top=top+'px';chart.style.height=(window.innerHeight-top-10)+'px';
  }
  function update(){
    const messageVisible=getComputedStyle(panel).display!=='none';
    const busy=container.classList.contains('loading')||messageVisible;
    container.classList.toggle('app-loading-active',busy);container.setAttribute('aria-busy',String(busy));summary.dataset.loadingMessage=String(messageVisible);
    for(const reading of readings){if(busy)reading.setAttribute('aria-hidden','true');else reading.removeAttribute('aria-hidden');}
    if(previous!==busy){label.textContent=busy?'測定データと接続状況を読み込んでいます。':'読み込みが完了しました。';previous=busy;}
    positionChart();
  }
  const observer=new MutationObserver(update);observer.observe(container,{attributes:true,attributeFilter:['class']});observer.observe(panel,{attributes:true,attributeFilter:['style']});
  new ResizeObserver(positionChart).observe(primary);window.addEventListener('resize',positionChart);update();
})();
