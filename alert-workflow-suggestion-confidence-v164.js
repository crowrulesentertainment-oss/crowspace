/* CrowSpace — Alert Workflow Suggestion Confidence & Eligibility v164
   Browser-only. Estimates descriptive suggestion evidence from historical decisions.
*/
(function(){
const SRC='crowspace-alert-workflow-workload-balancing-v161',LEARN='crowspace-alert-workflow-assignment-decision-learning-v163',KEY='crowspace-alert-workflow-suggestion-confidence-v164',J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{suggestions:{},updatedAt:null})}
function sync(){
 const src=J(SRC,{}),learn=J(LEARN,{}),st=state(),byOwner=learn.byOwner||{},byPriority=learn.byPriority||{},now=Date.now();
 (src.suggestions||[]).forEach(x=>{
  const o=byOwner[x.suggestedOwner||'UNASSIGNED']||{total:0,acceptanceRate:0},p=byPriority[x.priority||'NORMAL']||{total:0,acceptanceRate:0};
  const evidence=Math.min(1,(Number(o.total)||0)/10)*.6+Math.min(1,(Number(p.total)||0)/10)*.4;
  const agreement=1-Math.abs((Number(o.acceptanceRate)||0)-(Number(p.acceptanceRate)||0));
  const score=Math.round(100*(.7*evidence+.3*agreement));
  const band=score>=75?'HIGH':score>=50?'MODERATE':'LIMITED';
  st.suggestions[x.suggestionId]={suggestionId:x.suggestionId,eventId:x.eventId,priority:x.priority,suggestedOwner:x.suggestedOwner||null,evidence,agreement,score,band,eligible:score>=50,ownerDecisionCount:Number(o.total)||0,priorityDecisionCount:Number(p.total)||0,updatedAt:now};
 });
 st.updatedAt=now;S(KEY,st);return st
}
function summary(){const a=Object.values(state().suggestions);return {total:a.length,high:a.filter(x=>x.band==='HIGH').length,moderate:a.filter(x=>x.band==='MODERATE').length,limited:a.filter(x=>x.band==='LIMITED').length,eligible:a.filter(x=>x.eligible).length}}
window.CrowSpaceAlertWorkflowSuggestionConfidenceV164={state,sync,summary};
setTimeout(sync,303000);setInterval(sync,30000);
})();