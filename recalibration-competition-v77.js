/* CrowSpace — Recalibration Strategy Competition v77
   Browser-only. Compares recovery strategies on matched outcomes before promoting a winner.
*/
(function(){
const EXP="crowspace-recalibration-exploration-v76",OUT="crowspace-threshold-recalibration-outcomes-v74",KEY="crowspace-recalibration-competition-v77",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const ex=L(EXP,{}),out=L(OUT,{}),st=state();
 Object.values(ex).forEach(x=>{
  const old=st[x.reason]||{arms:{},history:[]},result=out[x.reason],mode=x.explore||x.selected;
  if(result&&result.lastMode&&mode){
   const a=old.arms[result.lastMode]||{tests:0,success:0};
   a.tests=N(a.tests)+1;a.success+=result.status==="RECOVERED"?1:0;a.rate=a.tests?a.success/a.tests:0;old.arms[result.lastMode]=a;
  }
  const arms=Object.entries(old.arms).filter(a=>a[1].tests>=2).sort((a,b)=>(b[1].rate||0)-(a[1].rate||0)),leader=arms[0],runner=arms[1];
  const margin=leader&&runner?(leader[1].rate-runner[1].rate):0;
  old.reason=x.reason;old.leader=leader?.[0]||x.selected;old.leaderRate=leader?.[1]?.rate||0;old.runner=runner?.[0]||null;old.margin=+margin.toFixed(3);
  old.status=leader&&runner&&margin>=.2?"PROMOTE":arms.length<2?"COLLECT":"CLOSE";
  old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function mode(reason){return state()[reason]?.leader||"CONSERVATIVE_RECALIBRATION"}
function confidence(reason){const x=state()[reason];return x?.status==="PROMOTE"?.8:x?.status==="CLOSE"?.6:.25}
function best(){return Object.values(state()).sort((a,b)=>(b.margin||0)-(a.margin||0))}
window.CrowSpaceRecalibrationCompetitionV77={sync,state,mode,confidence,best};
setTimeout(sync,97000);setInterval(sync,30000);
})();