(()=> {
const explainable=["PERSON","GROUP","CROWROOM","EVENT"];
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function decorate(){
 document.querySelectorAll("#app .card").forEach(card=>{
  if(card.dataset.graphExplained==="1")return;
  const kicker=card.querySelector(".kicker");
  const title=card.querySelector("h2");
  if(!kicker||!title||!explainable.includes(kicker.textContent.trim()))return;
  card.dataset.graphExplained="1";
  const topics=[...card.querySelectorAll(".muted")].find(x=>x.textContent.trim().startsWith("Connected topics:"));
  const reasons=[];
  if(topics){
   const value=topics.textContent.replace(/^Connected topics:s*/i,"").trim();
   if(value)reasons.push("Shares topic connections with your Discover graph: "+value+".");
  }
  const type=kicker.textContent.trim().toLowerCase();
  if(type==="person")reasons.push("This person is connected to the people/topic side of your CrowSpace graph.");
  if(type==="group")reasons.push("This group is connected to community topics represented in your Discover graph.");
  if(type==="crowroom")reasons.push("This CrowRoom is connected to topics represented in your Discover graph.");
  if(type==="event")reasons.push("This event is connected to community topics represented in your Discover graph.");
  if(!reasons.length)reasons.push("This recommendation is connected to activity and relationships represented in your Discover graph.");
  const details=document.createElement("details");
  details.className="why-recommendation";
  details.innerHTML='<summary>WHY YOU’RE SEEING THIS</summary><div class="recommendation-reasons">'+reasons.slice(0,3).map(r=>'<div class="recommendation-reason">↳ '+esc(r)+'</div>').join("")+'</div>';
  title.insertAdjacentElement("afterend",details);
 });
}
function boot(){
 const style=document.createElement("style");
 style.textContent=".why-recommendation{margin:12px 0;padding:10px 12px;border:1px solid rgba(139,92,246,.28);border-radius:12px;background:rgba(10,10,20,.55)}.why-recommendation summary{cursor:pointer;font-size:.72rem;letter-spacing:.12em;font-weight:800;color:#a78bfa}.recommendation-reasons{display:grid;gap:6px;margin-top:9px}.recommendation-reason{font-size:.88rem;color:#cbd5e1;line-height:1.45}";
 document.head.appendChild(style);
 decorate();
 new MutationObserver(decorate).observe(document.getElementById("app")||document.body,{childList:true,subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();