/* CrowSpace — Threshold Decision Confidence v70
   Browser-only. Combines evidence quality, contextual trust, arbitration stability and recovery
   into one conservative confidence gate for threshold allocation.
*/
(function(){
const REB="crowspace-challenge-threshold-rebalance-v60",GUARD="crowspace-threshold-context-guardrails-v65",STAB="crowspace-threshold-arbitration-stability-v68",REC="crowspace-threshold-arbitration-recovery-v69",KEY="crowspace-threshold-decision-confidence-v70",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const reb=L(REB,{}),guard=L(GUARD,{}),stab=L(STAB,{}),rec=L(REC,{}),st=state();
 Object.values(reb).forEach(x=>{
  const ctx=Object.values(guard).find(g=>g.reason===x.reason),s=stab[x.reason]||{},r=rec[x.reason]||{};
  const evidence=Math.min(1,N(x.tests)/6),quality=Math.max(0,Math.min(1,(N(x.quality)+1)/2)),context=ctx?.status==="TRUSTED"?N(ctx.confidence):0,stability=N(s.stability)||0,recovery=N(r.factor)||1;
  const confidence=quality*.3+evidence*.2+context*.2+stability*.2+Math.min(1,recovery)*.1;
  const gate=confidence>=.7?1:confidence>=.5?.75:confidence>=.3?.5:.25;
  st[x.reason]={reason:x.reason,confidence:+confidence.toFixed(3),gate,quality,evidence,context:+context.toFixed(3),stability:+stability.toFixed(3),recovery, status:confidence>=.7?"HIGH":confidence>=.5?"MEDIUM":confidence>=.3?"LOW":"INSUFFICIENT",updatedAt:Date.now()};
 });
 S(KEY,st);return st
}
function gate(reason){return state()[reason]?.gate||.25}
function confidence(reason){return state()[reason]?.confidence||0}
function best(){return Object.values(state()).sort((a,b)=>(b.confidence||0)-(a.confidence||0))}
window.CrowSpaceThresholdDecisionConfidenceV70={sync,state,gate,confidence,best};
setTimeout(sync,83000);setInterval(sync,30000);
})();