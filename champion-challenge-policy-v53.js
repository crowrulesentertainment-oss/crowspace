/* CrowSpace — Champion Challenge Policy Engine v53
   Browser-only. Converts calibrated evidence into explicit challenge policies with safety limits.
*/
(function(){
const CAL="crowspace-challenge-calibration-v52",KEY="crowspace-challenge-policy-v53",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return L(KEY,{})}
function policy(reason){
 const x=L(CAL,{})[reason];
 if(!x)return{reason,status:"UNSEEN",priorityBoost:0,action:"OBSERVE"};
 const v=N(x.calibratedValue),conf=N(x.confidence),tests=N(x.tests),th=window.CrowSpaceChallengeThresholdsV57?.thresholds?.(reason),up=th?.prioritizeAt??.35,down=th?.suppressAt??-.25,alloc=window.CrowSpaceChallengeThresholdPortfolioV59?.allocation?.(reason);
 if(x.status==="CONTRADICTED")return{reason,status:"CONTRADICTED",priorityBoost:-5,action:"DEPRIORITIZE",tests,confidence:conf};
 if(tests<2)return{reason,status:"COLD_START",priorityBoost:0,action:"COLLECT",tests,confidence:conf};
 if(v>=up&&conf>=.6){const tv=window.CrowSpaceChallengeThresholdValidationV58?.quality?.(reason);return{reason,status:"SUPPORTIVE",priorityBoost:tv!==undefined&&tv<-.2?2:Math.round(8*(alloc===undefined?1:alloc)),action:"PRIORITIZE",tests,confidence:conf};}
 if(v<=down&&conf>=.5){const tv=window.CrowSpaceChallengeThresholdValidationV58?.quality?.(reason);return{reason,status:"CAUTIOUS",priorityBoost:tv!==undefined&&tv<-.2?-2:Math.round(-8*(alloc===undefined?1:alloc)),action:"DEPRIORITIZE",tests,confidence:conf};}
 return{reason,status:"BALANCED",priorityBoost:0,action:"NORMAL",tests,confidence:conf};
}
function sync(){
 const cal=L(CAL,{}),st=state();
 Object.keys(cal).forEach(k=>{st[k]={...policy(k),updatedAt:Date.now()};});
 S(KEY,st);return st
}
function boost(reason){const g=window.CrowSpaceChallengeGovernanceV55?.influence?.(reason);if(g!==undefined&&window.CrowSpaceChallengeGovernanceV55?.canUse?.(reason))return Math.round(g*10);const p=state()[reason];return p?.priorityBoost||0}
function decision(reason){return state()[reason]||policy(reason)}
function best(){return Object.values(state()).sort((a,b)=>(b.priorityBoost||0)-(a.priorityBoost||0))}
window.CrowSpaceChallengePolicyV53={sync,state,boost,decision,best};
setTimeout(sync,49000);setInterval(sync,30000);
})();