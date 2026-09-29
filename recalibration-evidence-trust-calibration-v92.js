/* CrowSpace — Recalibration Evidence Trust Calibration v92
   Browser-only. Measures whether synthesized evidence trust is itself predictive of observed recovery quality.
*/
(function(){
const TRUST="crowspace-recalibration-evidence-trust-v91",OUT="crowspace-threshold-recalibration-outcomes-v74",KEY="crowspace-recalibration-evidence-trust-calibration-v92",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const trust=L(TRUST,{}),out=L(OUT,{}),st=state();
 Object.values(trust).forEach(x=>{
  const o=out[x.reason]||{},old=st[x.reason]||{tests:0,correct:0,history:[]};
  const expected=N(x.trust)>=.6, observed=o.status==="RECOVERED", marker=String(x.updatedAt||0)+":"+String(o.updatedAt||0)+":"+String(o.status||"");
  if(old.lastMarker!==marker){
   old.tests++;old.correct+=(expected===observed)?1:0;
   old.history=[{at:Date.now(),expected,observed,trust:N(x.trust),outcome:o.status||null},...(old.history||[])].slice(0,30);
   old.lastMarker=marker;
  }
  old.reason=x.reason;old.accuracy=old.tests?old.correct/old.tests:0;old.status=old.tests<4?"COLLECTING":old.accuracy>=.75?"CALIBRATED":old.accuracy>=.5?"WATCH":"MISALIGNED";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];if(!x||x.tests<4)return 1;return x.status==="CALIBRATED"?1:x.status==="WATCH"?.8:.5}
function accuracy(reason){return state()[reason]?.accuracy||0}
function best(){return Object.values(state()).sort((a,b)=>(b.accuracy||0)-(a.accuracy||0))}
window.CrowSpaceRecalibrationEvidenceTrustCalibrationV92={sync,state,factor,accuracy,best};
setTimeout(sync,127000);setInterval(sync,30000);
})();