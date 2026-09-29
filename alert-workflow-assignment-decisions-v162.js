/* CrowSpace — Alert Workflow Assignment Decision Tracking v162
   Browser-only. Records reviewer decisions on workload-balancing suggestions.
*/
(function(){
const SRC='crowspace-alert-workflow-workload-balancing-v161',KEY='crowspace-alert-workflow-assignment-decisions-v162',MAX=500,J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{decisions:{},history:[]})}
function sync(){
 const src=J(SRC,{}),st=state(),now=Date.now();
 (src.suggestions||[]).forEach(x=>{
  if(!st.decisions[x.suggestionId])st.decisions[x.suggestionId]={suggestionId:x.suggestionId,eventId:x.eventId,notificationId:x.notificationId,priority:x.priority,currentOwner:x.currentOwner,suggestedOwner:x.suggestedOwner,status:'PENDING',updatedAt:now};
 });
 S(KEY,st);return st
}
function decide(suggestionId,status,note){
 const allowed=['ACCEPTED','REJECTED','DEFERRED'];if(!allowed.includes(status))return null;
 const st=state(),x=st.decisions[String(suggestionId)];if(!x)return null;
 x.status=status;x.note=String(note||'').trim()||null;x.decidedAt=Date.now();x.updatedAt=x.decidedAt;
 st.history=[{suggestionId:x.suggestionId,eventId:x.eventId,status,note:x.note,at:x.decidedAt},...(st.history||[])].slice(0,MAX);
 S(KEY,st);return x
}
function summary(){const a=Object.values(state().decisions);return {total:a.length,pending:a.filter(x=>x.status==='PENDING').length,accepted:a.filter(x=>x.status==='ACCEPTED').length,rejected:a.filter(x=>x.status==='REJECTED').length,deferred:a.filter(x=>x.status==='DEFERRED').length}}
window.CrowSpaceAlertWorkflowAssignmentDecisionsV162={state,sync,decide,summary};
setTimeout(sync,297000);setInterval(sync,30000);
})();