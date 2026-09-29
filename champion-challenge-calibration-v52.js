/* CrowSpace — Champion Challenge Learning Calibration v52
   Browser-only. Separates signal quality from raw success and detects contradictory outcomes.
*/
(function(){
const GUARD="crowspace-challenge-guardrails-v51",KEY="crowspace-challenge-calibration-v52",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(GUARD,{}),st=state();
 Object.entries(src).forEach(([reason,x])=>{
  const tests=N(x.tests),raw=N(x.rawValue),confidence=N(x.confidence),signal=Math.max(-1,Math.min(1,raw));
  const contradiction=signal>0&&N(x.boost)<0||signal<0&&N(x.boost)>0;
  const reliability=Math.min(1,confidence)*(contradiction?.5:1);
  const calibrated=+(signal*reliability).toFixed(3);
  const status=tests<2?"COLLECTING":contradiction?"CONTRADICTED":Math.abs(calibrated)<.1?"NEUTRAL":calibrated>0?"SUPPORTIVE":"CAUTIOUS";
  st[reason]={reason,tests,rawValue:raw,confidence,reliability:+reliability.toFixed(2),calibratedValue:calibrated,contradiction,status,updatedAt:Date.now()};
 });
 S(KEY,st);return st
}
function value(reason){return state()[reason]?.calibratedValue||0}
function best(){return Object.values(state()).sort((a,b)=>(b.calibratedValue||0)-(a.calibratedValue||0))}
window.CrowSpaceChallengeCalibrationV52={sync,state,value,best};
setTimeout(sync,47000);setInterval(sync,30000);
})();