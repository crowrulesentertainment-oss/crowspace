/* CrowSpace — Threshold Confidence Recalibration Outcome Engine v74
   Browser-only. Determines whether recalibration actually restores confidence quality.
*/
(function(){
const REC="crowspace-threshold-confidence-recalibration-v73",MEM="crowspace-threshold-confidence-memory-v71",REG="crowspace-threshold-confidence-regime-v72",KEY="crowspace-threshold-recalibration-outcomes-v74",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const rec=L(REC,{}),mem=L(MEM,{}),reg=L(REG,{}),st=state();
 Object.values(rec).forEach(x=>{
  const old=st[x.reason]||{tests:0,success:0,failure:0,history:[]},m=mem[x.reason]||{},r=reg[x.reason]||{};
  const improved=N(m.accuracy)>=N(x.targetConfidence),stable=r.regime==="RELIABLE"||r.regime==="STABLE",success=improved&&stable;
  if(x.status==="ACTIVE"||x.status==="STABLE"){
   const marker=String(x.lastAt||0)+":"+String(m.updatedAt||0);
   if(old.lastMarker!==marker){
    old.tests++;old.success+=success?1:0;old.failure+=success?0:1;old.history=[{at:Date.now(),success,accuracy:N(m.accuracy),target:N(x.targetConfidence),regime:r.regime},...(old.history||[])].slice(0,20);old.lastMarker=marker;
   }
  }
  old.reason=x.reason;old.accuracy=N(m.accuracy);old.target=N(x.targetConfidence);old.successRate=old.tests?old.success/old.tests:0;
  old.status=old.tests<2?"COLLECTING":old.successRate>=.7?"RECOVERED":old.successRate<=.3?"FAILING":"MIXED";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];if(!x||x.tests<2)return 1;return x.status==="RECOVERED"?1:x.status==="FAILING"?.5:.75}
function status(reason){return state()[reason]?.status||"COLLECTING"}
function best(){return Object.values(state()).sort((a,b)=>(b.successRate||0)-(a.successRate||0))}
window.CrowSpaceThresholdRecalibrationOutcomesV74={sync,state,factor,status,best};
setTimeout(sync,91000);setInterval(sync,30000);
})();