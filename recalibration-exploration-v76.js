/* CrowSpace — Recalibration Strategy Exploration v76
   Browser-only. Prevents premature lock-in by deliberately testing alternate recovery modes.
*/
(function(){
const STR="crowspace-recalibration-strategy-v75",OUT="crowspace-threshold-recalibration-outcomes-v74",KEY="crowspace-recalibration-exploration-v76",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MODES=["RESET_AND_COLLECT","CONSERVATIVE_RECALIBRATION"];
function state(){return L(KEY,{})}
function sync(){
 const src=L(STR,{}),out=L(OUT,{}),st=state();
 Object.values(src).forEach(x=>{
  const old=st[x.reason]||{tests:0,explorations:0,modeTests:{},modeSuccess:{}},selected=x.selected||MODES[1];
  const alternatives=MODES.filter(m=>m!==selected),tested=Object.keys(old.modeTests);
  const underExplored=alternatives.filter(m=>N(old.modeTests[m])<2);
  const explore=underExplored[0]||null;
  const outcome=out[x.reason];
  if(outcome&&outcome.lastMode){
   const m=outcome.lastMode;old.modeTests[m]=N(old.modeTests[m])+1;
   if(outcome.status==="RECOVERED")old.modeSuccess[m]=N(old.modeSuccess[m])+1;
  }
  old.reason=x.reason;old.selected=selected;old.explore=explore;old.explorationNeeded=!!explore;
  old.tests=Object.values(old.modeTests).reduce((a,b)=>a+N(b),0);old.explorations=N(old.explorations)+(explore?1:0);
  old.status=explore?"EXPLORE":"EXPLOIT";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function mode(reason){const x=state()[reason];return x?.explore||x?.selected||"CONSERVATIVE_RECALIBRATION"}
function shouldExplore(reason){return !!state()[reason]?.explorationNeeded}
function best(){return Object.values(state()).sort((a,b)=>(Number(b.explorations)||0)-(Number(a.explorations)||0))}
window.CrowSpaceRecalibrationExplorationV76={sync,state,mode,shouldExplore,best};
setTimeout(sync,95000);setInterval(sync,30000);
})();