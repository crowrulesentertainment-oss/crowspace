/* CrowSpace — Threshold Arbitration Stability v68
   Browser-only. Detects persistent arbitration drift and stabilizes noisy decision signals.
*/
(function(){
const MEM="crowspace-threshold-arbitration-memory-v67",KEY="crowspace-threshold-arbitration-stability-v68",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(MEM,{}),st=state();
 Object.values(src).forEach(x=>{
  const h=x.history||[],recent=h.slice(0,6),avg=recent.reduce((a,b)=>a+N(b.arbitration),0)/Math.max(1,recent.length),abs=recent.reduce((a,b)=>a+Math.abs(N(b.arbitration)),0)/Math.max(1,recent.length);
  const variance=recent.reduce((a,b)=>a+Math.pow(N(b.arbitration)-avg,2),0)/Math.max(1,recent.length),noise=Math.sqrt(variance);
  const stability=Math.max(0,Math.min(1,1-noise*12)),persistent=Math.abs(avg)>=.02&&recent.length>=3;
  const status=stability>=.8&&persistent?"STABLE_SIGNAL":stability<.5?"NOISY":"WATCH";
  st[x.reason]={reason:x.reason,avg:+avg.toFixed(3),magnitude:+abs.toFixed(3),noise:+noise.toFixed(3),stability:+stability.toFixed(3),persistent,status,tests:N(x.tests),updatedAt:Date.now()};
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];if(!x)return 1;return x.status==="NOISY"?.5:x.status==="WATCH"?.8:1}
function best(){return Object.values(state()).sort((a,b)=>(b.stability||0)-(a.stability||0))}
window.CrowSpaceThresholdStabilityV68={sync,state,factor,best};
setTimeout(sync,79000);setInterval(sync,30000);
})();