/* CrowSpace — Experiment Memory & Pattern Library v1
   Browser-only persistent library of tested action patterns.
*/
(function(){
const EXP="crowspace-action-experiments-v1",DEC="crowspace-experiment-decisions-v1",MEM="crowspace-experiment-pattern-library-v1",LEARN="crowspace-action-learning-v1";
const $=id=>document.getElementById(id),N=x=>Number(x)||0,F=n=>Math.round(N(n)).toLocaleString(),P=n=>(N(n)*100).toFixed(1)+"%",L=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||"")||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v)),E=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
function stats(e,i){const o=e.arms[i]?.outcomes||[],c=o.flatMap(x=>x.caws||[]),v=c.length?c.reduce((n,x)=>n+N(x.views),0):o.reduce((n,x)=>n+N(x.views),0),r=c.length?c.reduce((n,x)=>n+N(x.interactions),0):o.reduce((n,x)=>n+N(x.interactions),0);return{actions:o.length,caws:c.length||o.reduce((n,x)=>n+N(x.cawsPublished),0),views:v,interactions:r,avgViews:c.length?v/c.length:o.length?v/o.length:0,rate:v?r/v:0}}
function sync(s){
 const exps=L(EXP,{})[s]||[],dec=L(DEC,{})[s]||{},all=L(MEM,{});
 const rows=all[s]||{};
 exps.filter(e=>e.status==="complete").forEach(e=>{
   const d=dec[e.id]?.decision||{},a=stats(e,0),b=stats(e,1),pair=[e.arms[0]?.type||"A",e.arms[1]?.type||"B"].sort(),key=pair.join("::");
   let status=d.status==="DECIDED"?(d.a==="CONTINUE"||d.b==="CONTINUE"?"SUCCESSFUL":"FAILED"):d.status==="RETEST"?"RETEST":"COLLECTING";
   rows[e.id]={id:e.id,series:s,name:e.name,patternKey:key,arms:[{type:e.arms[0]?.type,actions:a.actions,caws:a.caws,views:a.views,avgViewsPerCaw:a.avgViews,interactionRate:a.rate},{type:e.arms[1]?.type,actions:b.actions,caws:b.caws,views:b.views,avgViewsPerCaw:b.avgViews,interactionRate:b.rate}],status,decision:d,createdAt:e.createdAt||Date.now(),completedAt:e.completedAt||Date.now(),lastUpdated:Date.now()};
 });
 all[s]=rows;S(MEM,all);return rows;
}
function render(){
 const s=$( "studioSeries")?.value||"all";if(s==="all"){ $( "experimentPatternLibrary")?.remove();return; }
 const rows=sync(s),list=Object.values(rows).sort((a,b)=>b.completedAt-a.completedAt),counts={SUCCESSFUL:0,FAILED:0,RETEST:0,COLLECTING:0};list.forEach(x=>counts[x.status]=(counts[x.status]||0)+1);
 let box=$( "experimentPatternLibrary");if(!box){$( "experimentDecisionEngine")?.after(document.createElement("section"));box=$( "experimentPatternLibrary")||document.createElement("section");if(!box.id){box.id="experimentPatternLibrary";$( "experimentDecisionEngine")?.after(box)}}box.className="card experiment-pattern-library";
 const cards=list.slice(0,8).map(x=>'<article><div class="pattern-top"><b>'+E(x.name)+'</b><em class="pattern-'+x.status.toLowerCase()+'">'+E(x.status)+'</em></div><small>'+new Date(x.completedAt).toLocaleDateString()+' · '+x.arms.map(a=>E(a.type)).join(" vs ")+'</small><div class="pattern-metrics"><span>A '+F(x.arms[0].avgViewsPerCaw)+' avg views/Caw</span><span>B '+F(x.arms[1].avgViewsPerCaw)+' avg views/Caw</span><span>'+x.arms[0].actions+' vs '+x.arms[1].actions+' actions</span></div></article>').join("");
 box.innerHTML='<div class="pattern-head"><div><span>EXPERIMENT MEMORY // PATTERN LIBRARY</span><h3>What We Have Already Tested</h3><small>Persistent browser-only memory prevents repeated combinations and preserves tested patterns by series.</small></div></div><div class="pattern-stats"><span><b>'+counts.SUCCESSFUL+'</b> Successful</span><span><b>'+counts.FAILED+'</b> Failed</span><span><b>'+counts.RETEST+'</b> Retest</span><span><b>'+list.length+'</b> Total Tests</span></div>'+(cards||'<div class="pattern-empty">No completed experiment patterns have been stored yet.</div>');
}
setTimeout(render,4600);setInterval(render,5000);document.addEventListener("change",e=>{if(e.target?.id==="studioSeries")setTimeout(render,800)});
window.CrowSpaceExperimentMemory={load:s=>L(MEM,{})[s]||{},pairTested:(s,a,b)=>{const k=[a,b].sort().join("::");return Object.values(L(MEM,{})[s]||{}).some(x=>x.patternKey===k)},sync};
})();