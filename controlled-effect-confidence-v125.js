/* CrowSpace — Controlled Effect Confidence v125
   Browser-only. Adds conservative confidence intervals and a minimum meaningful-effect
   threshold to pooled treated/control evidence. This is descriptive evidence, not a
   claim of causality.
*/
(function(){
const SRC='crowspace-controlled-effect-evidence-v124',KEY='crowspace-controlled-effect-confidence-v125',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN_EFFECT=.05,MIN_GROUP=4,Z=1.96;
function state(){return L(KEY,{})}
function sync(){
 const src=L(SRC,{}),st=state();
 Object.values(src).forEach(x=>{
  const n=Math.min(N(x.treated),N(x.control)),effect=N(x.effect),u=N(x.uncertainty);
  const margin=Z*u,low=effect-margin,high=effect+margin,meaningful=Math.abs(effect)>=MIN_EFFECT,intervalExcludesZero=low>0||high<0;
  const confidence=intervalExcludesZero&&meaningful?'SUPPORTED':meaningful?'UNCERTAIN':'SMALL_EFFECT';
  st[x.reason]={...x,marginOfError:margin,lower:low,upper:high,meaningful,intervalExcludesZero,confidence,minEffect:MIN_EFFECT,minGroup:MIN_GROUP,sampleMinimumMet:n>=MIN_GROUP,updatedAt:Date.now(),method:'CONSERVATIVE_NORMAL_APPROXIMATION'};
 });
 S(KEY,st);return st
}
function summary(reason){return state()[reason]||{confidence:'EMPTY',sampleMinimumMet:false}}
function factor(reason){const x=summary(reason);if(x.confidence==='SUPPORTED')return 1;if(x.confidence==='UNCERTAIN')return .85;if(x.confidence==='SMALL_EFFECT')return 1;return 1}
window.CrowSpaceControlledEffectConfidenceV125={state,sync,summary,factor};
setTimeout(sync,194000);setInterval(sync,30000);
})();