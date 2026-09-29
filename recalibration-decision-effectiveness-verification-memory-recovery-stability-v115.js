/* CrowSpace — Recalibration Decision Effectiveness Verification Memory Recovery Stability v115
   Browser-only. Confirms v114 recovered verification memory remains stable.
*/
(function(){
const REC="crowspace-recalibration-decision-effectiveness-recovery-stability-verification-memory-recovery-v114",MEM="crowspace-recalibration-decision-effectiveness-recovery-stability-verification-memory-v113",KEY="crowspace-recalibration-decision-effectiveness-verification-memory-recovery-stability-v115",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const rec=L(REC,{}),mem=L(MEM,{}),st=state();
 Object.values(rec).forEach(x=>{
  const m=mem[x.reason]||{},old=st[x.reason]||{checks:0,stable:0,unstable:0,history:[]};
  const recovered=x.status==="RECOVERED",stable=recovered&&m.status!=="UNRELIABLE";
  const marker=String(x.updatedAt||0)+":"+String(m.updatedAt||0)+":"+String(x.status||"");
  if(old.lastMarker!==marker){
   old.checks++;if(stable)old.stable++;else if(recovered)old.unstable++;
   old.history=[{at:Date.now(),recovered,stable,source:x.status,recoveryRate:N(x.rate)},...(old.history||[])].slice(0,30);old.lastMarker=marker;
  }
  old.reason=x.reason;old.stability=old.checks?old.stable/old.checks:0;
  old.status=old.checks<3?"VERIFYING":old.stability>=.75?"STABLE":old.stability>=.5?"WATCH":"UNSTABLE";
  old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];return x?.status==="STABLE"?1:x?.status==="WATCH"?.75:.5}
function stable(reason){return state()[reason]?.status==="STABLE"}
function best(){return Object.values(state()).sort((a,b)=>(b.stability||0)-(a.stability||0))}
window.CrowSpaceRecalibrationDecisionEffectivenessVerificationMemoryRecoveryStabilityV115={sync,state,factor,stable,best};
setTimeout(sync,173000);setInterval(sync,30000);
})();