/* CrowSpace — Threshold Arbitration Memory v67
   Browser-only. Records arbitration decisions and learns whether contextual adjustments improve allocation outcomes.
*/
(function(){
const ARB="crowspace-threshold-arbitration-v66",MEM="crowspace-threshold-rebalance-memory-v61",KEY="crowspace-threshold-arbitration-memory-v67",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const a=L(ARB,{}),m=L(MEM,{}),st=state();
 Object.values(a).forEach(x=>{
  const old=st[x.reason]||{tests:0,history:[]},hist=m[x.reason]?.history||[],realized=hist.length>=2?N(hist[0].allocation)-N(hist[1].allocation):0,arb=N(x.arbitration),aligned=Math.sign(arb)===Math.sign(realized)&&Math.abs(arb)>0&&Math.abs(realized)>0;
  if(hist.length>=2){
   old.tests++;old.aligned+=aligned?1:0;old.misaligned+=!aligned?1:0;
   old.history=[{at:Date.now(),arbitration:arb,realized,aligned},...(old.history||[])].slice(0,30);
  }
  old.reason=x.reason;old.arbitration=arb;old.realized=realized;old.alignmentRate=old.tests?old.aligned/old.tests:0;
  old.status=old.tests<3?"COLLECTING":old.alignmentRate>=.7?"ALIGNED":old.alignmentRate<=.3?"MISALIGNED":"MIXED";
  old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function alignment(reason){return state()[reason]?.alignmentRate||0}
function adjustment(reason){const x=state()[reason];if(!x||x.tests<3)return 0;return x.status==="ALIGNED"?Math.min(.04,N(x.arbitration)*.5):x.status==="MISALIGNED"?-Math.min(.04,Math.abs(N(x.arbitration))*.5):0}
function best(){return Object.values(state()).sort((a,b)=>(b.alignmentRate||0)-(a.alignmentRate||0))}
window.CrowSpaceThresholdArbitrationMemoryV67={sync,state,alignment,adjustment,best};
setTimeout(sync,77000);setInterval(sync,30000);
})();