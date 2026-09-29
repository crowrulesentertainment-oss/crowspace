/* CrowSpace — Execution Integrity Repair Verification v171
   Browser-only. Re-verifies explicit v170 repairs and records whether the local
   execution state is consistent after repair. No external delivery is inferred.
*/
(function(){
const VERIFY='crowspace-alert-workflow-assignment-execution-verification-v169',
      RECOVERY='crowspace-alert-workflow-execution-integrity-recovery-v170',
      ASSIGN='crowspace-alert-workflow-queue-assignment-v159',
      KEY='crowspace-alert-workflow-execution-integrity-repair-verification-v171',
      MAX=500,
      J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},
      S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{records:{},history:[]})}
function check(id){
 const v=J(VERIFY,{}).verifications?.[String(id)],
       r=J(RECOVERY,{}).repairs?.[String(id)],
       a=J(ASSIGN,{}),target=v?.notificationId?(a.assignments||{})[v.notificationId]:null;
 if(!v)return null;
 const checks=[];
 checks.push({name:'VERIFICATION_EXISTS',ok:true});
 checks.push({name:'ASSIGNMENT_LINK',ok:!!v.notificationId&&!!target});
 if(v.status==='EXECUTED')checks.push({name:'EXECUTED_OWNER',ok:!!target&&target.owner===v.newOwner});
 if(v.status==='ROLLED_BACK')checks.push({name:'ROLLBACK_OWNER',ok:!!target&&target.owner===v.previousOwner});
 checks.push({name:'REPAIR_RECORDED',ok:!r||!r.repairCount||!!r.lastRepairAt});
 const passed=checks.filter(x=>x.ok).length,score=Math.round(passed/checks.length*100);
 return {suggestionId:v.suggestionId,eventId:v.eventId,status:v.status,priorIntegrity:v.integrity,repairCount:r?.repairCount||0,targetOwner:target?.owner||null,checks,score,state:score===100?'VERIFIED':score>=70?'REVIEW':'FAILED',verifiedAt:Date.now()};
}
function sync(){
 const rec=J(RECOVERY,{}),s=state(),now=Date.now();
 Object.values(rec.repairs||{}).forEach(r=>{const x=check(r.suggestionId);if(x)s.records[String(r.suggestionId)]=x});
 s.history=[{at:now,verified:Object.values(s.records).filter(x=>x.state==='VERIFIED').length,review:Object.values(s.records).filter(x=>x.state==='REVIEW').length,failed:Object.values(s.records).filter(x=>x.state==='FAILED').length},...(s.history||[])].slice(0,MAX);
 S(KEY,s);return s
}
function summary(){const a=Object.values(state().records);return {total:a.length,verified:a.filter(x=>x.state==='VERIFIED').length,review:a.filter(x=>x.state==='REVIEW').length,failed:a.filter(x=>x.state==='FAILED').length,averageScore:a.length?Math.round(a.reduce((n,x)=>n+x.score,0)/a.length):0}}
window.CrowSpaceExecutionIntegrityRepairVerificationV171={state,sync,check,summary};
setTimeout(sync,324000);setInterval(sync,30000);
})();