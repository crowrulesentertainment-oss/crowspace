/* CrowSpace — Controlled Effect Regime Recovery v135
   Browser-only. Detects renewed strength after a measured post-change decay period.
   Descriptive evidence only.
*/
(function(){
const SRC='crowspace-controlled-effect-regime-v130',DEC='crowspace-controlled-effect-regime-decay-v134',KEY='crowspace-controlled-effect-regime-recovery-v135',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN=4,RECOVERY=.02;
function state(){return L(KEY,{})}
function sync(){
 const src=L(SRC,{}),dec=L(DEC,{}),st=state();
 Object.values(src).forEach(x=>{
  const d=dec[x.reason];if(!d)return;
  const rows=x.rows||[],point=N(x.changePointIndex),effects=point>0?rows.slice(point).map(r=>N(r.effect)):[];
  const n=effects.length,last=effects[n-1]||0;
  let peak=-Infinity,peakIndex=-1; effects.forEach((v,i)=>{if(Math.abs(v)>peak){peak=Math.abs(v);peakIndex=i}});
  const tail=effects.slice(Math.max(0,peakIndex+1)),start=tail[0]||last,end=tail[tail.length-1]||last;
  const gain=Math.abs(end)-Math.abs(start),recovered=n>=MIN&&peakIndex>=1&&gain>=RECOVERY&&end*last>=0;
  st[x.reason]={reason:x.reason,windows:n,peakIndex,peakMagnitude:peak,recoveryGain:gain,recovered,status:n<MIN?'COLLECTING':recovered?'RECOVERING':d.status==='DECAYING'?'DECAYING':'NO_RECOVERY',updatedAt:Date.now(),method:'POST_DECAY_RECOVERY'};
 });
 S(KEY,st);return st
}
function summary(reason){return state()[reason]||{status:'EMPTY'}}
function factor(reason){const x=summary(reason);return x.status==='RECOVERING'?1:x.status==='DECAYING'?.8:1}
window.CrowSpaceControlledEffectRegimeRecoveryV135={state,sync,summary,factor};
setTimeout(sync,224000);setInterval(sync,30000);
})();
