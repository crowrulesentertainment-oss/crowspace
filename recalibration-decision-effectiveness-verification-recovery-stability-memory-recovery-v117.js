/* CrowSpace — Recalibration Decision Effectiveness Verification Recovery Stability Memory Recovery v117
   Browser-only. Recovers degraded v116 stability memory using fresh v115 evidence.
*/
(function(){
const STAB="crowspace-recalibration-decision-effectiveness-verification-memory-recovery-stability-v115",MEM="crowspace-recalibration-decision-effectiveness-verification-memory-recovery-stability-memory-v116",KEY="crowspace-recalibration-decision-effectiveness-verification-recovery-stability-memory-recovery-v117",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(STAB,{}),mem=L(MEM,{}),st=state();
 Object.values(src).forEach(x=>{
  const m=mem[x.reason]||{},old=st[x.reason]||{attempts:0,recovered:0,history:[]};
  const degraded=m.status==="UNRELIABLE"||N(m.accuracy)<.5;
  const fresh=x.status==="STABLE"||x.status==="WATCH";
  const recovered=degraded&&fresh;
  const marker=String(x.updatedAt||0)+":"+String(m.updatedAt||0)+":"+String(m.status||"");
  if(old.lastMarker!==marker){
   old.attempts++;if(recovered)old.recovered++;
   old.history=[{at:Date.now(),recovered,fresh,sourceStatus:x.status,accuracy:N(m.accuracy)},...(old.history||[])].slice(0,30);old.lastMarker=marker;
  }
  old.reason=x.reason;old.rate=old.attempts?old.recovered/old.attempts:0;
  old.status=old.attempts<3?"STABLE":old.rate>=.67?"RECOVERED":old.rate>=.34?"RECOVERING":"STALLED";
  old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];return x?.status==="RECOVERED"?1:x?.status==="RECOVERING"?.8:x?.status==="STALLED"?.5:1}
function status(reason){return state()[reason]?.status||"STABLE"}
function best(){return Object.values(state()).sort((a,b)=>(b.rate||0)-(a.rate||0))}
window.CrowSpaceRecalibrationDecisionEffectivenessVerificationRecoveryStabilityMemoryRecoveryV117={sync,state,factor,status,best};
setTimeout(sync,177000);setInterval(sync,30000);
})();