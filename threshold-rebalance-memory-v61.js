/* CrowSpace — Threshold Rebalance Memory v61
   Browser-only. Records allocation changes and detects stable, improving or deteriorating threshold regimes.
*/
(function(){
const REB="crowspace-challenge-threshold-rebalance-v60",KEY="crowspace-threshold-rebalance-memory-v61",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const reb=L(REB,{}),st=state(),now=Date.now();
 Object.values(reb).forEach(x=>{
  const old=st[x.reason]||{history:[]},prev=N(old.allocation),next=N(x.allocation),delta=next-prev;
  const direction=delta>.05?"INCREASING":delta<-.05?"DECREASING":"STABLE";
  old.reason=x.reason;old.allocation=next;old.score=N(x.score);old.quality=N(x.quality);old.tests=N(x.tests);old.delta=+delta.toFixed(3);old.direction=direction;
  old.history=[{at:now,allocation:next,score:N(x.score),delta:+delta.toFixed(3)},...(old.history||[])].slice(0,40);
  const recent=old.history.slice(0,5),avg=recent.reduce((a,b)=>a+N(b.delta),0)/Math.max(1,recent.length);
  old.momentum=avg>.02?"UP":avg<-.02?"DOWN":"FLAT";
  old.status=old.momentum==="UP"?"GAINING":old.momentum==="DOWN"?"LOSING":"STABLE";
  old.updatedAt=now;st[x.reason]=old;
 });
 S(KEY,st);return st
}
function momentum(reason){return state()[reason]?.momentum||"FLAT"}
function adjustment(reason){const x=state()[reason];return x?Math.max(-.1,Math.min(.1,N(x.delta))):0}
function best(){return Object.values(state()).sort((a,b)=>(b.allocation||0)-(a.allocation||0))}
window.CrowSpaceThresholdMemoryV61={sync,state,momentum,adjustment,best};
setTimeout(sync,65000);setInterval(sync,30000);
})();