/* CrowSpace — Growth Action Execution Board v1
   Browser-only execution layer for Audience Growth Action Plans.
*/
(function(){
const KEY="crowspace-growth-action-tasks-v1",PLANS="crowspace-growth-action-plans-v1",SNAP="crowspace-series-growth-v1";
const $=id=>document.getElementById(id),L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v)),E=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m])),F=n=>Math.round(Number(n)||0).toLocaleString();
function actions(){const b=$("growthActionPlans");return b?[...b.querySelectorAll(".ap-list article")].map((el,i)=>({i,title:el.querySelector("b")?.textContent||"Growth action",detail:el.querySelector("small")?.textContent||"",priority:el.querySelector("em")?.textContent||"MEDIUM",done:!!el.querySelector("input")?.checked})):[]}
function key(){return $("studioSeries")?.value||"all"}
function ensure(series,acts){
 if(series==="all"||!acts.length)return[];
 const all=L(KEY,{}), now=new Date(), base=new Date(now); base.setHours(23,59,59,999);
 const existing=all[series]||[];
 const out=acts.map((a,i)=>{let t=existing.find(x=>x.sourceIndex===i);if(t)return t;const d=new Date(base);d.setDate(d.getDate()+Math.min(i,6));return{id:series+"-"+Date.now()+"-"+i,sourceIndex:i,title:a.title,detail:a.detail,priority:a.priority,due:d.toISOString(),completed:false,created:Date.now()};});
 all[series]=out;S(KEY,all);return out;
}
function render(){
 const series=key(), acts=actions(); if(series==="all"||!acts.length){$("growthExecutionBoard")?.remove();return}
 const tasks=ensure(series,acts), box=$("growthExecutionBoard")||document.createElement("section");
 box.id="growthExecutionBoard";box.className="card growth-execution-board";
 if(!$("growthExecutionBoard"))$("growthActionPlans")?.after(box);
 const today=new Date();today.setHours(0,0,0,0),week=new Date(today);week.setDate(week.getDate()+7);
 const groups={today:[],week:[],upcoming:[],done:[]};
 tasks.forEach(t=>{if(t.completed)groups.done.push(t);else{const d=new Date(t.due);d.setHours(0,0,0,0);if(d<=today)groups.today.push(t);else if(d<=week)groups.week.push(t);else groups.upcoming.push(t)}});
 const item=(t)=>'<article class="'+(t.completed?"done":"")+'"><label><input type="checkbox" data-task="'+E(t.id)+'" '+(t.completed?"checked":"")+'><span><b>'+E(t.title)+'</b><small>'+E(t.detail)+'</small></span></label><div class="task-meta"><em>'+E(t.priority)+'</em><time>'+new Date(t.due).toLocaleDateString(undefined,{month:"short",day:"numeric"})+'</time></div></article>';
 const section=(name,list)=>list.length?'<div class="exec-group"><h4>'+name+' <span>'+list.length+'</span></h4>'+list.map(item).join("")+'</div>':"";
 box.innerHTML='<div class="exec-head"><div><span>GROWTH EXECUTION</span><h3>Action Queue</h3><small>Turn recommendations into dated, trackable creator tasks. Stored only in this browser.</small></div><button id="execReset">Rebuild Queue</button></div><div class="exec-summary"><b>'+tasks.filter(t=>!t.completed).length+'</b> open <b>'+tasks.filter(t=>t.completed).length+'</b> completed</div>'+section("TODAY",groups.today)+section("THIS WEEK",groups.week)+section("UPCOMING",groups.upcoming)+section("COMPLETED",groups.done)+'</div>';
 box.querySelectorAll("[data-task]").forEach(c=>c.onchange=()=>{const all=L(KEY,{});const t=(all[series]||[]).find(x=>x.id===c.dataset.task);if(t){t.completed=c.checked;t.completedAt=c.checked?Date.now():null;S(KEY,all);render()}});
 $("execReset").onclick=()=>{const all=L(KEY,{});delete all[series];S(KEY,all);render()};
}
setTimeout(render,2400);setInterval(render,5000);document.addEventListener("change",e=>{if(e.target?.id==="studioSeries")setTimeout(render,300)});
})();