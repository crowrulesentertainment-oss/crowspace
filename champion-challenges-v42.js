/* CrowSpace — Champion Challenge Orchestrator v42
   Browser-only. Converts scheduled rotation checks into explicit challenger trials.
*/
(function(){
const ROT="crowspace-transfer-rotation-v41",TE="crowspace-transfer-experiments-v37",KEY="crowspace-champion-challenges-v42",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function candidates(){
 const r=L(ROT,{}),t=L(TE,{}),out=[];
 Object.values(r).forEach(x=>{
  if(!x.key||!x.dueAt&&!Date.now()>=N(x.nextChallengeAt))return;
  if(!x.nextChallengeAt||Date.now()<N(x.nextChallengeAt))return;
  if(x.status==="HOLD")return;
  const base=t[x.key];
  if(base?.status==="CHALLENGE")return;
  out.push({key:x.key,originalKey:x.originalKey,targetContext:x.targetContext,incumbent:x.champion||"UNDECIDED",margin:N(x.margin),confidence:N(x.confidence)});
 });
 return out;
}
function plan(key){
 const c=candidates().find(x=>x.key===key),st=state();if(!c)return null;
 const old=st[key];if(old?.status==="SCHEDULED"||old?.status==="TESTING")return old;
 const p={key,version:42,status:"SCHEDULED",originalKey:c.originalKey,targetContext:c.targetContext,incumbent:c.incumbent,createdAt:Date.now(),attempts:N(old?.attempts)};
 st[key]=p;S(KEY,st);return p
}
function record(key,result){
 const st=state(),x=st[key];if(!x)return null;
 const effect=N(result?.effect),winner=effect>=10?"CHALLENGER":effect<=-10?"INCUMBENT":"TIE";
 x.attempts=N(x.attempts)+1;x.lastResult={effect,winner,at:Date.now()};x.status=winner==="CHALLENGER"?"ROTATE":winner==="INCUMBENT"?"RETAIN":"RETEST";x.updatedAt=Date.now();S(KEY,st);return x
}
function ready(){return candidates().map(x=>plan(x.key)).filter(Boolean)}
window.CrowSpaceChampionChallengesV42={candidates,plan,record,ready,state};
setTimeout(ready,26000);setInterval(ready,30000);
})();