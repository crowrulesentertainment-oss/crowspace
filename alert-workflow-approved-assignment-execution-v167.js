/* CrowSpace — Approved Assignment Execution v167
   Browser-only. Requires explicit confirmation before applying an approved reassignment.
*/
(function(){
const APPROVAL='crowspace-alert-workflow-suggestion-approval-v166',ASSIGN='crowspace-alert-workflow-queue-assignment-v159',KEY='crowspace-alert-workflow-approved-assignment-execution-v167',MAX=500,J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{executions:{},history:[]})}
function sync(){
 const a=J(APPROVAL,{}),s=state(),now=Date.now();
 Object.values(a.reviews||{}).forEach(x=>{
  if(x.status==='APPROVED'&&!s.executions[x.suggestionId])s.executions[x.suggestionId]={suggestionId:x.suggestionId,eventId:x.eventId,suggestedOwner:x.suggestedOwner||null,status:'READY',approvedAt:x.reviewedAt||now,confirmedAt:null,executedAt:null,updatedAt:now};
 });
 S(KEY,s);return s
}
function confirm(id){
 const s=state(),x=s.executions[String(id)];if(!x||x.status!=='READY'||!x.suggestedOwner)return null;
 x.status='CONFIRMED';x.confirmedAt=Date.now();x.updatedAt=x.confirmedAt;
 S(KEY,s);return x
}
function execute(id){
 const s=state(),x=s.executions[String(id)];if(!x||x.status!=='CONFIRMED')return null;
 const a=J(ASSIGN,{}),target=a.assignments?.[x.notificationId||x.suggestionId];x.status='EXECUTED';x.executedAt=Date.now();x.updatedAt=x.executedAt;
 if(target){target.owner=x.suggestedOwner;target.assignedAt=x.executedAt;target.updatedAt=x.executedAt;}
 s.history=[{suggestionId:x.suggestionId,eventId:x.eventId,owner:x.suggestedOwner,at:x.executedAt},...(s.history||[])].slice(0,MAX);S(ASSIGN,a);S(KEY,s);return x
}
function summary(){const a=Object.values(state().executions);return {ready:a.filter(x=>x.status==='READY').length,confirmed:a.filter(x=>x.status==='CONFIRMED').length,executed:a.filter(x=>x.status==='EXECUTED').length,total:a.length}}
window.CrowSpaceAlertWorkflowApprovedAssignmentExecutionV167={state,sync,confirm,execute,summary};
setTimeout(sync,312000);setInterval(sync,30000);
})();