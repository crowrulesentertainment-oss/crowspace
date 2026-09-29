/* CrowSpace — Challenge Threshold Validation v58
   Browser-only. Validates adaptive thresholds against realized challenge outcomes.
*/
(function(){
const TH="crowspace-challenge-thresholds-v57",LIFE="crowspace-challenge-lifecycle-v49",ATTR="crowspace-challenge-attribution-v44",KEY="crowspace-challenge-threshold-validation-v58",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const th=L(TH,{}),life=L(LIFE,{}),attr=L(ATTR,{}),st=state();
 Object.values(life).forEach(x=>{
  if(!["ROTATE","RETAIN"].includes(x.status))return;
  const r=attr[x.key];if(!r?.last)return;
  const reason=x.reason||"UNKNOWN",t=th[reason];if(!t)return;
  const old=st[reason]||{tests:0,triggered:0,positive:0,negative:0,effects:[]};
  if(old.lastExperiment===x.key)return;
  const effect=N(r.last.effect),positive=r.last.positive?1:0,negative=r.last.negative?1:0;
  old.tests++;old.triggered++;old.positive+=positive;old.negative+=negative;old.effects=[effect,...old.effects].slice(0,30);
  old.avgEffect=old.effects.reduce((a,b)=>a+b,0)/old.effects.length;
  old.successRate=old.tests?old.positive/old.tests:0;
  old.thresholdQuality=+(old.successRate*.6+Math.max(-1,Math.min(1,old.avgEffect/100))*.4).toFixed(3);
  old.status=old.tests<3?"COLLECTING":old.thresholdQuality>=.35?"VALIDATED":old.thresholdQuality<=-.2?"REJECTED":"UNCERTAIN";
  old.lastExperiment=x.key;old.updatedAt=Date.now();st[reason]=old;
 });
 S(KEY,st);return st
}
function quality(reason){return state()[reason]?.thresholdQuality||0}
function canTrust(reason){const x=state()[reason];return !!x&&x.status==="VALIDATED"&&x.tests>=3}
function best(){return Object.entries(state()).sort((a,b)=>(b[1].thresholdQuality||0)-(a[1].thresholdQuality||0)).map(([reason,x])=>({...x,reason}))}
window.CrowSpaceChallengeThresholdValidationV58={sync,state,quality,canTrust,best};
setTimeout(sync,59000);setInterval(sync,30000);
})();