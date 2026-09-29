/* CrowSpace — Threshold Rebalance Forecast v62
   Browser-only. Forecasts near-term threshold allocation and identifies drift risk.
*/
(function(){
const MEM="crowspace-threshold-rebalance-memory-v61",KEY="crowspace-threshold-rebalance-forecast-v62",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(MEM,{}),st=state(),now=Date.now();
 Object.values(src).forEach(x=>{
  const h=x.history||[],recent=h.slice(0,5),avg=recent.reduce((a,b)=>a+N(b.delta),0)/Math.max(1,recent.length);
  const cal=window.CrowSpaceThresholdCalibrationV63?.accuracy?.(x.reason)||0,scale=.5+.5*cal,projected=Math.max(0,Math.min(1,N(x.allocation)+avg*3*scale)),drift=Math.abs(avg)*3*scale;
  const risk=drift>=.08||x.momentum==="DOWN"&&N(x.quality)<0.35?"HIGH":drift>=.03?"MEDIUM":"LOW";
  const direction=projected>N(x.allocation)+.01?"RISING":projected<N(x.allocation)-.01?"FALLING":"STABLE";
  st[x.reason]={reason:x.reason,current:N(x.allocation),projected:+projected.toFixed(3),drift:+drift.toFixed(3),direction,risk,momentum:x.momentum,quality:N(x.quality),tests:N(x.tests),updatedAt:now};
 });
 S(KEY,st);return st
}
function get(reason){return state()[reason]||null}
function risk(reason){return get(reason)?.risk||"LOW"}
function best(){return Object.values(state()).sort((a,b)=>(b.projected||0)-(a.projected||0))}
window.CrowSpaceThresholdForecastV62={sync,state,get,risk,best};
setTimeout(sync,67000);setInterval(sync,30000);
})();