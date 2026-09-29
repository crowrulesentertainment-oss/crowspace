/* CrowSpace — Adaptive Champion Rotation v41
   Browser-only. Periodically re-challenges the incumbent transfer/local winner.
*/
(function(){
const V40="crowspace-transfer-champions-v40",KEY="crowspace-transfer-rotation-v41",DAY=864e5,N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const MIN_DAYS=14,MIN_MARGIN=8;
function state(){return L(KEY,{})}
function sync(){
 const base=L(V40,{}),st=state(),now=Date.now();
 Object.values(base).forEach(x=>{
  const k=x.key,old=st[k]||{key:k,originalKey:x.originalKey,champion:"UNDECIDED",checks:0,rotations:0,history:[]};
  const age=(now-N(old.lastChallengeAt))/DAY;
  const due=!old.lastChallengeAt||age>=MIN_DAYS;
  const current=x.status==="CHAMPION"?"TRANSFER":x.status==="CHALLENGER_WINS"?"LOCAL":"TIE";
  if(due){
   const previous=old.champion;
   old.checks++;
   if(current==="TIE")old.champion=previous||"UNDECIDED";
   else old.champion=current;
   if(previous&&old.champion!==previous&&old.champion!=="UNDECIDED")old.rotations++;
   old.lastChallengeAt=now;
   old.history=[{at:now,previous,current,margin:N(x.margin),rotated:previous!==old.champion&&previous!=="UNDECIDED"},...(old.history||[])].slice(0,40);
  }else if(!old.champion&&current!=="TIE")old.champion=current;
  old.current=current;old.margin=N(x.margin);old.confidence=N(x.confidence);
  old.nextChallengeAt=(old.lastChallengeAt||now)+MIN_DAYS*DAY;
  old.status=Math.abs(old.margin)>=MIN_MARGIN?old.champion:"HOLD";
  old.updatedAt=now;st[k]=old;
 });
 S(KEY,st);return st
}
function shouldRotate(key){
 const x=state()[key];if(!x)return false;
 return x.status==="HOLD"||x.current!==x.champion;
}
function champion(key){return state()[key]?.champion||"UNDECIDED"}
function canUseTransfer(key){const x=state()[key];return !!x&&x.champion==="TRANSFER"&&x.status==="TRANSFER"}
function canUseLocal(key){const x=state()[key];return !!x&&x.champion==="LOCAL"&&x.status==="LOCAL"}
function due(key){const x=state()[key];return !!x&&Date.now()>=N(x.nextChallengeAt)}
window.CrowSpaceChampionRotationV41={sync,state,shouldRotate,champion,canUseTransfer,canUseLocal,due};
setTimeout(sync,24000);setInterval(sync,30000);
})();