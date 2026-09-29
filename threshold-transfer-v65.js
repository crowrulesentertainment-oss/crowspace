/* CrowSpace — Threshold Context Transfer v65
   Browser-only. Transfers reliable threshold evidence to similar contexts with conservative similarity weighting.
*/
(function(){
const CTX="crowspace-threshold-context-v64",KEY="crowspace-threshold-transfer-v65",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function similarity(a,b){
 let s=0;if(a.reason===b.reason)s+=.25;if(a.risk===b.risk)s+=.25;if(a.direction===b.direction)s+=.25;if(a.momentum===b.momentum)s+=.25;return s
}
function transfer(reason,target){
 const rows=Object.values(L(CTX,{})).filter(x=>x.reason===reason&&x.context);
 const ranked=rows.map(x=>({x,similarity:similarity(x,target)})).filter(z=>z.similarity>=.5).sort((a,b)=>b.similarity-a.similarity).slice(0,6);
 if(!ranked.length)return{signal:0,confidence:0,sources:[]};
 const total=ranked.reduce((a,z)=>a+z.similarity,0)||1,signal=ranked.reduce((a,z)=>a+N(z.x.avgSignal)*z.similarity,0)/total,evidence=ranked.reduce((a,z)=>a+N(z.x.tests)*z.similarity,0)/total,confidence=Math.min(1,evidence/5)*Math.min(1,ranked[0].similarity);
 return{signal:+signal.toFixed(3),confidence:+confidence.toFixed(3),sources:ranked.map(z=>({context:z.x.context,similarity:z.similarity,tests:z.x.tests}))}
}
function sync(){
 const src=L(CTX,{}),st=state();
 Object.values(src).forEach(x=>{if(!x.context)return;const k=[x.reason,x.context].join("::"),t=transfer(x.reason,x);st[k]={key:k,reason:x.reason,context:x.context,...t,updatedAt:Date.now()};});
 S(KEY,st);return st
}
function signal(reason,target){const k=[reason,target.context||"",""].join("::");const exact=state()[k];if(exact)return exact.signal;return transfer(reason,target).signal}
function confidence(reason,target){return transfer(reason,target).confidence}
function best(){return Object.values(state()).sort((a,b)=>(b.confidence||0)-(a.confidence||0))}
window.CrowSpaceThresholdTransferV65={sync,state,similarity,transfer,signal,confidence,best};
setTimeout(sync,73000);setInterval(sync,30000);
})();