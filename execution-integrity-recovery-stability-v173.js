/* CrowSpace — Recovery Stability & Regression Detection v173
   Browser-only. Detects repeated integrity regressions after recovery and measures
   local stability across observed verification transitions.
*/
(function(){
const HIST='crowspace-execution-integrity-repair-verification-history-v172',
      VERIFY='crowspace-execution-integrity-repair-verification-v171',
      KEY='crowspace-execution-integrity-recovery-stability-v173',
      MAX=500,
      J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},
      S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{records:{},history:[]})}
function sync(){
 const h=J(HIST,{}),s=state(),now=Date.now(),events=h.history||[];
 Object.values(h.records||{}).forEach(x=>{
  const id=String(x.suggestionId), prior=s.records[id]||{};
  const mine=events.filter(e=>String(e.suggestionId)===id);
  const regressions=mine.filter(e=>e.from==='VERIFIED'&&(e.to==='REVIEW'||e.to==='FAILED')).length;
  const recoveries=mine.filter(e=>(e.from==='REVIEW'||e.from==='FAILED')&&e.to==='VERIFIED').length;
  const last=mine[0]||null;
  let stability='COLLECTING';
  if(regressions===0&&recoveries>0)stability='STABLE_RECOVERY';
  else if(regressions>0&&recoveries>=regressions)stability='RECOVERING';
  else if(regressions>0)stability='REGRESSION';
  s.records[id]={...prior,suggestionId:x.suggestionId,eventId:x.eventId,currentState:x.currentState,regressions,recoveries,transitionCount:mine.length,stability,lastTransition:last?.at||null,updatedAt:now};
 });
 s.history=[{at:now,stable:Object.values(s.records).filter(x=>x.stability==='STABLE_RECOVERY').length,recovering:Object.values(s.records).filter(x=>x.stability==='RECOVERING').length,regression:Object.values(s.records).filter(x=>x.stability==='REGRESSION').length,total:Object.values(s.records).length},...(s.history||[])].slice(0,MAX);
 S(KEY,s);return s
}
function summary(){const a=Object.values(state().records);return {total:a.length,stable:a.filter(x=>x.stability==='STABLE_RECOVERY').length,recovering:a.filter(x=>x.stability==='RECOVERING').length,regression:a.filter(x=>x.stability==='REGRESSION').length,collecting:a.filter(x=>x.stability==='COLLECTING').length}}
window.CrowSpaceRecoveryStabilityV173={state,sync,summary};
setTimeout(sync,330000);setInterval(sync,30000);
})();