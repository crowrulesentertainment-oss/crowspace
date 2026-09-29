/* CrowSpace — Controlled Effect Regime Trajectory Alert Timeline v144
   Browser-only. Builds a descriptive lifecycle timeline for each trajectory alert.
*/
(function(){
const HIST='crowspace-controlled-effect-regime-alert-history-v142',RES='crowspace-controlled-effect-regime-alert-resolution-v143',KEY='crowspace-controlled-effect-regime-alert-timeline-v144',MAX=50,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const h=L(HIST,{}),r=L(RES,{}),st=state(),now=Date.now();
 (h.events||[]).forEach(ev=>{
  const old=st[ev.eventId]||{timeline:[]},rr=r[ev.eventId];
  const timeline=old.timeline||[];
  function add(status,at,detail){if(!at)return;const last=timeline[0];if(last&&last.status===status&&last.at===at)return;timeline.unshift({status,at,detail:detail||null})}
  add('CREATED',ev.createdAt,'Alert detected');
  if(ev.acknowledged)add('ACKNOWLEDGED',ev.acknowledgedAt,'Alert reviewed');
  if(rr){add(rr.resolution,rr.checkedAt,'Automatic evidence check');}
  st[ev.eventId]={eventId:ev.eventId,reason:ev.reason,current:rr?.resolution||ev.status||'CREATED',timeline:timeline.slice(0,MAX),updatedAt:now};
 });
 st.updatedAt=now;S(KEY,st);return st
}
function stateFor(reason){return Object.values(state()).filter(x=>!reason||x.reason===reason)}
function summary(){const a=Object.values(state());return {alerts:a.length,timelineEvents:a.reduce((n,x)=>n+(x.timeline||[]).length,0),resolved:a.filter(x=>x.current==='RESOLVED').length,persisting:a.filter(x=>x.current==='PERSISTING').length,reopened:a.filter(x=>x.current==='REOPENED').length}}
window.CrowSpaceControlledEffectRegimeAlertTimelineV144={state,sync,stateFor,summary};
setTimeout(sync,251000);setInterval(sync,30000);
})();