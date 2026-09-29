/* CrowSpace — Replacement Confidence Governance v29
   Confidence is a live portfolio gate: strong evidence earns more exploitation,
   decayed/contradictory evidence automatically loses exploitation access.
*/
(function(){
const VAL="crowspace-replacement-validation-v27",KEY="crowspace-replacement-confidence-v29",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function score(original){
 const v=L(VAL,{})[original];if(!v)return null;const t=v.tests||[],w=t.map(x=>Math.pow(.5,Math.max(0,(Date.now()-N(x.completedAt))/DAY)/30)),sum=w.reduce((a,b)=>a+b,0)||1;
 const eff=t.reduce((n,x,i)=>n+w[i]*N(x.effect),0)/sum, pos=t.reduce((n,x,i)=>n+w[i]*(x.positive?1:x.negative?-1:0),0)/sum;
 const series=[...new Set(t.map(x=>x.series).filter(Boolean))], positives=t.filter(x=>x.positive).length, negatives=t.filter(x=>x.negative).length;
 const consistency=t.length?positives/t.length:0, coverage=Math.min(1,series.length/3), sample=Math.min(1,t.length/5), recency=t.length?Math.max(.15,w.reduce((a,b)=>a+b,0)/t.length):0;
 let confidence=sample*25+coverage*25+Math.max(0,eff)*.5+Math.max(0,pos)*20+recency*10-negatives*12;
 confidence=Math.max(0,Math.min(100,confidence));
 const tier=confidence>=80&&positives>=3&&series.length>=3&&negatives===0?"HIGH":confidence>=65&&positives>=2&&series.length>=2&&negatives===0?"STRONG":confidence>=45?"PROMISING":confidence>=25?"EARLY":"LOW";
 return{originalKey:original,confidence:+confidence.toFixed(1),tier,tests:t.length,positiveTests:positives,negativeTests:negatives,seriesCount:series.length,series,weightedEffect:+eff.toFixed(2),weightedSignal:+pos.toFixed(3),consistency:+consistency.toFixed(2),coverage:+coverage.toFixed(2),sample:+sample.toFixed(2),recency:+recency.toFixed(3),decayHalfLifeDays:30,exploitation:tier==="HIGH"||tier==="STRONG",updatedAt:Date.now(),version:29};
}
function all(){const v=L(VAL,{}),o={};Object.keys(v).forEach(k=>{const x=score(k);if(x)o[k]=x});S(KEY,o);return o}
function canExploit(original){const x=score(original);return !!x&&x.exploitation}
function state(original){return score(original)}
window.CrowSpaceReplacementGovernance={score,all,canExploit,state};
setTimeout(all,16000);setInterval(all,15000);
})();