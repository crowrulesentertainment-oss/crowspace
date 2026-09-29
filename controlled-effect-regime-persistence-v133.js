/* CrowSpace — Controlled Effect Regime Persistence v133
   Browser-only. Measures whether a detected post-change regime persists across
   subsequent ordered holdout windows. Descriptive evidence only.
*/
(function(){
const SRC='crowspace-controlled-effect-regime-v130',TRANS='crowspace-controlled-effect-regime-transition-v132',KEY='crowspace-controlled-effect-regime-persistence-v133',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN_POST=3,MIN_EFFECT=.05;
function state(){return L(KEY,{})}
function sync(){
 const regimes=L(SRC,{}),trans=L(TRANS,{}),st=state();
 Object.values(regimes).forEach(x=>{
  const t=trans[x.reason],point=N(x.changePointIndex),post=[]; 
  const rows=x.rows||[];
  if(t?.validated&&point>0) rows.slice(point).forEach(r=>post.push(N(r.effect)));
  const n=post.length,first=post[0]||0,last=post[n-1]||0;
  const positive=post.filter(v=>v>=MIN_EFFECT).length,negative=post.filter(v=>v<=-MIN_EFFECT).length;
  const sameDirection=n?Math.max(positive,negative)/n:0;
  const persistent=n>=MIN_POST&&sameDirection>=2/3&&((first>=MIN_EFFECT&&last>=MIN_EFFECT)||(first<=-MIN_EFFECT&&last<=-MIN_EFFECT));
  st[x.reason]={reason:x.reason,postWindows:n,firstPostEffect:first,lastPostEffect:last,sameDirection,persistent,status:n<MIN_POST?'COLLECTING':persistent?'PERSISTENT':'NOT_PERSISTENT',minimumPostWindows:MIN_POST,updatedAt:Date.now(),method:'POST_CHANGE_PERSISTENCE'};
 });
 S(KEY,st);return st
}
function summary(reason){return state()[reason]||{status:'EMPTY'}}
function factor(reason){const x=summary(reason);return x.status==='PERSISTENT'?1:x.status==='NOT_PERSISTENT'?.85:1}
window.CrowSpaceControlledEffectRegimePersistenceV133={state,sync,summary,factor};
setTimeout(sync,218000);setInterval(sync,30000);
})();
