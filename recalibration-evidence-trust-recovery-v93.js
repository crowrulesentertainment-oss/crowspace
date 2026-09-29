/* CrowSpace — Recalibration Evidence Trust Calibration Recovery v93
   Browser-only. Restores cautious trust after calibration drift using fresh successful observations.
*/
(function(){
const CAL="crowspace-recalibration-evidence-trust-calibration-v92",TRUST="crowspace-recalibration-evidence-trust-v91",KEY="crowspace-recalibration-evidence-trust-recovery-v93",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const cal=L(CAL,{}),trust=L(TRUST,{}),st=state();
 Object.values(cal).forEach(x=>{
  const t=trust[x.reason]||{},old=st[x.reason]||{attempts:0,recovered:0,history:[]};
  const degraded=x.status==="MISALIGNED"||x.status==="WATCH",fresh=N(t.updatedAt)>N(x.updatedAt),recovered=degraded&&fresh&&N(x.accuracy)>=.75;
  const marker=String(x.updatedAt||0)+":"+String(t.updatedAt||0)+":"+String(x.status||"");
  if(old.lastMarker!==marker){
   if(degraded)old.attempts++;if(recovered)old.recovered++;
   old.history=[{at:Date.now(),degraded,recovered,accuracy:N(x.accuracy),trust:N(t.trust)},...(old.history||[])].slice(0,30);old.lastMarker=marker;
  }
  old.reason=x.reason;old.factor=recovered?1:degraded?.65:1;old.status=recovered?"RECOVERED":degraded?"RECOVERING":"STABLE";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){return state()[reason]?.factor||1}
function status(reason){return state()[reason]?.status||"STABLE"}
function best(){return Object.values(state()).sort((a,b)=>(b.recovered||0)-(a.recovered||0))}
window.CrowSpaceRecalibrationEvidenceTrustRecoveryV93={sync,state,factor,status,best};
setTimeout(sync,129000);setInterval(sync,30000);
})();