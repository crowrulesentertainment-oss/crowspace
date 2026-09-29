/* CrowSpace — Multi-Series Replacement Validation v27
   Browser-only. A replacement cannot enter portfolio exploitation until fresh controlled
   evidence is positive across multiple eligible series.
*/
(function(){
const COMP="crowspace-replacement-competition-v26",KEY="crowspace-replacement-validation-v27",EXP="crowspace-action-experiments-v1",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function result(e){const r=e?.strategyTrial?.result||{};const effect=N(r.differenceInDifferences??r.viewDelta);return{effect,positive:r.classification==="CALIBRATED_POSITIVE"||effect>=10,negative:r.classification==="CALIBRATED_NEGATIVE"||effect<=-10,classification:r.classification||""}}
function eligible(original,used){const all=L(EXP,{});return Object.keys(all).filter(s=>!used.includes(s)&&!((all[s]||[]).some(e=>e.status==="active"&&!e.completedAt))).filter(s=>s!==original)}
function update(original,e){
 const st=L(KEY,{}),g=st[original]||{originalKey:original,version:27,status:"VALIDATING",tests:[],positiveTests:0,negativeTests:0,series:[]},r=result(e),replacementKey=e?.replacementExperiment?.replacementKey||e?.strategyTrial?.key||e?.strategyTrial?.strategy&&[e.strategyTrial.strategy.mode,e.strategyTrial.strategy.correctionMode,e.strategyTrial.strategy.explorationShare].join("|"),series=e?.series||e?.strategyTrial?.series||e?.replacementExperiment?.series;
 g.replacementKey=replacementKey||g.replacementKey;g.tests.push({experimentId:e.id,series,effect:r.effect,classification:r.classification,positive:r.positive,negative:r.negative,completedAt:Date.now()});
 if(r.positive)g.positiveTests=N(g.positiveTests)+1;if(r.negative)g.negativeTests=N(g.negativeTests)+1;if(series&&!g.series.includes(series))g.series.push(series);
 g.lastEffect=r.effect;g.lastResult=r.positive?"POSITIVE":r.negative?"NEGATIVE":"UNCERTAIN";g.updatedAt=Date.now();
 if(g.positiveTests>=2&&g.series.length>=2){g.status="VALIDATED";g.reason="Positive controlled evidence reproduced across at least 2 eligible series.";g.validatedAt=Date.now();const cs=L(COMP,{}),cg=cs[original];if(cg&&cg.promotedKey===g.replacementKey){cg.status="PROMOTED";cg.promotedAt=Date.now();cg.reason="Validated across multiple eligible series.";cs[original]=cg;S(COMP,cs)}}
 else if(g.negativeTests>=2){g.status="REJECTED";g.reason="Repeated negative controlled evidence across replacement tests."}
 else g.status="VALIDATING";
 st[original]=g;S(KEY,st);return g;
}
function canExploit(original,replacement){const g=L(KEY,{})[original];return !!g&&g.status==="VALIDATED"&&g.replacementKey===replacement}
function state(original){return L(KEY,{})[original]||null}
window.CrowSpaceReplacementValidation={update,canExploit,state,eligible};
})();