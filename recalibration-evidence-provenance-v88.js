/* CrowSpace — Recalibration Evidence Provenance v88
   Browser-only. Tracks provenance of recalibration evidence and prevents repeated derived observations
   from being treated as independent evidence.
*/
(function(){
const IND="crowspace-recalibration-audit-independence-v87",AUD="crowspace-recalibration-integrity-audit-v86",KEY="crowspace-recalibration-evidence-provenance-v88",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(IND,{}),aud=L(AUD,{}),st=state();
 Object.values(src).forEach(x=>{
  const old=st[x.reason]||{observations:0,unique:0,derived:0,history:[]},a=aud[x.reason]||{};
  const source=x.status==="INDEPENDENT"?"DECISION_OUTCOME":"DERIVED_AUDIT";
  const marker=String(x.reason)+":"+String(a.updatedAt||0)+":"+source+":"+String(a.validRate||0);
  if(old.lastMarker!==marker){
   old.observations++;
   if(source==="DECISION_OUTCOME")old.unique++;else old.derived++;
   old.history=[{at:Date.now(),source,independence:N(x.independence),audit:a.status||null},...(old.history||[])].slice(0,30);
   old.lastMarker=marker;
  }
  old.reason=x.reason;old.provenance=old.observations?old.unique/old.observations:0;
  old.status=old.observations<3?"COLLECTING":old.provenance>=.8?"TRUSTED":old.provenance>=.5?"MIXED":"DERIVED";
  old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];return x?.status==="TRUSTED"?1:x?.status==="MIXED"?.7:.4}
function provenance(reason){return state()[reason]?.provenance||0}
function best(){return Object.values(state()).sort((a,b)=>(b.provenance||0)-(a.provenance||0))}
window.CrowSpaceRecalibrationEvidenceProvenanceV88={sync,state,factor,provenance,best};
setTimeout(sync,119000);setInterval(sync,30000);
})();