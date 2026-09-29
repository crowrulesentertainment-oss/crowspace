/* CrowSpace — Recalibration Decision Effectiveness Recovery Stability Memory Recovery v111
   Browser-only. Recovers degraded v110 memory using fresh v109 stability evidence.
*/
(function(){
const STAB="crowspace-recalibration-decision-effectiveness-memory-recovery-stability-v109",MEM="crowspace-recalibration-decision-effectiveness-recovery-stability-memory-v110",KEY="crowspace-recalibration-decision-effectiveness-recovery-stability-memory-recovery-v111",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
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
window.CrowSpaceRecalibrationDecisionEffectivenessRecoveryStabilityMemoryRecoveryV111={sync,state,factor,status,best};
setTimeout(sync,165000);setInterval(sync,30000);
})();