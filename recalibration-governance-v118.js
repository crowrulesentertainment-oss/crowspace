/* CrowSpace — Recalibration Governance Factor Synthesis v118
   Browser-only. Replaces deep multiplicative dampening with bounded geometric synthesis.
   This prevents dozens of downstream factors from compounding into near-zero influence.
*/
(function(){
const N=x=>Number(x),clamp=x=>Math.max(.5,Math.min(1,Number.isFinite(x)?x:1));
function factors(reason){
 const names=[
  ["base","CrowSpaceRecalibrationRecoveryV81",true],
  ["verify","CrowSpaceRecalibrationVerificationV82"],
  ["memory","CrowSpaceRecalibrationVerificationMemoryV83"],
  ["recovery","CrowSpaceVerificationMemoryRecoveryV84"],
  ["stability","CrowSpaceVerificationRecoveryStabilityV85"],
  ["audit","CrowSpaceRecalibrationIntegrityAuditV86"],
  ["independence","CrowSpaceRecalibrationAuditIndependenceV87"],
  ["provenance","CrowSpaceRecalibrationEvidenceProvenanceV88"],
  ["freshness","CrowSpaceRecalibrationEvidenceFreshnessV89"],
  ["conflict","CrowSpaceRecalibrationEvidenceConflictV90"],
  ["trust","CrowSpaceRecalibrationEvidenceTrustV91"],
  ["calibration","CrowSpaceRecalibrationEvidenceTrustCalibrationV92"],
  ["trustRecovery","CrowSpaceRecalibrationEvidenceTrustRecoveryV93"],
  ["trustVerification","CrowSpaceRecalibrationEvidenceTrustVerificationV94"],
  ["verificationMemory","CrowSpaceRecalibrationEvidenceTrustVerificationMemoryV95"],
  ["verificationRecovery","CrowSpaceRecalibrationEvidenceTrustVerificationRecoveryV96"],
  ["verificationStability","CrowSpaceRecalibrationEvidenceTrustVerificationStabilityV97"],
  ["stabilityMemory","CrowSpaceRecalibrationEvidenceTrustVerificationStabilityMemoryV98"],
  ["stabilityRecovery","CrowSpaceRecalibrationEvidenceTrustVerificationStabilityRecoveryV99"],
  ["stabilityRecoveryVerification","CrowSpaceRecalibrationEvidenceTrustVerificationStabilityRecoveryVerificationV100"],
  ["recoveryVerificationMemory","CrowSpaceRecalibrationEvidenceTrustStabilityRecoveryVerificationMemoryV101"],
  ["recoveryVerificationMemoryRecovery","CrowSpaceRecalibrationEvidenceTrustStabilityRecoveryVerificationMemoryRecoveryV102"],
  ["recoveryVerificationMemoryRecoveryStability","CrowSpaceRecalibrationEvidenceTrustStabilityRecoveryVerificationMemoryRecoveryStabilityV103"],
  ["decisionEffectivenessMemory","CrowSpaceRecalibrationDecisionEffectivenessMemoryV107"],
  ["decisionEffectivenessMemoryRecovery","CrowSpaceRecalibrationDecisionEffectivenessMemoryRecoveryV108"],
  ["decisionEffectivenessMemoryRecoveryStability","CrowSpaceRecalibrationDecisionEffectivenessMemoryRecoveryStabilityV109"],
  ["decisionEffectivenessRecoveryStabilityMemory","CrowSpaceRecalibrationDecisionEffectivenessRecoveryStabilityMemoryV110"],
  ["decisionEffectivenessRecoveryStabilityMemoryRecovery","CrowSpaceRecalibrationDecisionEffectivenessRecoveryStabilityMemoryRecoveryV111"],
  ["decisionEffectivenessRecoveryStabilityMemoryRecoveryStability","CrowSpaceRecalibrationDecisionEffectivenessRecoveryStabilityMemoryRecoveryStabilityV112"],
  ["decisionEffectivenessRecoveryStabilityVerificationMemory","CrowSpaceRecalibrationDecisionEffectivenessRecoveryStabilityVerificationMemoryV113"],
  ["decisionEffectivenessRecoveryStabilityVerificationMemoryRecovery","CrowSpaceRecalibrationDecisionEffectivenessRecoveryStabilityVerificationMemoryRecoveryV114"],
  ["decisionEffectivenessVerificationMemoryRecoveryStability","CrowSpaceRecalibrationDecisionEffectivenessVerificationMemoryRecoveryStabilityV115"],
  ["decisionEffectivenessVerificationMemoryRecoveryStabilityMemory","CrowSpaceRecalibrationDecisionEffectivenessVerificationMemoryRecoveryStabilityMemoryV116"],
  ["decisionEffectivenessVerificationRecoveryStabilityMemoryRecovery","CrowSpaceRecalibrationDecisionEffectivenessVerificationRecoveryStabilityMemoryRecoveryV117"]
 ];
 const out=[];
 names.forEach(([name,obj])=>{
  const api=window[obj],v=api?.factor?.(reason);
  if(v!==undefined)out.push({name,value:clamp(N(v))});
 });
 return out;
}
function synthesize(reason){
 const fs=factors(reason),sum=fs.reduce((a,x)=>a+Math.log(x.value),0),value=fs.length?Math.exp(sum/fs.length):1;
 return {reason,value:clamp(value),count:fs.length,factors:fs,method:"BOUNDED_GEOMETRIC_MEAN",updatedAt:Date.now()};
}
function factor(reason){return synthesize(reason).value}
function audit(reason){const x=synthesize(reason);return {...x,status:x.value>=.85?"STABLE":x.value>=.7?"WATCH":"RESTRICTED"}}
function best(reasons){return (reasons||[]).map(r=>audit(r)).sort((a,b)=>b.value-a.value)}
window.CrowSpaceRecalibrationGovernanceV118={factors,synthesize,factor,audit,best};
})();