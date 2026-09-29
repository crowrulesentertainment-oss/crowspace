/* CrowSpace — Alert Workflow Suggestion Review & Approval v166
   Browser-only. Records explicit reviewer approval decisions; never changes ownership automatically.
*/
(function(){
const SRC='crowspace-alert-workflow-confidence-routing-v165',KEY='crowspace-alert-workflow-suggestion-approval-v166',MAX=500,J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{reviews:{},history:[]})}
function sync(){
 const src=J(SRC,{}),st=state(),now=Date.now();
 ['ELIGIBLE','REVIEW'].forEach(route=>(src.routes?.[route]||[]).forEach(x=>{
  if(!st.reviews[x.suggestionId])st.reviews[x.suggestionId]={suggestionId:x.suggestionId,eventId:x.eventId,priority:x.priority,suggestedOwner:x.suggestedOwner||null,evidenceBand:x.band||'UNKNOWN',route,status:'PENDING',updatedAt:now};
 }));
 S(KEY,st);return st
}
function decide(id,status,note){
 if(!['APPROVED','REJECTED','DEFERRED'].includes(status))return null;
 const st=state(),x=st.reviews[String(id)];if(!x)return null;
 x.status=status;x.note=String(note||'').trim()||null;x.reviewedAt=Date.now();x.updatedAt=x.reviewedAt;
 st.history=[{suggestionId:x.suggestionId,eventId:x.eventId,status,note:x.note,at:x.reviewedAt},...(st.history||[])].slice(0,MAX);
 S(KEY,st);return x
}
function summary(){const a=Object.values(state().reviews);return {total:a.length,pending:a.filter(x=>x.status==='PENDING').length,approved:a.filter(x=>x.status==='APPROVED').length,rejected:a.filter(x=>x.status==='REJECTED').length,deferred:a.filter(x=>x.status==='DEFERRED').length}}
window.CrowSpaceAlertWorkflowSuggestionApprovalV166={state,sync,decide,summary};
setTimeout(sync,309000);setInterval(sync,30000);
})();