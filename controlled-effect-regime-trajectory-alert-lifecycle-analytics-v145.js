/* CrowSpace — Controlled Effect Regime Trajectory Alert Lifecycle Analytics v145
   Browser-only. Summarizes observed alert lifecycle timing and recurrence patterns.
   Descriptive operational analytics only.
*/
(function(){
const SRC='crowspace-controlled-effect-regime-alert-timeline-v144',KEY='crowspace-controlled-effect-regime-alert-lifecycle-analytics-v145',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(SRC,{}),st=state(),now=Date.now();
 Object.values(src).forEach(x=>{
  const t=Array.isArray(x.timeline)?x.timeline.slice().sort((a,b)=>N(a.at)-N(b.at)):[], created=t.find(e=>e.status==='CREATED'), ack=t.find(e=>e.status==='ACKNOWLEDGED'), resolved=t.find(e=>e.status==='RESOLVED'), reopened=t.filter(e=>e.status==='REOPENED');
  const end=t[t.length-1],age=created?Math.max(0,(end?.at||now)-N(created.at)):0;
  st[x.eventId]={eventId:x.eventId,reason:x.reason,current:x.current||'CREATED',createdAt:N(created?.at),acknowledgedAt:N(ack?.at),resolvedAt:N(resolved?.at),reopenedCount:reopened.length,ageMs:age,timeToAcknowledgeMs:created&&ack?Math.max(0,N(ack.at)-N(created.at)):null,timeToResolutionMs:created&&resolved?Math.max(0,N(resolved.at)-N(created.at)):null,persistenceMs:created&&(!resolved||N(resolved.at)>N(end?.at))?age:(resolved?Math.max(0,N(resolved.at)-N(created.at)):age),updatedAt:now};
 });
 S(KEY,st);return st
}
function summary(){const a=Object.values(state()),avg=k=>{const v=a.map(x=>N(x[k])).filter(Boolean);return v.length?v.reduce((s,n)=>s+n,0)/v.length:null};return {alerts:a.length,acknowledged:a.filter(x=>x.acknowledgedAt).length,resolved:a.filter(x=>x.current==='RESOLVED').length,persisting:a.filter(x=>x.current==='PERSISTING').length,reopened:a.filter(x=>x.reopenedCount>0).length,avgTimeToAcknowledgeMs:avg('timeToAcknowledgeMs'),avgTimeToResolutionMs:avg('timeToResolutionMs'),avgPersistenceMs:avg('persistenceMs')}}
function stateFor(reason){return Object.values(state()).filter(x=>!reason||x.reason===reason)}
window.CrowSpaceCrowSpaceAlertLifecycleAnalyticsV145={state,sync,summary,stateFor};
setTimeout(sync,254000);setInterval(sync,30000);
})();