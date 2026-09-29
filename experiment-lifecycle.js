/* CrowSpace — Autonomous Experiment Lifecycle v5
   Browser-only. Automatically closes finished experiments, evaluates evidence,
   updates Pattern Memory, and releases the scheduler for the next experiment.
*/
(function(){
const EXP="crowspace-action-experiments-v1",TASK="crowspace-growth-action-tasks-v1",DEC="crowspace-experiment-decisions-v1",MEM="crowspace-experiment-pattern-library-v1",SCHED="crowspace-experiment-scheduler-v1";
const $=id=>document.getElementById(id),N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v)),F=n=>Math.round(N(n)).toLocaleString(),P=n=>(N(n)*100).toFixed(1)+"%",E=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
function stats(e,i){const o=e.arms[i]?.outcomes||[],c=o.flatMap(x=>x.caws||[]),v=c.length?c.reduce((n,x)=>n+N(x.views),0):o.reduce((n,x)=>n+N(x.views),0),r=c.length?c.reduce((n,x)=>n+N(x.interactions),0):o.reduce((n,x)=>n+N(x.interactions),0);return{actions:o.length,caws:c.length||o.reduce((n,x)=>n+N(x.cawsPublished),0),views:v,interactions:r,avgViews:c.length?v/c.length:o.length?v/o.length:0,rate:v?r/v:0}}
function decide(e){const a=stats(e,0),b=stats(e,1);if(a.actions<2||b.actions<2)return{status:"COLLECTING",a:"RETEST",b:"RETEST",reason:"Each arm needs at least 2 measured actions before a decision."};const lift=a.avgViews?((b.avgViews/a.avgViews)-1)*100:0,rateLift=a.rate?((b.rate/a.rate)-1)*100:0;if(lift<10&&lift>-10)return{status:"RETEST",a:"RETEST",b:"RETEST",reason:"The measured view difference is below the 10% decision threshold; collect another round."};const stronger=lift>=10?"B":"A",weaker=stronger==="A"?"B":"A";return{status:"DECIDED",a:stronger==="A"?"CONTINUE":"RETIRE",b:stronger==="B"?"CONTINUE":"RETIRE",reason:stronger+" has "+(lift>=0?"+":"")+lift.toFixed(1)+"% average views/Caw versus "+weaker+". Interaction conversion difference: "+(rateLift>=0?"+":"")+rateLift.toFixed(1)+"%. Treat this as measured evidence, not a guarantee."}}
function decisionFor(e){return decide(e)}
function syncMemory(s,e,d){
 const all=L(MEM,{}),rows=all[s]||{},a=stats(e,0),b=stats(e,1),pair=[e.arms[0]?.type||"A",e.arms[1]?.type||"B"].sort(),key=pair.join("::");
 const status=d.status==="DECIDED"?(d.a==="CONTINUE"||d.b==="CONTINUE"?"SUCCESSFUL":"FAILED"):d.status==="RETEST"?"RETEST":"COLLECTING";
 rows[e.id]={id:e.id,series:s,name:e.name,patternKey:key,arms:[{type:e.arms[0]?.type,actions:a.actions,caws:a.caws,views:a.views,avgViewsPerCaw:a.avgViews,interactionRate:a.rate},{type:e.arms[1]?.type,actions:b.actions,caws:b.caws,views:b.views,avgViewsPerCaw:b.avgViews,interactionRate:b.rate}],status,decision:d,createdAt:e.createdAt||Date.now(),completedAt:e.completedAt||Date.now(),lastUpdated:Date.now(),lifecycleVersion:5};
 all[s]=rows;S(MEM,all)
}
function releaseScheduler(s,e){
 const all=L(SCHED,{}),cur=all[s];if(!cur||cur.experimentId===e.id){all[s]={lastCompletedExperimentId:e.id,releasedAt:Date.now(),cooldownUntil:(e.completedAt||Date.now())+7*864e5,version:5};S(SCHED,all)}
}
function lifecycle(){
 const all=L(EXP,{}),tasks=L(TASK,{}),decs=L(DEC,{}),now=Date.now(),changed=[];
 Object.entries(all).forEach(([s,list])=>{
  decs[s]??={};
  list.filter(e=>e.status==="active"&&!e.lifecycleCompletedAt).forEach(e=>{
   const ts=(tasks[s]||[]).filter(t=>t.experimentId===e.id);
   const completeTasks=ts.length>0&&ts.every(t=>t.completed);
   const expired=N(e.endsAt)>0&&now>=N(e.endsAt);
   if(!completeTasks&&!expired)return;
   e.status="complete";e.completedAt=now;e.lifecycleCompletedAt=now;e.lifecycleReason=completeTasks?"ALL ARMS COMPLETED":"EXPERIMENT WINDOW ENDED";
   const d=decisionFor(e);decs[s][e.id]={experimentId:e.id,updatedAt:now,decision:d,automated:true,version:5};
   syncMemory(s,e,d);releaseScheduler(s,e);changed.push({series:s,name:e.name,reason:e.lifecycleReason,decision:d.status});
  });
 });
 S(EXP,all);S(DEC,decs);return changed
}
function render(){
 const s=$( "studioSeries")?.value||"all",box=$( "experimentLifecycle");
 if(s==="all"){box?.remove();return}
 const all=L(EXP,{}),list=all[s]||[],active=list.find(e=>e.status==="active"),recent=list.filter(e=>e.lifecycleCompletedAt).sort((a,b)=>b.lifecycleCompletedAt-a.lifecycleCompletedAt).slice(0,3);
 const el=box||document.createElement("section");if(!box){el.id="experimentLifecycle";$("experimentExplorationEngine")?.after(el)}
 el.className="card experiment-lifecycle";
 const state=active?("ACTIVE · ends "+new Date(active.endsAt||Date.now()).toLocaleDateString()):"SCHEDULER RELEASED";
 el.innerHTML='<div class="life-head"><div><span>AUTONOMOUS EXPERIMENT LIFECYCLE // V5</span><h3>Experiments Manage Themselves</h3><small>Completed arms or expired windows are automatically closed, evaluated, remembered, and released back to the scheduler.</small></div><b>'+E(state)+'</b></div>'+(recent.length?'<div class="life-list">'+recent.map(e=>'<article><div><strong>'+E(e.name)+'</strong><small>'+E(e.lifecycleReason||"Completed")+' · '+new Date(e.completedAt).toLocaleString()+'</small></div><em>'+E((L(DEC,{})[s]?.[e.id]?.decision?.status)||"EVALUATED")+'</em></article>').join("")+'</div>':'<div class="life-empty">No autonomous lifecycle completions yet.</div>');
}
function run(){try{lifecycle();render()}catch(e){console.warn("CrowSpace Experiment Lifecycle",e)}}
setTimeout(run,6500);setInterval(run,5000);document.addEventListener("change",e=>{if(e.target?.id==="studioSeries")setTimeout(run,500)});
window.CrowSpaceExperimentLifecycle={run,lifecycle,decisionFor};
})();