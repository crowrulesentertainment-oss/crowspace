/* CrowSpace — Experiment Portfolio Intelligence v7
   Browser-only. Coordinates the single experiment slot across all series.
*/
(function(){
const EXP="crowspace-action-experiments-v1",TASK="crowspace-growth-action-tasks-v1",LEARN="crowspace-action-learning-v1",SCHED="crowspace-experiment-scheduler-v1",PORT="crowspace-experiment-portfolio-v1",N=x=>Number(x)||0,L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v)),E=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m])),now=()=>Date.now();
function seriesStats(s){const e=L(EXP,{})[s]||[],t=L(TASKS,{})[s]||[],l=L(LEARN,{})[s]||{},done=e.filter(x=>x.status==="complete"),active=e.find(x=>x.status==="active"),views=done.reduce((n,x)=>n+(x.arms||[]).reduce((m,a)=>m+(a.outcomes||[]).reduce((q,o)=>q+N(o.views),0),0),0),open=t.filter(x=>!x.completed).length,evidence=Object.values(l).reduce((n,x)=>n+N(x.actions),0),recent=done.filter(x=>now()-N(x.completedAt)<30*864e5).length;return{series:s,active,open,experiments:done.length,recent,evidence,views}}
function portfolio(){const ex=L(EXP,{}),series=new Set([...Object.keys(ex),...Object.keys(L(LEARN,{})),...Object.keys(L(TASKS,{}))]);return[...series].filter(Boolean).map(seriesStats)}
function score(x){return Math.round(Math.min(100,10+Math.min(30,x.evidence*2)+Math.min(25,x.recent*8)+Math.min(20,x.open?5:20)+(x.experiments===0?20:0)))}
function choose(){const rows=portfolio().map(x=>({...x,priority:score(x)})).filter(x=>!x.active);return rows.sort((a,b)=>b.priority-a.priority||b.evidence-a.evidence||a.experiments-b.experiments)[0]||null}
function state(){return L(PORT,{})}
function run(){
 const rows=portfolio().map(x=>({...x,priority:score(x)})),chosen=choose(),p=state(),sched=L(SCHED,{}),active=rows.find(x=>x.active),open=rows.reduce((n,x)=>n+x.open,0);
 const out={version:7,updatedAt:now(),capacity:1,activeSeries:active?.series||null,totalOpenTasks:open,selectedSeries:chosen?.series||null,series:rows};
 S(PORT,out);render(out)
}
function render(p){
 let el=document.getElementById("experimentPortfolio");if(!el){el=document.createElement("section");el.id="experimentPortfolio";el.className="card experiment-portfolio";document.getElementById("experimentLifecycle")?.before(el)}
 const active=p.activeSeries, rows=p.series.sort((a,b)=>b.priority-a.priority).slice(0,8);
 el.innerHTML='<div class="portfolio-head"><div><span>EXPERIMENT PORTFOLIO INTELLIGENCE // V7</span><h3>Which Series Should Test Next?</h3><small>One shared experiment slot is allocated across series using evidence, recent experimentation, open queue load, and unmet testing opportunity.</small></div><b>'+E(active?"SLOT OCCUPIED":"SLOT AVAILABLE")+'</b></div><div class="portfolio-summary"><div><small>ACTIVE SERIES</small><b>'+E(active||"NONE")+'</b></div><div><small>TOTAL OPEN TASKS</small><b>'+p.totalOpenTasks+'</b></div><div><small>SELECTED NEXT</small><b>'+E(p.selectedSeries||"NONE")+'</b></div></div><div class="portfolio-list">'+(rows.length?rows.map((x,i)=>'<article><div><em>#'+(i+1)+'</em><b>'+E(x.series)+'</b><small>'+x.evidence+' measured actions · '+x.experiments+' completed tests · '+x.recent+' completed in 30d · '+x.open+' open tasks</small></div><strong>'+x.priority+'</strong></article>').join(""):'<div class="portfolio-empty">No series has enough local data for portfolio selection yet.</div>')+'</div>'}
setTimeout(run,7000);setInterval(run,5000);document.addEventListener("change",e=>{if(e.target?.id==="studioSeries")setTimeout(run,700)});window.CrowSpaceExperimentPortfolio={portfolio,choose,run};
})();