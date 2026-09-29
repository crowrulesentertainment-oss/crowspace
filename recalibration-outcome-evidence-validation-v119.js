/* CrowSpace — Recalibration Outcome Evidence Validation v119
   Browser-only. Validates decision outcomes against a bounded post-decision observation window.
*/
(function(){
const LED="crowspace-recalibration-event-ledger-v104",OUT="crowspace-recalibration-event-outcomes-v105",KEY="crowspace-recalibration-outcome-evidence-validation-v119",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN=5*60*1000,MAX=7*864e5;
function state(){return L(KEY,{})}
function sync(){
 const led=L(LED,{}),out=L(OUT,{}),st=state(),now=Date.now();
 (led.events||[]).forEach(ev=>{
  const o=out.byDecision?.[ev.decisionId],old=st[ev.decisionId]||{};
  let status="MISSING",age=0;
  if(o){
   age=N(o.observedAt)-N(ev.decisionAt);
   const match=String(o.decisionId)===String(ev.decisionId)&&String(o.eventId)===String(ev.eventId);
   if(!match)status="MISMATCHED";
   else if(age<0)status="INVALID_ORDER";
   else if(age<MIN)status="PENDING";
   else if(age>MAX)status="EXPIRED";
   else if(!o.outcome||o.outcome==="UNKNOWN")status="INVALID_OUTCOME";
   else status="VALID";
  }else if(now<N(ev.decisionAt)+MIN)status="PENDING";
  old.decisionId=ev.decisionId;old.eventId=ev.eventId;old.reason=ev.reason;old.decisionAt=N(ev.decisionAt);old.observedAt=o?N(o.observedAt):0;old.age=age;old.status=status;old.updatedAt=now;st[ev.decisionId]=old;
 });
 S(KEY,st);return st
}
function stateFor(reason){return Object.values(state()).filter(x=>!reason||x.reason===reason)}
function valid(reason){return stateFor(reason).filter(x=>x.status==="VALID")}
function summary(reason){const a=stateFor(reason),v=a.filter(x=>x.status==="VALID").length;return {count:a.length,valid:v,pending:a.filter(x=>x.status==="PENDING").length,missing:a.filter(x=>x.status==="MISSING").length,invalid:a.filter(x=>["MISMATCHED","INVALID_ORDER","INVALID_OUTCOME","EXPIRED"].includes(x.status)).length,status:v?"VALIDATED":a.length?"PENDING":"EMPTY"}}
function factor(reason){const s=summary(reason);if(!s.count)return .75;return s.valid?s.valid/s.count>=.75?1:.8:s.pending?.8:.5}
function best(){return Object.values(state()).sort((a,b)=>a.status.localeCompare(b.status))}
window.CrowSpaceRecalibrationOutcomeEvidenceValidationV119={sync,state,stateFor,valid,summary,factor,best};
setTimeout(sync,179000);setInterval(sync,30000);
})();