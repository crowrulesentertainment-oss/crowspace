/* CrowSpace — Champion Confidence Trend & Forecast v47
   Browser-only. Tracks confidence direction, survival trajectory, and projected durability.
*/
(function(){
const CONF="crowspace-champion-confidence-v46",ATTR="crowspace-challenge-attribution-v44",KEY="crowspace-champion-forecast-v47",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const c=L(CONF,{}),a=L(ATTR,{}),st=state(),now=Date.now();
 Object.values(c).forEach(x=>{
  const k=x.key,old=st[k]||{history:[]},prev=old.confidence||x.confidence,next=N(x.confidence),delta=next-prev;
  const direction=delta>3?"RISING":delta<-3?"FALLING":"STABLE";
  const survival=N(x.survival),forecast=Math.max(0,Math.min(100,Math.round(next+delta*4+((survival-50)*.15))));
  old.key=k;old.originalKey=x.originalKey;old.champion=x.champion;old.confidence=next;old.survival=survival;old.delta=delta;old.direction=direction;old.forecast=forecast;
  old.challengeCount=N(x.total);old.lastChallengeAt=a[k]?.last?.at||old.lastChallengeAt||null;
  old.history=[{at:now,confidence:next,survival,delta,forecast},...(old.history||[])].slice(0,30);
  old.status=forecast>=80?"DURABLE":forecast>=60?"STABLE":forecast>=40?"WATCH":"AT RISK";
  old.updatedAt=now;st[k]=old;
 });
 S(KEY,st);return st
}
function get(k){return state()[k]||null}
function needsChallenge(k){const x=get(k);return !!x&&x.status!=="DURABLE"&&(x.direction==="FALLING"||x.forecast<60)}
function best(){return Object.values(state()).sort((a,b)=>(b.forecast||0)-(a.forecast||0))}
window.CrowSpaceChampionForecastV47={sync,state,get,needsChallenge,best};
setTimeout(sync,37000);setInterval(sync,30000);
})();