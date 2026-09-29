/* CrowSpace — Recalibration Independent Event Ledger v104
   Browser-only. Records decision-lineage events once, independent of periodic sync timestamps.
*/
(function(){
const REC="crowspace-threshold-confidence-recalibration-v73",KEY="crowspace-recalibration-event-ledger-v104",MAX=500,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{events:[],byDecision:{}})}
function sync(){
 const src=L(REC,{}),st=state(),seen=st.byDecision||{};
 Object.values(src).forEach(x=>{
  if(!x.decisionId)return;
  if(seen[x.decisionId])return;
  const event={eventId:"evt-"+String(x.decisionId),decisionId:String(x.decisionId),reason:x.reason||"UNKNOWN",mode:x.mode||"CONSERVATIVE_RECALIBRATION",required:!!x.required,targetConfidence:N(x.targetConfidence),decisionAt:N(x.lastAt)||Date.now(),recordedAt:Date.now(),lineage:"DECISION"};
  st.events=[event,...(st.events||[])].slice(0,MAX);seen[x.decisionId]=event.eventId;
 });
 st.byDecision=seen;st.updatedAt=Date.now();S(KEY,st);return st
}
function events(reason){return state().events.filter(x=>!reason||x.reason===reason)}
function event(decisionId){return state().events.find(x=>x.decisionId===String(decisionId))||null}
function integrity(reason){
 const e=events(reason);if(!e.length)return {status:"EMPTY",count:0,duplicates:0};
 const ids=e.map(x=>x.decisionId),unique=new Set(ids).size,duplicates=ids.length-unique;
 return {status:duplicates?"DUPLICATE":"CLEAN",count:e.length,unique,duplicates}
}
function factor(reason){const i=integrity(reason);return i.status==="CLEAN"?1:i.status==="DUPLICATE"?.7:.5}
function best(){return Object.values(state().byDecision||{}).length}
window.CrowSpaceRecalibrationEventLedgerV104={sync,state,events,event,integrity,factor,best};
setTimeout(sync,151000);setInterval(sync,30000);
})();