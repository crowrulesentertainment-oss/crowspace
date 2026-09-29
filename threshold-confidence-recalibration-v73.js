/* CrowSpace — Threshold Confidence Recalibration v73
   Browser-only. Creates bounded recalibration states when confidence regimes shift.
*/
(function(){
const REG="crowspace-threshold-confidence-regime-v72",KEY="crowspace-threshold-confidence-recalibration-v73",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(REG,{}),st=state(),now=Date.now();
 Object.values(src).forEach(x=>{
  const old=st[x.reason]||{attempts:0,history:[]},needs=!!x.recalibrate;
  if(needs&&old.lastAt&&now-N(old.lastAt)<7*864e5)return;
  const diverse=window.CrowSpaceRecalibrationDiversityV79?.canUse?.(x.reason);\n  const learned=diverse?window.CrowSpaceRecalibrationEvidenceV78?.mode?.(x.reason):null||window.CrowSpaceRecalibrationCompetitionV77?.mode?.(x.reason)||window.CrowSpaceRecalibrationExplorationV76?.mode?.(x.reason)||window.CrowSpaceRecalibrationStrategyV75?.mode?.(x.reason);\n  const mode=learned|| (x.regime==="SHIFTING"?"RESET_AND_COLLECT":"CONSERVATIVE_RECALIBRATION");
  old.reason=x.reason;old.mode=needs?mode:"MONITOR";old.required=needs;old.attempts+=needs?1:0;old.lastAt=needs?now:(old.lastAt||null);
  old.targetConfidence=needs?.6:.7;old.targetTests=needs?4:3;old.history=[{at:now,mode:old.mode,accuracy:N(x.accuracy),shift:N(x.shift)},...(old.history||[])].slice(0,20);
  old.status=needs?"ACTIVE":"STABLE";old.updatedAt=now;st[x.reason]=old;
 });
 S(KEY,st);return st
}
function gate(reason){const x=state()[reason];if(!x)return 1;return x.status==="ACTIVE"?.65:1}
function required(reason){return !!state()[reason]?.required}
function best(){return Object.values(state()).sort((a,b)=>(b.attempts||0)-(a.attempts||0))}
window.CrowSpaceThresholdRecalibrationV73={sync,state,gate,required,best};
setTimeout(sync,89000);setInterval(sync,30000);
})();