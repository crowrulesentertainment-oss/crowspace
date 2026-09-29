/* CrowSpace — Controlled Effect Regime Lifecycle v136
   Browser-only. Synthesizes transition, persistence, decay, and recovery signals
   into one descriptive lifecycle state. It does not establish causality.
*/
(function(){
const REG='crowspace-controlled-effect-regime-v130',TRANS='crowspace-controlled-effect-regime-transition-v132',PER='crowspace-controlled-effect-regime-persistence-v133',DEC='crowspace-controlled-effect-regime-decay-v134',REC='crowspace-controlled-effect-regime-recovery-v135',KEY='crowspace-controlled-effect-regime-lifecycle-v136',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const reg=L(REG,{}),tr=L(TRANS,{}),pe=L(PER,{}),de=L(DEC,{}),re=L(REC,{}),st=state();
 Object.values(reg).forEach(x=>{
  const reason=x.reason,t=tr[reason],p=pe[reason],d=de[reason],r=re[reason];
  let lifecycle='COLLECTING';
  if(t?.validated){
   if(r?.status==='RECOVERING') lifecycle='RECOVERY';
   else if(d?.status==='DECAYING'||d?.status==='MILD_DECAY') lifecycle='DECAY';
   else if(p?.status==='PERSISTENT') lifecycle='PERSISTENCE';
   else lifecycle='TRANSITION';
  }
  st[reason]={reason,lifecycle,transitionValidated:!!t?.validated,persistence:p?.status||'UNKNOWN',decay:d?.status||'UNKNOWN',recovery:r?.status||'UNKNOWN',updatedAt:Date.now(),method:'REGIME_LIFECYCLE_SYNTHESIS'};
 });
 S(KEY,st);return st
}
function summary(reason){return state()[reason]||{lifecycle:'EMPTY'}}
window.CrowSpaceControlledEffectRegimeLifecycleV136={state,sync,summary};
setTimeout(sync,227000);setInterval(sync,30000);
})();
