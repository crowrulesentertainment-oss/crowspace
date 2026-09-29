/* CrowSpace — Replacement Competition Engine v26
   Browser-only. Multiple replacement candidates compete; weak candidates are eliminated.
*/
(function(){
const V25="crowspace-strategy-replacements-v25",RET="crowspace-strategy-retirement-v24",EXP="crowspace-action-experiments-v1",KEY="crowspace-replacement-competition-v26",EVOL="crowspace-portfolio-strategy-evolution-v1";
const N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function key(s){return[s.mode,s.correctionMode,s.explorationShare].join("|")}
function candidates(original){
 const st=L(V25,{}), evo=L(EVOL,{candidates:[],tested:[]}), used=new Set(Object.values(st).map(x=>x.replacementKey).filter(Boolean)), out=[];
 (evo.candidates||[]).forEach(x=>{if(x?.strategy&&x.key!==original&&!used.has(x.key)&&!L(RET,{})[x.key])out.push({key:x.key,strategy:x.strategy,source:"EVOLUTION_HISTORY",score:N(x.score)})});
 const p=String(original).split("|"),share=Math.max(0,Math.min(100,N(p[2])||50));
 [{mode:p[0]||"BALANCED",correctionMode:"EXPLORE",explorationShare:Math.min(100,share+10)},
  {mode:p[0]||"BALANCED",correctionMode:"BALANCED",explorationShare:50},
  {mode:"EXPLORE",correctionMode:p[1]||"BALANCED",explorationShare:Math.min(100,share+15)},
  {mode:"BALANCED",correctionMode:"CAUTIOUS",explorationShare:Math.max(25,share-10)}].forEach((s,i)=>{const k=key(s);if(k!==original&&!out.some(x=>x.key===k)&&!used.has(k))out.push({key:k,strategy:s,source:"GENERATED_MUTATION",score:50-i*5})});
 return out.slice(0,4);
}
function result(e){const r=e?.strategyTrial?.result||{};return{effect:N(r.differenceInDifferences??r.viewDelta),classification:r.classification||"",positive:r.classification==="CALIBRATED_POSITIVE"||N(r.differenceInDifferences??r.viewDelta)>=10,negative:r.classification==="CALIBRATED_NEGATIVE"||N(r.differenceInDifferences??r.viewDelta)<=-10}}
function build(){const retired=L(RET,{}),state=L(KEY,{}),out=[];Object.entries(retired).forEach(([original,r])=>{if(r.status!=="RETIRED")return;let c=state[original]||{originalKey:original,candidates:[],status:"READY",version:26};if(c.status==="PROMOTED"||c.status==="RETIRED")return;if(!c.candidates.length)c.candidates=candidates(original).map((x,i)=>({...x,slot:i+1,status:"READY",attempts:0}));state[original]=c;out.push(c)});S(KEY,state);return out}
function record(original,e){const state=L(KEY,{}),c=state[original];if(!c)return null;const r=result(e),cand=c.candidates.find(x=>x.key===e.replacementExperiment?.replacementKey||x.key===e.strategyTrial?.key);if(!cand)return c;cand.attempts=N(cand.attempts)+1;cand.lastEffect=r.effect;cand.lastResult=r.positive?"POSITIVE":r.negative?"NEGATIVE":"UNCERTAIN";if(r.negative||cand.attempts>=2&&!r.positive)cand.status="ELIMINATED";else if(r.positive)cand.status="QUALIFIED";c.updatedAt=Date.now();S(KEY,state);return promote(original)}
function promote(original){const state=L(KEY,{}),c=state[original];if(!c)return null;const q=c.candidates.filter(x=>x.status==="QUALIFIED").sort((a,b)=>N(b.lastEffect)-N(a.lastEffect));if(q.length){const best=q[0];c.status="QUALIFIED_PENDING_VALIDATION";c.promotedKey=best.key;c.qualifiedAt=Date.now();c.reason="Strongest candidate selected; multi-series validation is required before portfolio exploitation.";c.candidates.forEach(x=>{if(x.key!==best.key&&x.status==="QUALIFIED")x.status="ELIMINATED"});S(KEY,state);return c}if(c.candidates.length&&c.candidates.every(x=>x.status==="ELIMINATED"))c.status="RETIRED";S(KEY,state);return c}
function canExploit(original,replacementKey){const c=L(KEY,{})[original];return !!c&&c.status==="PROMOTED"&&c.promotedKey===replacementKey}
window.CrowSpaceReplacementCompetition={build,record,promote,canExploit,state:()=>L(KEY,{})};
setTimeout(build,10500);setInterval(build,9000);
})();