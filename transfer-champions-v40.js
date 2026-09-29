/* CrowSpace — Transfer Champion / Challenger v40
   Browser-only. Compares validated transfer performance with the target's local baseline.
*/
(function(){
const KEY="crowspace-transfer-champions-v40",VAL="crowspace-transfer-validation-v38",ROLL="crowspace-transfer-rollout-v39",MEM="crowspace-contextual-bandit-memory-v33",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function decay(t){return Math.pow(.5,Math.max(0,(Date.now()-N(t))/DAY)/30)}
function localEvidence(original,target){
 const mem=L(MEM,{});return Object.values(mem).filter(x=>x.originalKey===original&&x.context&&x.context.series===target.series&&x.context.window===target.window).map(x=>({effect:x.tests?N(x.effectSum)/N(x.tests):0,tests:N(x.tests),at:x.lastAt,weight:decay(x.lastAt)}));
}
function transferEvidence(v){return (v?.tests||[]).map(x=>({effect:N(x.effect),positive:!!x.positive,negative:!!x.negative,at:x.at,weight:decay(x.at)}))}
function avg(a){const w=a.reduce((n,x)=>n+x.weight,0)||1;return a.reduce((n,x)=>n+x.effect*x.weight,0)/w}
function evaluate(key){
 const v=L(VAL,{})[key],roll=L(ROLL,{})[key];if(!v)return null;
 const target=v.targetContext||{},local=localEvidence(v.originalKey,target),tr=transferEvidence(v),te=avg(tr),le=avg(local),margin=te-le;
 const confidence=N(v.confidence),localEvidenceCount=local.reduce((n,x)=>n+x.tests,0),transferTests=tr.length;
 const status=margin>=10&&confidence>=65&&transferTests>=3?"CHAMPION":margin<=-10?"CHALLENGER_WINS":"TIED";
 return{version:40,key,originalKey:v.originalKey,targetContext:target,transferEffect:+te.toFixed(2),localEffect:+le.toFixed(2),margin:+margin.toFixed(2),transferTests,localEvidence:localEvidenceCount,confidence,rollout:roll?.rollout||0,status,updatedAt:Date.now()};
}
function sync(){
 const vals=L(VAL,{}),st=L(KEY,{});
 Object.keys(vals).forEach(k=>{const e=evaluate(k);if(e)st[k]={...st[k],...e};});
 S(KEY,st);return st
}
function state(){return L(KEY,{})}
function winner(key){const x=state()[key];return x?.status==="CHAMPION"?"TRANSFER":x?.status==="CHALLENGER_WINS"?"LOCAL":"TIE"}
function canExploitTransfer(key){return winner(key)==="TRANSFER"&&state()[key].confidence>=65}
function canExploitLocal(key){return winner(key)!=="TRANSFER"}
window.CrowSpaceTransferChampionsV40={evaluate,sync,state,winner,canExploitTransfer,canExploitLocal};
setTimeout(sync,22000);setInterval(sync,30000);
})();