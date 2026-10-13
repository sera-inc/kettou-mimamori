'use strict';
const fs=require('fs');const vm=require('vm');const assert=require('node:assert/strict');
const clock=require('node:test').mock.timers;clock.enable({apis:['setTimeout','Date'],now:Date.now()});const context={window:{},setTimeout,clearTimeout,Date};const results=[];
try {
 vm.runInNewContext(fs.readFileSync('static/design-system/toast-store.js','utf8'),context);
 const store=context.window.KettouToastStore.createToastStore();
 const ids=['一','二','三','四'].map(title=>store.show({title,variant:'info',durationMs:1}));
 assert.equal(store.getToasts().length,3);assert.equal(store.getToasts()[0].title,'一');clock.tick(4999);assert.equal(store.getToasts().length,3);
 store.dismiss(ids[0]);assert.equal(store.getToasts()[2].title,'四');results.push({case:'maximum three visible notifications, FIFO promotion and minimum five-second display',pass:true});
 store.pause('hover');store.pause('focus');clock.tick(60000);assert.equal(store.getToasts().length,3);store.resume('hover');clock.tick(60000);assert.equal(store.getToasts().length,3);store.resume('focus');clock.tick(5001);assert.equal(store.getToasts().length,0);
 results.push({case:'hover and focus both pause timers until every pause reason is released',pass:true});
 const id=store.show({title:'閉じるまで保持',variant:'warning',action:{label:'確認',onClick(){}}});clock.tick(86400000);assert.equal(store.getToasts().length,1);store.dismiss(id);assert.equal(store.getToasts().length,0);
 results.push({case:'notifications requiring action remain until explicitly dismissed',pass:true});fs.writeFileSync('docs/verification/toast-store.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{clock.reset();}
