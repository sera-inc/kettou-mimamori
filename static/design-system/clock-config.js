'use strict';
(() => {
  const face=document.querySelector('#facename');if(!face)return;
  function update(value) {
    face.textContent=value;document.querySelector('#inner').dataset.faceConfig=value;
    const link=new URL('/clock/'+value,location.origin);const token=new URLSearchParams(location.search).get('token');if(token)link.searchParams.set('token',token);
    document.querySelector('#clocklink').setAttribute('href',link.pathname+link.search);
    window.Nightscout.client.query();
  }
  for(const button of document.querySelectorAll('input.elmt'))button.addEventListener('click',()=>{
    const size=document.getElementById(button.id+'_size');if(size&&!size.reportValidity())return;
    update(face.textContent+'-'+button.name+(size?size.value:''));
  });
  document.querySelector('#sgage').addEventListener('change',event=>update(face.textContent.slice(0,1)+event.target.value+face.textContent.slice(2)));
  document.querySelector('#bgcolor').addEventListener('change',event=>update(event.target.value+face.textContent.slice(1)));
  document.querySelector('#threshold').addEventListener('change',event=>{if(event.target.reportValidity())update(face.textContent.slice(0,2)+event.target.value.padStart(2,'0')+face.textContent.slice(4));});
  document.querySelector('#cfg_undo').addEventListener('click',()=>{const index=face.textContent.lastIndexOf('-');update(index<0?face.textContent:face.textContent.slice(0,index));});
  const token=new URLSearchParams(location.search).get('token');if(token)document.querySelector('#clocklink').setAttribute('href','/clock/'+face.textContent+'?token='+encodeURIComponent(token));
})();
