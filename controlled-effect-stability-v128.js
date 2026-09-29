/* CrowSpace — Controlled Effect Stability v128
   Browser-only. Examines ordered holdout-window effects for persistence, weakening,
   or reversal. Descriptive only; it does not establish causality.
*/
(function(){
const SRC='crowspace-controlled-effect-confidence-v125',KEY='crowspace-controlled-effect-stability-v128',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN_WINDOWS=3,MIN_EFFECT=.05;
function state(){return L(KEY,{})}
function sync(){
 const src=L(SRC,{}),st=state(),groups={};
 Object.values(src).forEach(x=>{if(!x.usable)return;(groups[x.reason||'UNKNOWN']||(groups[x.reason||'UNKNOWN']=[])).push(x)});
 Object.keys(groups).forEach(reason=>{
  const rows=groups[reason].sort((a,b)=>N(a.updatedAt)-N(b.updatedAt));
  const effects=rows.map(x=>N(x.effect)),first=effects[0]||0,last=effects[effects.length-1]||0;
  const positive=effects.filter(x=>x>=MIN_EFFECT).length,negative=effects.filter(x=>x<=-MIN_EFFECT).length;
  const slope=effects.length>1?(last-first)/(effects.length-1):0;
  let status='COLLECTING';
  if(rows.length>=MIN_WINDOWS){
   if(positive===rows.length) status=Math.abs(slope)<MIN_EFFECT/2?'STABLE_POSITIVE':'WEAKENING_POSITIVE';
   else if(negative===rows.length) status=Math.abs(slope)<MIN_EFFECT/2?'STABLE_NEGATIVE':'WEAKENING_NEGATIVE';
   else if((first>0&&last<0)||(first<0&&last>0)) status='REVERSING';
   else status='VARIABLE';
  }
  st[reason]={reason,windows:rows.length,firstEffect:first,lastEffect:last,slope,positive,negative,status,minimumWindows:MIN_WINDOWS,updatedAt:Date.now(),method:'ORDERED_EFFECT_STABILITY'};
 });S(KEY,st);return st
}
function summary(reason){return state()[reason]||{status:'EMPTY',windows:0}}
function factor(reason){const x=summary(reason);if(x.status==='STABLE_POSITIVE')return 1;if(x.status==='WEAKENING_POSITIVE')return .9;if(x.status==='VARIABLE')return .85;if(x.status==='REVERSING')return .75;return 1}
window.CrowSpaceControlledEffectStabilityV128={state,sync,summary,factor};setTimeout(sync,203000);setInterval(sync,30000);
})();