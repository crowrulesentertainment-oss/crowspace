/* CrowSpace — Controlled Effect Regime Alert Health Trend Alerts v148
   Browser-only. Flags significant portfolio health deterioration or recovery.
   Descriptive operational monitoring only.
*/
(function(){
const SRC='crowspace-controlled-effect-regime-alert-health-history-v147',KEY='crowspace-controlled-effect-regime-alert-health-trend-alerts-v148',L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{history:[],current:null})}
function sync(){
 const src=L(SRC,{}),st=state(),now=Date.now(),x=src;
 if(!x||x.currentScore===undefined)return st;
 const trend=x.trend||'COLLECTING',delta=Number(x.delta)||0;
 let status='CLEAR',type='NONE';
 if(trend==='DETERIORATING'&&delta<=-10){status='CRITICAL';type='HEALTH_DETERIORATION'}
 else if(trend==='DETERIORATING'){status='WARNING';type='HEALTH_DETERIORATION'}
 else if(trend==='IMPROVING'&&delta>=10){status='POSITIVE_CHANGE';type='HEALTH_RECOVERY'}
 const marker=status+':'+type+':'+String(x.currentScore)+':'+String(delta);
 if(st.lastMarker!==marker)st.history=[{at:now,status,type,score:Number(x.currentScore)||0,delta} ,...(st.history||[])].slice(0,50);
 st.lastMarker=marker;st.current={status,type,score:Number(x.currentScore)||0,delta,trend,samples:Number(x.samples)||0,updatedAt:now};st.updatedAt=now;S(KEY,st);return st
}
function summary(){const x=state();return {status:x.current?.status||'EMPTY',type:x.current?.type||'NONE',score:x.current?.score||0,delta:x.current?.delta||0,events:(x.history||[]).length}}
window.CrowSpaceAlertHealthTrendAlertsV148={state,sync,summary};
setTimeout(sync,263000);setInterval(sync,30000);
})();