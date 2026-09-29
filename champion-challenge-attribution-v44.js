/* CrowSpace — Champion Challenge Attribution v44
   Browser-only. Resolves completed controlled challenges back into v42/v41 champion state.
*/
(function(){
const EXEC="crowspace-challenge-execution-v43",CH="crowspace-champion-challenges-v42",ROT="crowspace-transfer-rotation-v41",KEY="crowspace-challenge-attribution-v44",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function result(e){
 const r=e?.strategyTrial?.result||{},effect=N(r.differenceInDifferences??r.viewDelta);
 return{effect,positive:r.classification==="CALIBRATED_POSITIVE"||effect>=10,negative:r.classification==="CALIBRATED_NEGATIVE"||effect<=-10,at:e.completedAt||Date.now()};
}
function sync(){
 const ex=L(EXEC,{}),ch=L(CH,{}),rot=L(ROT,{}),st=state(),all=L("crowspace-action-experiments-v1",{});
 Object.values(ex).forEach(x=>{
  if(!x.experimentId)return;
  const series=x.series,list=all[series]||[],e=list.find(z=>z.id===x.experimentId);
  if(!e||e.status==="active"||!e.completedAt)return;
  const r=result(e),c=ch[x.key]||{},old=st[x.key]||{tests:0,positive:0,negative:0};
  old.key=x.key;old.originalKey=x.originalKey;old.series=series;old.incumbent=x.incumbent;old.tests=N(old.tests)+1;
  old.positive=N(old.positive)+(r.positive?1:0);old.negative=N(old.negative)+(r.negative?1:0);old.last=r;
  old.status=r.positive?"CHALLENGER_AHEAD":r.negative?"INCUMBENT_AHEAD":"INCONCLUSIVE";
  old.updatedAt=Date.now();st[x.key]=old;
  if(c){
   const winner=r.positive?"ROTATE":r.negative?"RETAIN":"RETEST";
   const cs=L(CH,{});cs[x.key]={...c,status:winner,lastResult:r,completedAt:e.completedAt};S(CH,cs);
  }
  const rr=rot[x.key];if(rr&&r.positive)rr.champion="TRANSFER";if(rr&&r.negative)rr.champion="LOCAL";if(rr){rr.current=rr.champion;rr.updatedAt=Date.now();const rs=L(ROT,{});rs[x.key]=rr;S(ROT,rs)}
 });
 S(KEY,st);return st
}
window.CrowSpaceChallengeAttributionV44={sync,state};
setTimeout(sync,31000);setInterval(sync,30000);
})();