/* CrowSpace — Controlled Effect Regime Trajectory Alert Resolution v143
   Browser-only. Evaluates acknowledged alerts against later trajectory evidence.
   Resolution states are descriptive review states, not causal conclusions.
*/
(function(){
const HIST='crowspace-controlled-effect-regime-alert-history-v142',CUR='crowspace-controlled-effect-regime-trajectory-confidence-history-v140',QUAL='crowspace-controlled-effect-regime-trajectory-quality-v138',KEY='crowspace-controlled-effect-regime-alert-resolution-v143',L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const h=L(HIST,{}),cur=L(CUR,{}),q=L(QUAL,{}),st=state(),now=Date.now();
 (h.events||[]).forEach(ev=>{
  const reason=ev.reason,x=cur[reason]||{},quality=q[reason]||{},old=st[ev.eventId]||{};
  if(!ev.acknowledged||ev.status==='CLEAR')return;
  const stillCritical=quality.contradictory||x.trend==='DEGRADING'||Number(x.delta)<=-10;
  const improved=!quality.contradictory&&x.trend==='IMPROVING'&&Number(x.currentScore)>=80;
  let resolution=stillCritical?'PERSISTING':improved?'RESOLVED':'PERSISTING';
  if(old.resolution==='RESOLVED'&&stillCritical)resolution='REOPENED';
  st[ev.eventId]={eventId:ev.eventId,reason,status:ev.status,acknowledgedAt:ev.acknowledgedAt,previousResolution:old.resolution||null,resolution,currentScore:Number(x.currentScore)||0,trend:x.trend||'UNKNOWN',contradictory:!!quality.contradictory,checkedAt:now,updatedAt:now};
 });
 S(KEY,st);return st
}
function summary(){const a=Object.values(state());return {total:a.length,resolved:a.filter(x=>x.resolution==='RESOLVED').length,persisting:a.filter(x=>x.resolution==='PERSISTING').length,reopened:a.filter(x=>x.resolution==='REOPENED').length}}
function active(){return Object.values(state()).filter(x=>x.resolution==='PERSISTING'||x.resolution==='REOPENED')}
window.CrowSpaceControlledEffectRegimeAlertResolutionV143={state,sync,summary,active};
setTimeout(sync,248000);setInterval(sync,30000);
})();