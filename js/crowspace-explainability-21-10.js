/* CrowSpace 21.10 — Recommendation Explainability & Discovery Surfaces */
window.CrowSpaceExplainability21_10=(()=>{
 const version="21.10", esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
 const labels={follow:"Because You Follow",affinity:"People Who Discovered This",trend:"Trending",graph:"Connected to CrowRules",history:"Based on Your Activity",similarity:"Similar Creator"};
 function explain(item){
  const reasons=(item?.reasons||[]).map(String);
  const primary=reasons[0]||"Connected to your CrowSpace discovery graph";
  return {primary,details:reasons.slice(0,3),score:Number(item?.score||0),type:item?.type||"content",id:item?.id||""};
 }
 function badge(item){const e=explain(item);const p=e.primary.toLowerCase();let label="For You";if(p.includes("trend"))label=labels.trend;else if(p.includes("follow"))label=labels.follow;else if(p.includes("people")||p.includes("affinity"))label=labels.affinity;else if(p.includes("connected"))label=labels.graph;else if(p.includes("activity")||p.includes("history"))label=labels.history;else if(p.includes("similar"))label=labels.similarity;return label}
 function whyPanel(item){
  const e=explain(item);
  return '<div class="cr21-10-why"><div class="cr21-10-why-title">WHY AM I SEEING THIS?</div><div class="cr21-10-why-primary">'+esc(e.primary)+'</div>'+(e.details.length?'<ul>'+e.details.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>':"")+'<div class="cr21-10-why-note">CrowSpace uses your follows, activity, graph connections and aggregate discovery signals. You can hide or mark recommendations as not interested.</div></div>';
 }
 function render(items,container,title="FOR YOU"){
  if(!container)return;
  container.innerHTML='<div class="cr21-10-head"><div><span class="cr21-10-kicker">CROWRULES // 21.10</span><h2>'+esc(title)+'</h2></div><span class="cr21-10-transparent">TRANSPARENT RECOMMENDATIONS</span></div><div class="cr21-10-grid">'+(items||[]).map((x,i)=>'<article class="cr21-10-card" data-type="'+esc(x.type)+'" data-id="'+esc(x.id)+'"><div class="cr21-10-rank">'+String(i+1).padStart(2,"0")+'</div><div class="cr21-10-type">'+esc(x.type)+'</div><div class="cr21-10-badge">'+esc(badge(x))+'</div><div class="cr21-10-score">SIGNAL '+Math.round(Number(x.score||0))+'</div><button type="button" class="cr21-10-why-btn" data-why="'+i+'">Why am I seeing this?</button><div class="cr21-10-why-wrap" hidden>'+whyPanel(x)+'</div></article>').join("")+'</div>';
  container.querySelectorAll(".cr21-10-why-btn").forEach(btn=>btn.addEventListener("click",()=>{const w=btn.parentElement.querySelector(".cr21-10-why-wrap");w.hidden=!w.hidden}));
 }
 function install(){
  if(document.getElementById("cr21-10-style"))return;
  const s=document.createElement("style");s.id="cr21-10-style";s.textContent='.cr21-10-head{display:flex;justify-content:space-between;gap:18px;align-items:end;margin:28px 0 14px}.cr21-10-kicker,.cr21-10-transparent{font-size:.72rem;letter-spacing:.18em;opacity:.65}.cr21-10-head h2{margin:.3rem 0;font-size:1.5rem}.cr21-10-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.cr21-10-card{position:relative;padding:18px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(10,10,18,.72);min-height:145px}.cr21-10-rank{position:absolute;right:14px;top:12px;opacity:.35;font-weight:700}.cr21-10-type{font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;opacity:.6}.cr21-10-badge{margin-top:18px;font-weight:700}.cr21-10-score{font-size:.68rem;letter-spacing:.12em;opacity:.45;margin-top:9px}.cr21-10-why-btn{margin-top:16px;border:0;background:none;color:inherit;text-decoration:underline;cursor:pointer;padding:0;font:inherit;font-size:.8rem}.cr21-10-why{margin-top:14px;padding:13px;border-radius:12px;background:rgba(255,255,255,.06)}.cr21-10-why-title{font-size:.65rem;letter-spacing:.16em;opacity:.6}.cr21-10-why-primary{font-weight:700;margin-top:7px}.cr21-10-why ul{padding-left:18px;font-size:.78rem;opacity:.8}.cr21-10-why-note{font-size:.68rem;line-height:1.5;opacity:.55;margin-top:10px}@media(max-width:650px){.cr21-10-head{display:block}.cr21-10-transparent{display:block;margin-top:6px}}';document.head.appendChild(s);
 }
 return {version,explain,badge,whyPanel,render,install};
})();