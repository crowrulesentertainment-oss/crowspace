/* CrowSpace — Replacement Confidence Scoring v28
   Browser-only. Confidence decays over time and controls portfolio exploitation.
*/
(function(){
const VAL="crowspace-replacement-validation-v27",KEY="crowspace-replacement-confidence-v28",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function score(original){
 const v=L(VAL,{})[original];if(!v)return null;
 const tests=v.tests||[],positive=tests.filter(x=>x.positive),negative=tests.filter(x=>x.negative),series=[...new Set(tests.map(x=>x.series).filter(Boolean))];
 const weights=tests.map(x=>Math.pow(.5,Math.max(0,(Date.now()-N(x.completedAt))/DAY)/30)),sum=weights.reduce((a,b)=>a+b,0)||1;
 const weightedEffect=tests.reduce((n,x,i)=>n+weights[i]*N(x.effect),0)/sum;
 const weightedPositive=tests.reduce((n,x,i)=>n+weights[i]*(x.positive?1:x.negative?-1:0),0)/sum;
 const consistency=tests.length?Math.max(positive.length,negative.length)/tests.length:0;
 const coverage=Math.min(1,series.length/3),sample=Math.min(1,tests.length/5);
 const recency=tests.length?Math.max(.15,weights.reduce((a,b)=>a+b,0)/tests.length):0;
 const negativePenalty=Math.min(.45,negative.length*.12);
 let confidence=0;
 confidence += Math.min(30,tests.length*6);
 confidence += Math.min(25,series.length*8.333);
 confidence += Math.min(25,Math.max(0,weightedEffect)*.5);
 confidence += Math.min(15,Math.max(0,weightedPositive)*15);
 confidence += recency*10;
 confidence -= negativePenalty*100;
 confidence=Math.max(0,Math.min(100,confidence));
 const status=confidence>=80&&positive.length>=2&&series.length>=2&&negative.length===0?"HIGH":confidence>=65&&positive.length>=2&&series.length>=2?"STRONG":confidence>=45?"PROMISING":confidence>=25?"EARLY":"LOW";
 return{originalKey:original,confidence:+confidence.toFixed(1),status,tests:tests.length,positiveTests:positive.length,negativeTests:negative.length,seriesCount:series.length,series,weightedEffect:+weightedEffect.toFixed(2),weightedSignal:+weightedPositive.toFixed(3),consistency:+consistency.toFixed(2),recency:+recency.toFixed(3),negativePenalty:+negativePenalty.toFixed(2),decayHalfLifeDays:30,updatedAt:Date.now(),version:28};
}
function all(){const v=L(VAL,{}),out={};Object.keys(v).forEach(k=>{const x=score(k);if(x)out[k]=x});S(KEY,out);return out}
function canExploit(original,replacement){
 const x=score(original);return !!x&&x.status!=="LOW"&&x.confidence>=65&&x.positiveTests>=2&&x.seriesCount>=2&&x.negativeTests===0&&x.originalKey===original;
}
function state(original){return score(original)}
window.CrowSpaceReplacementConfidence={score,all,canExploit,state};
setTimeout(all,13500);setInterval(all,15000);
})();