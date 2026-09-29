/* CrowSpace — Threshold Arbitration Recovery v69
   Browser-only. Learns when noisy arbitration signals recover and safely restores influence.
*/
(function(){
const ST="crowspace-threshold-arbitration-stability-v68",MEM="crowspace-threshold-arbitration-memory-v67",KEY="crowspace-threshold-arbitration-recovery-v69",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const st=L(ST,{}),mem=L(MEM,{}),out=state();
 Object.values(st).forEach(x=>{
  const h=mem[x.reason]?.history||[],recent=h.slice(0,6),aligned=recent.filter(r=>r.aligned).length,misaligned=recent.filter(r=>!r.aligned).length;
  const evidence=recent.length,alignment=evidence?aligned/evidence:0;
  const recovered=x.status==="STABLE_SIGNAL"&&alignment>=.67&&evidence>=3;
  const persistent=x.status==="NOISY"&&alignment<.4&&evidence>=3;
  const old=out[x.reason]||{checks:0,recoveries:0,blocks:0};
  old.checks++;if(recovered)old.recoveries++;if(persistent)old.blocks++;
  old.reason=x.reason;old.stability=N(x.stability);old.alignment=+alignment.toFixed(3);old.evidence=evidence;
  old.recovery=recovered;old.persistentNoise=persistent;
  old.factor=recovered?1:persistent?.35:x.status==="WATCH"?.7:1;
  old.status=recovered?"RECOVERED":persistent?"BLOCKED":x.status==="NOISY"?"DAMPENED":"NORMAL";
  old.updatedAt=Date.now();out[x.reason]=old;
 });
 S(KEY,out);return out
}
function factor(reason){return state()[reason]?.factor||1}
function status(reason){return state()[reason]?.status||"NORMAL"}
function best(){return Object.values(state()).sort((a,b)=>(b.alignment||0)-(a.alignment||0))}
window.CrowSpaceThresholdRecoveryV69={sync,state,factor,status,best};
setTimeout(sync,81000);setInterval(sync,30000);
})();