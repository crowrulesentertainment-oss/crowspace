/* CrowSpace — Repair Verification History & Recovery Tracking v172
   Browser-only. Preserves verification transitions over time and tracks recovery
   from REVIEW/FAILED states. Historical records are descriptive local evidence.
*/
(function(){
const VERIFY='crowspace-execution-integrity-repair-verification-v171',
      RECOVERY='crowspace-alert-workflow-execution-integrity-recovery-v170',
      KEY='crowspace-execution-integrity-repair-verification-history-v172',
      MAX=500,
      J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},
      S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{records:{},history:[]})}
function sync(){
 const src=J(VERIFY,{}),rec=J(RECOVERY,{}),s=state(),now=Date.now();
 Object.values(src.records||{}).forEach(x=>{
  const id=String(x.suggestionId),p=s.records[id]||{},prev=p.currentState||null,next=x.state||'UNKNOWN';
  const transition=prev&&prev!==next;
  s.records[id]={...p,suggestionId:x.suggestionId,eventId:x.eventId,previousState:prev,currentState:next,score:x.score,priorIntegrity:x.priorIntegrity,repairCount:x.repairCount||0,lastVerifiedAt:x.verifiedAt||now,updatedAt:now,recovered:next==='VERIFIED'&&(prev==='REVIEW'||prev==='FAILED'),transition};
  if(transition)s.history=[{suggestionId:x.suggestionId,eventId:x.eventId,from:prev,to:next,score:x.score,at:now},...(s.history||[])].slice(0,MAX);
 });
 S(KEY,s);return s
}
function summary(){
 const a=Object.values(state().records),h=state().history||[];
 return {total:a.length,verified:a.filter(x=>x.currentState==='VERIFIED').length,review:a.filter(x=>x.currentState==='REVIEW').length,failed:a.filter(x=>x.currentState==='FAILED').length,recovered:a.filter(x=>x.recovered).length,transitions:h.length}
}
window.CrowSpaceRepairVerificationHistoryV172={state,sync,summary};
setTimeout(sync,327000);setInterval(sync,30000);
})();