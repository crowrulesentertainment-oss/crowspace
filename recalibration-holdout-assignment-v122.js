/* CrowSpace — Recalibration Holdout Assignment v122
   Browser-only. Creates deterministic local treated/control assignments and records
   control observations only when a neutral holdout path is explicitly available.
*/
(function(){
const KEY='crowspace-recalibration-holdout-observations-v121',ASSIGN='crowspace-recalibration-holdout-assignments-v122',N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function assignments(){return L(ASSIGN,{})}
function observations(){return L(KEY,{})}
function bucket(id){let h=0;String(id).split('').forEach(c=>{h=((h<<5)-h+c.charCodeAt(0))|0});return Math.abs(h)%2===0?'TREATED':'CONTROL'}
function assign(decisionId,reason){const st=assignments(),id=String(decisionId);if(!st[id])st[id]={decisionId:id,reason:reason||'UNKNOWN',group:bucket(id),assignedAt:Date.now(),source:'DETERMINISTIC_LOCAL_HOLDOUT'};S(ASSIGN,st);return st[id]}
function recordControl(decisionId,accuracy,observedAt){const st=assignments(),id=String(decisionId),a=st[id];if(!a||a.group!=='CONTROL')return null;const o=observations();o[id]={decisionId:id,accuracy:Math.max(0,Math.min(1,N(accuracy))),observedAt:N(observedAt)||Date.now(),group:'CONTROL',source:'EXPLICIT_NEUTRAL_OBSERVATION'};S(KEY,o);return o[id]}
function state(){return {assignments:assignments(),observations:observations()}}
window.CrowSpaceRecalibrationHoldoutAssignmentV122={state,assign,recordControl,bucket};
})();