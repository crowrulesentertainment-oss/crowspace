/* CrowSpace — Threshold Confidence Regime Detection v72
   Browser-only. Detects changing confidence regimes and requires re-calibration when behavior shifts.
*/
(function(){
const MEM="crowspace-threshold-confidence-memory-v71",KEY="crowspace-threshold-confidence-regime-v72",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(MEM,{}),st=state();
 Object.values(src).forEach(x=>{
  const old=st[x.reason]||{history:[]},prev=N(old.accuracy),next=N(x.accuracy),delta=next-prev;
  const h=[{at:Date.now(),accuracy:next,error:N(x.error)},...(old.history||[])].slice(0,12);
  const recent=h.slice(0,4),older=h.slice(4,8),ra=recent.length?recent.reduce((a,b)=>a+b.accuracy,0)/recent.length:next,oa=older.length?older.reduce((a,b)=>a+b.accuracy,0)/older.length:ra;
  const shift=ra-oa,regime=Math.abs(shift)>=.12?"SHIFTING":next>=.7?"RELIABLE":next>=.45?"UNCERTAIN":"UNRELIABLE";
  const recalibrate=regime==="SHIFTING"||regime==="UNRELIABLE";
  st[x.reason]={reason:x.reason,accuracy:next,error:N(x.error),delta:+delta.toFixed(3),shift:+shift.toFixed(3),regime,recalibrate,history:h,updatedAt:Date.now()};
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];if(!x)return 1;return x.recalibrate?.6:x.regime==="UNCERTAIN"?.8:1}
function needsRecalibration(reason){return !!state()[reason]?.recalibrate}
function best(){return Object.values(state()).sort((a,b)=>(b.accuracy||0)-(a.accuracy||0))}
window.CrowSpaceThresholdConfidenceRegimeV72={sync,state,factor,needsRecalibration,best};
setTimeout(sync,87000);setInterval(sync,30000);
})();