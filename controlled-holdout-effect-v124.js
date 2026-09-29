/* CrowSpace — Controlled Holdout Effect Evidence v124
   Browser-only. Pools validated treated/control observations without treating a
   small sample as decisive. Reports effect size, sample balance, and uncertainty.
*/
(function(){
const OBS='crowspace-recalibration-holdout-observation-ledger-v123',KEY='crowspace-controlled-effect-evidence-v124',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN=4;
function state(){return L(KEY,{})}
function sync(){
 const src=Object.values(L(OBS,{})),st=state(),groups={};
 src.forEach(x=>{const r=x.reason||'UNKNOWN';(groups[r]||(groups[r]={treated:[],control:[]}))[x.group==='CONTROL'?'control':'treated'].push(N(x.metric))});
 Object.keys(groups).forEach(reason=>{
  const g=groups[reason],nt=g.treated.length,nc=g.control.length,avg=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:0;
  const tm=avg(g.treated),cm=avg(g.control),delta=tm-cm,total=nt+nc,balance=total?Math.min(nt,nc)/Math.max(nt,nc):0;
  const usable=nt>=MIN&&nc>=MIN, uncertainty=usable?Math.min(1,1/Math.sqrt(Math.min(nt,nc))):1;
  st[reason]={reason,treated:nt,control:nc,treatedAverage:tm,controlAverage:cm,effect:delta,balance,uncertainty,usable,status:usable?(delta>0?'POSITIVE':delta<0?'NEGATIVE':'INCONCLUSIVE'):'COLLECTING',updatedAt:Date.now(),method:'POOLED_TREATED_VS_CONTROL'};
 });
 S(KEY,st);return st
}
function summary(reason){const x=state()[reason];return x||{status:'EMPTY',usable:false,treated:0,control:0}}
function factor(reason){const x=summary(reason);if(!x.usable)return 1;return x.effect>0?Math.min(1,.5+x.effect):Math.max(.5,.5+x.effect)}
window.CrowSpaceControlledEffectEvidenceV124={state,sync,summary,factor};
setTimeout(sync,191000);setInterval(sync,30000);
})();