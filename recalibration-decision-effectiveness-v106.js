/* CrowSpace — Recalibration Decision Effectiveness v106
   Browser-only. Measures attributable outcome effectiveness from the v104 → v105 lineage.
*/
(function(){
const OUT="crowspace-recalibration-event-outcomes-v105",VAL="crowspace-recalibration-outcome-evidence-validation-v119",KEY="crowspace-recalibration-decision-effectiveness-v106",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(OUT,{}),st=state();
 Object.values(src.byDecision||{}).forEach(x=>{const validation=window.CrowSpaceRecalibrationOutcomeEvidenceValidationV119?.state?.()[x.decisionId];if(validation&&validation.status!=="VALID")return;
  const old=st[x.decisionId]||{tests:0,success:0,history:[]};
  const marker=String(x.decisionId)+":"+String(x.observedAt||0)+":"+String(x.outcome||"");
  if(old.lastMarker!==marker){
   old.tests++;old.success+=x.outcome==="RECOVERED"?1:0;
   old.history=[{at:Date.now(),outcome:x.outcome,success:x.outcome==="RECOVERED",successRate:N(x.successRate)},...(old.history||[])].slice(0,20);
   old.lastMarker=marker;
  }
  old.decisionId=x.decisionId;old.reason=x.reason;old.mode=x.mode||old.mode||null;
  old.effectiveness=old.tests?old.success/old.tests:0;
  old.status=old.tests<2?"COLLECTING":old.effectiveness>=.75?"EFFECTIVE":old.effectiveness>=.5?"MIXED":"INEFFECTIVE";
  old.updatedAt=Date.now();st[x.decisionId]=old;
 });
 S(KEY,st);return st
}
function stateFor(reason){return Object.values(state()).filter(x=>!reason||x.reason===reason)}
function effectiveness(reason){const a=stateFor(reason);if(!a.length)return 0;return a.reduce((s,x)=>s+N(x.effectiveness),0)/a.length}
function factor(reason){const e=effectiveness(reason);return e?Math.max(.5,Math.min(1,e)):1}
function best(){return Object.values(state()).sort((a,b)=>(b.effectiveness||0)-(a.effectiveness||0))}
window.CrowSpaceRecalibrationDecisionEffectivenessV106={sync,state,stateFor,effectiveness,factor,best};
setTimeout(sync,155000);setInterval(sync,30000);
})();