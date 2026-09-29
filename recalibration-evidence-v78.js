/* CrowSpace — Recalibration Competition Evidence v78
   Browser-only. Prevents competition decisions from reusing the same observation repeatedly.
*/
(function(){
const COMP="crowspace-recalibration-competition-v77",OUT="crowspace-threshold-recalibration-outcomes-v74",KEY="crowspace-recalibration-evidence-v78",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const comp=L(COMP,{}),out=L(OUT,{}),st=state();
 Object.values(comp).forEach(x=>{
  const old=st[x.reason]||{observed:{}},r=out[x.reason];
  if(!r)return;
  const marker=String(r.updatedAt||0)+":"+String(r.successRate||0)+":"+String(r.status||"");
  if(old.lastMarker!==marker){
   const mode=r.lastMode||x.leader||x.runner||"UNKNOWN",a=old.observed[mode]||{tests:0,success:0};
   a.tests++;a.success+=r.status==="RECOVERED"?1:0;a.rate=a.success/a.tests;old.observed[mode]=a;old.lastMarker=marker;
  }
  const arms=Object.entries(old.observed).filter(a=>a[1].tests>=2).sort((a,b)=>(b[1].rate||0)-(a[1].rate||0)),leader=arms[0],runner=arms[1],margin=leader&&runner?leader[1].rate-runner[1].rate:0;
  old.reason=x.reason;old.leader=leader?.[0]||x.leader||null;old.runner=runner?.[0]||x.runner||null;old.margin=+margin.toFixed(3);old.totalTests=arms.reduce((n,a)=>n+N(a[1].tests),0);
  old.status=leader&&runner&&margin>=.2?"VALIDATED":arms.length<2?"COLLECTING":"UNRESOLVED";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function mode(reason){return state()[reason]?.status==="VALIDATED"?state()[reason].leader:null}
function confidence(reason){const x=state()[reason];return x?.status==="VALIDATED"?Math.min(1,.5+(x.totalTests||0)/20):.25}
function best(){return Object.values(state()).sort((a,b)=>(b.margin||0)-(a.margin||0))}
window.CrowSpaceRecalibrationEvidenceV78={sync,state,mode,confidence,best};
setTimeout(sync,99000);setInterval(sync,30000);
})();