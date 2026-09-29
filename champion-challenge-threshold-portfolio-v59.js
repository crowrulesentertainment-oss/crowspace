/* CrowSpace — Challenge Threshold Portfolio v59
   Browser-only. Selects validated threshold regimes while preserving exploration for uncertain signals.
*/
(function(){
const VAL="crowspace-challenge-threshold-validation-v58",TH="crowspace-challenge-thresholds-v57",KEY="crowspace-challenge-threshold-portfolio-v59",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const val=L(VAL,{}),th=L(TH,{}),st=state();
 Object.keys(th).forEach(reason=>{
  const v=val[reason]||{},t=th[reason]||{},q=N(v.thresholdQuality),tests=N(v.tests),explore=tests<3||v.status==="UNCERTAIN",validated=v.status==="VALIDATED";
  const allocation=validated?Math.min(1,.5+Math.max(0,q)*.8):explore?.25:0;
  st[reason]={reason,status:validated?"EXPLOIT":explore?"EXPLORE":"HOLD",allocation:+allocation.toFixed(2),quality:q,tests,thresholds:{prioritizeAt:t.prioritizeAt,suppressAt:t.suppressAt},updatedAt:Date.now()};
 });
 S(KEY,st);return st
}
function allocation(reason){return state()[reason]?.allocation||0}
function mode(reason){return state()[reason]?.status||"HOLD"}
function best(){return Object.values(state()).sort((a,b)=>(b.allocation||0)-(a.allocation||0))}
window.CrowSpaceChallengeThresholdPortfolioV59={sync,state,allocation,mode,best};
setTimeout(sync,61000);setInterval(sync,30000);
})();