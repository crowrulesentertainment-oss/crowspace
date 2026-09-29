/* CrowSpace — Recalibration Decision Effectiveness Memory Recovery v108
   Browser-only. Recovers degraded effectiveness-memory confidence using fresh effectiveness evidence.
*/
(function(){
const MEM="crowspace-recalibration-decision-effectiveness-memory-v107",EFF="crowspace-recalibration-decision-effectiveness-v106",KEY="crowspace-recalibration-decision-effectiveness-memory-recovery-v108",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const mem=L(MEM,{}),eff=L(EFF,{}),st=state();
 Object.values(mem).forEach(x=>{
  const old=st[x.reason]||{attempts:0,recoveries:0,history:[]},e=eff[x.reason]||{};
  const degraded=x.status==="UNRELIABLE"||x.status==="PARTIAL",fresh=N(e.updatedAt)>N(x.updatedAt),recovered=degraded&&fresh&&N(e.effectiveness)>=.75;
  const marker=String(x.updatedAt||0)+":"+String(e.updatedAt||0)+":"+String(e.effectiveness||0);
  if(old.lastMarker!==marker){
   if(degraded)old.attempts++;
   if(recovered)old.recoveries++;
   old.history=[{at:Date.now(),degraded,recovered,accuracy:N(x.accuracy),effectiveness:N(e.effectiveness)},...(old.history||[])].slice(0,30);
   old.lastMarker=marker;
  }
  old.reason=x.reason;old.factor=recovered?1:degraded?.5:1;old.status=recovered?"RECOVERED":degraded?"RECOVERING":"STABLE";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){return state()[reason]?.factor||1}
function status(reason){return state()[reason]?.status||"STABLE"}
function best(){return Object.values(state()).sort((a,b)=>(b.recoveries||0)-(a.recoveries||0))}
window.CrowSpaceRecalibrationDecisionEffectivenessMemoryRecoveryV108={sync,state,factor,status,best};
setTimeout(sync,159000);setInterval(sync,30000);
})();