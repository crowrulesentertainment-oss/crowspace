/* CrowSpace — Threshold Decision Confidence Memory v71
   Browser-only. Learns whether confidence gates predict stable threshold behavior and calibrates them over time.
*/
(function(){
const CONF="crowspace-threshold-decision-confidence-v70",MEM="crowspace-threshold-arbitration-memory-v67",KEY="crowspace-threshold-confidence-memory-v71",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const c=L(CONF,{}),m=L(MEM,{}),st=state();
 Object.values(c).forEach(x=>{
  const h=m[x.reason]?.history||[],recent=h.slice(0,8),old=st[x.reason]||{tests:0,correct:0,errors:[]};
  if(recent.length){
   const realized=recent.reduce((a,b)=>a+N(b.realized),0)/recent.length;
   const expected=Math.abs(N(x.confidence)-.5);
   const observed=Math.min(1,Math.abs(realized)*10);
   const correct=(expected<.25&&observed<.25)||(expected>=.25&&observed>=.1);
   old.tests++;old.correct+=correct?1:0;old.errors=[Math.abs(expected-observed),...(old.errors||[])].slice(0,20);
  }
  const err=old.errors?.length?old.errors.reduce((a,b)=>a+b,0)/old.errors.length:0;
  old.reason=x.reason;old.confidence=N(x.confidence);old.gate=N(x.gate);old.accuracy=old.tests?old.correct/old.tests:0;old.error=+err.toFixed(3);
  old.status=old.tests<3?"COLLECTING":old.accuracy>=.7?"CALIBRATED":old.accuracy>=.45?"PARTIAL":"UNRELIABLE";
  old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];if(!x||x.tests<3)return 1;return x.status==="CALIBRATED"?1:x.status==="PARTIAL"?.85:.6}
function accuracy(reason){return state()[reason]?.accuracy||0}
function best(){return Object.values(state()).sort((a,b)=>(b.accuracy||0)-(a.accuracy||0))}
window.CrowSpaceThresholdConfidenceMemoryV71={sync,state,factor,accuracy,best};
setTimeout(sync,85000);setInterval(sync,30000);
})();