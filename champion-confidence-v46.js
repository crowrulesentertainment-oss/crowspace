/* CrowSpace — Champion Confidence & Survival Scoring v46
   Browser-only. Scores champion durability from recency, repeated wins, margin,
   challenge frequency, and resistance to challengers.
*/
(function(){
const ST="crowspace-champion-stability-v45",ATTR="crowspace-challenge-attribution-v44",KEY="crowspace-champion-confidence-v46",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function decay(t){return Math.pow(.5,Math.max(0,(Date.now()-N(t))/DAY)/30)}
function state(){return L(KEY,{})}
function score(x){
 const tests=N(x.tests),wins=x.champion==="TRANSFER"?N(x.challengerWins):N(x.incumbentWins),losses=x.champion==="TRANSFER"?N(x.incumbentWins):N(x.challengerWins),total=wins+losses||tests||1;
 const repeat=Math.min(1,wins/5),resistance=Math.max(0,1-losses/Math.max(1,total)),consistency=Math.max(0,N(x.stability)),frequency=Math.min(1,total/6);
 const recency=decay(x.updatedAt||Date.now()),margin=Math.min(1,Math.abs(wins-losses)/Math.max(1,total));
 const confidence=Math.round(100*(repeat*.2+resistance*.25+consistency*.2+frequency*.15+margin*.1+recency*.1));
 const survival=Math.round(100*(resistance*.35+consistency*.2+frequency*.2+margin*.15+recency*.1));
 const tier=confidence>=85?"DOMINANT":confidence>=70?"STRONG":confidence>=50?"ESTABLISHED":confidence>=30?"EARLY":"FRAGILE";
 return{confidence,survival,tier,wins,losses,total,repeat:+repeat.toFixed(2),resistance:+resistance.toFixed(2),recency:+recency.toFixed(2),margin:+margin.toFixed(2),frequency:+frequency.toFixed(2)}
}
function sync(){
 const st=L(ST,{}),a=L(ATTR,{}),out=state();
 Object.values(st).forEach(x=>{
  if(x.champion==="UNDECIDED")return;
  const k=x.key,s=score(x),old=out[k]||{};
  out[k]={...old,key:k,originalKey:x.originalKey,champion:x.champion,...s,lastChallengeAt:a[k]?.last?.at||old.lastChallengeAt||null,updatedAt:Date.now()};
 });
 S(KEY,out);return out
}
function get(k){return state()[k]||null}
function canExploit(k){const x=get(k);return !!x&&x.tier!=="FRAGILE"&&x.confidence>=50&&x.survival>=50}
function best(){return Object.values(state()).sort((a,b)=>(b.confidence||0)-(a.confidence||0)||(b.survival||0)-(a.survival||0))}
window.CrowSpaceChampionConfidenceV46={sync,state,get,canExploit,best};
setTimeout(sync,35000);setInterval(sync,30000);
})();