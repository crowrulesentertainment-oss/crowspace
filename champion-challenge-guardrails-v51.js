/* CrowSpace — Champion Challenge Learning Guardrails v51
   Browser-only. Prevents learned scheduling signals from overfitting sparse outcomes.
*/
(function(){
const LEARN="crowspace-challenge-learning-v50",KEY="crowspace-challenge-guardrails-v51",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(LEARN,{}),st=state();
 Object.entries(src).forEach(([reason,x])=>{
  const tests=N(x.tests),raw=N(x.learnedValue),confidence=Math.min(1,tests/8),shrink=0.25+0.75*confidence,guarded=raw*shrink;
  const cap=Math.max(-10,Math.min(10,Math.round(guarded*15)));
  st[reason]={reason,tests,rawValue:raw,confidence:+confidence.toFixed(2),guardedValue:+guarded.toFixed(3),boost:cap,status:tests<2?"COLD_START":tests<5?"LEARNING":"ESTABLISHED",updatedAt:Date.now()};
 });
 S(KEY,st);return st
}
function boost(reason){return state()[reason]?.boost||0}
function confidence(reason){return state()[reason]?.confidence||0}
function best(){return Object.values(state()).sort((a,b)=>(b.guardedValue||0)-(a.guardedValue||0))}
window.CrowSpaceChallengeGuardrailsV51={sync,state,boost,confidence,best};
setTimeout(sync,45000);setInterval(sync,30000);
})();