/* CrowSpace — Alert Workflow SLA Escalation & Priority v156
   Browser-only. Escalates overdue workflow items using deterministic operational rules.
*/
(function(){
const SRC='crowspace-alert-workflow-audit-sla-v155',KEY='crowspace-alert-workflow-sla-escalation-v156',N=x=>Number(x)||0,J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{})}
function sync(){
 const src=J(SRC,{}),st=state(),now=Date.now();
 Object.values(src).forEach(x=>{
  const overdue=!!x.overdue,ratio=x.slaMs&&Number.isFinite(x.slaMs)?N(x.elapsedMs)/x.slaMs:0;
  let priority='NORMAL',escalation='NONE';
  if(x.status!=='CLOSED'&&ratio>=3){priority='CRITICAL';escalation='LEVEL_3'}
  else if(x.status!=='CLOSED'&&ratio>=2){priority='HIGH';escalation='LEVEL_2'}
  else if(overdue){priority='ELEVATED';escalation='LEVEL_1'}
  st[x.eventId]={eventId:x.eventId,status:x.status,priority,escalation,overdue,elapsedMs:N(x.elapsedMs),slaMs:N(x.slaMs),overdueRatio:ratio,escalatedAt:escalation==='NONE'?(st[x.eventId]?.escalatedAt||null):(st[x.eventId]?.escalatedAt||now),updatedAt:now};
 });
 S(KEY,st);return st
}
function summary(){const a=Object.values(state());return {total:a.length,critical:a.filter(x=>x.priority==='CRITICAL').length,high:a.filter(x=>x.priority==='HIGH').length,elevated:a.filter(x=>x.priority==='ELEVATED').length,normal:a.filter(x=>x.priority==='NORMAL').length}}
function queue(){return Object.values(state()).filter(x=>x.status!=='CLOSED').sort((a,b)=>({CRITICAL:0,HIGH:1,ELEVATED:2,NORMAL:3}[a.priority]-({CRITICAL:0,HIGH:1,ELEVATED:2,NORMAL:3}[b.priority])||b.overdueRatio-a.overdueRatio))}
window.CrowSpaceAlertWorkflowSlaEscalationV156={state,sync,summary,queue};
setTimeout(sync,279000);setInterval(sync,30000);
})();