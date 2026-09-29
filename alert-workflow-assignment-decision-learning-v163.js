/* CrowSpace — Alert Workflow Assignment Decision Learning v163
   Browser-only. Learns descriptive acceptance patterns from prior assignment decisions.
*/
(function(){
const SRC='crowspace-alert-workflow-assignment-decisions-v162',KEY='crowspace-alert-workflow-assignment-decision-learning-v163',J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{byOwner:{},byPriority:{},updatedAt:null})}
function sync(){
 const src=J(SRC,{}),st=state(),owner={},priority={};
 Object.values(src.decisions||{}).forEach(x=>{
  const o=x.suggestedOwner||'UNASSIGNED',p=x.priority||'NORMAL';
  owner[o]=owner[o]||{owner:o,total:0,accepted:0,rejected:0,deferred:0};
  priority[p]=priority[p]||{priority:p,total:0,accepted:0,rejected:0,deferred:0};
  [owner[o],priority[p]].forEach(g=>{g.total++;if(x.status==='ACCEPTED')g.accepted++;else if(x.status==='REJECTED')g.rejected++;else if(x.status==='DEFERRED')g.deferred++});
 });
 Object.values(owner).forEach(g=>g.acceptanceRate=g.total?g.accepted/g.total:0);
 Object.values(priority).forEach(g=>g.acceptanceRate=g.total?g.accepted/g.total:0);
 st.byOwner=owner;st.byPriority=priority;st.updatedAt=Date.now();S(KEY,st);return st
}
function summary(){const s=state(),a=Object.values(s.byOwner),p=Object.values(s.byPriority);return {owners:a.length,priorities:p.length,totalDecisions:p.reduce((n,x)=>n+x.total,0),accepted:p.reduce((n,x)=>n+x.accepted,0),rejected:p.reduce((n,x)=>n+x.rejected,0),deferred:p.reduce((n,x)=>n+x.deferred,0)}}
window.CrowSpaceAlertWorkflowAssignmentDecisionLearningV163={state,sync,summary};
setTimeout(sync,300000);setInterval(sync,30000);
})();