/* CrowSpace — Champion Stability & Hysteresis v45
   Browser-only. Prevents noisy one-test flips and requires sustained evidence before rotation.
*/
(function(){
const ATTR="crowspace-challenge-attribution-v44",ROT="crowspace-transfer-rotation-v41",KEY="crowspace-champion-stability-v45",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN_TESTS=2,MIN_MARGIN=10,COOLDOWN=14*DAY;
function state(){return L(KEY,{})}
function sync(){
 const a=L(ATTR,{}),st=state(),now=Date.now();
 Object.values(a).forEach(x=>{
  const k=x.key,old=st[k]||{key:k,champion:"UNDECIDED",wins:0,losses:0,flips:0,history:[]};
  const challenger=N(x.positive),incumbent=N(x.negative),total=challenger+incumbent;
  const candidate=challenger>incumbent?"TRANSFER":incumbent>challenger?"LOCAL":"TIE";
  old.tests=N(x.tests);old.challengerWins=challenger;old.incumbentWins=incumbent;old.candidate=candidate;
  const margin=Math.abs(challenger-incumbent),eligible=total>=MIN_TESTS&&margin>=1;
  if(eligible&&candidate!=="TIE"&&candidate!==old.champion){
   const recent=(old.history||[]).filter(h=>now-N(h.at)<COOLDOWN);
   if(!recent.length){
    old.champion=candidate;old.flips=N(old.flips)+1;old.lastRotationAt=now;
    old.history=[{at:now,from:old.champion===candidate?null:old.champion,to:candidate,tests:total,margin},...(old.history||[])].slice(0,30);
   }
  }
  if(old.champion==="UNDECIDED"&&candidate!=="TIE"&&eligible)old.champion=candidate;
  old.stability=total?Math.max(challenger,incumbent)/total:0;
  old.status=total<MIN_TESTS?"COLLECTING":candidate==="TIE"?"TIED":old.champion===candidate?"STABLE":"CHALLENGE";
  old.updatedAt=now;st[k]=old;
 });
 S(KEY,st);return st
}
function champion(k){return state()[k]?.champion||"UNDECIDED"}
function stable(k){const x=state()[k];return !!x&&x.status==="STABLE"}
function canUse(k){return stable(k)&&champion(k)!=="UNDECIDED"}
window.CrowSpaceChampionStabilityV45={sync,state,champion,stable,canUse};
setTimeout(sync,33000);setInterval(sync,30000);
})();