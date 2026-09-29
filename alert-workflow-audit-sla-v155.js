/* CrowSpace — Alert Workflow Audit & SLA Tracking v155
   Browser-only. Measures time spent in each review state and flags overdue workflow items.
   SLA status is an operational review signal, not a causal or predictive claim.
*/
(function(){
const WF='crowspace-alert-review-workflow-v154',KEY='crowspace-alert-workflow-audit-sla-v155',N=x=>Number(x)||0,J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const SLA={OPEN:86400000,IN_REVIEW:172800000,ACKNOWLEDGED:259200000,RESOLUTION_REVIEW:172800000,CLOSED:Infinity};
function state(){return J(KEY,{})}
function sync(){
 const src=J(WF,{}),st=state(),now=Date.now();
 Object.values(src).forEach(x=>{
  const h=Array.isArray(x.history)?x.history.slice().sort((a,b)=>N(a.at)-N(b.at)):[],current=x.status||'OPEN',last=h.length?h[h.length-1]:null,entered=N(last?.at)||N(x.updatedAt)||now,elapsed=Math.max(0,now-entered),limit=SLA[current]??172800000,overdue=current!=='CLOSED'&&elapsed>limit;
  const durations={};for(let i=0;i<h.length;i++){const end=h[i+1]?.at||now;durations[h[i].status]=(durations[h[i].status]||0)+Math.max(0,N(end)-N(h[i].at))}
  st[x.eventId]={eventId:x.eventId,status:current,enteredAt:entered,elapsedMs:elapsed,slaMs:limit,overdue,durations,historyCount:h.length,updatedAt:now};
 });
 S(KEY,st);return st
}
function summary(){const a=Object.values(state()),avg=k=>{const v=a.map(x=>N(x[k])).filter(Boolean);return v.length?v.reduce((s,n)=>s+n,0)/v.length:null};return {total:a.length,overdue:a.filter(x=>x.overdue).length,open:a.filter(x=>x.status==='OPEN').length,inReview:a.filter(x=>x.status==='IN_REVIEW').length,resolutionReview:a.filter(x=>x.status==='RESOLUTION_REVIEW').length,closed:a.filter(x=>x.status==='CLOSED').length,avgCurrentElapsedMs:avg('elapsedMs')}}
window.CrowSpaceAlertWorkflowAuditSlaV155={state,sync,summary,SLA};
setTimeout(sync,276000);setInterval(sync,30000);
})();