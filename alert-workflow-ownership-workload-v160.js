/* CrowSpace — Alert Workflow Ownership Workload & Capacity v160
   Browser-only. Summarizes active reviewer workload from local assignments.
*/
(function(){
const SRC='crowspace-alert-workflow-queue-assignment-v159',KEY='crowspace-alert-workflow-ownership-workload-v160',J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{owners:{},updatedAt:null})}
function sync(){
 const src=J(SRC,{}),st=state(),owners={};
 Object.values(src.assignments||{}).forEach(x=>{
  if(!x.owner)return;
  const o=x.owner;
  owners[o]=owners[o]||{owner:o,total:0,critical:0,high:0,elevated:0,normal:0,active:0};
  owners[o].total++;
  if(x.priority==='CRITICAL')owners[o].critical++;
  else if(x.priority==='HIGH')owners[o].high++;
  else if(x.priority==='ELEVATED')owners[o].elevated++;
  else owners[o].normal++;
  owners[o].active++;
 });
 Object.values(owners).forEach(x=>{x.capacityBand=x.active>=10?'HIGH_LOAD':x.active>=5?'MODERATE_LOAD':'NORMAL_LOAD'});
 st.owners=owners;st.updatedAt=Date.now();S(KEY,st);return st
}
function summary(){const a=Object.values(state().owners);return {owners:a.length,totalAssigned:a.reduce((n,x)=>n+x.total,0),highLoad:a.filter(x=>x.capacityBand==='HIGH_LOAD').length,moderateLoad:a.filter(x=>x.capacityBand==='MODERATE_LOAD').length}}
window.CrowSpaceAlertWorkflowOwnershipWorkloadV160={state,sync,summary};
setTimeout(sync,291000);setInterval(sync,30000);
})();