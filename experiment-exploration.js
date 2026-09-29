/* CrowSpace — Experiment Scheduler Intelligence v4
   Browser-only. No Supabase.
   Selects experiment candidates, learns publishing windows, respects cooldowns,
   estimates experiment duration, checks queue capacity, and schedules A/B arms.
*/
(function(){
const LEARN="crowspace-action-learning-v1",MEM="crowspace-experiment-pattern-library-v1",EXP="crowspace-action-experiments-v1",TASKS="crowspace-growth-action-tasks-v1",SCHED="crowspace-experiment-scheduler-v1",DB="crowspace-caws",STORE="videos";
const COOLDOWN=7*864e5,DURATION=7*864e5,MAX_OPEN_TASKS=6,ARM_GAP=864e5;
const $=id=>document.getElementById(id),N=x=>Number(x)||0,F=n=>Math.round(N(n)).toLocaleString(),L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v)),E=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
function pairKey(a,b){return[a,b].sort().join("::")}
function allCaws(){return new Promise(ok=>{try{const r=indexedDB.open(DB);r.onsuccess=()=>{try{const q=r.result.transaction(STORE,"readonly").objectStore(STORE).getAll();q.onsuccess=()=>ok(q.result||[]);q.onerror=()=>ok([])}catch(e){ok([])}};r.onerror=()=>ok([])}catch(e){ok([])}})}
function candidates(s){
 const learned=L(LEARN,{})[s]||{},memory=Object.values(L(MEM,{})[s]||{}),tested=new Set(memory.map(x=>x.patternKey));
 const types=Object.entries(learned).filter(([,x])=>N(x.actions)>=2).map(([type,x])=>({type,actions:N(x.actions),avgViews:N(x.avgViews),rate:N(x.interactionRate)})).sort((a,b)=>b.avgViews-a.avgViews),out=[];
 const push=(kind,a,b,reason,base)=>{const key=pairKey(a,b);if(!a||!b||a===b||tested.has(key)||out.some(x=>x.key===key))return;const A=types.find(x=>x.type===a),B=types.find(x=>x.type===b),evidence=Math.min(20,Math.max(N(A?.actions),N(B?.actions))*2),novelty=tested.size?Math.min(35,Math.max(5,35-tested.size*2)):35,quality=Math.min(30,Math.round((N(A?.avgViews)+N(B?.avgViews))/2>0?15:5));out.push({key,kind,a,b,reason,score:Math.round(base+evidence+novelty+quality)})};
 memory.filter(x=>x.status==="RETEST").sort((a,b)=>(b.completedAt||0)-(a.completedAt||0)).slice(0,3).forEach(x=>{const age=Math.max(0,Date.now()-(x.completedAt||Date.now()));push("RETEST",x.arms[0]?.type,x.arms[1]?.type,"Retest an earlier comparison whose evidence was inconclusive; older tests receive more scheduling priority.",60+Math.min(15,Math.floor(age/604800000)*3))});
 types.slice(0,6).forEach((a,i)=>types.slice(i+1,6).forEach(b=>push("EXPLORE",a.type,b.type,a.actions>=5||b.actions>=5?"Explore a new combination built from measured action patterns.":"Explore a new combination using two measured action patterns.",35)));
 memory.filter(x=>x.status==="SUCCESSFUL").slice(0,4).forEach(x=>{const known=x.arms.map(a=>a.type);types.filter(t=>!known.includes(t.type)).slice(0,3).forEach(t=>push("VARIATION",known[0],t.type,"Vary a previously successful pattern by introducing another measured action type.",50))});
 return out.sort((a,b)=>b.score-a.score).slice(0,8)
}
function state(){return L(SCHED,{})}
function activeExperiment(s){return(L(EXP,{})[s]||[]).find(e=>e.status==="active"&&!e.completedAt)||null}
function openTaskCount(s){return (L(TASKS,{})[s]||[]).filter(t=>!t.completed).length}
function lastCompletedAt(s){const xs=(L(EXP,{})[s]||[]).filter(e=>e.completedAt).map(e=>N(e.completedAt));return xs.length?Math.max(...xs):0}
function reconcile(s){
 const sched=state(),cur=sched[s],exp=activeExperiment(s);
 if(cur&&cur.experimentId&&!exp){delete sched[s];S(SCHED,sched);return null}
 return cur||null
}
function windowModel(items){
 const pub=items.filter(x=>x.status==="published"&&x.publishedAt),buckets={};
 pub.forEach(x=>{const d=new Date(x.publishedAt),k=d.getDay()+"-"+d.getHours();const v=N(x.views||x.viewCount);buckets[k]||(buckets[k]={day:d.getDay(),hour:d.getHours(),count:0,views:0});buckets[k].count++;buckets[k].views+=v});
 const ranked=Object.values(buckets).map(x=>({...x,avg:x.count?x.views/x.count:0})).sort((a,b)=>b.avg-a.avg||b.count-a.count);
 return ranked.slice(0,12)
}
function nextWindow(model,from,used){
 const now=Math.max(Date.now(),from),base=new Date(now);
 if(!model.length){const d=new Date(base);d.setHours(18,0,0,0);if(d.getTime()<now)d.setDate(d.getDate()+1);return d}
 let best=null;
 for(let i=0;i<14;i++)for(const w of model){const d=new Date(base);d.setDate(d.getDate()+i);d.setHours(w.hour,0,0,0);if(d.getTime()<now)continue;if(used.some(t=>Math.abs(t-d.getTime())<12*3600000))continue;const rank=i*2+(model.indexOf(w)*.05);if(!best||rank<best.rank)best={date:d,rank,w};}
 return best?.date||new Date(now+864e5)
}
function planTiming(s,items){
 const model=windowModel(items),used=[],start=nextWindow(model,Date.now()+3600000,used);used.push(start.getTime());
 const second=nextWindow(model,start.getTime()+ARM_GAP,used);used.push(second.getTime());
 const finish=new Date(Math.max(start.getTime(),second.getTime())+DURATION);
 return {model,start,second,finish}
}
function schedulerStatus(s,items){
 reconcile(s);
 const cur=reconcile(s),active=activeExperiment(s),open=openTaskCount(s),last=lastCompletedAt(s),cooldownUntil=last?last+COOLDOWN:0;
 return {current:cur,active,open,last,cooldownUntil,timing:planTiming(s,items)}
}
async function schedule(s,x,meta){
 const items=await allCaws(),st=schedulerStatus(s,items);
 if(st.active)return{ok:false,reason:"An active experiment is already running."};
 if(st.open+2>MAX_OPEN_TASKS)return{ok:false,reason:"Queue capacity reached: "+st.open+" open tasks of "+MAX_OPEN_TASKS+" allowed."};
 if(Date.now()<st.cooldownUntil)return{ok:false,reason:"Scheduler cooldown is active until "+new Date(st.cooldownUntil).toLocaleString()+"."};
 const all=L(EXP,{}),list=all[s]||[],id=s+"-"+Date.now(),now=Date.now(),t=st.timing;
 const e={id,name:x.a+" vs "+x.b,series:s,status:"active",createdAt:now,scheduledAt:now,startsAt:t.start.getTime(),endsAt:t.finish.getTime(),durationDays:7,armGapHours:24,explorationKind:x.kind,explorationScore:x.score,schedulerVersion:4,strategyTrial:meta?.strategyTrial||null,schedulingWindow:"learned publishing window",arms:[{type:x.a,outcomes:[],taskIds:[],scheduledFor:t.start.getTime()},{type:x.b,outcomes:[],taskIds:[],scheduledFor:t.second.getTime()}]};
 list.push(e);all[s]=list;
 const tasks=L(TASKS,{});tasks[s]??=[];
 e.arms.forEach((a,i)=>{const when=a.scheduledFor,taskId=s+"-exp-"+id+"-"+i;e.arms[i].taskIds.push(taskId);tasks[s].push({id:taskId,title:"Experiment "+(i?"B":"A")+" • "+a.type,detail:"AUTO-SCHEDULED v4 "+x.kind+" arm. Planned start: "+new Date(when).toLocaleString()+". Publish the associated Caw(s) during this window.",priority:"HIGH",due:new Date(when).toISOString(),scheduledFor:when,completed:false,created:now,experimentId:id,experimentArm:i,experimentSeries:s,attributedCawIds:[],attributedCaws:[],autoScheduled:true,schedulerVersion:4,strategyTrial:meta?.strategyTrial||null})});
 S(EXP,all);S(TASKS,tasks);
 const sched=state();sched[s]={experimentId:id,scheduledAt:now,startsAt:t.start.getTime(),endsAt:t.finish.getTime(),cooldownUntil:t.finish.getTime()+COOLDOWN,candidate:{kind:x.kind,a:x.a,b:x.b,score:x.score},windowSource:t.model.length?"historical publishing windows":"fallback window",windowModel:t.model.slice(0,3).map(w=>({day:w.day,hour:w.hour,count:w.count,avg:w.avg})),queueOpenBefore:st.open,queueCapacity:MAX_OPEN_TASKS,version:4};S(SCHED,sched);
 return{ok:true,e}
}
async function autoSchedule(s){const items=await allCaws(),st=schedulerStatus(s,items);if(st.current||st.active||st.open+2>MAX_OPEN_TASKS||Date.now()<st.cooldownUntil)return{ok:false,reason:st.current?"An experiment is already scheduled.":st.active?"An active experiment is already running.":st.open+2>MAX_OPEN_TASKS?"Queue capacity is full.":"Cooldown is active."};const cs=candidates(s);return cs.length?schedule(s,cs[0]):{ok:false,reason:"No experiment candidate is available yet."}}
function render(){
 const s=$( "studioSeries")?.value||"all",old=$( "experimentExplorationEngine");if(s==="all"){old?.remove();return}
 const run=async()=>{const items=await allCaws(),cs=candidates(s),st=schedulerStatus(s,items),current=st.current,can=cs.length&&!current&&!st.active&&st.open+2<=MAX_OPEN_TASKS&&Date.now()>=st.cooldownUntil;
  const el=$( "experimentExplorationEngine")||(()=>{const b=document.createElement("section");b.id="experimentExplorationEngine";$("experimentPatternLibrary")?.after(b);return b})();
  el.className="card experiment-exploration-engine";
  const timing=st.timing,windows=timing.model.slice(0,3).map(w=>"<span>"+["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][w.day]+" "+String(w.hour).padStart(2,"0")+":00 · "+F(w.avg)+" avg views</span>").join("");
  let reason=current?"An experiment is already scheduled.":st.active?"An active experiment is already running.":st.open+2>MAX_OPEN_TASKS?"Queue capacity: "+st.open+"/"+MAX_OPEN_TASKS+" open tasks.":Date.now()<st.cooldownUntil?"Cooldown until "+new Date(st.cooldownUntil).toLocaleString():"Ready to schedule.";
  el.innerHTML='<div class="explore-head"><div><span>EXPERIMENT SCHEDULER INTELLIGENCE // V4</span><h3>What Should We Test — and When?</h3><small>Local scheduling uses learned publishing windows, cooldowns, experiment duration and Growth Execution queue capacity.</small></div></div><div class="scheduler-grid"><div><small>QUEUE CAPACITY</small><b>'+st.open+' / '+MAX_OPEN_TASKS+'</b><em>'+E(reason)+'</em></div><div><small>PLANNED ARM A</small><b>'+new Date(timing.start).toLocaleString(undefined,{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})+'</b><em>selected window</em></div><div><small>PLANNED ARM B</small><b>'+new Date(timing.second).toLocaleString(undefined,{weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})+'</b><em>24-hour separation</em></div><div><small>EXPERIMENT DURATION</small><b>7 DAYS</b><em>through '+new Date(timing.finish).toLocaleDateString(undefined,{month:"short",day:"numeric"})+'</em></div></div><div class="scheduler-windows"><b>LEARNED PUBLISHING WINDOWS</b>'+(windows||"<span>No historical publishing window yet — using a fallback evening window.</span>")+'</div>'+(current?'<div class="explore-scheduled"><b>AUTO-SCHEDULED V4</b><span>'+E(current.candidate.a)+' vs '+E(current.candidate.b)+' · score '+current.candidate.score+(current.strategyTrial?' · strategy trial '+E(current.strategyTrial.mutation||current.strategyTrial.key):'')+' · starts '+new Date(current.startsAt).toLocaleString()+' · ends '+new Date(current.endsAt).toLocaleString()+'</span></div>':'<div class="explore-auto"><button id="autoScheduleExperiment" '+(can?"":"disabled")+'>AUTO-SCHEDULE TOP CANDIDATE</button><small>'+E(reason)+'</small></div>')+(cs.length?'<div class="explore-list">'+cs.map((x,i)=>'<article><div><em>'+E(x.kind)+'</em><b>'+E(x.a)+' <span>vs</span> '+E(x.b)+'</b><small>'+E(x.reason)+' · Exploration score: <strong>'+x.score+'</strong></small></div><button data-explore="'+i+'" '+(current||st.active?"disabled":"")+'>Create Test</button></article>').join("")+'</div>':'<div class="explore-empty">No new candidate is available yet. Complete more measured action outcomes or an inconclusive experiment.</div>');
  const auto=$( "autoScheduleExperiment");if(auto)auto.onclick=async()=>{const r=await autoSchedule(s);if(!r.ok)alert(r.reason);render()};
  el.querySelectorAll("[data-explore]").forEach(btn=>btn.onclick=async()=>{const r=await schedule(s,cs[Number(btn.dataset.explore)]);if(!r.ok)alert(r.reason);render()});
 };
 run();
}
window.CrowSpaceExperimentExplorer={candidates,render,autoSchedule,schedule};
setTimeout(render,5000);setInterval(render,5000);document.addEventListener("change",e=>{if(e.target?.id==="studioSeries")setTimeout(render,900)});
})();