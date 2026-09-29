/* CrowSpace — Strategy Resurrection & Replacement Engine v25
   Browser-only. Retired strategies are never resurrected unchanged.
*/
(function(){
const RET="crowspace-strategy-retirement-v24",EVOL="crowspace-portfolio-strategy-evolution-v1",EXP="crowspace-action-experiments-v1",KEY="crowspace-strategy-replacements-v25",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function parse(k){const p=String(k).split("|");return{mode:p[0]||"BALANCED",correctionMode:p[1]||"BALANCED",explorationShare:N(p[2])}}
function replacement(key){
 const evo=L(EVOL,{candidates:[],tested:[]}),ret=L(RET,{})[key],parts=parse(key);
 const pool=(evo.candidates||[]).filter(x=>x?.strategy&&x.key!==key&&!L(RET,{})[x.key]);
 let best=pool.sort((a,b)=>N(b.score)-N(a.score))[0];
 if(best)return{source:"EVOLUTION_HISTORY",strategy:best.strategy,key:best.key,parent:key,mutation:"REPLACEMENT_FROM_EVOLUTION",confidenceFloor:"PROMISING"};
 const share=Math.max(0,Math.min(100,parts.explorationShare||50));
 const variants=[{mode:parts.mode,correctionMode:"EXPLORE",explorationShare:Math.min(100,share+10)},{mode:parts.mode,correctionMode:"BALANCED",explorationShare:50},{mode:"EXPLORE",correctionMode:parts.correctionMode,explorationShare:Math.min(100,share+15)}];
 const v=variants.find(x=>String(x.mode)+"|"+String(x.correctionMode)+"|"+String(x.explorationShare)!==key)||variants[0];
 const nk=[v.mode,v.correctionMode,v.explorationShare].join("|");
 return{source:"GENERATED_MUTATION",strategy:v,key:nk,parent:key,mutation:"REPLACEMENT_MUTATION",confidenceFloor:"PROMISING"};
}
function generate(){
 const retired=L(RET,{}),state=L(KEY,{}),out=[];
 Object.entries(retired).forEach(([key,r])=>{
  if(r.status!=="RETIRED"||state[key]?.status==="ACTIVE"||state[key]?.status==="TESTING"||state[key]?.status==="ACCEPTED")return;
  const rep=replacement(key),next=state[key]?.replacementKey===rep.key?state[key]:{originalKey:key,replacementKey:rep.key,replacement:rep,attempts:0};
  next.status="READY_FOR_CONTROLLED_TEST";next.reason="Retired strategy replaced; fresh controlled evidence is required before exploitation.";next.updatedAt=Date.now();next.version=25;
  state[key]=next;out.push(next);
 });
 S(KEY,state);return out;
}
function evaluate(key,result){
 const state=L(KEY,{}),x=state[key];if(!x)return null;
 const r=result||{},positive=r.classification==="CALIBRATED_POSITIVE"||N(r.differenceInDifferences??r.viewDelta)>=10;
 const negative=r.classification==="CALIBRATED_NEGATIVE"||N(r.differenceInDifferences??r.viewDelta)<=-10;
 x.lastResult=positive?"POSITIVE":negative?"NEGATIVE":"UNCERTAIN";
 x.attempts=N(x.attempts)+1;
 x.status=positive?"ACCEPTED":x.attempts>=3?"REJECTED":"READY_FOR_CONTROLLED_TEST";
 x.updatedAt=Date.now();x.version=25;S(KEY,state);return x;
}
function canExploit(key){
 const x=L(KEY,{})[key];return !!x&&x.status==="ACCEPTED"&&x.lastResult==="POSITIVE";
}
window.CrowSpaceStrategyReplacement={generate,evaluate,canExploit,replacement,state:()=>L(KEY,{})};
setTimeout(generate,9500);setInterval(generate,7000);
})();