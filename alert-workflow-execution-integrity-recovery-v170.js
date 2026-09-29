/* CrowSpace — Execution Integrity Recovery & Repair v170
   Browser-only. Provides explicit, reversible repair suggestions for failed or review
   execution-integrity checks. Repairs never run automatically.
*/
(function(){
const VERIFY='crowspace-alert-workflow-assignment-execution-verification-v169',
      AUDIT='crowspace-alert-workflow-assignment-execution-audit-v168',
      ASSIGN='crowspace-alert-workflow-queue-assignment-v159',
      KEY='crowspace-alert-workflow-execution-integrity-recovery-v170',
      MAX=500,
      J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},
      S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{repairs:{},history:[]})}
function inspect(x,a){
 const target=x.notificationId?(a.assignments||{})[x.notificationId]:null, issues=[];
 if(!x.suggestionId||!x.eventId)issues.push('IDENTITY');
 if(!x.notificationId||!target)issues.push('ASSIGNMENT_LINK');
 if(x.status==='EXECUTED'&&(!target||target.owner!==x.newOwner))issues.push('EXECUTED_OWNER');
 if(x.status==='ROLLED_BACK'&&(!target||target.owner!==x.previousOwner))issues.push('ROLLBACK_OWNER');
 if(x.confirmedAt&&x.approvedAt&&x.confirmedAt<x.approvedAt)issues.push('TIMELINE_CONFIRM');
 if(x.executedAt&&x.confirmedAt&&x.executedAt<x.confirmedAt)issues.push('TIMELINE_EXECUTE');
 if(x.rolledBackAt&&x.executedAt&&x.rolledBackAt<x.executedAt)issues.push('TIMELINE_ROLLBACK');
 return {issues,targetOwner:target?.owner||null};
}
function sync(){
 const v=J(VERIFY,{}),a=J(ASSIGN,{}),s=state(),now=Date.now();
 Object.values(v.verifications||{}).forEach(x=>{
  const id=String(x.suggestionId),ins=inspect(x,a),prior=s.repairs[id]||{};
  s.repairs[id]={...prior,suggestionId:x.suggestionId,eventId:x.eventId,notificationId:x.notificationId||null,status:x.status,integrity:x.integrity,integrityScore:x.integrityScore,issues:ins.issues,targetOwner:ins.targetOwner,repairable:ins.issues.length>0&&!!x.notificationId&&!!(a.assignments||{})[x.notificationId],updatedAt:now};
 });
 S(KEY,s);return s
}
function repair(id){
 const s=sync(),x=s.repairs[String(id)],a=J(ASSIGN,{}),target=x?.notificationId?(a.assignments||{})[x.notificationId]:null;
 if(!x||!target||!x.repairable)return null;
 const v=J(VERIFY,{}).verifications?.[String(id)],at=Date.now(),changes=[];
 if(v?.status==='EXECUTED'&&v.newOwner&&target.owner!==v.newOwner){target.owner=v.newOwner;target.updatedAt=at;changes.push('OWNER_RESTORED_TO_EXECUTED_STATE');}
 if(v?.status==='ROLLED_BACK'&&v.previousOwner!=null&&target.owner!==v.previousOwner){target.owner=v.previousOwner;target.updatedAt=at;changes.push('OWNER_RESTORED_TO_ROLLBACK_STATE');}
 if(!changes.length)return null;
 x.lastRepairAt=at;x.lastRepairChanges=changes;x.repairCount=(x.repairCount||0)+1;x.updatedAt=at;
 s.history=[{suggestionId:x.suggestionId,eventId:x.eventId,changes,at},...(s.history||[])].slice(0,MAX);
 S(ASSIGN,a);S(KEY,s);return x
}
function summary(){const a=Object.values(state().repairs);return {total:a.length,repairable:a.filter(x=>x.repairable).length,clean:a.filter(x=>!x.issues?.length).length,issueRecords:a.filter(x=>x.issues?.length).length,repaired:a.filter(x=>x.repairCount>0).length}}
window.CrowSpaceExecutionIntegrityRecoveryV170={state,sync,repair,summary};
setTimeout(sync,321000);setInterval(sync,30000);
})();