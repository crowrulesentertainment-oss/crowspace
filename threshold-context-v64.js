/* CrowSpace — Threshold Context Interaction v64
   Browser-only. Learns whether threshold behavior changes under combined risk/context signals.
*/
(function(){
const CAL="crowspace-threshold-forecast-calibration-v63",FORE="crowspace-threshold-rebalance-forecast-v62",KEY="crowspace-threshold-context-v64",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function bucket(x){return x==="HIGH"?"HIGH":x==="MEDIUM"?"MEDIUM":"LOW"}
function context(x){return [bucket(x.risk),x.direction||"STABLE",x.momentum||"FLAT"].join("|")}
function state(){return L(KEY,{})}
function sync(){
 const f=L(FORE,{}),cal=L(CAL,{}),st=state();
 Object.values(f).forEach(x=>{
  const k=[x.reason,context(x)].join("::"),old=st[k]||{tests:0,accuracy:0,effects:[]},c=cal[x.reason]||{};
  const signal=N(c.accuracy)-.5;
  old.tests++;old.effects=[signal,...old.effects].slice(0,20);
  old.avgSignal=old.effects.reduce((a,b)=>a+b,0)/old.effects.length;
  old.confidence=Math.min(1,old.tests/5)*Math.min(1,Math.abs(old.avgSignal)*2+.25);
  old.status=old.tests<3?"COLLECTING":old.avgSignal>.1?"SUPPORTIVE":old.avgSignal<-.1?"CAUTIOUS":"NEUTRAL";
  old.reason=x.reason;old.context=context(x);old.risk=x.risk;old.direction=x.direction;old.momentum=x.momentum;old.updatedAt=Date.now();st[k]=old;
 });
 S(KEY,st);return st
}
function signal(reason,x){const k=[reason,context(x)].join("::");return state()[k]?.avgSignal||0}
function confidence(reason,x){const k=[reason,context(x)].join("::");return state()[k]?.confidence||0}
function best(){return Object.values(state()).sort((a,b)=>(b.confidence||0)-(a.confidence||0))}
window.CrowSpaceThresholdContextV64={sync,state,signal,confidence,best};
setTimeout(sync,71000);setInterval(sync,30000);
})();