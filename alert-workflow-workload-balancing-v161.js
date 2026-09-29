/* CrowSpace — Alert Workflow Workload Balancing & Reassignment Suggestions v161
   Browser-only. Produces descriptive local reassignment suggestions; never changes ownership automatically.
*/
(function(){
const SRC='crowspace-alert-workflow-queue-assignment-v159',WK='crowspace-alert-workflow-ownership-workload-v160',KEY='crowspace-alert-workflow-workload-balancing-v161',J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{suggestions:[],updatedAt:null})}
function sync(){
 const a=Object.values(J(SRC,{}).assignments||{}),owners=Object.values(J(WK,{}).owners||{}),st=state(),now=Date.now();
 const available=owners.filter(x=>x.capacityBand!=='HIGH_LOAD').sort((x,y)=>x.active-y.active);
 const suggestions=a.filter(x=>!x.owner||((J(WK,{}).owners[x.owner]||{}).capacityBand==='HIGH_LOAD')).map(x=>({
  suggestionId:'sug-'+x.notificationId,eventId:x.eventId,notificationId:x.notificationId,priority:x.priority,currentOwner:x.owner||null,suggestedOwner:available[0]?.owner||null,reason:x.owner?'CURRENT_OWNER_HIGH_LOAD':'UNASSIGNED',createdAt:now
 }));
 st.suggestions=suggestions;st.updatedAt=now;S(KEY,st);return st
}
function summary(){const a=state().suggestions;return {total:a.length,unassigned:a.filter(x=>x.reason==='UNASSIGNED').length,highLoadOwner:a.filter(x=>x.reason==='CURRENT_OWNER_HIGH_LOAD').length,withSuggestedOwner:a.filter(x=>x.suggestedOwner).length}}
window.CrowSpaceAlertWorkflowWorkloadBalancingV161={state,sync,summary};
setTimeout(sync,294000);setInterval(sync,30000);
})();