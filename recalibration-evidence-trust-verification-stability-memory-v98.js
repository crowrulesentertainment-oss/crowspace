/* CrowSpace — Recalibration Evidence Trust Verification Stability Memory v98
   Browser-only. Learns whether verification-stability decisions remain reliable across cycles.
*/
(function(){
const STAB="crowspace-recalibration-evidence-trust-verification-stability-v97",KEY="crowspace-recalibration-evidence-trust-verification-stability-memory-v98",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(STAB,{}),st=state();
 Object.values(src).forEach(x=>{
  const old=st[x.reason]||{tests:0,correct:0,history:[]};
  const marker=String(x.updatedAt||0)+":"+String(x.stability||0)+":"+String(x.status||"");
  if(old.lastMarker!==marker){
   const expected=x.status==="STABLE",observed=N(x.stability)>=.75;
   old.tests++;old.correct+=expected===observed?1:0;
   old.history=[{at:Date.now(),expected,observed,stability:N(x.stability)},...(old.history||[])].slice(0,30);old.lastMarker=marker;
  }
  old.reason=x.reason;old.accuracy=old.tests?old.correct/old.tests:0;old.status=old.tests<4?"COLLECTING":old.accuracy>=.75?"CALIBRATED":old.accuracy>=.5?"PARTIAL":"UNRELIABLE";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];if(!x||x.tests<4)return 1;return x.status==="CALIBRATED"?1:x.status==="PARTIAL"?.8:.5}
function accuracy(reason){return state()[reason]?.accuracy||0}
function best(){return Object.values(state()).sort((a,b)=>(b.accuracy||0)-(a.accuracy||0))}
window.CrowSpaceRecalibrationEvidenceTrustVerificationStabilityMemoryV98={sync,state,factor,accuracy,best};
setTimeout(sync,139000);setInterval(sync,30000);
})();