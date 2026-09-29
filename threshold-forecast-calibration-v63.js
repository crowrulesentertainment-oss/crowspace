/* CrowSpace — Threshold Forecast Calibration v63
   Browser-only. Compares forecasted allocation movement with realized movement and calibrates forecast reliability.
*/
(function(){
const FORE="crowspace-threshold-rebalance-forecast-v62",MEM="crowspace-threshold-rebalance-memory-v61",KEY="crowspace-threshold-forecast-calibration-v63",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const f=L(FORE,{}),m=L(MEM,{}),st=state(),now=Date.now();
 Object.values(f).forEach(x=>{
  const hist=(m[x.reason]?.history||[]),actual=hist.length>=2?N(hist[0].allocation)-N(hist[1].allocation):0,pred=N(x.projected)-N(x.current),error=Math.abs(pred-actual),old=st[x.reason]||{tests:0,errors:[]};
  if(hist.length>=2){
   old.tests++;old.errors=[error,...old.errors].slice(0,20);
   old.avgError=old.errors.reduce((a,b)=>a+b,0)/old.errors.length;
   old.accuracy=Math.max(0,Math.min(1,1-old.avgError));
  }
  old.reason=x.reason;old.actualDelta=actual;old.predictedDelta=pred;old.error=error;old.updatedAt=now;
  old.status=old.tests<3?"COLLECTING":old.accuracy>=.8?"CALIBRATED":old.accuracy>=.5?"PARTIAL":"POOR";
  st[x.reason]=old;
 });
 S(KEY,st);return st
}
function accuracy(reason){return state()[reason]?.accuracy||0}
function status(reason){return state()[reason]?.status||"COLLECTING"}
function best(){return Object.values(state()).sort((a,b)=>(b.accuracy||0)-(a.accuracy||0))}
window.CrowSpaceThresholdCalibrationV63={sync,state,accuracy,status,best};
setTimeout(sync,69000);setInterval(sync,30000);
})();