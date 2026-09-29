/* CrowSpace — Autonomous Experiment Lifecycle v6
   Browser-only. Closes, evaluates, remembers, releases, and orchestrates the next experiment.
*/
(function(){
const EVOL="crowspace-portfolio-strategy-evolution-v1",STRAT="crowspace-portfolio-strategy-trials-v1",EXP="crowspace-action-experiments-v1",TASK="crowspace-growth-action-tasks-v1",DEC="crowspace-experiment-decisions-v1",MEM="crowspace-experiment-pattern-library-v1",SCHED="crowspace-experiment-scheduler-v1",ORCH="crowspace-experiment-orchestrator-v1";
const $=id=>document.getElementById(id),N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v)),E=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
function stats(e,i){const o=e.arms[i]?.outcomes||[],c=o.flatMap(x=>x.caws||[]),v=c.length?c.reduce((n,x)=>n+N(x.views),0):o.reduce((n,x)=>n+N(x.views),0),r=c.length?c.reduce((n,x)=>n+N(x.interactions),0):o.reduce((n,x)=>n+N(x.interactions),0);return{actions:o.length,caws:c.length||o.reduce((n,x)=>n+N(x.cawsPublished),0),views:v,interactions:r,avgViews:c.length?v/c.length:o.length?v/o.length:0,rate:v?r/v:0}}
function decide(e){const a=stats(e,0),b=stats(e,1);if(a.actions<2||b.actions<2)return{status:"COLLECTING",a:"RETEST",b:"RETEST",reason:"Each arm needs at least 2 measured actions before a decision."};const lift=a.avgViews?((b.avgViews/a.avgViews)-1)*100:0,rateLift=a.rate?((b.rate/a.rate)-1)*100:0;if(lift<10&&lift>-10)return{status:"RETEST",a:"RETEST",b:"RETEST",reason:"The measured view difference is below the 10% decision threshold; collect another round."};const stronger=lift>=10?"B":"A",weaker=stronger==="A"?"B":"A";return{status:"DECIDED",a:stronger==="A"?"CONTINUE":"RETIRE",b:stronger==="B"?"CONTINUE":"RETIRE",reason:stronger+" has "+(lift>=0?"+":"")+lift.toFixed(1)+"% average views/Caw versus "+weaker+". Interaction conversion difference: "+(rateLift>=0?"+":"")+rateLift.toFixed(1)+"%. Treat this as measured evidence, not a guarantee."}}
function remember(s,e,d){const all=L(MEM,{}),rows=all[s]||{},a=stats(e,0),b=stats(e,1),key=[e.arms[0]?.type||"A",e.arms[1]?.type||"B"].sort().join("::"),status=d.status==="DECIDED"?(d.a==="CONTINUE"||d.b==="CONTINUE"?"SUCCESSFUL":"FAILED"):d.status==="RETEST"?"RETEST":"COLLECTING";rows[e.id]={id:e.id,series:s,name:e.name,patternKey:key,arms:[{type:e.arms[0]?.type,actions:a.actions,caws:a.caws,views:a.views,avgViewsPerCaw:a.avgViews,interactionRate:a.rate},{type:e.arms[1]?.type,actions:b.actions,caws:b.caws,views:b.views,avgViewsPerCaw:b.avgViews,interactionRate:b.rate}],status,decision:d,createdAt:e.createdAt||Date.now(),completedAt:e.completedAt||Date.now(),lastUpdated:Date.now(),lifecycleVersion:6};all[s]=rows;S(MEM,all)}
async function lifecycle(){
 const all=L(EXP,{}),tasks=L(TASK,{}),decs=L(DEC,{}),now=Date.now(),changed=[];
 for(const [s,list] of Object.entries(all)){
  decs[s]??={};
  for(const e of list.filter(e=>e.status==="active"&&!e.lifecycleCompletedAt)){
   const ts=(tasks[s]||[]).filter(t=>t.experimentId===e.id),done=ts.length>0&&ts.every(t=>t.completed),expired=N(e.endsAt)>0&&now>=N(e.endsAt);
   if(!done&&!expired)continue;
   e.status="complete";e.completedAt=now;e.lifecycleCompletedAt=now;e.lifecycleReason=done?"ALL ARMS COMPLETED":"EXPERIMENT WINDOW ENDED";
   const d=decide(e);
   if(e.strategyTrial&&window.CrowSpaceExperimentPortfolio?.strategyTrialResult){
    e.strategyTrial.result=window.CrowSpaceControlledHoldouts?.evaluate?await window.CrowSpaceControlledHoldouts.evaluate(e):(window.CrowSpaceCausalAttribution?.evaluate?await window.CrowSpaceCausalAttribution.evaluate(e):(window.CrowSpaceStrategyEvidence?.evaluate?window.CrowSpaceStrategyEvidence.evaluate(e):window.CrowSpaceExperimentPortfolio.strategyTrialResult(e)));
    e.strategyTrial.evaluationVersion=e.strategyTrial.result?.evaluationVersion||19;
   }
   decs[s][e.id]={experimentId:e.id,updatedAt:now,decision:d,automated:true,version:22,strategyTrial:e.strategyTrial?.result||null};
   remember(s,e,d);
   if(e.strategyTrial&&window.CrowSpaceExperimentPortfolio?.recordStrategyTest)window.CrowSpaceExperimentPortfolio.recordStrategyTest(e.id,e.strategyTrial.strategy,e.strategyTrial.series||e.series);
   if(e.recoveryExperiment&&window.CrowSpaceRecoveryIntelligence?.analyze)window.CrowSpaceRecoveryIntelligence.analyze();
   if(e.replacementExperiment&&window.CrowSpaceStrategyReplacement?.evaluate){window.CrowSpaceStrategyReplacement.evaluate(e.replacementExperiment.originalKey,e.strategyTrial?.result||null);}
   changed.push({series:s,id:e.id,decision:d.status});
  }
 }
 S(EXP,all);S(DEC,decs);
 if(window.CrowSpaceExperimentPortfolio?.run)window.CrowSpaceExperimentPortfolio.run();
 return changed;
}
function reEvaluationPlan(){
 const p=window.CrowSpaceExperimentPortfolio,rows=p?.controlledConfidence?p.controlledConfidence():[],key="crowspace-strategy-re-evaluation-v22",stored=L(key,{}),plans={};
 rows.forEach(r=>{
  const needs=r.confidence==="MIXED"||r.contradiction||r.confidence==="EARLY SIGNAL"&&r.tests>=2||r.confidence==="PROMISING"&&r.ageDays>60;
  if(!needs)return;
  plans[r.key]={key:r.key,status:"RECOVERY_REQUIRED",confidence:r.confidence,contradiction:!!r.contradiction,reason:r.contradiction?"Contradictory controlled results detected; exploitation is paused pending fresh evidence.":"Confidence has decayed or remains unresolved; collect a fresh controlled holdout.",tests:r.tests,series:r.series,lastUpdated:now(),version:22};
 });
 S(key,{...stored,...plans});
 return Object.values(plans);
}

async function generateRecoveryExperiments(){
 const plans=reEvaluationPlan(),p=window.CrowSpaceExperimentPortfolio,x=window.CrowSpaceExperimentExplorer;
 if(!plans.length||!p||!x?.candidates||!x?.schedule)return[];
 const key="crowspace-strategy-recovery-v23",state=L(key,{}),expAll=L(EXP,{}),created=[],activeKeys=new Set();
 for(const plan of plans){\n  if(state[plan.key]?.status==="RETIRED")continue;\n  const attempts=N(state[plan.key]?.attempts);if(attempts>=3){state[plan.key]={...state[plan.key],status:"RETIRED",reason:"Three recovery experiments failed to restore confidence.",updatedAt:Date.now(),version:23};continue;}
  const existing=Object.values(expAll).flat().find(e=>e.recoveryExperiment&&e.recoveryExperiment.strategyKey===plan.key&&!e.lifecycleCompletedAt);
  if(existing){state[plan.key]={...state[plan.key],status:"ACTIVE",experimentId:existing.id,updatedAt:Date.now(),version:23};continue}
  const candidates=(plan.series||[]).filter(series=>{const list=expAll[series]||[];return !list.some(e=>e.status==="active"&&!e.completedAt)}).map(series=>({series,candidate:(x.candidates(series)||[])[0]})).filter(z=>z.candidate);
  if(!candidates.length){state[plan.key]={status:"WAITING",reason:"No eligible series/action candidate is currently available.",updatedAt:Date.now(),version:23};continue}
  candidates.sort((a,b)=>N(b.candidate.score)-N(a.candidate.score));
  const selected=candidates[0],baseline=p.strategyBaseline?p.strategyBaseline(selected.series):{observations:0,experiments:0,avgViewsPerCaw:0,interactionRate:0};
  const holdout=window.CrowSpaceControlledHoldouts?.capture?await window.CrowSpaceControlledHoldouts.capture(selected.series,plan.series||[]):null;
  if(!holdout){state[plan.key]={status:"WAITING",reason:"Unable to capture an eligible controlled holdout.",updatedAt:Date.now(),version:23};continue}
  const parts=String(plan.key).split("|"),strategy={mode:parts[0],correctionMode:parts[1],explorationShare:N(parts[2])};\n  const trial={key:plan.key,strategy,mutation:"RECOVERY",baseline,holdout,capturedAt:Date.now(),version:24,controlledHoldout:true,recovery:true,recoveryFrom:plan.confidence,priorSeries:plan.series||[],series:selected.series};
  const result=await x.schedule(selected.series,selected.candidate,{strategyTrial:trial});
  if(result?.ok){
   const list=L(EXP,{})[selected.series]||[],createdExp=list[list.length-1];createdExp&&(createdExp.recoveryExperiment={strategyKey:plan.key,version:24,recoveryFrom:plan.confidence,originalTests:plan.tests,originalSeries:plan.series||[],originalWeightedSignal:plan.weightedSignal??null,attempt:N(state[plan.key]?.attempts)+1});
   const fresh=L(EXP,{});fresh[selected.series]=list;S(EXP,fresh);
   state[plan.key]={status:"SCHEDULED",attempts:N(state[plan.key]?.attempts)+1,experimentId:createdExp?.id||null,series:selected.series,updatedAt:Date.now(),version:23};
   created.push({key:plan.key,series:selected.series,experimentId:createdExp?.id||null});
  }else state[plan.key]={status:"WAITING",reason:result?.reason||"Scheduler declined the recovery experiment.",updatedAt:Date.now(),version:23};
 }
 const planKeys=new Set(plans.map(x=>x.key));Object.keys(state).forEach(k=>{if(!planKeys.has(k)&&state[k].status!=="RETIRED"&&state[k].status!=="RESTORED")state[k]={...state[k],status:"RESTORED",reason:"Fresh evidence no longer meets the recovery trigger.",updatedAt:Date.now(),version:23}});S(key,state);return created;
}
async function generateReplacementExperiments(){
 const rep=window.CrowSpaceStrategyReplacement;if(!rep)return[];
 const ready=rep.generate(),state=rep.state(),x=window.CrowSpaceExperimentExplorer,p=window.CrowSpaceExperimentPortfolio;
 if(!x?.candidates||!x?.schedule||!p)return[];
 const out=[],expAll=L(EXP,{});
 for(const item of ready){
  if(item.status!=="READY_FOR_CONTROLLED_TEST")continue;
  const key=item.replacementKey, strategy=item.replacement?.strategy;if(!strategy)continue;
  const selected=(item.replacement?.series||[]).find(s=>!(expAll[s]||[]).some(e=>e.status==="active"&&!e.completedAt)) || Object.keys(expAll).find(s=>!(expAll[s]||[]).some(e=>e.status==="active"&&!e.completedAt));
  if(!selected)continue;
  const action=(x.candidates(selected)||[])[0];if(!action)continue;
  const holdout=window.CrowSpaceControlledHoldouts?.capture?await window.CrowSpaceControlledHoldouts.capture(selected,[]):null;if(!holdout)continue;
  const baseline=p.strategyBaseline?p.strategyBaseline(selected):{};
  const trial={key,strategy,mutation:item.replacement.mutation,parent:item.originalKey,baseline,holdout,capturedAt:Date.now(),version:25,controlledHoldout:true,replacement:true,replaces:item.originalKey,series:selected,requiredFreshEvidence:true};
  const r=await x.schedule(selected,action,{strategyTrial:trial});
  if(r?.ok){
   const list=L(EXP,{})[selected]||[],e=list[list.length-1];
   if(e)e.replacementExperiment={originalKey:item.originalKey,replacementKey:key,version:25};
   const fresh=L(EXP,{});fresh[selected]=list;S(EXP,fresh);
   const st=L("crowspace-strategy-replacements-v25",{});st[item.originalKey]={...st[item.originalKey],status:"TESTING",experimentId:e?.id||null,series:selected,updatedAt:Date.now(),version:25};S("crowspace-strategy-replacements-v25",st);
   out.push({originalKey:item.originalKey,replacementKey:key,experimentId:e?.id||null});
  }
 }
 return out;
}
async function orchestrate(s){
 const portfolio=window.CrowSpaceExperimentPortfolio;
 const explorer=window.CrowSpaceExperimentExplorer;
 const evidence=window.CrowSpaceStrategyEvidence;
 const evo=L(EVOL,{candidates:[],tested:[]});
 const ready=(evo.candidates||[]).find(x=>x.status==="READY"||x.status==="REPLICATE");
 if(portfolio?.chooseForStrategy&&explorer?.candidates&&explorer?.schedule&&ready&&!(window.CrowSpaceRecoveryIntelligence?.canResurrect&&ready.key&&!window.CrowSpaceRecoveryIntelligence.canResurrect(ready.key))){
  const priorSeries=ready.priorSeries||ready.testedSeries||[]; const selected=portfolio.chooseForStrategy(ready.strategy, evidence?.chooseReplicationSeries?priorSeries:priorSeries);
  const action=(selected?explorer.candidates(selected.series):[])[0];
  const exps=L(EXP,{})[selected?.series]||[],active=exps.find(e=>e.status==="active"&&!e.completedAt);
  const existing=(L(EXP,{})[selected?.series]||[]).find(e=>e.strategyTrial?.key===ready.key&&!e.lifecycleCompletedAt);
  if(selected?.series&&action&&!active&&!existing){
   const baseline=portfolio.strategyBaseline?portfolio.strategyBaseline(selected.series):{observations:0,experiments:0,avgViewsPerCaw:0,interactionRate:0}; const holdout=window.CrowSpaceControlledHoldouts?.capture?await window.CrowSpaceControlledHoldouts.capture(selected.series,priorSeries):null; const trial={key:ready.key,parent:ready.parent,strategy:ready.strategy,mutation:ready.mutation,baseline,holdout,capturedAt:Date.now(),version:19,replication:!!ready.replication,priorSeries,matchedReplication:!!ready.replication,controlledHoldout:!!holdout,series:selected.series}; const r=await explorer.schedule(selected.series,action,{strategyTrial:trial});
   const oa=L(ORCH,{});oa[selected.series]={status:r?.ok?"STRATEGY TEST SCHEDULED":"WAITING",updatedAt:Date.now(),reason:r?.reason||"",automatic:true,strategyEvolution:true,strategyKey:ready.key,replication:!!ready.replication,version:19};S(ORCH,oa);if(r?.ok)return;
  }
 }
 if(portfolio?.choose){
  const chosen=portfolio.choose();
  if(chosen?.series&&chosen.series!==s){
   const exps=L(EXP,{})[chosen.series]||[],active=exps.find(e=>e.status==="active"&&!e.completedAt);
   if(!active&&window.CrowSpaceExperimentExplorer?.autoSchedule){
    const r=await window.CrowSpaceExperimentExplorer.autoSchedule(chosen.series);
    const oa=L(ORCH,{});oa[chosen.series]={status:r?.ok?"SCHEDULED":"WAITING",updatedAt:Date.now(),reason:r?.reason||"",automatic:true,portfolioSelected:true,portfolioMode:chosen.mode,portfolioPriority:chosen.priority,version:9};S(ORCH,oa);return;
   }
  }
 }const exps=L(EXP,{})[s]||[],active=exps.find(e=>e.status==="active"&&!e.completedAt),sch=L(SCHED,{}),cur=sch[s],now=Date.now();if(active){const a=L(ORCH,{});a[s]={status:"ACTIVE",updatedAt:now,experimentId:active.id,version:6};S(ORCH,a);return}if(cur?.cooldownUntil&&now<N(cur.cooldownUntil)){const a=L(ORCH,{});a[s]={status:"COOLDOWN",updatedAt:now,cooldownUntil:cur.cooldownUntil,message:"Next experiment unlocks "+new Date(cur.cooldownUntil).toLocaleString(),version:6};S(ORCH,a);return}if(window.CrowSpaceExperimentExplorer?.autoSchedule){const r=await window.CrowSpaceExperimentExplorer.autoSchedule(s),a=L(ORCH,{});a[s]={status:r?.ok?"SCHEDULED":"WAITING",updatedAt:Date.now(),reason:r?.reason||"",automatic:true,version:6};S(ORCH,a)}}
function render(){const recovery=reEvaluationPlan();const s=$( "studioSeries")?.value||"all",old=$( "experimentLifecycle");if(s==="all"){old?.remove();return}const all=L(EXP,{}),list=all[s]||[],active=list.find(e=>e.status==="active"),orch=L(ORCH,{})[s],recent=list.filter(e=>e.lifecycleCompletedAt).sort((a,b)=>b.lifecycleCompletedAt-a.lifecycleCompletedAt).slice(0,3),el=old||document.createElement("section");if(!old){el.id="experimentLifecycle";$("experimentExplorationEngine")?.after(el)}el.className="card experiment-lifecycle";const state=active?"ACTIVE":orch?.status==="SCHEDULED"?"NEXT TEST SCHEDULED":"SCHEDULER RELEASED";el.innerHTML='<div class="life-head"><div><span>STRATEGY RE-EVALUATION ENGINE // V22</span><h3>Confidence Failures Trigger Fresh Evidence</h3><small>Experiments close, evaluate, enter memory, release the scheduler, and automatically queue the next eligible test.</small></div><b>'+E(state)+'</b></div><div class="life-orchestrator"><b>NEXT-TEST ORCHESTRATOR</b><span>'+E(orch?.reason||orch?.message||(orch?.status==="SCHEDULED"?"The next experiment has been scheduled automatically.":"Evaluating the next eligible experiment."))+'</span></div>'+(recent.length?'<div class="life-list">'+recent.map(e=>'<article><div><strong>'+E(e.name)+'</strong><small>'+E(e.lifecycleReason||"Completed")+' · '+new Date(e.completedAt).toLocaleString()+'</small></div><em>'+E((L(DEC,{})[s]?.[e.id]?.decision?.status)||"EVALUATED")+'</em></article>').join("")+'</div>':'<div class="life-empty">No autonomous lifecycle completions yet.</div>')}
async function run(){try{await lifecycle();const s=$( "studioSeries")?.value||"all";if(s!=="all"){if(window.CrowSpaceRecoveryIntelligence?.analyze)window.CrowSpaceRecoveryIntelligence.analyze();if(window.CrowSpaceStrategyReplacement?.generate)window.CrowSpaceStrategyReplacement.generate();await generateReplacementExperiments();await generateRecoveryExperiments();await orchestrate(s)}render()}catch(e){console.warn("CrowSpace Experiment Lifecycle",e)}}
setTimeout(run,6500);setInterval(run,5000);document.addEventListener("change",e=>{if(e.target?.id==="studioSeries")setTimeout(run,500)});window.CrowSpaceExperimentLifecycle={run,lifecycle,orchestrate,decisionFor:decide};
window.CrowSpaceLifecycle={run,lifecycle,orchestrate,decide,reEvaluationPlan,generateRecoveryExperiments};\n})();