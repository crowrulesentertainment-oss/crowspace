/* CrowSpace — Challenge Policy Threshold Optimizer v57
   Browser-only. Learns conservative thresholds for when a policy should prioritize, normalize, or suppress challenges.
*/
(function(){
const CAL="crowspace-challenge-calibration-v52",LEARN="crowspace-challenge-policy-learning-v54",CORR="crowspace-challenge-self-correction-v56",KEY="crowspace-challenge-thresholds-v57",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const cal=L(CAL,{}),learn=L(LEARN,{}),corr=L(CORR,{}),st=state();
 Object.keys(cal).forEach(reason=>{
  const c=cal[reason],l=learn[reason]||{},q=corr[reason]||{},tests=N(l.tests),success=N(l.successRate),effect=N(l.avgEffect),factor=N(q.factor)||1;
  const baseUp=.35,baseDown=-.25;
  const evidence=Math.min(1,tests/8);
  const adjustment=tests>=4?(success>=.7?.05:success<=.3?-.05:0):0;
  const up=+(baseUp+adjustment).toFixed(2),down=+(baseDown-adjustment).toFixed(2);
  const status=tests<2?"LEARNING":Math.abs(effect)<5?"STABLE":success>=.7?"ADAPTIVE_UP":success<=.3?"ADAPTIVE_DOWN":"STABLE";
  st[reason]={reason,tests,evidence,successRate:success,avgEffect:effect,correctionFactor:factor,prioritizeAt:up,suppressAt:down,status,updatedAt:Date.now()};
 });
 S(KEY,st);return st
}
function thresholds(reason){return state()[reason]||null}
function best(){return Object.values(state()).sort((a,b)=>(b.evidence||0)-(a.evidence||0))}
window.CrowSpaceChallengeThresholdsV57={sync,state,thresholds,best};
setTimeout(sync,57000);setInterval(sync,30000);
})();