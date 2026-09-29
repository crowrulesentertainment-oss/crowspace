/* CrowSpace — Recalibration Evidence Trust Synthesis v91
   Browser-only. Produces one bounded evidence-trust signal from provenance, freshness,
   conflict, independence, and audit quality without allowing stacked penalties to collapse trust.
*/
(function(){
const IND="crowspace-recalibration-audit-independence-v87",PROV="crowspace-recalibration-evidence-provenance-v88",FRESH="crowspace-recalibration-evidence-freshness-v89",CONFLICT="crowspace-recalibration-evidence-conflict-v90",AUD="crowspace-recalibration-integrity-audit-v86",KEY="crowspace-recalibration-evidence-trust-v91",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const ind=L(IND,{}),prov=L(PROV,{}),fresh=L(FRESH,{}),conf=L(CONFLICT,{}),aud=L(AUD,{}),st=state();
 Object.keys({...ind,...prov,...fresh,...conf,...aud}).forEach(reason=>{
  const i=ind[reason]||{},p=prov[reason]||{},f=fresh[reason]||{},c=conf[reason]||{},a=aud[reason]||{};
  const signals=[N(i.independence),N(p.provenance),N(f.freshness),Math.max(0,1-N(c.conflictRate)),N(a.validRate)];
  const active=signals.filter(v=>v>0);
  const raw=active.length?active.reduce((s,v)=>s+v,0)/active.length:0;
  const trust=Math.min(1,Math.max(.25,raw));
  st[reason]={reason,trust:+trust.toFixed(3),independence:N(i.independence),provenance:N(p.provenance),freshness:N(f.freshness),agreement:Math.max(0,1-N(c.conflictRate)),audit:N(a.validRate),status:trust>=.8?"TRUSTED":trust>=.6?"CAUTIOUS":trust>=.4?"LIMITED":"RESTRICTED",updatedAt:Date.now()};
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];return x?.trust||.25}
function trust(reason){return state()[reason]?.trust||0}
function status(reason){return state()[reason]?.status||"RESTRICTED"}
function best(){return Object.values(state()).sort((a,b)=>(b.trust||0)-(a.trust||0))}
window.CrowSpaceRecalibrationEvidenceTrustV91={sync,state,factor,trust,status,best};
setTimeout(sync,125000);setInterval(sync,30000);
})();