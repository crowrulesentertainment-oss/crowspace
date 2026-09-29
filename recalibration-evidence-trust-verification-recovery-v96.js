/* CrowSpace — Recalibration Evidence Trust Verification Recovery v96
   Browser-only. Recovers degraded verification-memory confidence using fresh verification evidence.
*/
(function(){
const MEM="crowspace-recalibration-evidence-trust-verification-memory-v95",VER="crowspace-recalibration-evidence-trust-verification-v94",KEY="crowspace-recalibration-evidence-trust-verification-recovery-v96",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const mem=L(MEM,{}),ver=L(VER,{}),st=state();
 Object.values(mem).forEach(x=>{
  const old=st[x.reason]||{attempts:0,recoveries:0,history:[]},v=ver[x.reason]||{};
  const degraded=x.status==="UNRELIABLE"||x.status==="PARTIAL",fresh=N(v.updatedAt)>N(x.updatedAt),recovered=degraded&&fresh&&N(v.stability)>=.75;
  const marker=String(x.updatedAt||0)+":"+String(v.updatedAt||0)+":"+String(v.stability||0);
  if(old.lastMarker!==marker){
   if(degraded)old.attempts++;if(recovered)old.recoveries++;
   old.history=[{at:Date.now(),degraded,recovered,accuracy:N(x.accuracy),stability:N(v.stability)},...(old.history||[])].slice(0,30);old.lastMarker=marker;
  }
  old.reason=x.reason;old.factor=recovered?1:degraded?.5:1;old.status=recovered?"RECOVERED":degraded?"RECOVERING":"STABLE";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){return state()[reason]?.factor||1}
function status(reason){return state()[reason]?.status||"STABLE"}
function best(){return Object.values(state()).sort((a,b)=>(b.recoveries||0)-(a.recoveries||0))}
window.CrowSpaceRecalibrationEvidenceTrustVerificationRecoveryV96={sync,state,factor,status,best};
setTimeout(sync,135000);setInterval(sync,30000);
})();