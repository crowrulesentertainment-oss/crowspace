/* CrowSpace — Recalibration Calibration Recovery v81
   Browser-only. Automatically restores cautious evidence influence when calibration deteriorates,
   while requiring fresh observations before full trust returns.
*/
(function(){
const CAL="crowspace-recalibration-evidence-calibration-v80",VER="crowspace-recalibration-recovery-verification-v82",DIV="crowspace-recalibration-evidence-diversity-v79",KEY="crowspace-recalibration-calibration-recovery-v81",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function sync(){
 const cal=L(CAL,{}),div=L(DIV,{}),st=state();
 Object.values(cal).forEach(x=>{
  const old=st[x.reason]||{attempts:0,restored:0,history:[]},d=div[x.reason]||{};
  const degraded=x.status==="UNRELIABLE"||x.status==="PARTIAL",fresh=(d.freshness||0)>=.5,restored=degraded&&fresh&&N(x.tests)>=3;
  const mode=degraded?"CONSERVATIVE_RECOVERY":"NORMAL_MONITOR";
  const marker=String(x.updatedAt||0)+":"+String(x.status||"")+":"+String(d.freshness||0);
  if(old.lastMarker!==marker){
   old.attempts+=degraded?1:0;old.restored+=restored?1:0;old.history=[{at:Date.now(),degraded,restored,accuracy:N(x.accuracy),freshness:N(d.freshness)},...(old.history||[])].slice(0,20);old.lastMarker=marker;
  }
  old.reason=x.reason;old.mode=mode;old.factor=restored?1:degraded?.5:1;old.status=restored?"RECOVERED":degraded?"RECOVERING":"STABLE";old.updatedAt=Date.now();st[x.reason]=old;
 });
 S(KEY,st);return st
}
function factor(reason){const base=state()[reason]?.factor||1;const verify=window.CrowSpaceRecalibrationVerificationV82?.factor?.(reason)||1;const memory=window.CrowSpaceRecalibrationVerificationMemoryV83?.factor?.(reason)||1;const recovery=window.CrowSpaceVerificationMemoryRecoveryV84?.factor?.(reason)||1;const stability=window.CrowSpaceVerificationRecoveryStabilityV85?.factor?.(reason)||1;const audit=window.CrowSpaceRecalibrationIntegrityAuditV86?.factor?.(reason)||1;const independence=window.CrowSpaceRecalibrationAuditIndependenceV87?.factor?.(reason)||1;const provenance=window.CrowSpaceRecalibrationEvidenceProvenanceV88?.factor?.(reason)||1;const freshness=window.CrowSpaceRecalibrationEvidenceFreshnessV89?.factor?.(reason)||1;const conflict=window.CrowSpaceRecalibrationEvidenceConflictV90?.factor?.(reason)||1;const trust=window.CrowSpaceRecalibrationEvidenceTrustV91?.factor?.(reason)||1;const calibration=window.CrowSpaceRecalibrationEvidenceTrustCalibrationV92?.factor?.(reason)||1;return base*verify*memory*recovery*stability*audit*independence*provenance*freshness*conflict*trust*calibration}
function mode(reason){return state()[reason]?.mode||"NORMAL_MONITOR"}
function status(reason){return state()[reason]?.status||"STABLE"}
function best(){return Object.values(state()).sort((a,b)=>(b.restored||0)-(a.restored||0))}
window.CrowSpaceRecalibrationRecoveryV81={sync,state,factor,mode,status,best};
setTimeout(sync,105000);setInterval(sync,30000);
})();