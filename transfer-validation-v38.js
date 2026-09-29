/* CrowSpace — Transfer Counterfactual Validation v38
   Browser-only. Determines whether a transferred strategy beats the target context's local evidence.
*/
(function(){
const KEY="crowspace-transfer-validation-v38",EXP="crowspace-action-experiments-v1",TE="crowspace-transfer-experiments-v37",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function decay(t){return Math.pow(.5,Math.max(0,(Date.now()-N(t))/DAY)/30)}
function result(e){const r=e?.strategyTrial?.result||{},effect=N(r.differenceInDifferences??r.viewDelta);return{effect,positive:r.classification==="CALIBRATED_POSITIVE"||effect>=10,negative:r.classification==="CALIBRATED_NEGATIVE"||effect<=-10,at:e.completedAt||Date.now()}}
function state(){return L(KEY,{})}
function update(e){
 const tr=e?.strategyTrial?.transferExperiment;if(!tr)return null;
 const st=state(),x=st[tr.key]||{key:tr.key,originalKey:tr.originalKey,targetContext:tr.targetContext,tests:[],positiveTests:0,negativeTests:0,series:[],effects:[]},r=result(e);
 x.tests.push({...r,series:tr.targetContext?.series});x.tests=x.tests.slice(-20);
 x.positiveTests=x.tests.filter(z=>z.positive).length;x.negativeTests=x.tests.filter(z=>z.negative).length;
 x.series=[...new Set(x.tests.map(z=>z.series).filter(Boolean))];x.effects=x.tests.map(z=>z.effect);
 const weights=x.tests.map(z=>decay(z.at)),sw=weights.reduce((a,b)=>a+b,0)||1;
 x.weightedEffect=x.tests.reduce((a,z,i)=>a+z.effect*weights[i],0)/sw;
 x.consistency=x.tests.length?Math.max(x.positiveTests,x.negativeTests)/x.tests.length:0;
 x.confidence=Math.max(0,Math.min(100,x.tests.length*12+x.series.length*15+Math.max(0,x.weightedEffect)*.35+x.consistency*15-x.negativeTests*12));
 x.status=x.negativeTests>=2&&x.weightedEffect<=0?"BLOCKED":x.positiveTests>=3&&x.series.length>=2&&x.confidence>=65?"TRANSFER_VALIDATED":x.positiveTests>=2?"PROMISING":"COLLECTING";
 x.updatedAt=Date.now();S(KEY,{...st,[tr.key]:x});
 if(window.CrowSpaceTransferExperimentsV37?.record)window.CrowSpaceTransferExperimentsV37.record(e);
 return x
}
function canUse(key){const x=state()[key];return !!x&&x.status==="TRANSFER_VALIDATED"&&x.confidence>=65&&x.negativeTests===0}
function best(){return Object.values(state()).sort((a,b)=>(b.confidence||0)-(a.confidence||0))}
window.CrowSpaceTransferValidationV38={update,canUse,best,state};
})();