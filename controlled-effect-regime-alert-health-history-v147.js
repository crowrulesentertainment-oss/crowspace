/* CrowSpace — Controlled Effect Regime Alert Health History v147
   Browser-only. Preserves bounded portfolio health snapshots and detects directional trend.
   Descriptive operational analytics only.
*/
(function(){
const SRC='crowspace-controlled-effect-regime-alert-health-v146',KEY='crowspace-controlled-effect-regime-alert-health-history-v147',MAX=30,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{history:[]})}
function sync(){
 const src=L(SRC,{}),st=state(),now=Date.now(),x=src.portfolio;
 if(!x)return st;
 const h=st.history||[],marker=String(x.score)+':'+String(x.total)+':'+String(x.updatedAt||0);
 if(st.lastMarker!==marker)h.unshift({at:now,score:Number(x.score)||0,band:x.band||'WATCH',resolved:Number(x.resolved)||0,unresolved:Number(x.unresolved)||0,reopened:Number(x.reopened)||0});
 st.history=h.slice(0,MAX);st.lastMarker=marker;
 const oldest=st.history[st.history.length-1]?.score ?? x.score,current=Number(x.score)||0,delta=current-oldest;
 st.trend=st.history.length<2?'COLLECTING':delta>=5?'IMPROVING':delta<=-5?'DETERIORATING':'STABLE';
 st.currentScore=current;st.currentBand=x.band||'WATCH';st.delta=delta;st.samples=st.history.length;st.updatedAt=now;
 S(KEY,st);return st
}
function summary(){const x=state();return {score:x.currentScore||0,band:x.currentBand||'EMPTY',trend:x.trend||'EMPTY',delta:x.delta||0,samples:x.samples||0}}
window.CrowSpaceAlertHealthHistoryV147={state,sync,summary};
setTimeout(sync,260000);setInterval(sync,30000);
})();