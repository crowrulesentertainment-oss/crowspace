/* CrowSpace — Champion Challenge Outcome Learning v50
   Browser-only. Learns which risk signals produce useful challenges and tunes future priority.
*/
(function(){
const LIFE="crowspace-challenge-lifecycle-v49",ATTR="crowspace-challenge-attribution-v44",KEY="crowspace-challenge-learning-v50",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const life=L(LIFE,{}),attr=L(ATTR,{}),st=state(),now=Date.now();
 Object.values(life).forEach(x=>{
  if(!["ROTATE","RETAIN"].includes(x.status))return;
  const r=attr[x.key];if(!r||!r.last)return;
  const k=x.reason||"UNKNOWN",old=st[k]||{tests:0,positive:0,negative:0,neutral:0,effects:[],prioritySum:0};
  if(old.lastExperiment===x.key)return;
  const positive=r.last.positive?1:0,negative=r.last.negative?1:0,neutral=positive||negative?0:1,effect=N(r.last.effect);
  old.tests++;old.positive+=positive;old.negative+=negative;old.neutral+=neutral;old.effects=[effect,...old.effects].slice(0,30);old.prioritySum+=N(x.priority);
  old.avgEffect=old.effects.reduce((a,b)=>a+b,0)/old.effects.length;
  old.successRate=old.tests?(old.positive/old.tests):0;
  old.priorityAvg=old.prioritySum/old.tests;
  old.learnedValue=+(old.successRate*.6+Math.max(-1,Math.min(1,old.avgEffect/100))*.4).toFixed(3);
  old.lastExperiment=x.key;old.updatedAt=now;st[k]=old;
 });
 S(KEY,st);return st
}
function value(reason){return state()[reason]?.learnedValue||0}
function boost(reason){const x=state()[reason];return x?Math.round(x.learnedValue*15):0}
function best(){return Object.entries(state()).sort((a,b)=>(b[1].learnedValue||0)-(a[1].learnedValue||0)).map(([reason,x])=>({...x,reason}))}
window.CrowSpaceChallengeLearningV50={sync,state,value,boost,best};
setTimeout(sync,43000);setInterval(sync,30000);
})();