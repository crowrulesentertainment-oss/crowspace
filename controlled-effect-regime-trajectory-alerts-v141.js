/* CrowSpace — Controlled Effect Regime Trajectory Alerts v141
   Browser-only. Flags meaningful trajectory data-quality degradation or contradictory
   lifecycle evidence for Creator Studio review. Alerts are descriptive, not causal.
*/
(function(){
const HIST='crowspace-controlled-effect-regime-trajectory-confidence-history-v140',QUAL='crowspace-controlled-effect-regime-trajectory-quality-v138',KEY='crowspace-controlled-effect-regime-trajectory-alerts-v141',L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const hist=L(HIST,{}),qual=L(QUAL,{}),st=state(),now=Date.now();
 const seen=st.seen||{};
 Object.keys({...hist,...qual}).forEach(reason=>{
  const h=hist[reason]||{},q=qual[reason]||{};
  const alerts=[];
  if(h.trend==='DEGRADING' || Number(h.delta)<=-10) alerts.push('CONFIDENCE_DEGRADING');
  if(q.contradictory) alerts.push('CONTRADICTORY_LIFECYCLE');
  if(!q.sufficient || h.trend==='COLLECTING') alerts.push('INSUFFICIENT_HISTORY');
  const status=alerts.includes('CONTRADICTORY_LIFECYCLE')?'CRITICAL':alerts.includes('CONFIDENCE_DEGRADING')?'WARNING':alerts.includes('INSUFFICIENT_HISTORY')?'WATCH':'CLEAR';
  const marker=status+':'+alerts.join('|')+':'+String(h.currentScore||0);
  if(seen[reason]!==marker){seen[reason]=marker}
  st[reason]={reason,status,alerts,currentScore:Number(h.currentScore)||0,delta:Number(h.delta)||0,trend:h.trend||'UNKNOWN',contradictory:!!q.contradictory,sufficient:!!q.sufficient,updatedAt:now};
 });
 st.seen=seen;st.updatedAt=now;S(KEY,st);return st
}
function summary(reason){return state()[reason]||{status:'EMPTY',alerts:[]}}
function active(){return Object.values(state()).filter(x=>x.status&&x.status!=='CLEAR')}
window.CrowSpaceControlledEffectRegimeTrajectoryAlertsV141={state,sync,summary,active};
setTimeout(sync,242000);setInterval(sync,30000);
})();