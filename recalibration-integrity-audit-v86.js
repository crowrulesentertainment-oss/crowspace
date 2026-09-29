/* CrowSpace — Recalibration Decision Integrity Audit v86
   Browser-only. Audits decision-to-outcome lineage without trusting downstream confidence labels.
*/
(function(){
const REC="crowspace-threshold-confidence-recalibration-v73",OUT="crowspace-threshold-recalibration-outcomes-v74",KEY="crowspace-recalibration-integrity-audit-v86",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const rec=L(REC,{}),out=L(OUT,{}),st=state();
 Object.values(rec).forEach(x=>{
  const old=st[x.reason]||{audits:0,valid:0,invalid:0,history:[]},o=out[x.reason]||{};
  const linked=!!x.decisionId&&!!o.decisionId&&x.decisionId===o.decisionId;
  const fresh=N(o.updatedAt)>=N(x.lastAt),valid=linked&&fresh;
  const marker=String(x.decisionId||"")+" : "+String(o.updatedAt||0);
  if(old.lastMarker!==marker){
   old.audits++;if(valid)old.valid++;else old.invalid++;
   old.history=[{at:Date.now(),decisionId:x.decisionId||null,linked,fresh,valid},...(old.history||[])].slice(0,30);old.lastMarker=marker;
  }
  old.reason=x.reason;old.validRate=old.audits?old.valid/old.audits:0;old.status=old.audits<2?"COLLECTING":old.validRate>=.9?"AUDITED":old.validRate>=.6?"DRIFT":"INVALID";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];return x?.status==="AUDITED"?1:x?.status==="DRIFT"?.75:.5}
function status(reason){return state()[reason]?.status||"COLLECTING"}
function best(){return Object.values(state()).sort((a,b)=>(b.validRate||0)-(a.validRate||0))}
window.CrowSpaceRecalibrationIntegrityAuditV86={sync,state,factor,status,best};
setTimeout(sync,115000);setInterval(sync,30000);
})();