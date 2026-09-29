/* CrowSpace — Transfer Rollout & Rollback Engine v39
   Browser-only. Gradually expands validated transfers and automatically rolls them back when fresh evidence deteriorates.
*/
(function(){
const VAL="crowspace-transfer-validation-v38",KEY="crowspace-transfer-rollout-v39",HIST="crowspace-transfer-rollout-history-v39",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function decay(t){return Math.pow(.5,Math.max(0,(Date.now()-N(t))/DAY)/30)}
function sync(){
 const v=L(VAL,{}),st=state();
 Object.values(v).forEach(x=>{
  if(x.status!=="TRANSFER_VALIDATED")return;
  const k=x.key,old=st[k]||{key:k,originalKey:x.originalKey,targetContext:x.targetContext,level:0,history:[]};
  const recent=(x.tests||[]).slice(-5),w=recent.map(t=>decay(t.at)),sw=w.reduce((a,b)=>a+b,0)||1;
  const effect=recent.reduce((a,t,i)=>a+t.effect*w[i],0)/sw,negative=recent.filter(t=>t.negative).length;
  if(negative>=1||effect<-5)old.level=Math.max(0,old.level-1);
  else if((x.confidence||0)>=80&&recent.length>=3)old.level=Math.min(3,old.level+1);
  old.rollout=old.level===3?1:old.level===2?.75:old.level===1?.25:0;
  old.status=old.level===0?"HOLD":old.level===1?"CANARY":old.level===2?"EXPANDING":"FULL";
  old.confidence=x.confidence||0;old.effect=+effect.toFixed(2);old.updatedAt=Date.now();
  old.history=[{at:Date.now(),level:old.level,rollout:old.rollout,effect:old.effect,confidence:old.confidence},...(old.history||[])].slice(0,30);
  st[k]=old;
 });
 S(KEY,st);return st
}
function canUse(k){const x=state()[k];return !!x&&x.status!=="HOLD"&&x.rollout>0}
function allocation(k){return state()[k]?.rollout||0}
function best(){return Object.values(state()).sort((a,b)=>(b.rollout||0)-(a.rollout||0)||(b.confidence||0)-(a.confidence||0))}
window.CrowSpaceTransferRolloutV39={sync,state,canUse,allocation,best};
setTimeout(sync,20500);setInterval(sync,30000);
})();