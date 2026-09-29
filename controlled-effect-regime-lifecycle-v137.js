/* CrowSpace — Controlled Effect Regime Lifecycle v137
   Browser-only. Produces a descriptive next-state signal from the observed lifecycle.
   It is not a causal or outcome forecast.
*/
(function(){
const SRC='crowspace-controlled-effect-regime-lifecycle-v136',KEY='crowspace-controlled-effect-regime-lifecycle-v137',L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(SRC,{}),st=state();
 Object.values(src).forEach(x=>{
  const map={COLLECTING:'COLLECTING',TRANSITION:'PERSISTENCE',PERSISTENCE:'PERSISTENCE',DECAY:'RECOVERY',RECOVERY:'PERSISTENCE'};
  st[x.reason]={reason:x.reason,currentState:x.lifecycle||'COLLECTING',nextObservedState:map[x.lifecycle]||'COLLECTING',basis:'LIFECYCLE_SEQUENCE',updatedAt:Date.now(),method:'DESCRIPTIVE_NEXT_STATE_SIGNAL'};
 });
 S(KEY,st);return st
}
function summary(reason){return state()[reason]||{currentState:'EMPTY',nextObservedState:'COLLECTING'}}
window.CrowSpaceControlledEffectRegimeLifecycleV137={state,sync,summary};setTimeout(sync,230000);setInterval(sync,30000);
})();