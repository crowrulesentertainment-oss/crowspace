/* CrowSpace — Contextual Threshold Arbitration v66
   Browser-only. Resolves global threshold signals against guarded contextual evidence.
*/
(function(){
const GUARD="crowspace-threshold-context-guardrails-v65",REB="crowspace-challenge-threshold-rebalance-v60",KEY="crowspace-threshold-arbitration-v66",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const g=L(GUARD,{}),r=L(REB,{}),st=state();
 Object.values(r).forEach(x=>{
  const ctx=x.reason+"::"+(x.forecast?.risk||"LOW")+"|"+(x.forecast?.direction||"STABLE")+"|"+(x.forecast?.momentum||"FLAT"),c=g[ctx],global=N(x.score),local=c&&c.status==="TRUSTED"?N(c.influence):0;
  const arbitration=Math.max(-.08,Math.min(.08,global*.02+local)),confidence=c?.status==="TRUSTED"?N(c.confidence):0;
  st[x.reason]={reason:x.reason,globalScore:global,contextInfluence:local,arbitration:+arbitration.toFixed(3),confidence,status:c?.status||"GLOBAL_ONLY",context:ctx,updatedAt:Date.now()};
 });
 S(KEY,st);return st
}
function influence(reason){return state()[reason]?.arbitration||0}
function status(reason){return state()[reason]?.status||"GLOBAL_ONLY"}
function best(){return Object.values(state()).sort((a,b)=>Math.abs(b.arbitration||0)-Math.abs(a.arbitration||0))}
window.CrowSpaceThresholdArbitrationV66={sync,state,influence,status,best};
setTimeout(sync,75000);setInterval(sync,30000);
})();