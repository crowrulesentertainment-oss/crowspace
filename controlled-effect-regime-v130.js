/* CrowSpace — Controlled Effect Regime Segmentation v130
   Browser-only. Segments ordered holdout evidence into pre/post-change regimes.
   Descriptive evidence only; no causal conclusion is implied.
*/
(function(){
const SRC='crowspace-controlled-effect-change-point-v129',KEY='crowspace-controlled-effect-regime-v130',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN=2;
function state(){return L(KEY,{})}
function sync(){
 const src=L(SRC,{}),st=state();
 Object.values(src).forEach(x=>{
  const rows=x.rows||[]; const point=N(x.changePointIndex);
  if(!rows.length){st[x.reason]={reason:x.reason,status:x.status||'COLLECTING',updatedAt:Date.now()};return}
  const effects=rows.map(r=>N(r.effect)),cut=point>0&&point<effects.length?point:null;
  const groups=cut?[effects.slice(0,cut),effects.slice(cut)]:[effects];
  const avg=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
  const pre=groups[0],post=cut?groups[1]:[];
  st[x.reason]={reason:x.reason,changeDetected:!!cut,changePointIndex:cut,preWindows:pre.length,postWindows:post.length,preEffect:avg(pre),postEffect:cut?avg(post):null,preStatus:pre.length>=MIN?'READY':'COLLECTING',postStatus:cut?(post.length>=MIN?'READY':'COLLECTING'):'NOT_APPLICABLE',status:cut&&pre.length>=MIN&&post.length>=MIN?'SEGMENTED':'COLLECTING',updatedAt:Date.now(),method:'CHANGE_POINT_REGIME_SEGMENTATION'};
 });
 S(KEY,st);return st
}
function summary(reason){return state()[reason]||{status:'EMPTY'}}
window.CrowSpaceControlledEffectRegimeV130={state,sync,summary};
setTimeout(sync,209000);setInterval(sync,30000);
})();
