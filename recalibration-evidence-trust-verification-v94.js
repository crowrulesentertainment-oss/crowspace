/* CrowSpace — Recalibration Evidence Trust Recovery Verification v94
   Browser-only. Verifies recovered trust remains reliable across subsequent observations.
*/
(function(){
const REC="crowspace-recalibration-evidence-trust-recovery-v93",CAL="crowspace-recalibration-evidence-trust-calibration-v92",KEY="crowspace-recalibration-evidence-trust-verification-v94",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const rec=L(REC,{}),cal=L(CAL,{}),st=state();
 Object.values(rec).forEach(x=>{
  const c=cal[x.reason]||{},old=st[x.reason]||{checks:0,stable:0,unstable:0,history:[]};
  const recovered=x.status==="RECOVERED",stable=recovered&&N(c.accuracy)>=.75,marker=String(x.updatedAt||0)+":"+String(c.updatedAt||0)+":"+String(c.accuracy||0);
  if(old.lastMarker!==marker){
   old.checks++;if(stable)old.stable++;else if(recovered)old.unstable++;
   old.history=[{at:Date.now(),recovered,stable,accuracy:N(c.accuracy)},...(old.history||[])].slice(0,30);old.lastMarker=marker;
  }
  old.reason=x.reason;old.stability=old.checks?old.stable/old.checks:0;old.status=old.checks<3?"VERIFYING":old.stability>=.75?"VERIFIED":old.stability>=.5?"WATCH":"UNSTABLE";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];return x?.status==="VERIFIED"?1:x?.status==="WATCH"?.75:.5}
function verified(reason){return state()[reason]?.status==="VERIFIED"}
function best(){return Object.values(state()).sort((a,b)=>(b.stability||0)-(a.stability||0))}
window.CrowSpaceRecalibrationEvidenceTrustVerificationV94={sync,state,factor,verified,best};
setTimeout(sync,131000);setInterval(sync,30000);
})();