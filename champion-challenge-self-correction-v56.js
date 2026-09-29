/* CrowSpace — Challenge Policy Self-Correction v56
   Browser-only. Learns when governance decisions were too aggressive or too conservative.
*/
(function(){
const GOV="crowspace-challenge-policy-governance-v55",LEARN="crowspace-challenge-policy-learning-v54",KEY="crowspace-challenge-self-correction-v56",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const g=L(GOV,{}),l=L(LEARN,{}),st=state();
 Object.entries(g).forEach(([reason,x])=>{
  const old=st[reason]||{checks:0,rollbackCount:0,overridden:0};
  const source=l[reason]||{},tests=N(source.tests),neg=N(source.negative),pos=N(source.positive);
  const contradiction=pos>0&&neg>0,unstable=tests>=3&&Math.abs(pos-neg)<=1;
  const correction=contradiction||unstable?"CAUTIOUS":x.rollback?"RECOVER":"NORMAL";
  const factor=correction==="RECOVER"?1.25:correction==="CAUTIOUS"?.5:1;
  old.checks++;old.rollbackCount+=x.rollback?1:0;old.factor=factor;old.mode=correction;old.confidence=N(x.confidence);old.updatedAt=Date.now();st[reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){return state()[reason]?.factor||1}
function mode(reason){return state()[reason]?.mode||"NORMAL"}
function best(){return Object.entries(state()).sort((a,b)=>(b[1].factor||0)-(a[1].factor||0)).map(([reason,x])=>({...x,reason}))}
window.CrowSpaceChallengeSelfCorrectionV56={sync,state,factor,mode,best};
setTimeout(sync,55000);setInterval(sync,30000);
})();