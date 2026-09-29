/* CrowSpace — Controlled Effect Regime Trajectory Confidence History v140
   Browser-only. Preserves bounded snapshots of trajectory data-quality scores so
   Creator Studio can observe whether evidence quality is improving, stable, or degrading.
   This is descriptive data quality, not causal confidence.
*/
(function(){
const SRC='crowspace-controlled-effect-regime-trajectory-confidence-v139',KEY='crowspace-controlled-effect-regime-trajectory-confidence-history-v140',MAX=30,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const src=L(SRC,{}),st=state(),now=Date.now();
 Object.values(src).forEach(x=>{
  const old=st[x.reason]||{history:[]}, marker=String(x.score)+':'+String(x.historyLength)+':'+String(x.updatedAt||0);
  if(old.lastMarker!==marker){
   old.history=[{at:now,score:Number(x.score)||0,band:x.band||'LOW',completeness:Number(x.completeness)||0,consistency:Number(x.consistency)||0,evidenceQuality:Number(x.evidenceQuality)||0},...(old.history||[])].slice(0,MAX);
   old.lastMarker=marker;
  }
  const h=old.history||[], first=h[h.length-1]?.score ?? 0,last=h[0]?.score ?? 0,delta=last-first;
  old.reason=x.reason;old.currentScore=last;old.currentBand=x.band||old.currentBand||'LOW';old.samples=h.length;old.delta=delta;
  old.trend=h.length<2?'COLLECTING':delta>=5?'IMPROVING':delta<=-5?'DEGRADING':'STABLE';old.updatedAt=now;st[x.reason]=old;
 });
 S(KEY,st);return st
}
function summary(reason){return state()[reason]||{trend:'EMPTY',samples:0}}
window.CrowSpaceControlledEffectRegimeTrajectoryConfidenceHistoryV140={state,sync,summary};
setTimeout(sync,239000);setInterval(sync,30000);
})();