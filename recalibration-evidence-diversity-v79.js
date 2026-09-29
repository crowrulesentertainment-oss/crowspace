/* CrowSpace — Recalibration Evidence Recency & Diversity v79
   Browser-only. Prevents stale or single-pattern evidence from dominating strategy validation.
*/
(function(){
const E="crowspace-recalibration-evidence-v78",CAL="crowspace-recalibration-evidence-calibration-v80",KEY="crowspace-recalibration-evidence-diversity-v79",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function decay(t){return Math.pow(.5,Math.max(0,(Date.now()-N(t))/DAY)/30)}
function sync(){
 const src=L(E,{}),st=state();
 Object.values(src).forEach(x=>{
  const old=st[x.reason]||{},observed=x.observed||{},arms=Object.entries(observed);
  const total=arms.reduce((n,a)=>n+N(a[1].tests),0),coverage=arms.length>=2?1:arms.length?0.5:0;
  const freshness=Math.min(1,N(x.updatedAt)?decay(x.updatedAt):0);
  const effective=Math.min(1,total/8)*.45+coverage*.3+freshness*.25;
  const gate=x.status==="VALIDATED"&&effective>=.65;
  st[x.reason]={reason:x.reason,status:gate?"DIVERSIFIED":"LIMITED",leader:x.leader,runner:x.runner,totalTests:total,coverage,freshness:+freshness.toFixed(3),effective:+effective.toFixed(3),gate,updatedAt:Date.now()};
 });
 S(KEY,st);return st
}
function canUse(reason){const x=state()[reason];const cal=window.CrowSpaceRecalibrationCalibrationV80?.accuracy?.(reason);return !!x?.gate&&(!cal||cal>=.5)}
function factor(reason){const x=state()[reason];return x?.gate?1:x?.effective>=.4?.65:.4}
function best(){return Object.values(state()).sort((a,b)=>(b.effective||0)-(a.effective||0))}
window.CrowSpaceRecalibrationDiversityV79={sync,state,canUse,factor,best};
setTimeout(sync,101000);setInterval(sync,30000);
})();