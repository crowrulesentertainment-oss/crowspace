/* CrowSpace — Champion Challenge Policy Outcome Learning v54
   Browser-only. Measures whether policy decisions actually improve challenge outcomes.
*/
(function(){
const POLICY="crowspace-challenge-policy-v53",LIFE="crowspace-challenge-lifecycle-v49",ATTR="crowspace-challenge-attribution-v44",KEY="crowspace-challenge-policy-learning-v54",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const policies=L(POLICY,{}),life=L(LIFE,{}),attr=L(ATTR,{}),st=state();
 Object.values(life).forEach(x=>{
  if(!["ROTATE","RETAIN"].includes(x.status))return;
  const r=attr[x.key];if(!r?.last)return;
  const reason=x.reason||"UNKNOWN",p=policies[reason];if(!p)return;
  const old=st[reason]||{tests:0,positive:0,negative:0,neutral:0,effects:[],actions:{}};
  if(old.lastExperiment===x.key)return;
  const positive=r.last.positive?1:0,negative=r.last.negative?1:0,effect=N(r.last.effect);
  old.tests++;old.positive+=positive;old.negative+=negative;old.neutral+=positive||negative?0:1;
  old.effects=[effect,...old.effects].slice(0,30);
  old.actions[p.action]=(old.actions[p.action]||0)+1;
  old.avgEffect=old.effects.reduce((a,b)=>a+b,0)/old.effects.length;
  old.successRate=old.tests?old.positive/old.tests:0;
  old.policyValue=+(old.successRate*.65+Math.max(-1,Math.min(1,old.avgEffect/100))*.35).toFixed(3);
  old.policyStatus=old.tests<3?"LEARNING":old.negative>old.positive?"UNDERPERFORMING":old.successRate>=.6?"EFFECTIVE":"NEUTRAL";
  old.policyAction=p.action;old.lastExperiment=x.key;old.updatedAt=Date.now();st[reason]=old;
 });
 S(KEY,st);return st
}
function value(reason){return state()[reason]?.policyValue||0}
function status(reason){return state()[reason]?.policyStatus||"UNMEASURED"}
function best(){return Object.entries(state()).sort((a,b)=>(b[1].policyValue||0)-(a[1].policyValue||0)).map(([reason,x])=>({...x,reason}))}
window.CrowSpaceChallengePolicyLearningV54={sync,state,value,status,best};
setTimeout(sync,51000);setInterval(sync,30000);
})();