/* CrowSpace — Controlled Effect Regime Trajectory Quality v138
   Browser-only. Validates observed lifecycle trajectories for completeness,
   contradictory states, and sufficient transitions. Descriptive only.
*/
(function(){
const SRC='crowspace-controlled-effect-regime-trajectory-v137',KEY='crowspace-controlled-effect-regime-trajectory-quality-v138',L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN_STATES=2;
function state(){return L(KEY,{})}
function sync(){
 const src=L(SRC,{}),st=state();
 Object.values(src).forEach(x=>{
  const h=Array.isArray(x.history)?x.history:[], transitions=Math.max(0,h.length-1), unique=[...new Set(h)], contradictory=(h.includes('DECAY')&&h.includes('PERSISTENCE')&&h.indexOf('DECAY')<h.indexOf('PERSISTENCE'))||(h.includes('RECOVERY')&&h.includes('TRANSITION')&&h.indexOf('RECOVERY')<h.indexOf('TRANSITION'));
  const sufficient=unique.length>=MIN_STATES&&transitions>=1;
  let status='INSUFFICIENT';
  if(sufficient)status=contradictory?'CONTRADICTORY':'VALID';
  st[x.reason]={reason:x.reason,states:h.length,uniqueStates:unique.length,transitions,contradictory,sufficient,status,trajectory:x.trajectory||'COLLECTING',updatedAt:Date.now(),method:'LIFECYCLE_TRAJECTORY_QUALITY'};
 });
 S(KEY,st);return st
}
function summary(reason){return state()[reason]||{status:'EMPTY'}}
window.CrowSpaceControlledEffectRegimeTrajectoryQualityV138={state,sync,summary};
setTimeout(sync,233000);setInterval(sync,30000);
})();