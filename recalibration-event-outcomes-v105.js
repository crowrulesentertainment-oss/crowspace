/* CrowSpace — Recalibration Event Outcome Ledger v105
   Browser-only. Attaches one outcome observation to each v104 decision event.
*/
(function(){
const LED="crowspace-recalibration-event-ledger-v104",OUT="crowspace-threshold-recalibration-outcomes-v74",KEY="crowspace-recalibration-event-outcomes-v105",MAX=500,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{outcomes:[],byDecision:{}})}
function sync(){
 const led=L(LED,{}),out=L(OUT,{}),st=state(),seen=st.byDecision||{};
 Object.values(led.events||[]).forEach(ev=>{
  const o=out[ev.reason];if(!o||seen[ev.decisionId])return;
  if(o.decisionId!==ev.decisionId)return;
  const item={eventId:ev.eventId,decisionId:ev.decisionId,reason:ev.reason,outcome:o.status||"UNKNOWN",successRate:N(o.successRate),accuracy:N(o.accuracy),observedAt:N(o.updatedAt)||Date.now(),recordedAt:Date.now(),lineage:"DECISION_OUTCOME"};
  st.outcomes=[item,...(st.outcomes||[])].slice(0,MAX);seen[ev.decisionId]=item;
 });
 st.byDecision=seen;st.updatedAt=Date.now();S(KEY,st);return st
}
function stateFor(reason){return state().outcomes.filter(x=>!reason||x.reason===reason)}
function outcome(decisionId){return state().outcomes.find(x=>x.decisionId===String(decisionId))||null}
function attribution(reason){const a=stateFor(reason);if(!a.length)return {status:"NO_OUTCOMES",count:0};
 const recovered=a.filter(x=>x.outcome==="RECOVERED").length;
 return {status:"ATTRIBUTED",count:a.length,recovered,successRate:a.length?recovered/a.length:0};
}
function factor(reason){const a=attribution(reason);return a.status==="ATTRIBUTED"?Math.max(.5,Math.min(1,a.successRate||.5)): .75}
function best(){return Object.values(state().byDecision||{}).length}
window.CrowSpaceRecalibrationEventOutcomesV105={sync,state,stateFor,outcome,attribution,factor,best};
setTimeout(sync,153000);setInterval(sync,30000);
})();