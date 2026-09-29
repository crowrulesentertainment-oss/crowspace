/* CrowSpace — Recalibration Holdout Observation Collector v123
   Browser-only. Collects actual local observations for assigned treated/control decisions.
   It never invents a control result: observations must come from an explicit performance
   metric supplied by the caller or an existing local outcome record.
*/
(function(){
const ASSIGN='crowspace-recalibration-holdout-assignments-v122',OBS='crowspace-recalibration-holdout-observations-v121',OUT='crowspace-recalibration-event-outcomes-v105',KEY='crowspace-recalibration-holdout-observation-ledger-v123',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function collect(decisionId,metric,observedAt,source){
 const id=String(decisionId),a=L(ASSIGN,{})[id]; if(!a)return null;
 const value=Math.max(0,Math.min(1,N(metric))); if(!Number.isFinite(value))return null;
 const st=state(),existing=st[id];
 if(existing&&existing.observedAt>= (N(observedAt)||Date.now()))return existing;
 const item={decisionId:id,reason:a.reason,group:a.group,metric:value,observedAt:N(observedAt)||Date.now(),source:source||'EXPLICIT_LOCAL_PERFORMANCE',lineage:'HOLDOUT_OBSERVATION'};
 st[id]=item;S(KEY,st);
 if(a.group==='CONTROL'){const o=L(OBS,{});o[id]={decisionId:id,accuracy:value,observedAt:item.observedAt,group:'CONTROL',source:item.source};S(OBS,o)}
 return item
}
function collectFromOutcomes(){
 const a=L(ASSIGN,{}),o=L(OUT,{}),st=state();
 Object.keys(a).forEach(id=>{const x=o.byDecision?.[id];if(x&&!st[id])collect(id,N(x.accuracy),N(x.observedAt),'LOCAL_OUTCOME_RECORD')});
 return state()
}
function summary(){const a=Object.values(state()),t=a.filter(x=>x.group==='TREATED'),c=a.filter(x=>x.group==='CONTROL');const avg=x=>x.length?x.reduce((s,v)=>s+N(v.metric),0)/x.length:null;return {total:a.length,treated:t.length,control:c.length,treatedAverage:avg(t),controlAverage:avg(c),complete:t.length&&c.length?'READY':'COLLECTING'}}
window.CrowSpaceRecalibrationHoldoutObservationV123={state,collect,collectFromOutcomes,summary};
setTimeout(collectFromOutcomes,188000);setInterval(collectFromOutcomes,30000);
})();