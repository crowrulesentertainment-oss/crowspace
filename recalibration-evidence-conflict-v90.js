/* CrowSpace — Recalibration Evidence Conflict Resolution v90
   Browser-only. Detects conflicting evidence signals and prevents contradictory evidence from
   receiving full recalibration influence.
*/
(function(){
const FRESH="crowspace-recalibration-evidence-freshness-v89",PROV="crowspace-recalibration-evidence-provenance-v88",KEY="crowspace-recalibration-evidence-conflict-v90",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const fresh=L(FRESH,{}),prov=L(PROV,{}),st=state();
 Object.values(fresh).forEach(x=>{
  const p=prov[x.reason]||{},old=st[x.reason]||{checks:0,agree:0,conflict:0,history:[]};
  const freshness=N(x.freshness),provenance=N(p.provenance),agreement=Math.min(freshness,provenance),conflict=Math.abs(freshness-provenance);
  const marker=String(x.updatedAt||0)+":"+String(p.updatedAt||0)+":"+String(x.status||"");
  if(old.lastMarker!==marker){
   old.checks++;if(conflict<.25)old.agree++;else old.conflict++;
   old.history=[{at:Date.now(),freshness,provenance,conflict},...(old.history||[])].slice(0,30);old.lastMarker=marker;
  }
  old.reason=x.reason;old.conflictRate=old.checks?old.conflict/old.checks:0;old.agreement=old.checks?old.agree/old.checks:0;
  old.status=old.checks<3?"COLLECTING":old.conflictRate<=.2?"ALIGNED":old.conflictRate<=.5?"CONFLICTING":"DIVERGENT";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];return x?.status==="ALIGNED"?1:x?.status==="CONFLICTING"?.65:.4}
function conflict(reason){return state()[reason]?.conflictRate||0}
function best(){return Object.values(state()).sort((a,b)=>(a.conflictRate||0)-(b.conflictRate||0))}
window.CrowSpaceRecalibrationEvidenceConflictV90={sync,state,factor,conflict,best};
setTimeout(sync,123000);setInterval(sync,30000);
})();