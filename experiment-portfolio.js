/* CrowSpace — Portfolio Intelligence v14
   Strategy Evolution Engine
   Browser-only. No Supabase.
*/
(function(){
const EVOL="crowspace-portfolio-strategy-evolution-v1",STRAT="crowspace-portfolio-strategy-trials-v1",EXP="crowspace-action-experiments-v1",TASK="crowspace-growth-action-tasks-v1",LEARN="crowspace-action-learning-v1",PORT="crowspace-experiment-portfolio-v1",HIST="crowspace-portfolio-learning-v1",MEM="crowspace-portfolio-strategy-memory-v1",V12="crowspace-portfolio-adaptive-v12",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v)),E=x=>String(x??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m])),DAY=864e5,now=()=>Date.now();

function completed(s){return(L(EXP,{})[s]||[]).filter(e=>e.status==="complete")}
function outcome(e){const vals=(e.arms||[]).map(a=>{const o=a.outcomes||[],c=o.flatMap(x=>x.caws||[]),v=c.length?c.reduce((n,x)=>n+N(x.views),0)/c.length:o.length?o.reduce((n,x)=>n+N(x.views),0)/o.length:0;return{actions:o.length,views:v}});if(vals.length<2)return null;const a=vals[0].views,b=vals[1].views,base=(a+b)/2,lift=base?((Math.max(a,b)-Math.min(a,b))/base)*100:0;return{observations:vals.reduce((n,x)=>n+x.actions,0),avgViews:base,lift,signal:lift>=10}}
function learn(s){const xs=completed(s).map(outcome).filter(Boolean),positive=xs.filter(x=>x.signal).length,avg=xs.length?xs.reduce((n,x)=>n+x.lift,0)/xs.length:0;return{experiments:xs.length,positive,avgLift:avg,observations:xs.reduce((n,x)=>n+x.observations,0),confidence:xs.length>=5?"HIGH":xs.length>=3?"MODERATE":xs.length?"EARLY":"NONE",updatedAt:now(),version:12}}
function stats(s){const ex=L(EXP,{})[s]||[],t=L(TASK,{})[s]||[],p=learn(s),recent=ex.filter(x=>x.status==="complete"&&now()-N(x.completedAt)<30*DAY).length,recentActivity=ex.filter(x=>x.status==="complete"&&now()-N(x.completedAt)<14*DAY).length;return{series:s,active:ex.find(x=>x.status==="active"),open:t.filter(x=>!x.completed).length,recent,recentActivity,learning:p}}
function portfolio(){const keys=new Set([...Object.keys(L(EXP,{})),...Object.keys(L(LEARN,{})),...Object.keys(L(TASK,{}))]);return[...keys].filter(Boolean).map(stats)}

function strategyKey(a){return[a.mode,a.correctionMode,a.explorationShare].join("|")}
function strategyMemory(){const raw=L(MEM,{});return Array.isArray(raw)?raw:[]}
function strategyBaseline(s){
 const xs=completed(s).filter(e=>!e.strategyTrial),rows=[];
 xs.forEach(e=>(e.arms||[]).forEach(a=>(a.outcomes||[]).forEach(o=>{const c=o.caws||[]; if(c.length)rows.push(...c.map(x=>({views:N(x.views),interactions:N(x.interactions)})));})));
 const obs=xs.reduce((n,e)=>n+(e.arms||[]).reduce((a,x)=>a+(x.outcomes||[]).length,0),0),views=rows.reduce((n,x)=>n+x.views,0),inter=rows.reduce((n,x)=>n+x.interactions,0);
 return{observations:obs,experiments:xs.length,avgViewsPerCaw:rows.length?views/rows.length:0,interactionRate:views?inter/views:0,caws:rows.length,capturedAt:now()};
}
function strategyTrialResult(e){
 if(!e?.strategyTrial)return null;
 if(e.strategyTrial.result?.measurementType==="CONTROLLED_HOLDOUT_ESTIMATE"||e.strategyTrial.result?.measurementType==="PORTFOLIO_CAUSAL_ESTIMATE")return e.strategyTrial.result;
 const arms=(e.arms||[]).map(a=>{const o=a.outcomes||[],c=o.flatMap(x=>x.caws||[]),views=c.length?c.reduce((n,x)=>n+N(x.views),0):o.reduce((n,x)=>n+N(x.views),0),inter=c.length?c.reduce((n,x)=>n+N(x.interactions),0):o.reduce((n,x)=>n+N(x.interactions),0),count=c.length||o.length;return{actions:o.length,caws:count,views,interactions:inter,avgViewsPerCaw:count?views/count:0,interactionRate:views?inter/views:0}});
 const caws=arms.reduce((n,x)=>n+x.caws,0),views=arms.reduce((n,x)=>n+x.views,0),inter=arms.reduce((n,x)=>n+x.interactions,0),avg=caws?views/caws:0,rate=views?inter/views:0,base=e.strategyTrial.baseline||{};
 const baseViews=N(base.avgViewsPerCaw),baseRate=N(base.interactionRate),delta=baseViews?((avg/baseViews)-1)*100:0,rateDelta=baseRate?((rate/baseRate)-1)*100:0;
 return{observations:arms.reduce((n,x)=>n+x.actions,0),caws,views,interactions,avgViewsPerCaw:avg,interactionRate:rate,baselineAvgViewsPerCaw:baseViews,baselineInteractionRate:baseRate,viewDelta:+delta.toFixed(2),rateDelta:+rateDelta.toFixed(2),outcome:delta>=10?"STRONG":delta<=-10?"WEAK":"NEUTRAL"};
}

function controlledConfidence(){
 const mem=strategyMemory().filter(x=>x.measurementType==="CONTROLLED_HOLDOUT_ESTIMATE"||x.evaluationVersion>=19||x.controlled===true),g={};
 mem.forEach(x=>{const k=x.key||strategyKey(x.strategy||{});(g[k]??=[]).push(x)});
 return Object.entries(g).map(([key,raw])=>{
  const rows=raw.sort((a,b)=>N(a.completedAt)-N(b.completedAt));
  const weights=rows.map(x=>Math.pow(.5,Math.max(0,(now()-N(x.completedAt))/DAY)/30));
  const wsum=weights.reduce((a,b)=>a+b,0)||1;
  const score=(x,i)=>weights[i]*(x.outcome==="STRONG"||x.classification==="CALIBRATED_POSITIVE"?1:x.outcome==="WEAK"||x.classification==="CALIBRATED_NEGATIVE"?-1:0);
  const weightedSignal=rows.reduce((n,x,i)=>n+score(x,i),0)/wsum;
  const strong=rows.filter(x=>x.outcome==="STRONG"||x.classification==="CALIBRATED_POSITIVE").length,weak=rows.filter(x=>x.outcome==="WEAK"||x.classification==="CALIBRATED_NEGATIVE").length,neutral=rows.length-strong-weak;
  const series=[...new Set(rows.map(x=>x.series).filter(Boolean))],contradiction=strong>0&&weak>0,ratio=rows.length?Math.max(strong,weak)/rows.length:0;
  let confidence="INSUFFICIENT";
  if(rows.length>=5&&series.length>=3&&ratio>=.8&&weightedSignal>.45&&!contradiction)confidence="HIGH CONFIDENCE";
  else if(rows.length>=4&&series.length>=3&&ratio>=.67&&weightedSignal>.25)confidence="REPLICATED";
  else if(rows.length>=2&&Math.abs(weightedSignal)>=.2)confidence="PROMISING";
  else if(rows.length)confidence="EARLY SIGNAL";
  if(contradiction&&Math.abs(weightedSignal)<.2)confidence="MIXED";
  const ageDays=rows.length?Math.max(0,(now()-N(rows[rows.length-1].completedAt))/DAY):0;
  return{key,tests:rows.length,strong,weak,neutral,series,consistency:+ratio.toFixed(2),weightedSignal:+weightedSignal.toFixed(3),confidence,contradiction,ageDays:+ageDays.toFixed(1),decayHalfLifeDays:30,avgEffect:+(rows.reduce((n,x,i)=>n+weights[i]*N(x.lift??x.differenceInDifferences),0)/wsum).toFixed(2)}
 }).sort((a,b)=>b.weightedSignal-a.weightedSignal);
}
function replacementConfidence(original,replacement){return window.CrowSpaceReplacementConfidence?.state?window.CrowSpaceReplacementConfidence.state(original):null}
function confidenceRecovery(){
 const rows=controlledConfidence(),out={version:21,updatedAt:now(),strategies:0,recovery:0,mixed:0};
 rows.forEach(x=>{out.strategies++;if(x.contradiction||x.confidence==="MIXED")out.recovery++;if(x.confidence==="MIXED")out.mixed++});
 return out;
}
;