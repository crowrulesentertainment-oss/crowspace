/* CrowSpace — Challenge Policy Governance v55
   Browser-only. Adds recency decay, minimum evidence, confidence and rollback protection to policy learning.
*/
(function(){
const LEARN="crowspace-challenge-policy-learning-v54",KEY="crowspace-challenge-policy-governance-v55",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function decay(t){return Math.pow(.5,Math.max(0,(Date.now()-N(t))/DAY)/30)}
function state(){return L(KEY,{})}
function sync(){
 const src=L(LEARN,{}),st=state();
 Object.entries(src).forEach(([reason,x])=>{
  const tests=N(x.tests),recency=decay(x.updatedAt),evidence=Math.min(1,tests/6),consistency=tests?Math.abs(N(x.positive)-N(x.negative))/tests:0,raw=N(x.policyValue),confidence=Math.min(1,evidence*.5+recency*.25+consistency*.25);
  const rollback=x.policyStatus==="UNDERPERFORMING"||N(x.negative)>N(x.positive)*2;
  const influence=rollback?0:raw*confidence;
  st[reason]={reason,tests,rawValue:raw,confidence:+confidence.toFixed(2),recency:+recency.toFixed(2),evidence:+evidence.toFixed(2),consistency:+consistency.toFixed(2),rollback,influence:+influence.toFixed(3),status:rollback?"ROLLBACK":tests<2?"COLLECTING":confidence>=.7?"TRUSTED":"CAUTIOUS",updatedAt:Date.now()};
 });
 S(KEY,st);return st
}
function influence(reason){return state()[reason]?.influence||0}
function canUse(reason){const x=state()[reason];return !!x&&!x.rollback&&x.tests>=2&&x.confidence>=.35}
function best(){return Object.values(state()).sort((a,b)=>(b.influence||0)-(a.influence||0))}
window.CrowSpaceChallengeGovernanceV55={sync,state,influence,canUse,best};
setTimeout(sync,53000);setInterval(sync,30000);
})();