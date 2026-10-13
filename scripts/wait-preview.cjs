'use strict';
(async()=>{
  const deadline=Date.now()+120000;
  while(Date.now()<deadline) {
    try {const res=await fetch('http://localhost:8410/api/v1/status.json',{signal:AbortSignal.timeout(2000)});if(res.ok&&(await res.json()).status==='ok'){console.log('Preview API ready');return;}} catch {}
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  throw new Error('Preview API did not become ready within 120 seconds');
})().catch(error=>{console.error(error);process.exitCode=1;});
