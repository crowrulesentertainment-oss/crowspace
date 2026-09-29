/* CrowSpace — Assignment Execution Verification & Integrity v169
   Browser-only. Verifies local assignment execution lineage and state consistency.
   Integrity checks are descriptive and do not prove external delivery or causality.
*/
(function(){
const AUDIT='crowspace-alert-workflow-assignment-execution-audit-v168',
      ASSIGN='crowspace-alert-workflow-queue-assignment-v159',
      KEY='crowspace-alert-workflow-assignment-execution-verification-v169',
      MAX=500,
      J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},
      S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{verifications:{},history:[]})}
function verifyOne(x,a){
 const target=x.notificationId?(a.assignments||{})[x.notificationId]:null, checks=[];
 checks.push({name:'IDENTITY',ok:!!x.suggestionId&&!!x.eventId});
 checks.push({name:'OWNER_CAPTURE',ok:x.status==='READY'||x.status==='CONFIRMED'||x.status==='EXECUTED'||x.status==='ROLLED_BACK'?true:false});
 checks.push({name:'ASSIGNMENT_LINK',ok:!!x.notificationId&&!!target});
 if(x.status==='EXECUTED')checks.push({name:'EXECUTED_OWNER',ok:!!target&&target.owner===x.newOwner});
 if(x.status==='ROLLED_BACK')checks.push({name:'ROLLBACK_OWNER',ok:!!target&&target.owner===x.previousOwner});
 checks.push({name:'TIMELINE',ok:(!x.confirmedAt||!x.approvedAt||x.confirmedAt>=x.approvedAt)&&(!x.executedAt||!x.confirmedAt||x.executedAt>=x.confirmedAt)&&(!x.rolledBackAt||!x.executedAt||x.rolledBackAt>=x.executedAt)});
 const passed=checks.filter(c=>c.ok).length;
 return {...x,checks,passed,totalChecks:checks.length,integrityScore:Math.round(passed/checks.length*100),integrity:passed===checks.length?'VERIFIED':passed>=Math.ceil(checks.length*.7)?'REVIEW':'FAILED',verifiedAt:Date.now()};
}
function sync(){
 const src=J(AUDIT,{}),a=J(ASSIGN,{}),s=state(),now=Date.now();
 Object.values(src.audit||{}).forEach(x=>{s.verifications[String(x.suggestionId)]=verifyOne(x,a)});
 const rows=Object.values(s.verifications).sort((p,q)=>(q.verifiedAt||0)-(p.verifiedAt||0)).slice(0,MAX);
 s.history=[{at:now,verified:rows.filter(x=>x.integrity==='VERIFIED').length,review:rows.filter(x=>x.integrity==='REVIEW').length,failed:rows.filter(x=>x.integrity==='FAILED').length,total:rows.length},...(s.history||[])].slice(0,MAX);
 S(KEY,s);return s
}
function summary(){const a=Object.values(state().verifications);return {total:a.length,verified:a.filter(x=>x.integrity==='VERIFIED').length,review:a.filter(x=>x.integrity==='REVIEW').length,failed:a.filter(x=>x.integrity==='FAILED').length,averageScore:a.length?Math.round(a.reduce((n,x)=>n+(x.integrityScore||0),0)/a.length):0}}
window.CrowSpaceAssignmentExecutionVerificationV169={state,sync,verifyOne,summary};
setTimeout(sync,318000);setInterval(sync,30000);
})();