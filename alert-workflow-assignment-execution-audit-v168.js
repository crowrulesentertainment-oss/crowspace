/* CrowSpace — Assignment Execution Audit & Rollback v168
   Browser-only. Audits explicit v167 assignment execution and permits manual rollback.
   Rollback restores the owner captured immediately before execution.
*/
(function(){
const EXEC='crowspace-alert-workflow-approved-assignment-execution-v167',
      ASSIGN='crowspace-alert-workflow-queue-assignment-v159',
      KEY='crowspace-alert-workflow-assignment-execution-audit-v168',
      MAX=500,
      J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},
      S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{audit:{},history:[]})}
function sync(){
 const e=J(EXEC,{}),s=state(),now=Date.now();
 Object.values(e.executions||{}).forEach(x=>{
   const id=String(x.suggestionId);
   const prior=s.audit[id]||{};
   s.audit[id]={
     ...prior,suggestionId:x.suggestionId,eventId:x.eventId,notificationId:x.notificationId||null,
     previousOwner:x.previousOwner??prior.previousOwner??null,
     newOwner:x.suggestedOwner||null,status:x.status||prior.status||'READY',
     approvedAt:x.approvedAt||prior.approvedAt||null,confirmedAt:x.confirmedAt||prior.confirmedAt||null,
     executedAt:x.executedAt||prior.executedAt||null,rolledBackAt:prior.rolledBackAt||null,
     rollbackReason:prior.rollbackReason||'',updatedAt:now
   };
 });
 S(KEY,s);return s
}
function rollback(id,reason){
 const s=sync(),x=s.audit[String(id)];
 if(!x||x.status!=='EXECUTED'||!x.notificationId||x.previousOwner==null)return null;
 const a=J(ASSIGN,{}),target=a.assignments?.[x.notificationId];
 if(!target)return null;
 const at=Date.now();
 target.owner=x.previousOwner;target.assignedAt=at;target.updatedAt=at;
 x.status='ROLLED_BACK';x.rolledBackAt=at;x.rollbackReason=String(reason||'Manual rollback').trim()||'Manual rollback';x.updatedAt=at;
 s.history=[{suggestionId:x.suggestionId,eventId:x.eventId,from:x.newOwner,to:x.previousOwner,reason:x.rollbackReason,at},...(s.history||[])].slice(0,MAX);
 S(ASSIGN,a);S(KEY,s);return x
}
function summary(){const a=Object.values(state().audit);return{
 total:a.length,ready:a.filter(x=>x.status==='READY').length,confirmed:a.filter(x=>x.status==='CONFIRMED').length,
 executed:a.filter(x=>x.status==='EXECUTED').length,rolledBack:a.filter(x=>x.status==='ROLLED_BACK').length
}}
window.CrowSpaceAssignmentExecutionAuditRollbackV168={state,sync,rollback,summary};
setTimeout(sync,315000);setInterval(sync,30000);
})();