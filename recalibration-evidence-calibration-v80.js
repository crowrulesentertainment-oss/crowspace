/* CrowSpace — Recalibration Evidence Calibration v80
   Browser-only. Calibrates evidence gates against subsequent recovery outcomes.
*/
(function(){
const DIV="crowspace-recalibration-evidence-diversity-v79",OUT="crowspace-threshold-recalibration-outcomes-v74",KEY="crowspace-recalibration-evidence-calibration-v80",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const div=L(DIV,{}),out=L(OUT,{}),st=state();
 Object.values(div).forEach(x=>{
  const r=out[x.reason],old=st[x.reason]||{tests:0,correct:0,errors:[]};
  if(!r)return;
  const marker=String(r.updatedAt||0)+":"+String(r.successRate||0)+":"+String(r.status||"");
  if(old.lastMarker!==marker){
   const expected=!!x.gate,observed=r.status==="RECOVERED",correct=expected===observed;
   old.tests++;old.correct+=correct?1:0;old.errors=[Math.abs((expected?1:0)-(observed?1:0)),...(old.errors||[])].slice(0,20);old.lastMarker=marker;
  }
  old.reason=x.reason;old.accuracy=old.tests?old.correct/old.tests:0;old.error=old.errors.length?old.errors.reduce((a,b)=>a+b,0)/old.errors.length:0;
  old.status=old.tests<3?"COLLECTING":old.accuracy>=.75?"CALIBRATED":old.accuracy>=.5?"PARTIAL":"UNRELIABLE";
  old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];if(!x||x.tests<3)return 1;return x.status==="CALIBRATED"?1:x.status==="PARTIAL"?.8:.5}
function accuracy(reason){return state()[reason]?.accuracy||0}
function best(){return Object.values(state()).sort((a,b)=>(b.accuracy||0)-(a.accuracy||0))}
window.CrowSpaceRecalibrationCalibrationV80={sync,state,factor,accuracy,best};
setTimeout(sync,103000);setInterval(sync,30000);
})();