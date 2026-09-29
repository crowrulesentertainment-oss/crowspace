/* CrowSpace — Experiment Exploration Engine v1
   Browser-only candidate generation from learned actions and experiment memory.
*/
(function(){
const LEARN="crowspace-action-learning-v1",MEM="crowspace-experiment-pattern-library-v1",DEC="crowspace-experiment-decisions-v1",EXP="crowspace-action-experiments-v1";
const $=id=>document.getElementById(id),N=x=>Number(x)||0,F=n=>Math.round(N(n)).toLocaleString(),L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v)),E=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
function pairKey(a,b){return[a,b].sort().join("::")}
function candidates(s){
 const learned=L(LEARN,{})[s]||{},memory=Object.values(L(MEM,{})[s]||{}),dec=L(DEC,{})[s]||{},tested=new Set(memory.map(x=>x.patternKey)),types=Object.entries(learned).filter(([,x])=>N(x.actions)>=2).map(([k,x])=>({type:k,actions:N(x.actions),avgViews:N(x.avgViews)})).sort((a,b)=>b.avgViews-a.avgViews);
 const out=[];
 const push=(kind,a,b,reason,priority)=>{const key=pairKey(a,b);if(a&&b&&a!==b&&!tested.has(key)&&!out.some(x=>x.key===key))out.push({key,kind,a,b,reason,priority})};
 const uncertain=memory.filter(x=>x.status==="RETEST").sort((a,b)=>(b.completedAt||0)-(a.completedAt||0));
 uncertain.slice(0,3).forEach(x=>push("RETEST",x.arms[0].type,x.arms[1].type,"Retest an earlier comparison whose evidence was inconclusive.", "HIGH"));
 types.slice(0,4).forEach((a,i)=>types.slice(i+1).forEach(b=>push("EXPLORE",a.type,b.type,a.actions>=5?"Explore a new combination around a repeatedly measured pattern.":"Explore a new combination using two measured action patterns.","MEDIUM")));
 types.slice(0,3).forEach(a=>["OPTIMIZE","ENGAGE","PUBLISH","CADENCE","AMPLIFY"].forEach(v=>{if(v!==a.type)push("VARIATION",a.type,v,"Create a variation around "+a.type+" by testing it against a different action pattern.","MEDIUM")}));
 return out.slice(0,8);
}
function render(){
 const s=$( "studioSeries")?.value||"all",box=$( "experimentExplorationEngine");
 if(s==="all"){box?.remove();return}
 const cs=candidates(s);
 if(!box){$( "experimentPatternLibrary")?.after(document.createElement("section"));const b=document.createElement("section");b.id="experimentExplorationEngine";$( "experimentPatternLibrary")?.after(b)}
 const el=$( "experimentExplorationEngine");el.className="card experiment-exploration-engine";
 el.innerHTML='<div class="explore-head"><div><span>EXPERIMENT EXPLORATION // CANDIDATES</span><h3>What Should We Test Next?</h3><small>New combinations, successful-pattern variations and deliberate retests are generated from local memory.</small></div></div>'+(cs.length?'<div class="explore-list">'+cs.map((x,i)=>'<article><div><em>'+E(x.kind)+'</em><b>'+E(x.a)+' <span>vs</span> '+E(x.b)+'</b><small>'+E(x.reason)+'</small></div><button data-explore="'+i+'">Create Test</button></article>').join("")+'</div>':'<div class="explore-empty">No new candidate is available yet. Complete more measured action outcomes or an inconclusive experiment.</div>');
 el.querySelectorAll("[data-explore]").forEach(btn=>btn.onclick=()=>{
   const x=cs[Number(btn.dataset.explore)],all=L(EXP,{}),list=all[s]||[],id=s+"-"+Date.now(),e={id,name:x.a+" vs "+x.b,series:s,status:"active",createdAt:Date.now(),explorationKind:x.kind,arms:[{type:x.a,outcomes:[],taskIds:[]},{type:x.b,outcomes:[],taskIds:[]}]};
   list.push(e);all[s]=list;
   const tasks=L("crowspace-growth-action-tasks-v1",{});tasks[s]??=[];
   e.arms.forEach((a,i)=>tasks[s].push({id:s+"-exp-"+id+"-"+i,title:"Experiment "+(i?"B":"A")+" • "+a.type,detail:"Exploration "+x.kind+": complete this labeled arm and publish the associated Caw(s).",priority:"HIGH",due:new Date(Date.now()+i*86400000).toISOString(),completed:false,created:Date.now(),experimentId:id,experimentArm:i,experimentSeries:s,attributedCawIds:[],attributedCaws:[]}));
   S(EXP,all);S("crowspace-growth-action-tasks-v1",tasks);render();
 });
}
window.CrowSpaceExperimentExplorer={candidates,render};
setTimeout(render,5000);setInterval(render,5000);document.addEventListener("change",e=>{if(e.target?.id==="studioSeries")setTimeout(render,900)});
})();