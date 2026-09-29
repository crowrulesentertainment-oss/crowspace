/* CrowSpace — Recalibration Audit Independence v87
   Browser-only. Detects circular/self-derived audit evidence and limits trust accordingly.
*/
(function(){
const AUD="crowspace-recalibration-integrity-audit-v86",REC="crowspace-threshold-confidence-recalibration-v73",OUT="crowspace-threshold-recalibration-outcomes-v74",KEY="crowspace-recalibration-audit-independence-v87",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const aud=L(AUD,{}),rec=L(REC,{}),out=L(OUT,{}),st=state();
 Object.values(aud).forEach(x=>{
  const r=rec[x.reason]||{},o=out[x.reason]||{},old=st[x.reason]||{checks:0,independent:0,dependent:0,history:[]};
  const linked=!!r.decisionId&&r.decisionId===o.decisionId;
  const sameCycle=N(o.updatedAt)>=N(r.lastAt);
  const independent=linked&&sameCycle&&x.status==="AUDITED";
  const marker=String(r.decisionId||"")+":"+String(o.updatedAt||0)+":"+String(x.status||"");
  if(old.lastMarker!==marker){
   old.checks++;if(independent)old.independent++;else old.dependent++;
   old.history=[{at:Date.now(),independent,linked,sameCycle,auditStatus:x.status},...(old.history||[])].slice(0,30);old.lastMarker=marker;
  }
  old.reason=x.reason;old.independence=old.checks?old.independent/old.checks:0;
  old.status=old.checks<3?"COLLECTING":old.independence>=.8?"INDEPENDENT":old.independence>=.5?"MIXED":"CIRCULAR";
  old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];return x?.status==="INDEPENDENT"?1:x?.status==="MIXED"?.7:.4}
function independent(reason){return state()[reason]?.status==="INDEPENDENT"}
function best(){return Object.values(state()).sort((a,b)=>(b.independence||0)-(a.independence||0))}
window.CrowSpaceRecalibrationAuditIndependenceV87={sync,state,factor,independent,best};
setTimeout(sync,117000);setInterval(sync,30000);
})();