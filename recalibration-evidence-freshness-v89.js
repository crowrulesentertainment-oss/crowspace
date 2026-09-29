/* CrowSpace — Recalibration Evidence Freshness v89
   Browser-only. Prevents old provenance observations from retaining full influence indefinitely.
*/
(function(){
const PROV="crowspace-recalibration-evidence-provenance-v88",KEY="crowspace-recalibration-evidence-freshness-v89",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function decay(t){return Math.pow(.5,Math.max(0,(Date.now()-N(t))/DAY)/14)}
function sync(){
 const src=L(PROV,{}),st=state();
 Object.values(src).forEach(x=>{
  const old=st[x.reason]||{};
  const freshness=x.updatedAt?decay(x.updatedAt):0;
  const effective=(N(x.provenance)*.7)+(freshness*.3);
  old.reason=x.reason;old.provenance=N(x.provenance);old.freshness=+freshness.toFixed(3);old.effective=+effective.toFixed(3);
  old.status=effective>=.8?"FRESH":effective>=.6?"AGING":effective>=.4?"STALE":"EXPIRED";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){const x=state()[reason];return x?.status==="FRESH"?1:x?.status==="AGING"?.8:x?.status==="STALE"?.6:.4}
function freshness(reason){return state()[reason]?.freshness||0}
function best(){return Object.values(state()).sort((a,b)=>(b.effective||0)-(a.effective||0))}
window.CrowSpaceRecalibrationEvidenceFreshnessV89={sync,state,factor,freshness,best};
setTimeout(sync,121000);setInterval(sync,30000);
})();