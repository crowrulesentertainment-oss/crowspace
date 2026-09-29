/* CrowSpace — Alert Workflow Queue Assignment & Ownership v159
   Browser-only. Tracks local reviewer ownership and assignment history.
*/
(function(){
const SRC='crowspace-alert-workflow-escalation-routing-v158',KEY='crowspace-alert-workflow-queue-assignment-v159',MAX=200,J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{assignments:{},history:[]})}
function sync(){
 const src=J(SRC,{}),st=state(),now=Date.now();
 Object.values(src.queues||{}).flat().forEach(n=>{
  if(!st.assignments[n.notificationId])st.assignments[n.notificationId]={notificationId:n.notificationId,eventId:n.eventId,priority:n.priority,owner:null,assignedAt:null,updatedAt:now};
 });
 S(KEY,st);return st
}
function assign(notificationId,owner){
 const st=state(),id=String(notificationId),x=st.assignments[id];if(!x)return null;
 const previous=x.owner||null;x.owner=String(owner||'').trim()||null;x.assignedAt=x.owner?Date.now():null;x.updatedAt=Date.now();
 st.history=[{notificationId:id,eventId:x.eventId,from:previous,to:x.owner,at:x.updatedAt},...(st.history||[])].slice(0,MAX);S(KEY,st);return x
}
function summary(){const a=Object.values(state().assignments);return {total:a.length,assigned:a.filter(x=>x.owner).length,unassigned:a.filter(x=>!x.owner).length,owners:[...new Set(a.map(x=>x.owner).filter(Boolean))]}}
function queue(){return Object.values(state().assignments)}
window.CrowSpaceAlertWorkflowQueueAssignmentV159={state,sync,assign,summary,queue};
setTimeout(sync,288000);setInterval(sync,30000);
})();