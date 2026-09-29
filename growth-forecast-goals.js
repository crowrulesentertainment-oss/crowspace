/* CrowSpace — Audience Growth Forecasting & Goals v1
   Browser-only. Forecasts are estimates derived from local snapshots; no Supabase.
*/
(function(){
  const DB="crowspace-caws",STORE="videos",SNAP="crowspace-series-growth-v1",GOALS="crowspace-audience-goals-v1";
  const $=id=>document.getElementById(id),num=x=>Number(x)||0,fmt=n=>num(n).toLocaleString();
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const load=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||"")||f}catch(e){return f}},save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  const pct=(a,b)=>b?(a/b*100):0, dayKey=d=>new Date(d).toISOString().slice(0,10);
  function readAll(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB);r.onsuccess=()=>{try{const q=r.result.transaction(STORE,"readonly").objectStore(STORE).getAll();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>reject(q.error)}catch(e){resolve([])}};r.onerror=()=>reject(r.error)})}
  function hist(s){return (load(SNAP,{})[s]||[]).slice().sort((a,b)=>a.date.localeCompare(b.date))}
  function calc(h){
    if(h.length<2)return {daily:0,weekly:0,confidence:"Limited",note:"Collect more daily snapshots before relying on the forecast."};
    const recent=h.slice(-8),deltas=[]; for(let i=1;i<recent.length;i++)deltas.push(num(recent[i].views)-num(recent[i-1].views));
    const daily=deltas.reduce((a,b)=>a+b,0)/deltas.length;
    const weekly=daily*7, coverage=Math.min(1,h.length/14), stability=deltas.length?Math.max(0,1-Math.abs(deltas.reduce((a,b)=>a+b,0)/deltas.length)/(Math.abs(daily)+1)):0;
    const confidence=h.length>=30?"High":h.length>=14?"Moderate":"Limited";
    return {daily,weekly,confidence,note:h.length<14?"Forecast confidence will improve as more daily snapshots accumulate.":"Based on recent local snapshot pace."};
  }
  function forecast(h,days){const c=calc(h),last=num(h.at(-1)?.views);return Math.max(0,last+c.daily*days)}
  function render(items){
    const sel=$("studioSeries"); if(!sel||sel.value==="all")return;
    const s=sel.value,h=hist(s),c=calc(h),last=num(h.at(-1)?.views),goals=load(GOALS,{}),g=goals[s]||{};
    const now=new Date(), targetDate=g.targetDate?new Date(g.targetDate):new Date(now.getTime()+30*864e5), days=Math.max(1,Math.ceil((targetDate-now)/864e5));
    const targetViews=num(g.viewTarget),targetInteractions=num(g.interactionTarget),currentInteractions=(items.filter(x=>(x.series||"")===s&&x.status==="published")).reduce((n,x)=>n+num(x.likes)+num(x.comments)+num(x.recasts),0);
    const projected=forecast(h,days), required=targetViews>last?(targetViews-last)/days:0, progress=targetViews?pct(last,targetViews):0;
    const status=targetViews===0?"Set a goal":progress>=100?"Goal reached":projected>=targetViews?"On track":c.daily>0&&required<=c.daily*1.15?"Needs attention":"Behind pace";
    let box=$("growthForecastGoals");if(!box){$("audienceIntelligence")?.insertAdjacentHTML("afterend",'<section id="growthForecastGoals" class="card growth-forecast-goals"></section>');box=$("growthForecastGoals")}if(!box)return;
    box.innerHTML='<div class="fg-head"><div><span>FORECASTING & GOALS</span><h3>'+esc(s)+'</h3><small>Local snapshots only • forecasts are estimates, not guarantees</small></div><button id="fgSetGoal">Set / Edit Goals</button></div>'+
      '<div class="fg-grid"><article><small>30-DAY FORECAST</small><strong>'+fmt(forecast(h,30))+'</strong><em>'+c.confidence+' confidence</em></article><article><small>60-DAY FORECAST</small><strong>'+fmt(forecast(h,60))+'</strong><em>local estimate</em></article><article><small>90-DAY FORECAST</small><strong>'+fmt(forecast(h,90))+'</strong><em>local estimate</em></article><article><small>DAILY PACE</small><strong>'+((c.daily>=0?"+":"")+fmt(c.daily))+'</strong><em>'+fmt(c.weekly)+' / week</em></article></div>'+
      '<div class="fg-two"><div class="fg-section"><b>GOAL PROGRESS</b><div class="fg-progress"><span style="width:'+Math.min(100,Math.max(0,progress))+'%"></span></div><div class="fg-meta"><span>'+fmt(last)+' / '+(targetViews?fmt(targetViews):"No target")+' views</span><strong>'+esc(status)+'</strong></div><small>Target date: '+(g.targetDate||"Not set")+'</small>'+(targetViews?'<p>Required pace: <b>'+fmt(required)+'</b> views/day • Current pace: <b>'+fmt(c.daily)+'</b> views/day</p>':"")+'</div>'+
      '<div class="fg-section"><b>INTERACTION GOAL</b><div class="fg-number">'+fmt(currentInteractions)+' <small>/ '+(targetInteractions?fmt(targetInteractions):"No target")+'</small></div><small>'+ (targetInteractions?(pct(currentInteractions,targetInteractions).toFixed(1)+"% of target"):"Set an interaction target to track progress.")+'</small></div></div>'+
      '<div class="fg-section"><b>PROJECTED PATH</b><div class="fg-path"><i style="height:'+Math.min(100,Math.max(5,pct(last,Math.max(last,forecast(h,90)))))+'%"></i><i style="height:'+Math.min(100,Math.max(5,pct(forecast(h,30),Math.max(last,forecast(h,90)))))+'%"></i><i style="height:'+Math.min(100,Math.max(5,pct(forecast(h,60),Math.max(last,forecast(h,90)))))+'%"></i><i style="height:100%"></i></div><div class="fg-labels"><span>Now</span><span>30d</span><span>60d</span><span>90d</span></div><small>'+esc(c.note)+'</small></div>'+
      '<div class="fg-milestones"><b>MILESTONES</b><div id="fgMilestones"></div></div>';
    const milestones=[100,500,1000,5000,10000,25000,50000,100000];
    const reached=milestones.filter(m=>last>=m), next=milestones.find(m=>last<m);
    $("fgMilestones").innerHTML=(reached.length?reached.map(m=>'<span>✓ '+fmt(m)+' views</span>').join(""):"<small>No view milestones reached yet.</small>")+(next?'<span class="next">Next: '+fmt(next)+'</span>':"");
    $("fgSetGoal").onclick=()=>{
      const view=prompt("Monthly / target views for this series:",targetViews||""); if(view===null)return;
      const interaction=prompt("Target interactions:",targetInteractions||""); if(interaction===null)return;
      const date=prompt("Target date (YYYY-MM-DD):",g.targetDate||dayKey(new Date(Date.now()+30*864e5)));if(date===null)return;
      goals[s]={viewTarget:num(view),interactionTarget:num(interaction),targetDate:date,updatedAt:new Date().toISOString()};save(GOALS,goals);render(items);
    };
  }
  async function run(){try{render(await readAll())}catch(e){console.warn("CrowSpace Forecasting & Goals",e)}}
  setTimeout(run,1300);setInterval(run,5000);document.addEventListener("change",e=>{if(e.target?.id==="studioSeries")setTimeout(run,80)});
})();