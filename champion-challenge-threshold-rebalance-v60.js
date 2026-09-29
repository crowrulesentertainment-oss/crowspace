/* CrowSpace — Challenge Threshold Portfolio Rebalancer v60
   Browser-only. Rebalances validated and exploratory threshold allocations using evidence, recency and performance.
*/
(function(){
const PORT="crowspace-challenge-threshold-portfolio-v59",VAL="crowspace-challenge-threshold-validation-v58",KEY="crowspace-challenge-threshold-rebalance-v60",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function decay(t){return Math.pow(.5,Math.max(0,(Date.now()-N(t))/DAY)/30)}
function state(){return L(KEY,{})}
function sync(){
 const p=L(PORT,{}),v=L(VAL,{}),st=state();
 Object.values(p).forEach(x=>{
  const q=v[x.reason]||{},age=decay(q.updatedAt||x.updatedAt),quality=Math.max(0,Math.min(1,(N(x.quality)+1)/2)),evidence=Math.min(1,N(x.tests)/6),recency=age;
  const score=quality*.5+evidence*.3+recency*.2;
  const base=x.status==="EXPLOIT"?.6:x.status==="EXPLORE"?.25:0,adj=window.CrowSpaceThresholdMemoryV61?.adjustment?.(x.reason)||0;
  const allocation=x.status==="HOLD"?0:Math.max(.1,Math.min(1,base+score*.4+adj));
  st[x.reason]={reason:x.reason,status:x.status,score:+score.toFixed(3),allocation:+allocation.toFixed(2),quality:N(x.quality),tests:N(x.tests),recency:+recency.toFixed(2),updatedAt:Date.now()};
 });
 S(KEY,st);return st
}
function allocation(reason){return state()[reason]?.allocation||0}
function score(reason){return state()[reason]?.score||0}
function best(){return Object.values(state()).sort((a,b)=>(b.allocation||0)-(a.allocation||0))}
window.CrowSpaceThresholdRebalanceV60={sync,state,allocation,score,best};
setTimeout(sync,63000);setInterval(sync,30000);
})();