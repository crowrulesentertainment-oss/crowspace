/* CrowSpace — Alert Command Center v150
   Browser-only. Consolidates trajectory alert, resolution, timeline, and portfolio-health
   signals into one operational Creator Studio overview. Descriptive monitoring only.
*/
(function(){
const A='crowspace-controlled-effect-regime-trajectory-alerts-v141',H='crowspace-controlled-effect-regime-alert-history-v142',R='crowspace-controlled-effect-regime-alert-resolution-v143',T='crowspace-controlled-effect-regime-alert-timeline-v144',L='crowspace-controlled-effect-regime-alert-lifecycle-analytics-v145',HE='crowspace-controlled-effect-regime-alert-health-v146',HT='crowspace-controlled-effect-regime-alert-health-history-v147',TA='crowspace-controlled-effect-regime-alert-health-trend-alerts-v148',KEY='crowspace-alert-command-center-v150',N=x=>Number(x)||0,J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function sync(){
 const a=J(A,{}),h=J(H,{}),r=J(R,{}),t=J(T,{}),l=J(L,{}),he=J(HE,{}),ht=J(HT,{}),ta=J(TA,{}),events=Object.values(a),res=Object.values(r),hist=J(H,{}).events||[];
 const portfolio=he.portfolio||{},trend=ht.trend||'COLLECTING',healthTrend=ta.current?.status||'CLEAR';
 const out={updatedAt:Date.now(),health:portfolio,healthTrend:trend,healthTrendAlert:healthTrend,alerts:events.length,active:events.filter(x=>x.status!=='CLEAR').length,acknowledged:hist.filter(x=>x.acknowledged).length,resolved:res.filter(x=>x.resolution==='RESOLVED').length,persisting:res.filter(x=>x.resolution==='PERSISTING').length,reopened:res.filter(x=>x.resolution==='REOPENED').length,timelineEvents:Object.values(t).reduce((n,x)=>n+(x.timeline||[]).length,0),analytics:l};
 S(KEY,out);return out
}
function summary(){return J(KEY,{})}
window.CrowSpaceAlertCommandCenterV150={sync,summary};
setTimeout(sync,266000);setInterval(sync,30000);
})();