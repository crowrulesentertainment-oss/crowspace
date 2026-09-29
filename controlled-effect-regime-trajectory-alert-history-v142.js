/* CrowSpace — Controlled Effect Regime Trajectory Alert History v142
   Browser-only. Preserves alert transitions and supports explicit local acknowledgment.
   Acknowledgment is a review state, not evidence that an underlying issue is resolved.
*/
(function(){
const SRC='crowspace-controlled-effect-regime-trajectory-alerts-v141',KEY='crowspace-controlled-effect-regime-alert-history-v142',MAX=100,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{events:[],current:{}})}
function sync(){
 const src=L(SRC,{}),st=state(),now=Date.now();
 st.events=st.events||[];st.current=st.current||{};
 Object.values(src).forEach(x=>{
  const id=x.reason||'UNKNOWN',prev=st.current[id],sig=String(x.status)+':'+(x.alerts||[]).join('|')+':'+String(x.currentScore||0);
  if(!prev||prev.signature!==sig){
   st.events=[{eventId:'alert-'+id+'-'+now,reason:id,status:x.status,alerts:x.alerts||[],score:Number(x.currentScore)||0,delta:Number(x.delta)||0,createdAt:now,acknowledged:false,acknowledgedAt:null,acknowledgedBy:null,signature:sig},...st.events].slice(0,MAX);
  }
  const latest=st.events.find(e=>e.reason===id);
  st.current[id]={...x,signature:sig,acknowledged:!!latest?.acknowledged,acknowledgedAt:latest?.acknowledgedAt||null};
 });
 st.updatedAt=now;S(KEY,st);return st
}
function acknowledge(eventId,by){
 const st=state(),e=(st.events||[]).find(x=>x.eventId===String(eventId));if(!e)return null;
 e.acknowledged=true;e.acknowledgedAt=Date.now();e.acknowledgedBy=by||'LOCAL_REVIEW';S(KEY,st);return e
}
function unacknowledge(eventId){
 const st=state(),e=(st.events||[]).find(x=>x.eventId===String(eventId));if(!e)return null;
 e.acknowledged=false;e.acknowledgedAt=null;e.acknowledgedBy=null;S(KEY,st);return e
}
function history(reason){return (state().events||[]).filter(x=>!reason||x.reason===reason)}
function active(){return (state().events||[]).filter(x=>x.status!=='CLEAR'&&!x.acknowledged)}
function summary(){const a=state().events||[];return {total:a.length,active:a.filter(x=>x.status!=='CLEAR'&&!x.acknowledged).length,acknowledged:a.filter(x=>x.acknowledged).length,critical:a.filter(x=>x.status==='CRITICAL').length,warning:a.filter(x=>x.status==='WARNING').length,watch:a.filter(x=>x.status==='WATCH').length}}
window.CrowSpaceControlledEffectRegimeAlertHistoryV142={state,sync,acknowledge,unacknowledge,history,active,summary};
setTimeout(sync,245000);setInterval(sync,30000);
})();