'use strict';
const fs=require('node:fs');const vm=require('node:vm');const assert=require('node:assert/strict');const acorn=require('acorn');
const source=fs.readFileSync('lib/client/index.js','utf8');const parsed=acorn.parse(source,{ecmaVersion:'latest'});
const assignment=parsed.body.find(node=>node.type==='ExpressionStatement'&&node.expression.type==='AssignmentExpression'&&node.expression.left.object?.name==='client'&&node.expression.left.property?.name==='init').expression;
const results=[];
for(const scenario of ['startup','offline','authentication']){
 const requests=[],timers=[],loads=[];let afterAuthentication;
 const client={headers:()=>({}),hashauth:{apisecrethash:null,requestAuthentication(next){afterAuthentication=next;}},loadLanguage(settings,callback){loads.push(callback);}};
 const $=()=>({text(){},hide(){}});$.ajax=()=>{const request={done(fn){this.success=fn;return this;},fail(fn){this.failure=fn;return this;}};requests.push(request);return request;};
 const context={client,$,Storages:{localStorage:{get:()=>null}},window:{setTimeout(fn,delay){timers.push({fn,delay});}},require:()=>()=>({queryParms:()=>({})}),navigator:{language:'ja-JP'},language:{languages:[{code:'ja'}],set(){},translate:value=>value},console:{log(){}}};
 vm.runInNewContext('client.init='+source.slice(assignment.right.start,assignment.right.end),context);
 const callback=()=>{};client.init(callback);assert.equal(requests.length,1);
 if(scenario==='startup')requests[0].success({runtimeState:'starting'});
 if(scenario==='offline')requests[0].failure({readyState:0});
 if(scenario==='authentication'){requests[0].failure({readyState:4});assert.equal(timers.length,0);assert.equal(typeof afterAuthentication,'function');afterAuthentication(true);}
 assert.equal(requests.length,1,'No immediate recursive request');assert.equal(timers.length,1);assert.equal(typeof timers[0].fn,'function');assert.equal(timers[0].delay,5000);
 timers[0].fn();assert.equal(requests.length,2);requests[1].success({runtimeState:'loaded'});assert.equal(loads.length,1);assert.equal(loads[0],callback,'Completion callback survives the retry');
 results.push({scenario,pass:true,delayMs:5000,immediateRequests:1,completionCallbackPreserved:true});
}
fs.writeFileSync('docs/verification/startup-retry.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
