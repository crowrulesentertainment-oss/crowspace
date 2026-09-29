/* CrowSpace — Context Transfer Learning v35
   Browser-only. Transfers evidence from learned neighboring contexts with safety limits.
*/
(function(){
const SIM="crowspace-context-similarity-v34",MEM="crowspace-contextual-bandit-memory-v33",KEY="crowspace-context-transfer-v35",HIST="crowspace-context-transfer-history-v35",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function candidates(original,ctx){
 const m=window.CrowSpaceContextSimilarityV34,r=Object.values(L(MEM,{})).filter(x=>x.originalKey===original&&x.context);
 return r.map(x=>({source:x,similarity:m?.similarity?m.similarity(x.context,ctx):0})).filter(x=>x.similarity>=.4).sort((a,b)=>b.similarity-a.similarity).slice(0,8);
}
function transfer(original,ctx){
 const gs=window.CrowSpaceTransferGuardrailsV36,rows=candidates(original,ctx).filter(x=>!gs||gs.canTransfer(original,ctx));
 if(!rows.length)return{mode:"NO_TRANSFER",reward:0,strength:0,evidence:0,sources:[]};
 const total=rows.reduce((n,x)=>n+Math.max(.05,x.similarity),0),reward=rows.reduce((n,x)=>{const s=x.source,signal=s.tests?(N(s.positive)-N(s.negative))/N(s.tests):0,effect=s.tests?Math.max(-1,Math.min(1,N(s.effectSum)/N(s.tests)/100)):0;return n+(signal*.7+effect*.3)*x.similarity},0)/total;
 const evidence=rows.reduce((n,x)=>n+N(x.source.tests),0),strength=Math.min(1,Math.max(...rows.map(x=>x.similarity)))*Math.min(1,evidence/4);
 const g=gs?.evaluate?gs.evaluate(original,ctx,rows.map(x=>({effect:N(x.source.effectSum)/Math.max(1,N(x.source.tests)),positive:N(x.source.positive)>N(x.source.negative),negative:N(x.source.negative)>N(x.source.positive),at:x.source.lastAt,weight:1}))):null;
 const safe=g?.disable?0:g?.status==="REDUCED"?strength*.5:strength;
 return{mode:"TRANSFERRED",reward:+reward.toFixed(3),strength:+safe.toFixed(3),evidence,guardrail:g?.status||"UNASSESSED",sources:rows.slice(0,5).map(x=>({series:x.source.context.series,similarity:+x.similarity.toFixed(2),tests:x.source.tests}))};
}
function learn(original,ctx){const x=transfer(original,ctx),st=L(KEY,{}),k=[original,ctx.series,ctx.window,ctx.momentum,ctx.experimentType].join("::"),experiment=L("crowspace-transfer-experiments-v37",{})[k],status=experiment?.status||"UNTESTED";const gated=status==="SUPPORTED";st[k]={key:k,originalKey:original,targetContext:ctx,...x,experimentStatus:status,allocationReward:gated?x.reward:0,allocationStrength:gated?x.strength:0,updatedAt:Date.now()};S(KEY,st);return st[k]}
function state(){return L(KEY,{})}
window.CrowSpaceContextTransferV35={candidates,transfer,learn,state};
})();