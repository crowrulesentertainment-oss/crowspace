/* CrowSpace — Recalibration Evidence Trust Verification Stability Recovery v99
   Browser-only. Recovers degraded stability-memory confidence using fresh stability evidence.
*/
(function(){
const MEM="crowspace-recalibration-evidence-trust-verification-stability-memory-v98",STAB="crowspace-recalibration-evidence-trust-verification-stability-v97",KEY="crowspace-recalibration-evidence-trust-verification-stability-recovery-v99",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const mem=L(MEM,{}),stab=L(STAB,{}),st=state();
 Object.values(mem).forEach(x=>{
  const old=st[x.reason]||{attempts:0,recoveries:0,history:[]},s=stab[x.reason]||{};
  const degraded=x.status==="UNRELIABLE"||x.status==="PARTIAL",fresh=N(s.updatedAt)>N(x.updatedAt),recovered=degraded&&fresh&&N(s.stability)>=.75;
  const marker=String(x.updatedAt||0)+":"+String(s.updatedAt||0)+":"+String(s.stability||0);
  if(old.lastMarker!==marker){
   if(degraded)old.attempts++;if(recovered)old.recoveries++;
   old.history=[{at:Date.now(),degraded,recovered,accuracy:N(x.accuracy),stability:N(s.stability)},...(old.history||[])].slice(0,30);old.lastMarker=marker;
  }
  old.reason=x.reason;old.factor=recovered?1:degraded?.5:1;old.status=recovered?"RECOVERED":degraded?"RECOVERING":"STABLE";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){return state()[reason]?.factor||1}
function status(reason){return state()[reason]?.status||"STABLE"}
function best(){return Object.values(state()).sort((a,b)=>(b.recoveries||0)-(a.recoveries||0))}
window.CrowSpaceRecalibrationEvidenceTrustVerificationStabilityRecoveryV99={sync,state,factor,status,best};
setTimeout(sync,141000);setInterval(sync,30000);
})();