/* CrowSpace — Growth Action Execution Board v1
   Browser-only execution layer for Audience Growth Action Plans.
*/
(function(){
const KEY="crowspace-growth-action-tasks-v1",PLANS="crowspace-growth-action-plans-v1",SNAP="crowspace-series-growth-v1",DB="crowspace-caws",STORE="videos",EXP="crowspace-action-experiments-v1";
const $=id=>document.getElementById(id),L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v)),E=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m])),F=n=>Math.round(Number(n)||0).toLocaleString();
function allCaws(){return new Promise(ok=>{try{const r=indexedDB.open(DB);r.onsuccess=()=>{try{const q=r.result.transaction(STORE,"readonly").objectStore(STORE).getAll();q.onsuccess=()=>ok(q.result||[]);q.onerror=()=>ok([])}catch(e){ok([])}};r.onerror=()=>ok([])}catch(e){ok([])}})}
async function metrics(series,since,until=Date.now()){const items=await allCaws(),list=items.filter(x=>(x.series||"")===series&&x.status==="published"&&new Date(x.publishedAt||x.created||0).getTime()>=since&&new Date(x.publishedAt||x.created||0).getTime()<=until);return{caws:list.length,views:list.reduce((n,x)=>n+(Number(x.views)||Number(x.viewCount)||0),0),interactions:list.reduce((n,x)=>n+(Number(x.likes)||0)+(Number(x.comments)||0)+(Number(x.recasts)||0),0)}}
async function attributedCaws(series,since,until=Date.now()){const items=await allCaws();return items.filter(x=>(x.series||"")===series&&x.status==="published"&&new Date(x.publishedAt||x.created||0).getTime()>=since&&new Date(x.publishedAt||x.created||0).getTime()<=until).map(x=>{const views=Number(x.views)||Number(x.viewCount)||0,interactions=(Number(x.likes)||0)+(Number(x.comments)||0)+(Number(x.recasts)||0);return{id:x.id,caption:x.caption||"Untitled Caw",publishedAt:x.publishedAt||"",views,interactions,conversionRate:views?interactions/views:0}})}
function actions(){const b=$("growthActionPlans");return b?[...b.querySelectorAll(".ap-list article")].map((el,i)=>({i,title:el.querySelector("b")?.textContent||"Growth action",detail:el.querySelector("small")?.textContent||"",priority:el.querySelector("em")?.textContent||"MEDIUM",done:!!el.querySelector("input")?.checked})):[]}
function key(){return $("studioSeries")?.value||"all"}
function ensure(series,acts){
 if(series==="all"||!acts.length)return[];
 const all=L(KEY,{}), now=new Date(), base=new Date(now); base.setHours(23,59,59,999);
 const existing=all[series]||[];
 const out=acts.map((a,i)=>{let t=existing.find(x=>x.sourceIndex===i);if(t)return t;const d=new Date(base);d.setDate(d.getDate()+Math.min(i,6));return{id:series+"-"+Date.now()+"-"+i,sourceIndex:i,title:a.title,detail:a.detail,priority:a.priority,due:d.toISOString(),completed:false,created:Date.now()};});
 all[series]=out;S(KEY,all);syncExperiments(series,out);return out;
}

function syncExperiments(series,tasks){
 const exps=L(EXP,{}),list=exps[series]||[],now=Date.now();
 list.filter(e=>e.status==="active").forEach(e=>{
  e.arms.forEach((arm,idx)=>{
   const matching=tasks.filter(t=>t.experimentId===e.id&&t.experimentArm===idx&&t.completed&&t.result);
   arm.taskIds=matching.map(t=>t.id);arm.outcomes=matching.map(t=>({taskId:t.id,views:N(t.result.viewsDelta),interactions:N(t.result.interactionsDelta),caws:N(t.result.cawsPublished),completedAt:t.completedAt||now}));
  });
 });
 exps[series]=list;S(EXP,exps);
}
function createExperimentTasks(series,e){
 const all=L(KEY,{}),tasks=all[series]||[],today=new Date();today.setHours(23,59,59,999);
 e.arms.forEach((arm,idx)=>{if(tasks.some(t=>t.experimentId===e.id&&t.experimentArm===idx))return;const d=new Date(today);d.setDate(d.getDate()+idx);tasks.push({id:series+"-exp-"+e.id+"-"+idx,sourceIndex:100000+idx,title:"Experiment "+(idx?"B":"A")+" • "+arm.type,detail:"Adaptive test arm "+(idx?"B":"A")+" for "+e.name+". Complete this action and publish the associated Caw(s) to generate an outcome.",priority:"HIGH",due:d.toISOString(),completed:false,created:Date.now(),experimentId:e.id,experimentArm:idx,experimentSeries:series});});
 all[series]=tasks;S(KEY,all);
}

function render(){
 const series=key(), acts=actions(); if(series==="all"||!acts.length){$("growthExecutionBoard")?.remove();return}
 const tasks=ensure(series,acts), box=$("growthExecutionBoard")||document.createElement("section");
 box.id="growthExecutionBoard";box.className="card growth-execution-board";
 if(!$("growthExecutionBoard"))$("growthActionPlans")?.after(box);
 const today=new Date();today.setHours(0,0,0,0),week=new Date(today);week.setDate(week.getDate()+7);
 const groups={today:[],week:[],upcoming:[],done:[]};
 tasks.forEach(t=>{if(t.completed)groups.done.push(t);else{const d=new Date(t.due);d.setHours(0,0,0,0);if(d<=today)groups.today.push(t);else if(d<=week)groups.week.push(t);else groups.upcoming.push(t)}});
 const item=(t)=>'<article class="'+(t.completed?"done":"")+'"><label><input type="checkbox" data-task="'+E(t.id)+'" '+(t.completed?"checked":"")+'><span><b>'+E(t.title)+'</b><small>'+E(t.detail)+'</small>'+(t.result?'<div class="task-result">'+F(t.result.viewsDelta)+' views • '+F(t.result.interactionsDelta)+' interactions • '+F(t.result.cawsPublished)+' Caws</div>':'')+'</span></label><div class="task-meta"><em>'+E(t.priority)+'</em><time>'+new Date(t.due).toLocaleDateString(undefined,{month:"short",day:"numeric"})+'</time></div></article>';
 const section=(name,list)=>list.length?'<div class="exec-group"><h4>'+name+' <span>'+list.length+'</span></h4>'+list.map(item).join("")+'</div>':"";
 box.innerHTML='<div class="exec-head"><div><span>GROWTH EXECUTION</span><h3>Action Queue</h3><small>Turn recommendations into dated, trackable creator tasks. Stored only in this browser.</small></div><button id="execReset">Rebuild Queue</button></div><div class="exec-summary"><b>'+tasks.filter(t=>!t.completed).length+'</b> open <b>'+tasks.filter(t=>t.completed).length+'</b> completed</div>'+section("TODAY",groups.today)+section("THIS WEEK",groups.week)+section("UPCOMING",groups.upcoming)+section("COMPLETED",groups.done)+'</div>';
 box.querySelectorAll("[data-task]").forEach(c=>c.onchange=async()=>{const all=L(KEY,{}),t=(all[series]||[]).find(x=>x.id===c.dataset.task);if(!t)return;if(c.checked){const completedAt=Date.now(),before=t.baseline||await metrics(series,t.created||Date.now(),completedAt),after=await metrics(series,t.created||Date.now(),completedAt),caws=await attributedCaws(series,t.created||Date.now(),completedAt);t.baseline=before;t.attributedCawIds=caws.map(x=>x.id);t.attributedCaws=caws;t.result={viewsDelta:Math.max(0,after.views-before.views),interactionsDelta:Math.max(0,after.interactions-before.interactions),cawsPublished:caws.length,avgViewsPerCaw:caws.length?caws.reduce((n,x)=>n+x.views,0)/caws.length:0,avgInteractionsPerCaw:caws.length?caws.reduce((n,x)=>n+x.interactions,0)/caws.length:0,conversionRate:after.views?after.interactions/after.views:0};t.completedAt=completedAt;t.completed=true}else{t.completed=false;t.completedAt=null;t.result=null;t.attributedCawIds=[];t.attributedCaws=[]}S(KEY,all);render()});
 $("execReset").onclick=()=>{const all=L(KEY,{});delete all[series];S(KEY,all);render()};
}
setTimeout(render,2400);setInterval(render,5000);document.addEventListener("change",e=>{if(e.target?.id==="studioSeries")setTimeout(render,300)});
})();