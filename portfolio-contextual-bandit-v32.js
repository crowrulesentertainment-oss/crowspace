/* CrowSpace — Contextual Portfolio Bandit v32
   Browser-only. Learns reward by context instead of treating opportunities as interchangeable.
*/
(function(){
const VAL="crowspace-replacement-validation-v27",V31="crowspace-portfolio-bandit-v31",KEY="crowspace-portfolio-contextual-bandit-v32",HIST="crowspace-portfolio-contextual-history-v32",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function context(e){
 const d=e?.strategyTrial?.capturedAt||e?.completedAt||Date.now(),dt=new Date(d);
 return{series:e?.strategyTrial?.series||e?.series||"",window:dt.getHours()<12?"MORNING":dt.getHours()<17?"AFTERNOON":dt.getHours()<21?"EVENING":"NIGHT",momentum:e?.strategyTrial?.audienceMomentum||e?.audienceMomentum||"UNKNOWN",experimentType:e?.strategyTrial?.mutation||e?.strategyTrial?.replication?"REPLICATION":"STANDARD",ageBucket:Math.floor(Math.max(0,(Date.now()-d))/DAY/30)};
}
function records(){
 const all=L(VAL,{}),out=[];Object.entries(all).forEach(([original,v])=>(v.tests||[]).forEach(t=>out.push({original,effect:N(t.effect),positive:!!t.positive,negative:!!t.negative,completedAt:t.completedAt,series:t.series,context:t.context||null})));return out;
}
function learn(){
 const out={};records().forEach(r=>{const c=r.context||{series:r.series||"",window:"UNKNOWN",momentum:"UNKNOWN",experimentType:"UNKNOWN",ageBucket:0};const k=[r.original,c.series,c.window,c.momentum,c.experimentType,c.ageBucket].join("::");const g=out[k]||(out[k]={key:k,original:r.original,context:c,tests:0,reward:0,positive:0,negative:0,lastAt:0});const w=Math.pow(.5,Math.max(0,(Date.now()-N(r.completedAt))/DAY)/30);g.reward+=w*(r.positive?1:r.negative?-1:r.effect/100);g.tests++;g.positive+=r.positive?1:0;g.negative+=r.negative?1:0;g.lastAt=Math.max(g.lastAt,N(r.completedAt));});Object.values(out).forEach(g=>g.reward=+(g.reward/Math.max(1,g.tests)).toFixed(3));return out;
}
function currentContext(series,opts={}){
 const d=Date.now(),dt=new Date(d);return{series:series||"",window:opts.window||(["MORNING","AFTERNOON","EVENING","NIGHT"][Math.min(3,Math.floor(dt.getHours()/6))]),momentum:opts.momentum||"UNKNOWN",experimentType:opts.experimentType||"STANDARD",ageBucket:opts.ageBucket??0};
}
function allocate(series,opts={}){
 const learned=learn(),base=L(V31,{}),ctx=currentContext(series,opts),candidates=Object.values(base).filter(x=>x.key);
 const rows=candidates.map(b=>{const matches=Object.values(learned).filter(g=>g.original===b.key.split("::")[0]&&g.context.series===ctx.series&&g.context.window===ctx.window&&g.context.momentum===ctx.momentum&&g.context.experimentType===ctx.experimentType);const reward=matches.length?matches.reduce((n,g)=>n+g.reward,0)/matches.length:N(b.reward),evidence=matches.reduce((n,g)=>n+g.tests,0),bonus=evidence<2?.5:Math.sqrt(1/Math.max(1,evidence));return{...b,context:ctx,contextReward:+reward.toFixed(3),contextEvidence:evidence,contextBonus:+bonus.toFixed(3),value:+(Math.max(0,(reward+1)/2)+.3*bonus).toFixed(4)}});const total=rows.reduce((n,x)=>n+x.value,0)||1,cap=.45,floor=Math.min(.15,1/Math.max(1,rows.length)*.75);rows.forEach(x=>x.share=floor+(1-floor*rows.length)*x.value/total);let over=rows.filter(x=>x.share>cap),ex=over.reduce((n,x)=>n+x.share-cap,0);over.forEach(x=>x.share=cap);const under=rows.filter(x=>x.share<cap),u=under.reduce((n,x)=>n+x.value,0)||1;under.forEach(x=>x.share+=ex*x.value/u);const out={};rows.forEach(x=>{x.share=+Math.min(cap,x.share).toFixed(3);x.mode=x.contextEvidence<2?"EXPLORE":x.contextReward>=.25?"EXPLOIT":"BALANCED";x.version=32;out[x.key]=x});S(KEY,{updatedAt:Date.now(),context:ctx,allocations:out});S(HIST,[{at:Date.now(),context:ctx,allocations:out},...L(HIST,[])].slice(0,100));return out;
}
function choose(series,opts){const a=allocate(series,opts),v=Object.values(a);return v.sort((x,y)=>y.share-x.share)[0]||null}
function state(){return L(KEY,{})}
window.CrowSpaceContextualBanditV32={allocate,choose,state,learn,currentContext,context};
setTimeout(function(){allocate();},19000);setInterval(function(){allocate();},15000);
})();