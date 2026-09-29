/* CrowSpace — Controlled Effect Regime Trajectory v137
   Browser-only. Describes the observed lifecycle trajectory from ordered regime
   states. It is not a forecast of causal outcomes.
*/
(function(){
const SRC='crowspace-controlled-effect-regime-lifecycle-v136',KEY='crowspace-controlled-effect-regime-trajectory-v137',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(SRC,{}),st=state();
 Object.values(src).forEach(x=>{
  const lifecycle=x.lifecycle||'COLLECTING';
  const prior=st[x.reason];
  const history=prior?.history||[];
  const last=history[history.length-1];
  if(last!==lifecycle)history.push(lifecycle);
  const compact=history.slice(-6);
  let trajectory='COLLECTING';
  if(compact.includes('RECOVERY'))trajectory='RECOVERY_PATH';
  else if(compact.includes('DECAY'))trajectory='DECAY_PATH';
  else if(compact.includes('PERSISTENCE'))trajectory='PERSISTENCE_PATH';
  else if(compact.includes('TRANSITION'))trajectory='TRANSITION_PATH';
  st[x.reason]={reason:x.reason,current:lifecycle,history:compact,trajectory,transitions:Math.max(0,compact.length-1),updatedAt:Date.now(),method:'OBSERVED_LIFECYCLE_TRAJECTORY'};
 });
 S(KEY,st);return st
}
function summary(reason){return state()[reason]||{trajectory:'EMPTY',history:[]}}
window.CrowSpaceControlledEffectRegimeTrajectoryV137={state,sync,summary};
setTimeout(sync,230000);setInterval(sync,30000);
})();