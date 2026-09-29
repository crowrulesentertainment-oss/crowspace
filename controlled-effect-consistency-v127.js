/* CrowSpace — Controlled Effect Consistency v127
   Browser-only. Tests whether longitudinal holdout effects are directionally consistent
   across completed windows. This is descriptive evidence, not a causal conclusion.
*/
(function(){
const SRC='crowspace-controlled-effect-confidence-v125',KEY='crowspace-controlled-effect-consistency-v127',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN_WINDOWS=3;
function state(){return L(KEY,{})}
function sync(){
 const src=L(SRC,{}),st=state(),groups={};
 Object.values(src).forEach(x=>{if(!x.usable)return;(groups[x.reason||'UNKNOWN']||(groups[x.reason||'UNKNOWN']=[])).push(x)});
 Object.keys(groups).forEach(reason=>{
  const rows=groups[reason].sort((a,b)=>N(a.updatedAt)-N(b.updatedAt));
  const pos=rows.filter(x=>N(x.effect)>0).length,neg=rows.filter(x=>N(x.effect)<0).length,zero=rows.length-pos-neg;
  const dominant=Math.max(pos,neg,zero),consistency=rows.length?dominant/rows.length:0;
  st[reason]={reason,windows:rows.length,positive:pos,negative:neg,inconclusive:zero,consistency,minimumWindows:MIN_WINDOWS,usable:rows.length>=MIN_WINDOWS,status:rows.length>=MIN_WINDOWS?(consistency>=2/3?'CONSISTENT':'MIXED'):'COLLECTING',updatedAt:Date.now(),method:'DIRECTIONAL_WINDOW_CONSISTENCY'};
 });S(KEY,st);return st
}
function summary(reason){return state()[reason]||{status:'EMPTY',windows:0,usable:false}}
function factor(reason){const x=summary(reason);if(!x.usable)return 1;return x.status==='CONSISTENT'?1:x.status==='MIXED'?.85:1}
window.CrowSpaceControlledEffectConsistencyV127={state,sync,summary,factor};setTimeout(sync,200000);setInterval(sync,30000);
})();