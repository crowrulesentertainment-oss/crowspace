/* CrowSpace — Champion Challenge Lifecycle v49
   Browser-only. Connects adaptive scheduling to execution and durable challenge states.
*/
(function(){
const SCH="crowspace-champion-scheduler-v48",CH="crowspace-champion-challenges-v42",EXEC="crowspace-challenge-execution-v43",KEY="crowspace-challenge-lifecycle-v49",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const sch=L(SCH,{}),ch=L(CH,{}),ex=L(EXEC,{}),st=state(),now=Date.now();
 Object.values(sch).forEach(x=>{
  const k=x.key,old=st[k]||{key:k,history:[]},c=ch[k],e=ex[k];
  old.key=k;old.originalKey=x.originalKey;old.priority=N(x.priority);old.reason=x.reason;old.forecast=N(x.forecast);old.direction=x.direction;
  old.challengeStatus=c?.status||old.challengeStatus||"PENDING";
  old.executionStatus=e?.status||old.executionStatus||"NOT_STARTED";
  old.experimentId=e?.experimentId||old.experimentId||null;
  const status=e?.status==="TESTING"?"TESTING":c?.status==="SCHEDULED"?"SCHEDULED":c?.status==="RETEST"?"RETEST":c?.status==="ROTATE"?"ROTATE":c?.status==="RETAIN"?"RETAIN":old.executionStatus==="NOT_STARTED"?"QUEUED":"PENDING";
  old.status=status;old.updatedAt=now;
  old.history=[{at:now,status,priority:old.priority,forecast:old.forecast},...(old.history||[])].slice(0,40);
  st[k]=old;
 });
 S(KEY,st);return st
}
function get(k){return state()[k]||null}
function active(){return Object.values(state()).filter(x=>["QUEUED","SCHEDULED","TESTING","RETEST"].includes(x.status))}
function completed(){return Object.values(state()).filter(x=>["ROTATE","RETAIN"].includes(x.status))}
window.CrowSpaceChallengeLifecycleV49={sync,state,get,active,completed};
setTimeout(sync,41000);setInterval(sync,30000);
})();