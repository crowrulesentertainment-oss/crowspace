/* CrowSpace — Transfer Safety & Counterfactual Guardrails v36
   Browser-only. Measures transferred-context outcomes against local-context evidence.
*/
(function(){
const VAL="crowspace-replacement-validation-v27",MEM="crowspace-contextual-bandit-memory-v33",KEY="crowspace-transfer-guardrails-v36",HIST="crowspace-transfer-guardrail-history-v36",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function decay(t){return Math.pow(.5,Math.max(0,(Date.now()-N(t))/DAY)/30)}
function outcome(t){const e=N(t.effect),s=t.positive?1:t.negative?-1:0;return .7*s+.3*Math.max(-1,Math.min(1,e/100))}
function transferRows(original,target){
 const v=L(VAL,{})[original],tests=v?.tests||[],mem=L(MEM,{});return tests.map(t=>{const m=mem[t.experimentId]||{},from=m.context||{},same=from.series===target.series&&from.window===target.window&&from.momentum===target.momentum&&from.experimentType===target.experimentType;return{experimentId:t.experimentId,from,to:target,transferred:!same,effect:N(t.effect),positive:!!t.positive,negative:!!t.negative,at:t.completedAt,weight:decay(t.completedAt)}}).filter(x=>x.transferred)}
function localRows(original,target){
 const v=L(VAL,{})[original],tests=v?.tests||[],mem=L(MEM,{});return tests.map(t=>{const m=mem[t.experimentId]||{},c=m.context||{};const same=c.series===target.series&&c.window===target.window&&c.momentum===target.momentum&&c.experimentType===target.experimentType;return{experimentId:t.experimentId,effect:N(t.effect),positive:!!t.positive,negative:!!t.negative,at:t.completedAt,weight:decay(t.completedAt),local:same}}).filter(x=>x.local)}
function evaluate(original,target,transferEvidence=[]) {
 const tr=transferEvidence.length?transferEvidence:transferRows(original,target),lr=localRows(original,target);
 const calc=a=>{const w=a.reduce((n,x)=>n+x.weight,0)||1;return{reward:a.reduce((n,x)=>n+x.weight*outcome(x),0)/w,tests:a.length,positive:a.filter(x=>x.positive).length,negative:a.filter(x=>x.negative).length}};
 const t=calc(tr),l=calc(lr),delta=t.reward-l.reward,negativeTransfer=t.tests>=2&&delta<-.2,disable=negativeTransfer&&t.negative>=l.positive+1;
 return{version:36,originalKey:original,targetContext:target,transfer:t,local:l,delta:+delta.toFixed(3),status:disable?"DISABLED":negativeTransfer?"REDUCED":Math.abs(delta)<.1?"NEUTRAL":"SUPPORTED",negativeTransfer,disable,updatedAt:Date.now()};
}
function guard(original,target){
 const e=evaluate(original,target),st=L(KEY,{}),k=[original,target.series,target.window,target.momentum,target.experimentType].join("::"),old=st[k]||{attempts:0,negative:0,reductions:0};
 if(e.negativeTransfer)old.negative++;if(e.status==="REDUCED")old.reductions++;old.attempts++;old.last=e;old.updatedAt=Date.now();old.transferStrength=e.status==="DISABLED"?0:e.status==="REDUCED"?.5:1;st[k]={key:k,originalKey:original,targetContext:target,...old};S(KEY,st);return st[k]
}
function strength(original,target){const k=[original,target.series,target.window,target.momentum,target.experimentType].join("::"),x=L(KEY,{})[k];return x?.transferStrength??1}
function canTransfer(original,target){return strength(original,target)>.05}
function state(){return L(KEY,{})}
window.CrowSpaceTransferGuardrailsV36={evaluate,guard,strength,canTransfer,state};
setTimeout(()=>{S(HIST,[{at:Date.now(),state:L(KEY,{})},...L(HIST,[])].slice(0,100))},17000);
setInterval(()=>{S(HIST,[{at:Date.now(),state:L(KEY,{})},...L(HIST,[])].slice(0,100))},30000);
})();