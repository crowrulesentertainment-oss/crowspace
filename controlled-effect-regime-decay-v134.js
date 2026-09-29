/* CrowSpace — Controlled Effect Regime Decay v134
   Browser-only. Measures whether a persistent post-change effect loses strength
   over subsequent windows. Descriptive evidence only.
*/
(function(){
const SRC='crowspace-controlled-effect-regime-v130',PER='crowspace-controlled-effect-regime-persistence-v133',KEY='crowspace-controlled-effect-regime-decay-v134',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN=3,DECAY=.02;
function state(){return L(KEY,{})}
function sync(){
 const src=L(SRC,{}),per=L(PER,{}),st=state();
 Object.values(src).forEach(x=>{
  const p=per[x.reason]; if(!p)return;
  const rows=x.rows||[],point=N(x.changePointIndex),effects=point>0?rows.slice(point).map(r=>N(r.effect)):[];
  const n=effects.length,first=effects[0]||0,last=effects[n-1]||0;
  const magnitudeDrop=Math.abs(first)-Math.abs(last),rate=n>1?magnitudeDrop/(n-1):0;
  const decay=n>=MIN&&magnitudeDrop>=DECAY&&last*first>=0;
  const accelerating=n>=4&&rate>=DECAY;
  st[x.reason]={reason:x.reason,windows:n,firstEffect:first,lastEffect:last,magnitudeDrop,decayRate:rate,decay,accelerating,status:n<MIN?'COLLECTING':decay?(accelerating?'DECAYING':'MILD_DECAY'):'STABLE_MAGNITUDE',updatedAt:Date.now(),method:'POST_CHANGE_MAGNITUDE_DECAY'};
 });
 S(KEY,st);return st
}
function summary(reason){return state()[reason]||{status:'EMPTY'}}
function factor(reason){const x=summary(reason);return x.status==='DECAYING'?.8:x.status==='MILD_DECAY'?.9:1}
window.CrowSpaceControlledEffectRegimeDecayV134={state,sync,summary,factor};
setTimeout(sync,221000);setInterval(sync,30000);
})();
