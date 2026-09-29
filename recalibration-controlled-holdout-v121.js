/* CrowSpace — Recalibration Controlled Holdout Evidence v121
   Browser-only. Compares validated decision outcomes with available neutral observations.
   A holdout is only considered usable when an explicit local control observation exists.
*/
(function(){
const LED='crowspace-recalibration-event-ledger-v104',OUT='crowspace-recalibration-event-outcomes-v105',VAL='crowspace-recalibration-outcome-evidence-validation-v119',KEY='crowspace-recalibration-controlled-holdout-v121',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN_EFFECT=.05;
function state(){return L(KEY,{})}
function sync(){
 const led=L(LED,{}),out=L(OUT,{}),val=L(VAL,{}),controls=L('crowspace-recalibration-holdout-observations-v121',{}),st=state();
 (led.events||[]).forEach(ev=>{const o=out.byDecision?.[ev.decisionId],v=val[ev.decisionId],ctrl=controls[ev.decisionId];if(!o||!v||v.status!=='VALID'||!ctrl)return;const treated=N(o.accuracy),control=N(ctrl.accuracy),delta=treated-control;const status=delta>=MIN_EFFECT?'HOLDOUT_POSITIVE':delta<=-MIN_EFFECT?'HOLDOUT_NEGATIVE':'HOLDOUT_INCONCLUSIVE';st[ev.decisionId]={decisionId:ev.decisionId,eventId:ev.eventId,reason:ev.reason,treated,control,delta,status,observedAt:N(o.observedAt),controlObservedAt:N(ctrl.observedAt),updatedAt:Date.now(),evidence:'VALIDATED_TREATED_VS_CONTROL'};});S(KEY,st);return st}
function stateFor(reason){return Object.values(state()).filter(x=>!reason||x.reason===reason)}
function summary(reason){const a=stateFor(reason),p=a.filter(x=>x.status==='HOLDOUT_POSITIVE').length,n=a.filter(x=>x.status==='HOLDOUT_NEGATIVE').length,i=a.filter(x=>x.status==='HOLDOUT_INCONCLUSIVE').length;return {count:a.length,positive:p,negative:n,inconclusive:i,status:p?'CONTROLLED_EVIDENCE':a.length?'INCONCLUSIVE':'EMPTY'}}
function factor(reason){const s=summary(reason);return s.count?Math.max(.5,Math.min(1,s.positive/s.count)):1}
window.CrowSpaceRecalibrationControlledHoldoutV121={sync,state,stateFor,summary,factor};setTimeout(sync,185000);setInterval(sync,30000);
})();