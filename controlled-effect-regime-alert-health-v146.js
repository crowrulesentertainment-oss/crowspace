/* CrowSpace — Controlled Effect Regime Alert Health v146
   Browser-only. Produces a bounded descriptive portfolio alert-health indicator.
   This is operational data quality, not causal or predictive scoring.
*/
(function(){
const SRC='crowspace-controlled-effect-regime-alert-lifecycle-analytics-v145',KEY='crowspace-controlled-effect-regime-alert-health-v146',clamp=x=>Math.max(0,Math.min(100,Number.isFinite(x)?x:0)),N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const s=L(SRC,{}),st=state(),now=Date.now(),a=Object.values(s),total=a.length;
 const unresolved=a.filter(x=>x.current==='PERSISTING'||x.current==='REOPENED').length;
 const reopened=a.filter(x=>N(x.reopenedCount)>0).length;
 const resolved=a.filter(x=>x.current==='RESOLVED').length;
 const resolutionRate=total?resolved/total:1;
 const unresolvedLoad=total?unresolved/total:0;
 const recurrence=total?reopened/total:0;
 const score=clamp(100*(.45*resolutionRate+.30*(1-unresolvedLoad)+.25*(1-recurrence)));
 const band=score>=80?'HEALTHY':score>=60?'WATCH':'ATTENTION';
 st.portfolio={score:Math.round(score),band,total,resolved,unresolved,reopened,resolutionRate,unresolvedLoad,recurrence,updatedAt:now,method:'BOUNDED_ALERT_HEALTH_SYNTHESIS'};
 S(KEY,st);return st
}
function summary(){return state().portfolio||{score:0,band:'EMPTY',total:0}}
window.CrowSpaceAlertHealthV146={state,sync,summary};
setTimeout(sync,257000);setInterval(sync,30000);
})();