/* CrowSpace — Controlled Effect Longitudinal Evidence v126
   Browser-only. Pools completed holdout windows with recency weighting so newer
   evidence contributes more without allowing a single window to dominate.
*/
(function(){
const SRC='crowspace-controlled-effect-confidence-v125',KEY='crowspace-controlled-effect-longitudinal-v126',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const HALF_LIFE=30*864e5,MIN_WINDOWS=2;
function state(){return L(KEY,{})}
function sync(){const src=L(SRC,{}),st=state(),now=Date.now(),groups={};Object.values(src).forEach(x=>{if(!x.sampleMinimumMet)return;const r=x.reason||'UNKNOWN';(groups[r]||(groups[r]=[])).push(x)});Object.keys(groups).forEach(reason=>{const rows=groups[reason].sort((a,b)=>N(a.updatedAt)-N(b.updatedAt));let sw=0,se=0;rows.forEach(x=>{const age=Math.max(0,now-N(x.updatedAt)),w=Math.pow(.5,age/HALF_LIFE);sw+=w;se+=N(x.effect)*w});const effect=sw?se/sw:0;st[reason]={reason,windows:rows.length,effect,weight:sw,recencyHalfLifeDays:30,usable:rows.length>=MIN_WINDOWS,status:rows.length>=MIN_WINDOWS?(effect>0?'POSITIVE':effect<0?'NEGATIVE':'INCONCLUSIVE'):'COLLECTING',updatedAt:now,method:'RECENCY_WEIGHTED_LONGITUDINAL_POOL'};});S(KEY,st);return st}
function summary(reason){return state()[reason]||{status:'EMPTY',windows:0,usable:false}}
window.CrowSpaceControlledEffectLongitudinalV126={state,sync,summary};setTimeout(sync,197000);setInterval(sync,30000);
})();