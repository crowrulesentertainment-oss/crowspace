/* CrowSpace — Transfer Experimentation Engine v37
   Browser-only. Turns learned context transfers into explicit controlled experiments.
*/
(function(){
const KEY="crowspace-transfer-experiments-v37",EXP="crowspace-action-experiments-v1",MEM="crowspace-contextual-bandit-memory-v33",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function contexts(){return Object.values(L(MEM,{})).filter(x=>x?.context&&x?.originalKey)}
function candidates(original,target){
 const t=window.CrowSpaceContextTransferV35?.transfer?.(original,target);if(!t||t.mode!=="TRANSFERRED"||t.strength<=0)return[];
 return (t.sources||[]).map(s=>({...s,originalKey:original,targetContext:target,strength:t.strength,evidence:t.evidence,reward:t.reward}));
}
function state(){return L(KEY,{})}
function plan(original,target){
 const c=candidates(original,target);if(!c.length)return null;
 const k=[original,target.series,target.window,target.momentum,target.experimentType].join("::"),st=state(),old=st[k];
 if(old?.status==="TESTING")return old;
 return st[k]={key:k,version:37,status:"READY",originalKey:original,targetContext:target,source:c[0],candidates:c,updatedAt:Date.now()};
}
function generate(original,target){const p=plan(original,target);if(p)S(KEY,{...state(),[p.key]:p});return p}
function record(e){
 const tr=e?.strategyTrial?.transferExperiment;if(!tr)return null;
 const result=e.strategyTrial?.result||{},effect=N(result.differenceInDifferences??result.viewDelta),positive=result.classification==="CALIBRATED_POSITIVE"||effect>=10,negative=result.classification==="CALIBRATED_NEGATIVE"||effect<=-10;
 const st=state(),x=st[tr.key]||tr;x.tests=N(x.tests)+1;x.positive=N(x.positive)+(positive?1:0);x.negative=N(x.negative)+(negative?1:0);x.effects=[effect,...(x.effects||[])].slice(0,20);x.lastResult={effect,positive,negative,at:Date.now()};x.status=x.negative>=2&&x.positive===0?"DISABLED":x.positive>=2&&x.negative===0?"SUPPORTED":negative?"REDUCED":"TESTED";x.updatedAt=Date.now();S(KEY,{...st,[tr.key]:x});
 window.CrowSpaceTransferValidationV38?.update?.(e);
 window.CrowSpaceTransferGuardrailsV36?.guard?.(tr.originalKey,tr.targetContext);
 return x
}
function ready(){return Object.values(state()).filter(x=>x.status==="READY")}
window.CrowSpaceTransferExperimentsV37={contexts,candidates,plan,generate,record,ready,state};
})();