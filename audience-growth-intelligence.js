/* CrowSpace — Audience Growth Intelligence v1
   Browser-only analytics layer. Reads the existing IndexedDB Caw store and local snapshot history.
*/
(function(){
  const DB="crowspace-caws", STORE="videos", SNAP="crowspace-series-growth-v1";
  const $=id=>document.getElementById(id), esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const num=x=>Number(x)||0, fmt=n=>num(n).toLocaleString();
  const pct=(a,b)=>b?((a/b)*100):0;
  const dateOf=x=>new Date(x?.publishedAt||x?.published_at||x?.published||x?.created||x?.createdAt||x?.updatedAt||Date.now());
  const dayKey=d=>new Date(d).toISOString().slice(0,10);
  const load=()=>{try{return JSON.parse(localStorage.getItem(SNAP)||"{}")||{}}catch(e){return {}}};
  function readAll(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB);r.onsuccess=()=>{try{const q=r.result.transaction(STORE,"readonly").objectStore(STORE).getAll();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>reject(q.error)}catch(e){resolve([])}};r.onerror=()=>reject(r.error)})}
  function signed(n){return (n>=0?"+":"")+fmt(n)}
  function signedPct(n){return (n>=0?"+":"")+n.toFixed(1)+"%"}
  function seriesItems(items,series){return items.filter(x=>(x.series||"")===series&&x.status==="published")}
  function history(series){return (load()[series]||[]).slice().sort((a,b)=>a.date.localeCompare(b.date))}
  function trend(hist){
    if(hist.length<2)return {label:"Collecting data",delta:0,rate:0};
    const recent=hist.slice(-7), prior=hist.slice(-14,-7);
    const a=recent.length?num(recent[recent.length-1].views)-num(recent[0].views):0;
    const b=prior.length>1?num(prior[prior.length-1].views)-num(prior[0].views):0;
    const rate=b?((a-b)/Math.abs(b))*100:0;
    return {label:rate>15?"Accelerating":rate<-15?"Cooling":"Steady",delta:a,rate};
  }
  function impact(items,series){
    const eps=seriesItems(items,series).slice().sort((a,b)=>dateOf(a)-dateOf(b));
    return eps.map((x,i)=>{
      const before=eps[i-1], after=eps[i+1], v=num(x.views||x.viewCount);
      const prior=before?num(before.views||before.viewCount):0;
      const next=after?num(after.views||after.viewCount):0;
      return {...x,_impact:prior?((v-prior)/prior*100):0,_views:v,_next:next};
    }).sort((a,b)=>b._impact-a._impact).slice(0,5);
  }
  function windows(eps){
    const buckets={};
    eps.forEach(x=>{const d=dateOf(x), key=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()]+" "+String(d.getHours()).padStart(2,"0")+":00";(buckets[key]??={n:0,v:0,i:0});buckets[key].n++;buckets[key].v+=num(x.views||x.viewCount);buckets[key].i+=num(x.likes)+num(x.comments)+num(x.recasts)});
    return Object.entries(buckets).map(([k,v])=>({k,n:v.n,views:v.v,avg:v.v/v.n,rate:pct(v.i,v.v)})).filter(x=>x.n>0).sort((a,b)=>b.avg-a.avg).slice(0,4);
  }
  function render(items){
    const sel=$("studioSeries"); if(!sel||sel.value==="all")return;
    const series=sel.value, eps=seriesItems(items,series), hist=history(series), t=trend(hist);
    const avg=eps.length?eps.reduce((n,x)=>n+num(x.views||x.viewCount),0)/eps.length:0;
    const scored=eps.map(x=>({...x,v:num(x.views||x.viewCount),i:num(x.likes)+num(x.comments)+num(x.recasts)}));
    const breakout=scored.filter(x=>x.v>=avg*1.5).sort((a,b)=>b.v-a.v).slice(0,3);
    const under=scored.filter(x=>x.v<avg*.6).sort((a,b)=>a.v-b.v).slice(0,3);
    const w=windows(eps), im=impact(items,series);
    const last=hist[hist.length-1], first=hist[Math.max(0,hist.length-8)];
    const weekly=last&&first?num(last.views)-num(first.views):0;
    const daily=hist.length>1?(num(hist[hist.length-1].views)-num(hist[hist.length-2].views)):0;
    const trajectory=Math.max(0,num(last?.views)+daily*30);
    const interactions=scored.reduce((n,x)=>n+x.i,0), views=scored.reduce((n,x)=>n+x.v,0);
    const momentum=Math.max(-100,Math.min(100,(t.delta/(Math.max(1,avg))*100)*2));
    const all=load(), compare=Object.entries(all).map(([name,h])=>({name,views:num(h.at(-1)?.views),change:h.length>1?num(h.at(-1).views)-num(h[Math.max(0,h.length-8)].views):0})).filter(x=>x.name).sort((a,b)=>b.views-a.views).slice(0,6);
    let box=$("audienceIntelligence"); if(!box){$("seriesBar")?.insertAdjacentHTML("afterend",'<section id="audienceIntelligence" class="card audience-intelligence"></section>');box=$("audienceIntelligence")} if(!box)return;
    const list=(arr,kind)=>arr.length?arr.map(x=>'<div class="ai-row"><b>'+esc(x.caption||("S"+(x.season||1)+" • EP "+(x.episode||"—"))).slice(0,72)+'</b><span>'+fmt(x.v)+' views'+(kind?kind(x):"")+'</span></div>').join(""):'<small class="ai-muted">Not enough local data yet.</small>';
    box.innerHTML='<div class="ai-head"><div><span class="ai-kicker">AUDIENCE GROWTH INTELLIGENCE</span><h3>'+esc(series)+'</h3><small>Derived from local IndexedDB + daily snapshots • no Supabase</small></div><div class="ai-actions"><button id="aiExport">Export History</button><button id="aiImport">Import History</button><input id="aiImportFile" type="file" accept=".json" hidden></div></div>'+
      '<div class="ai-grid"><article><small>GROWTH TREND</small><strong>'+t.label+'</strong><em>'+signedPct(t.rate)+'</em></article><article><small>30-DAY TRAJECTORY</small><strong>'+fmt(trajectory)+'</strong><em>local estimate</em></article><article><small>MOMENTUM</small><strong>'+Math.round(momentum)+'</strong><em>−100 to +100</em></article><article><small>ENGAGEMENT CONVERSION</small><strong>'+pct(interactions,views).toFixed(1)+'%</strong><em>'+fmt(interactions)+' interactions</em></article></div>'+
      '<div class="ai-two"><div class="ai-section"><b>EPISODE IMPACT</b><small>Change versus the previous published episode.</small>'+list(im,x=>'<i class="'+(x._impact>=0?"up":"down")+'">'+signedPct(x._impact)+'</i>')+'</div><div class="ai-section"><b>BEST PUBLISHING WINDOWS</b><small>Based on local episode averages.</small>'+(w.length?w.map(x=>'<div class="ai-row"><b>'+esc(x.k)+'</b><span>'+fmt(Math.round(x.avg))+' avg views</span></div>').join(""):'<small class="ai-muted">More published episodes are needed.</small>')+'</div></div>'+
      '<div class="ai-two"><div class="ai-section"><b>BREAKOUT EPISODES</b>'+list(breakout)+'</div><div class="ai-section"><b>UNDERPERFORMING EPISODES</b>'+list(under)+'</div></div>'+
      '<div class="ai-two"><div class="ai-section"><b>SERIES COMPARISON</b>'+(compare.length?compare.map(x=>'<div class="ai-row"><b>'+esc(x.name)+'</b><span>'+fmt(x.views)+' views • '+signed(x.change)+'</span></div>').join(""):'<small class="ai-muted">Snapshot more than one series to compare them.</small>')+'</div><div class="ai-section"><b>WEEKLY SNAPSHOT</b><p class="ai-report">'+(hist.length<2?'Collecting enough snapshots for a weekly report.':('The series recorded '+signed(weekly)+' views across the latest local week. Current daily movement is '+signed(daily)+' views. The audience trend is '+t.label.toLowerCase()+'.'))+'</p></div></div>'+
      '<div class="ai-foot"><span>Snapshots: '+hist.length+'</span><span>Episodes: '+eps.length+'</span><span>Average: '+fmt(Math.round(avg))+' views/episode</span><span>Last snapshot: '+(last?.date||"—")+'</span></div>';
    $("aiExport").onclick=()=>{const payload={version:1,exportedAt:new Date().toISOString(),snapshots:load()};const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}));a.download="crowspace-audience-history.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
    $("aiImport").onclick=()=>$("aiImportFile").click();
    $("aiImportFile").onchange=e=>{const f=e.target.files?.[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const p=JSON.parse(rd.result);if(!p.snapshots||typeof p.snapshots!=="object")throw Error("Invalid history");const merged=load();for(const [name,rows] of Object.entries(p.snapshots)){const map=new Map((merged[name]||[]).map(x=>[x.date,x]));for(const x of Array.isArray(rows)?rows:[])if(x.date)map.set(x.date,x);merged[name]=[...map.values()].sort((a,b)=>a.date.localeCompare(b.date)).slice(-180)}localStorage.setItem(SNAP,JSON.stringify(merged));render(items)}catch(err){alert("CrowSpace could not import that history file.")}};rd.readAsText(f)};
  }
  async function run(){try{render(await readAll())}catch(e){console.warn("CrowSpace Audience Growth Intelligence",e)}}
  setTimeout(run,1100);setInterval(run,5000);document.addEventListener("change",e=>{if(e.target?.id==="studioSeries")setTimeout(run,60)});
})();