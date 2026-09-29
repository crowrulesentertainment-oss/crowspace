/* CrowSpace — Recalibration Recovery Verification v82
   Browser-only. Verifies that restored confidence remains stable after recovery.
*/
(function(){
const REC="crowspace-recalibration-calibration-recovery-v81",CAL="crowspace-recalibration-evidence-calibration-v80",KEY="crowspace-recalibration-recovery-verification-v82",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const rec=L(REC,{}),cal=L(CAL,{}),st=state();
 Object.values(rec).forEach(x=>{
  const c=cal[x.reason],old=st[x.reason]||{checks:0,stable:0,unstable:0,history:[]};
  if(!c)return;
  const recovered=x.status==="RECOVERED",stable=recovered&&N(c.accuracy)>=.75,marker=String(c.updatedAt||0)+":"+String(x.updatedAt||0)+":"+String(c.status||"");
  if(old.lastMarker!==marker){
   old.checks++;if(stable)old.stable++;else if(recovered)old.unstable++;
   old.history=[{at:Date.now(),recovered,stable,accuracy:N(c.accuracy)},...(old.history||[])].slice(0,20);old.lastMarker=marker;
  }
  old.reason=x.reason;old.stability=old.checks?old.stable/old.checks:0;old.status=old.checks<2?"VERIFYING":old.stability>=.75?"VERIFIED":old.stability>=.5?"WATCH":"UNSTABLE";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function verified(reason){return state()[reason]?.status==="VERIFIED"}
function factor(reason){const x=state()[reason];return x?.status==="VERIFIED"?1:x?.status==="WATCH"?.75:.5}
function best(){return Object.values(state()).sort((a,b)=>(b.stability||0)-(a.stability||0))}
window.CrowSpaceRecalibrationVerificationV82={sync,state,verified,factor,best};
setTimeout(sync,107000);setInterval(sync,30000);
})();