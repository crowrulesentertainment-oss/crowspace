/* CrowSpace — Recalibration Strategy Selector v75
   Browser-only. Learns which recalibration mode works best for each threshold reason.
*/
(function(){
const OUT="crowspace-threshold-recalibration-outcomes-v74",REC="crowspace-threshold-confidence-recalibration-v73",KEY="crowspace-recalibration-strategy-v75",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const out=L(OUT,{}),rec=L(REC,{}),st=state();
 Object.values(out).forEach(x=>{
  const r=rec[x.reason]||{},old=st[x.reason]||{modes:{}},mode=r.mode||"CONSERVATIVE_RECALIBRATION",m=old.modes[mode]||{tests:0,success:0};
  if(x.tests>0){m.tests=x.tests;m.success=N(x.success);m.rate=m.tests?m.success/m.tests:0;old.modes[mode]=m;}
  const choices=Object.entries(old.modes).sort((a,b)=>(b[1].rate||0)-(a[1].rate||0)||(b[1].tests||0)-(a[1].tests||0));
  old.reason=x.reason;old.selected=choices[0]?.[0]||mode;old.confidence=choices[0]?.[1]?.tests>=3?Math.min(1,choices[0][1].tests/6):.25;old.status=old.confidence>=.5?"LEARNED":"EXPLORING";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function mode(reason){return state()[reason]?.selected||"CONSERVATIVE_RECALIBRATION"}
function confidence(reason){return state()[reason]?.confidence||0}
function best(){return Object.values(state()).sort((a,b)=>(b.confidence||0)-(a.confidence||0))}
window.CrowSpaceRecalibrationStrategyV75={sync,state,mode,confidence,best};
setTimeout(sync,93000);setInterval(sync,30000);
})();