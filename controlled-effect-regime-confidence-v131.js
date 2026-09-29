/* CrowSpace — Controlled Effect Regime Confidence v131
   Browser-only. Evaluates pre/post regime estimates independently using sample size,
   conservative uncertainty bounds, and a meaningful-effect threshold.
*/
(function(){
const SRC='crowspace-controlled-effect-regime-v130',KEY='crowspace-controlled-effect-regime-confidence-v131',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN=2,THRESH=.05,Z=1.96;
function state(){return L(KEY,{})}
function sync(){
 const src=L(SRC,{}),st=state();
 Object.values(src).forEach(x=>{
  const preN=N(x.preWindows),postN=N(x.postWindows),pre=N(x.preEffect),post=N(x.postEffect);
  const preMargin=preN?Z/Math.sqrt(preN):1,postMargin=postN?Z/Math.sqrt(postN):1;
  const classify=(effect,margin,n)=>{if(n<MIN)return 'COLLECTING';const low=effect-margin,high=effect+margin;if(Math.abs(effect)<THRESH)return 'SMALL_EFFECT';if(low>0||high<0)return 'SUPPORTED';return 'UNCERTAIN'};
  st[x.reason]={reason:x.reason,status:x.status,pre:{n:preN,effect:pre,margin:preMargin,lower:pre-preMargin,upper:pre+preMargin,confidence:classify(pre,preMargin,preN)},post:{n:postN,effect:post,margin:postMargin,lower:post-postMargin,upper:post+postMargin,confidence:x.postStatus==='NOT_APPLICABLE'?'NOT_APPLICABLE':classify(post,postMargin,postN)},threshold:THRESH,updatedAt:Date.now(),method:'REGIME_SPECIFIC_CONSERVATIVE_INTERVAL'};
 });
 S(KEY,st);return st
}
function summary(reason){return state()[reason]||{status:'EMPTY'}}
function factor(reason){const x=summary(reason);return x.post?.confidence==='SUPPORTED'?1:1}
window.CrowSpaceControlledEffectRegimeConfidenceV131={state,sync,summary,factor};
setTimeout(sync,212000);setInterval(sync,30000);
})();
