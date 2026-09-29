/* CrowSpace — Threshold Context Guardrails v65
   Browser-only. Controls contextual threshold influence with evidence, contradiction and recency safeguards.
*/
(function(){
const CTX="crowspace-threshold-context-v64",KEY="crowspace-threshold-context-guardrails-v65",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(CTX,{}),st=state();
 Object.values(src).forEach(x=>{
  const tests=N(x.tests),signal=N(x.avgSignal),confidence=N(x.confidence),history=x.effects||[],positive=history.filter(v=>v>.1).length,negative=history.filter(v=>v<-.1).length,contradiction=positive>0&&negative>0;
  const recency=Math.min(1,tests/6),guard=contradiction?.5:1,influence=Math.max(-.05,Math.min(.05,signal*confidence*guard));
  const status=tests<3?"COLLECTING":contradiction?"CONTRADICTED":confidence<.5?"CAUTIOUS":Math.abs(influence)<.01?"NEUTRAL":"TRUSTED";
  st[x.reason+"::"+x.context]={...x,positive,negative,contradiction,recency,guard,influence:+influence.toFixed(3),status,updatedAt:Date.now()};
 });
 S(KEY,st);return st
}
function influence(reason,ctx){const x=state()[reason+"::"+ctx];return x?.status==="TRUSTED"?x.influence:0}
function best(){return Object.values(state()).sort((a,b)=>Math.abs(b.influence||0)-Math.abs(a.influence||0))}
window.CrowSpaceThresholdGuardrailsV65={sync,state,influence,best};
setTimeout(sync,73000);setInterval(sync,30000);
})();