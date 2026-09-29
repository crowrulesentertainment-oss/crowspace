/* CrowSpace — Champion Challenge Execution v43
   Browser-only. Turns v42 challenge records into real controlled experiments.
*/
(function(){
const CH="crowspace-champion-challenges-v42",EXP="crowspace-action-experiments-v1",KEY="crowspace-challenge-execution-v43",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
async function execute(){
 const explorer=window.CrowSpaceExperimentExplorer,holdouts=window.CrowSpaceControlledHoldouts,portfolio=window.CrowSpaceExperimentPortfolio;if(!explorer?.candidates||!explorer?.schedule||!holdouts?.capture)return[];
 const challenges=L(CH,{}),all=L(EXP,{}),st=state(),out=[];
 for(const c of Object.values(challenges)){
  if(c.status!=="SCHEDULED"||!c.targetContext?.series)continue;
  const series=c.targetContext.series,active=(all[series]||[]).some(e=>e.status==="active"&&!e.completedAt);if(active)continue;
  const action=(explorer.candidates(series)||[])[0];if(!action)continue;
  const holdout=await holdouts.capture(series,[]);if(!holdout)continue;
  const baseline=portfolio?.strategyBaseline?portfolio.strategyBaseline(series):{};
  const trial={key:c.key,parent:c.originalKey,mutation:"CHAMPION_CHALLENGE",version:43,baseline,holdout,capturedAt:Date.now(),controlledHoldout:true,champion:c.incumbent,targetContext:c.targetContext,challenge:{key:c.key,incumbent:c.incumbent,version:43},series};
  const r=await explorer.schedule(series,action,{strategyTrial:trial});if(!r?.ok)continue;
  const list=L(EXP,{}),arr=list[series]||[],e=arr[arr.length-1];if(e)e.challengeExecution={key:c.key,version:43,incumbent:c.incumbent,challenge:true};
  list[series]=arr;S(EXP,list);
  st[c.key]={key:c.key,status:"TESTING",experimentId:e?.id||null,series,incumbent:c.incumbent,scheduledAt:Date.now(),version:43};
  S(KEY,st);out.push(st[c.key]);
 }
 return out
}
function state(){return L(KEY,{})}
window.CrowSpaceChallengeExecutionV43={execute,state};
setTimeout(execute,28000);setInterval(execute,30000);
})();