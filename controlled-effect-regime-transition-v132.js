/* CrowSpace — Controlled Effect Regime Transition Validation v132
   Browser-only. Tests whether pre/post regime estimates differ beyond their
   conservative uncertainty margins. Descriptive evidence only.
*/
(function(){
const SRC='crowspace-controlled-effect-regime-confidence-v131',KEY='crowspace-controlled-effect-regime-transition-v132',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN=2,MIN_SHIFT=.05;
function state(){return L(KEY,{})}
function sync(){
 const src=L(SRC,{}),st=state();
 Object.values(src).forEach(x=>{
  const pre=x.pre||{},post=x.post||{},valid=pre.n>=MIN&&post.n>=MIN;
  const delta=N(post.effect)-N(pre.effect),margin=N(pre.margin)+N(post.margin);
  const separated=Math.abs(delta)>margin,meaningful=Math.abs(delta)>=MIN_SHIFT;
  st[x.reason]={reason:x.reason,preEffect:N(pre.effect),postEffect:N(post.effect),delta,combinedMargin:margin,separated,meaningful,validated:valid&&separated&&meaningful,status:!valid?'COLLECTING':(separated&&meaningful?'TRANSITION_SUPPORTED':'TRANSITION_UNCERTAIN'),updatedAt:Date.now(),method:'PRE_POST_INTERVAL_SEPARATION'};
 });
 S(KEY,st);return st
}
function summary(reason){return state()[reason]||{status:'EMPTY'}}
function factor(reason){const x=summary(reason);return x.validated?1:1}
window.CrowSpaceControlledEffectRegimeTransitionV132={state,sync,summary,factor};
setTimeout(sync,215000);setInterval(sync,30000);
})();
