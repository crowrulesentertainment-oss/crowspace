/* CrowSpace — Alert Review Workflow v154
   Browser-only. Adds explicit local workflow states to alert review.
   Workflow state is an operational review state, not an evidence or causal conclusion.
*/
(function(){
const ACT='crowspace-alert-command-center-detail-actions-v153',KEY='crowspace-alert-review-workflow-v154',J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{})}
function set(eventId,status,note){
 const st=state(),id=String(eventId||'');if(!id||!['OPEN','IN_REVIEW','ACKNOWLEDGED','RESOLUTION_REVIEW','CLOSED'].includes(status))return null;
 const old=st[id]||{history:[]},now=Date.now();
 old.eventId=id;old.status=status;old.updatedAt=now;old.history=[{status,at:now,note:String(note||'')},...(old.history||[])].slice(0,30);st[id]=old;S(KEY,st);return old
}
function fromActions(eventId){
 const a=J(ACT,{actions:[]}).actions.filter(x=>x.eventId===String(eventId)).sort((x,y)=>x.at-y.at);
 let status='OPEN';a.forEach(x=>{if(x.action==='ACKNOWLEDGE')status='ACKNOWLEDGED';else if(x.action==='REOPEN_REVIEW')status='IN_REVIEW';else if(x.action==='RESOLUTION_REVIEW')status='RESOLUTION_REVIEW'});return set(eventId,status)
}
function summary(){const a=Object.values(state());return {total:a.length,open:a.filter(x=>x.status==='OPEN').length,inReview:a.filter(x=>x.status==='IN_REVIEW').length,acknowledged:a.filter(x=>x.status==='ACKNOWLEDGED').length,resolutionReview:a.filter(x=>x.status==='RESOLUTION_REVIEW').length,closed:a.filter(x=>x.status==='CLOSED').length}}
window.CrowSpaceAlertReviewWorkflowV154={state,set,fromActions,summary};
setTimeout(function(){Object.keys(J(ACT,{notes:{},actions:[]} ).notes||{}).forEach(fromActions)},273000);setInterval(function(){Object.keys(J(ACT,{notes:{},actions:[]}).notes||{}).forEach(fromActions)},30000);
})();