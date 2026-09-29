/* CrowSpace — Controlled Effect Regime Trajectory Confidence v139
   Browser-only. Combines trajectory completeness, consistency, and evidence-quality
   signals into a descriptive data-quality score. This is not causal confidence.
*/
(function(){
const SRC='crowspace-controlled-effect-regime-trajectory-quality-v138',KEY='crowspace-controlled-effect-regime-trajectory-confidence-v139',L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(SRC,{}),st=state();
 Object.values(src).forEach(x=>{
  const h=Array.isArray(x.history)?x.history:[], len=Math.min(1,h.length/4);
  const completeness=len;
  const consistency=x.contradictory?0:1;
  const evidence=(x.sufficient?1:0)+(x.hasTransition?1:0)+(x.uniqueStates>=2?1:0);
  const evidenceQuality=evidence/3;
  const score=Math.round(100*(.4*completeness+.3*consistency+.3*evidenceQuality));
  let band='LOW';
  if(score>=80)band='HIGH'; else if(score>=60)band='MODERATE';
  st[x.reason]={reason:x.reason,score,band,completeness,consistency,evidenceQuality,historyLength:h.length,sufficient:!!x.sufficient,contradictory:!!x.contradictory,updatedAt:Date.now(),method:'TRAJECTORY_DATA_QUALITY_SCORE'};
 });
 S(KEY,st);return st
}
function summary(reason){return state()[reason]||{score:0,band:'EMPTY'}}
window.CrowSpaceControlledEffectRegimeTrajectoryConfidenceV139={state,sync,summary};
setTimeout(sync,236000);setInterval(sync,30000);
})();