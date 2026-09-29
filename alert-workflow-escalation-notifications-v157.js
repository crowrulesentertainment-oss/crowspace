/* CrowSpace — Alert Workflow Escalation Notifications & Acknowledgment v157
   Browser-only. Records local notification events for escalated workflow items.
*/
(function(){
const SRC='crowspace-alert-workflow-sla-escalation-v156',KEY='crowspace-alert-workflow-escalation-notifications-v157',MAX=200,N=x=>Number(x)||0,J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{notifications:[],acknowledged:{}})}
function sync(){
 const src=J(SRC,{}),st=state(),now=Date.now(),seen=new Set((st.notifications||[]).map(x=>x.marker));
 Object.values(src).forEach(x=>{
  if(x.status==='CLOSED'||x.escalation==='NONE')return;
  const marker=String(x.eventId)+':'+String(x.escalation)+':'+String(x.priority);
  if(seen.has(marker))return;
  st.notifications=[{notificationId:'ntf-'+marker.replace(/[^a-zA-Z0-9_-]/g,'-'),eventId:x.eventId,priority:x.priority,escalation:x.escalation,createdAt:now,acknowledged:false,marker},...(st.notifications||[])].slice(0,MAX);
 });
 S(KEY,st);return st
}
function acknowledge(notificationId){
 const st=state(),n=st.notifications.find(x=>x.notificationId===String(notificationId));if(!n)return null;
 n.acknowledged=true;n.acknowledgedAt=Date.now();st.acknowledged[n.eventId]=n.acknowledgedAt;S(KEY,st);return n
}
function summary(){const a=state().notifications||[];return {total:a.length,unacknowledged:a.filter(x=>!x.acknowledged).length,acknowledged:a.filter(x=>x.acknowledged).length,critical:a.filter(x=>x.priority==='CRITICAL'&&!x.acknowledged).length}}
window.CrowSpaceAlertWorkflowEscalationNotificationsV157={state,sync,acknowledge,summary};
setTimeout(sync,282000);setInterval(sync,30000);
})();