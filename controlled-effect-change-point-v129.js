/* CrowSpace — Controlled Effect Change-Point Evidence v129
   Browser-only. Identifies an approximate transition point when ordered holdout
   effects materially change direction or magnitude. Descriptive only.
*/
(function(){
const SRC='crowspace-controlled-effect-confidence-v125',KEY='crowspace-controlled-effect-change-point-v129',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN_WINDOWS=4,MIN_SHIFT=.05;
function state(){return L(KEY,{})}
function sync(){
 const src=L(SRC,{}),st=state(),groups={};
 Object.values(src).forEach(x=>{if(!x.usable)return;(groups[x.reason||'UNKNOWN']||(groups[x.reason||'UNKNOWN']=[])).push(x)});
 Object.keys(groups).forEach(reason=>{
  const rows=groups[reason].sort((a,b)=>N(a.updatedAt)-N(b.updatedAt)),effects=rows.map(x=>N(x.effect));
  let best=null;
  for(let i=1;i<effects.length;i++){
   const left=effects.slice(0,i),right=effects.slice(i),avg=a=>a.reduce((s,x)=>s+x,0)/a.length,shift=avg(right)-avg(left);
   if(!best||Math.abs(shift)>Math.abs(best.shift))best={index:i,shift};
  }
  const enough=rows.length>=MIN_WINDOWS,change=best&&Math.abs(best.shift)>=MIN_SHIFT;
  st[reason]={reason,windows:rows.length,changePointIndex:change?best.index:null,changeShift:change?best.shift:0,detected:!!(enough&&change),status:enough?(change?'CHANGE_POINT_DETECTED':'NO_MATERIAL_CHANGE'):'COLLECTING',minimumWindows:MIN_WINDOWS,minShift:MIN_SHIFT,updatedAt:Date.now(),method:'MAX_MEAN_SHIFT'};
 });S(KEY,st);return st
}
function summary(reason){return state()[reason]||{status:'EMPTY',windows:0}}
function factor(reason){const x=summary(reason);return x.status==='CHANGE_POINT_DETECTED'?.85:1}
window.CrowSpaceControlledEffectChangePointV129={state,sync,summary,factor};setTimeout(sync,206000);setInterval(sync,30000);
})();