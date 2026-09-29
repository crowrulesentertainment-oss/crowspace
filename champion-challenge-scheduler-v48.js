/* CrowSpace — Adaptive Champion Challenge Scheduling v48
   Browser-only. Prioritizes challenges using forecast risk, confidence, survival and recency.
*/
(function(){
const FORE="crowspace-champion-forecast-v47",CH="crowspace-champion-challenges-v42",EXP="crowspace-action-experiments-v1",KEY="crowspace-challenge-scheduler-v48",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MAX=3,COOLDOWN=7*DAY;
function state(){return L(KEY,{})}
function score(x){
 const risk=x.status==="AT RISK"?40:x.status==="WATCH"?25:x.status==="STABLE"?10:0;
 const fall=x.direction==="FALLING"?25:x.direction==="RISING"?0:8;
 const low=Math.max(0,60-N(x.forecast))*.35;
 const survival=Math.max(0,50-N(x.survival))*.25;
 const age=Math.min(15,Math.max(0,(Date.now()-N(x.lastChallengeAt))/DAY/7));
 const reason=x.reason||"UNKNOWN",cal=window.CrowSpaceChallengeCalibrationV52?.value?.(reason);\n const learned=cal!==undefined?Math.round(cal*10):(window.CrowSpaceChallengeGuardrailsV51?.boost?.(reason)??(window.CrowSpaceChallengeLearningV50?.boost?.(reason)||0));
 return Math.round(risk+fall+low+survival+age+learned);
}
function candidates(){
 const f=L(FORE,{}),ch=L(CH,{}),exp=L(EXP,{}),out=[];
 Object.values(f).forEach(x=>{
  if(!x.key||!x.originalKey)return;
  const existing=ch[x.key],series=x.targetContext?.series;
  if(!series||existing?.status==="SCHEDULED"||existing?.status==="TESTING")return;
  if(Object.values(exp[series]||{}).some(e=>e.status==="active"&&!e.completedAt))return;
  if(!x.needsChallenge&&x.status==="DURABLE")return;
  out.push({...x,priority:score(x)});
 });
 return out.sort((a,b)=>b.priority-a.priority);
}
function schedule(){
 const st=state(),ch=L(CH,{}),now=Date.now(),made=[];
 for(const x of candidates().slice(0,MAX)){
  const old=st[x.key];if(old?.lastScheduledAt&&now-N(old.lastScheduledAt)<COOLDOWN)continue;
  ch[x.key]={key:x.key,version:42,status:"SCHEDULED",originalKey:x.originalKey,targetContext:x.targetContext,incumbent:x.champion||"UNDECIDED",createdAt:now,attempts:N(old?.attempts),adaptiveV48:true,priority:x.priority,reason:x.status,forecast:x.forecast,direction:x.direction};
  st[x.key]={key:x.key,version:48,status:"SCHEDULED",priority:x.priority,reason:x.status,forecast:x.forecast,direction:x.direction,lastScheduledAt:now,updatedAt:now};
  made.push(st[x.key]);
 }
 S(CH,ch);S(KEY,st);return made
}
function best(){return candidates()}
window.CrowSpaceChampionSchedulerV48={schedule,candidates,best,state};
setTimeout(schedule,39000);setInterval(schedule,30000);
})();