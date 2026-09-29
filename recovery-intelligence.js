/* CrowSpace — Recovery Learning & Strategy Retirement Intelligence v24
   Browser-only. Learns recovery failure modes and prevents repeated resurrection.
*/
(function(){
const KEY="crowspace-strategy-recovery-v23",LEARN="crowspace-strategy-recovery-learning-v24",RET="crowspace-strategy-retirement-v24",DAY=864e5;
const N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v)),now=()=>Date.now();
function rows(){const out=[];Object.values(L("crowspace-action-experiments-v1",{})).flat().forEach(e=>{if(e.recoveryExperiment&&e.status==="complete")out.push(e)});return out}
function classify(e){
 const r=e.strategyTrial?.result||{},dd=N(r.differenceInDifferences??r.viewDelta),cls=r.classification||"";
 if(cls==="CALIBRATED_POSITIVE"||dd>=10)return"RESTORING";
 if(cls==="CALIBRATED_NEGATIVE"||dd<=-10)return"NEGATIVE";
 if(cls==="CONTROLLED_UNCERTAIN"||cls==="INSUFFICIENT"||Math.abs(dd)<10)return"UNCERTAIN";
 return"UNCERTAIN"
}
function analyze(){
 const all=L(LEARN,{}), grouped={};
 rows().forEach(e=>{const k=e.recoveryExperiment.strategyKey;(grouped[k]??=[]).push(e)});
 Object.entries(grouped).forEach(([key,xs])=>{
  const outcomes=xs.map(classify),negative=outcomes.filter(x=>x==="NEGATIVE").length,restoring=outcomes.filter(x=>x==="RESTORING").length,uncertain=outcomes.filter(x=>x==="UNCERTAIN").length;
  const attempts=xs.length, persistent=negative>=2&&restoring===0, temporary=negative>0&&restoring>0, unresolved=attempts>=2&&uncertain>=1&&restoring===0;
  let failureMode="NONE",status="RECOVERING";
  if(persistent){failureMode="PERSISTENT_NEGATIVE";status="RETIRE"}
  else if(temporary){failureMode="TEMPORARY_CONTRADICTION";status="CONTINUE_RECOVERY"}
  else if(unresolved){failureMode="UNRESOLVED_SIGNAL";status="CONTINUE_RECOVERY"}
  else if(negative)failureMode="NEGATIVE_RECOVERY_SIGNAL";
  const last=xs.slice().sort((a,b)=>N(b.completedAt)-N(a.completedAt))[0];
  all[key]={strategyKey:key,attempts,negative,restoring,uncertain,failureMode,status,lastExperimentId:last?.id||null,lastClassification:outcomes[outcomes.length-1]||null,updatedAt:now(),version:24};
 });
 S(LEARN,all);
 const retired=L(RET,{});
 Object.entries(all).forEach(([k,v])=>{if(v.status==="RETIRE")retired[k]={...v,status:"RETIRED",reason:"Recovery produced repeated negative controlled evidence without a restoring result.",retiredAt:retired[k]?.retiredAt||now(),version:24}});
 S(RET,retired); return all;
}
function stateFor(key){const x=analyze()[key];return x||null}
function canResurrect(key){const r=L(RET,{})[key];return !r||r.status!=="RETIRED"}
window.CrowSpaceRecoveryIntelligence={analyze,stateFor,canResurrect,rows};
setTimeout(analyze,9000);setInterval(analyze,7000);
})();