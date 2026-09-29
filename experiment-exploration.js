/* CrowSpace — Experiment Exploration Engine v1
   Browser-only candidate generation from learned actions and experiment memory.
*/
(function(){
const LEARN="crowspace-action-learning-v1",MEM="crowspace-experiment-pattern-library-v1",DEC="crowspace-experiment-decisions-v1",EXP="crowspace-action-experiments-v1",TASKS="crowspace-growth-action-tasks-v1",SCHED="crowspace-experiment-scheduler-v1";
const $=id=>document.getElementById(id),N=x=>Number(x)||0,F=n=>Math.round(N(n)).toLocaleString(),L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v)),E=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
function pairKey(a,b){return[a,b].sort().join("::")}
function candidates(s){
 const learned=L(LEARN,{})[s]||{},memory=Object.values(L(MEM,{})[s]||{}),tested=new Set(memory.map(x=>x.patternKey));
 const types=Object.entries(learned).filter(([,x])=>N(x.actions)>=2).map(([type,x])=>({type,actions:N(x.actions),avgViews:N(x.avgViews),viewsPerCaw:N(x.viewsPerCaw),rate:N(x.interactionRate)})).sort((a,b)=>b.avgViews-a.avgViews);
 const out=[];
 const push=(kind,a,b,reason,base)=>{const key=pairKey(a,b);if(!a||!b||a===b||tested.has(key)||out.some(x=>x.key===key))return;const A=types.find(x=>x.type===a),B=types.find(x=>x.type===b);const evidence=Math.min(20,Math.max(N(A?.actions),N(B?.actions))*2),novelty=tested.size?Math.min(35,Math.max(5,35-(tested.size*2))):35,quality=Math.min(30,Math.round((N(A?.avgViews)+N(B?.avgViews))/2>0?15:5)),score=Math.round(base+evidence+novelty+quality);out.push({key,kind,a,b,reason,score})};
 const uncertain=memory.filter(x=>x.status==="RETEST").sort((a,b)=>(b.completedAt||0)-(a.completedAt||0));
 uncertain.slice(0,3).forEach(x=>{const age=Math.max(0,Date.now()-(x.completedAt||Date.now())),ageBonus=Math.min(15,Math.floor(age/604800000)*3);push("RETEST",x.arms[0]?.type,x.arms[1]?.type,"Retest an earlier comparison whose evidence was inconclusive; its age increases its exploration priority.",60+ageBonus)});
 types.slice(0,6).forEach((a,i)=>types.slice(i+1,6).forEach(b=>push("EXPLORE",a.type,b.type,a.actions>=5||b.actions>=5?"Explore a new combination built from measured action patterns, including a repeatedly observed pattern.":"Explore a new combination using two measured action patterns.",35)));
 const successful=memory.filter(x=>x.status==="SUCCESSFUL");
 successful.slice(0,4).forEach(x=>{const known=x.arms.map(a=>a.type);types.filter(t=>!known.includes(t.type)).slice(0,3).forEach(t=>push("VARIATION",known[0],t.type,"Vary a previously successful pattern by introducing another measured action type.",50))});
 return out.sort((a,b)=>b.score-a.score).slice(0,8);
}
function scheduled(s){return L(SCHED,{})[s]||null}
function schedule(s,x){const all=L(EXP,{}),list=all[s]||[],existing=list.find(e=>e.status==="active"&&!e.completedAt);if(existing)return {ok:false,reason:"An active experiment is already scheduled."};const id=s+"-"+Date.now(),now=Date.now(),e={id,name:x.a+" vs "+x.b,series:s,status:"active",createdAt:now,scheduledAt:now,explorationKind:x.kind,explorationScore:x.score,arms:[{type:x.a,outcomes:[],taskIds:[]},{type:x.b,outcomes:[],taskIds:[]}]};list.push(e);all[s]=list;const tasks=L(TASKS,{});tasks[s]??=[];e.arms.forEach((a,i)=>{const taskId=s+"-exp-"+id+"-"+i;const task={id:taskId,title:"Experiment "+(i?"B":"A")+" • "+a.type,detail:"AUTO-SCHEDULED "+x.kind+" experiment: complete this labeled arm and publish the associated Caw(s).",priority:"HIGH",due:new Date(now+(i*86400000)).toISOString(),completed:false,created:now,experimentId:id,experimentArm:i,experimentSeries:s,attributedCawIds:[],attributedCaws:[],autoScheduled:true};e.arms[i].taskIds.push(taskId);tasks[s].push(task)});S(EXP,all);S(TASKS,tasks);S(SCHED,{...L(SCHED,{}),[s]:{experimentId:id,scheduledAt:now,candidate:{kind:x.kind,a:x.a,b:x.b,score:x.score}}});return {ok:true,e}}
function autoSchedule(s){const cs=candidates(s),existing=scheduled(s);if(!cs.length||existing)return null;return schedule(s,cs[0])}
function render(){
 const s=$( "studioSeries")?.value||"all",box=$( "experimentExplorationEngine");
 if(s==="all"){box?.remove();return}
 const cs=candidates(s);const current=scheduled(s);
 if(!box){$( "experimentPatternLibrary")?.after(document.createElement("section"));const b=document.createElement("section");b.id="experimentExplorationEngine";$( "experimentPatternLibrary")?.after(b)}
 const el=$( "experimentExplorationEngine");el.className="card experiment-exploration-engine";
 el.innerHTML='<div class="explore-head"><div><span>EXPERIMENT EXPLORATION // CANDIDATES</span><h3>What Should We Test Next?</h3><small>New combinations, successful-pattern variations and deliberate retests are generated from local memory. The highest-priority candidate can be auto-scheduled into the execution queue.</small></div></div>'+(current?'<div class="explore-scheduled"><b>AUTO-SCHEDULED</b><span>Experiment '+E(current.candidate.a)+' vs '+E(current.candidate.b)+' · score '+current.candidate.score+' · '+new Date(current.scheduledAt).toLocaleString()+'</span></div>':'<div class="explore-auto"><button id="autoScheduleExperiment">AUTO-SCHEDULE TOP CANDIDATE</button><small>Creates both A/B tasks and assigns them to the Growth Execution Queue.</small></div>')+(cs.length?'<div class="explore-list">'+cs.map((x,i)=>'<article><div><em>'+E(x.kind)+'</em><b>'+E(x.a)+' <span>vs</span> '+E(x.b)+'</b><small>'+E(x.reason)+' · Exploration score: <strong>'+x.score+'</strong></small></div><button data-explore="'+i+'">Create Test</button></article>').join("")+'</div>':'<div class="explore-empty">No new candidate is available yet. Complete more measured action outcomes or an inconclusive experiment.</div>');
 el.querySelectorAll("[data-explore]").forEach(btn=>btn.onclick=()=>{
   const x=cs[Number(btn.dataset.explore)],all=L(EXP,{}),list=all[s]||[],id=s+"-"+Date.now(),e={id,name:x.a+" vs "+x.b,series:s,status:"active",createdAt:Date.now(),explorationKind:x.kind,arms:[{type:x.a,outcomes:[],taskIds:[]},{type:x.b,outcomes:[],taskIds:[]}]};
   list.push(e);all[s]=list;
   const tasks=L("crowspace-growth-action-tasks-v1",{});tasks[s]??=[];
   e.arms.forEach((a,i)=>tasks[s].push({id:s+"-exp-"+id+"-"+i,title:"Experiment "+(i?"B":"A")+" • "+a.type,detail:"Exploration "+x.kind+": complete this labeled arm and publish the associated Caw(s).",priority:"HIGH",due:new Date(Date.now()+i*86400000).toISOString(),completed:false,created:Date.now(),experimentId:id,experimentArm:i,experimentSeries:s,attributedCawIds:[],attributedCaws:[]}));
   S(EXP,all);S("crowspace-growth-action-tasks-v1",tasks);render();
 });
}
window.CrowSpaceExperimentExplorer={candidates,render,autoSchedule,schedule};
setTimeout(render,5000);setInterval(render,5000);document.addEventListener("change",e=>{if(e.target?.id==="studioSeries")setTimeout(render,900)});
})();