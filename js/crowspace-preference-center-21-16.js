/* CrowSpace 21.16 — Universal Preference Center */
window.CrowSpacePreferenceCenter21_16=(()=>{
 const version="21.16";
 async function init(db,user,root){
  const rt=window.CrowSpacePreferenceRuntime21_12;
  if(!root)return null;
  if(!db||!user||!rt){root.innerHTML='<p>Sign in to manage personalization.</p>';return null}
  let prefs=await rt.load(db,user);
  const esc=s=>String(s??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  const save=async(action="updated")=>{prefs=await rt.save(db,user,prefs,action);render();};
  async function history(){
   const r=await db.from("crowspace_recommendation_preference_history").select("id,action,snapshot,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(25);
   const el=root.querySelector("#cr2116-history");if(!el)return;
   el.innerHTML=r.error?'<p>History unavailable.</p>':(r.data||[]).map(x=>'<div class="cr21-16-history-row"><strong>'+esc(x.action)+'</strong><time>'+new Date(x.created_at).toLocaleString()+'</time><button data-undo="'+x.id+'">Undo</button></div>').join("")||'<p>No preference history yet.</p>';
   root.querySelectorAll("[data-undo]").forEach(b=>b.onclick=async()=>{const x=(r.data||[]).find(v=>v.id===b.dataset.undo);if(!x)return;const s=x.snapshot||{};prefs={...prefs,intensity:s.discovery_intensity||s.intensity||"balanced",categories:s.categories||prefs.categories,preferCreators:s.preferred_creators||[],avoidCreators:s.reduced_creators||[],topics:s.preferred_topics||[],avoidTopics:s.reduced_topics||[],personalizationEnabled:s.personalization_enabled??true,historyEnabled:s.history_enabled??true};await save("updated")});
  }
  function render(){
   root.innerHTML='<section class="cr21-16"><div class="cr21-16-kicker">CROWRULES // 21.16</div><h2>CHANGE WHAT I SEE</h2><p>Your preferences are synchronized to your CrowRules account and can follow you across supported CrowSpace surfaces.</p><div class="cr21-16-top"><label>Discovery intensity<select id="cr2116-intensity"><option value="low">Focused</option><option value="balanced">Balanced</option><option value="high">Expanded</option></select></label><label><input id="cr2116-enabled" type="checkbox"> Personalization enabled</label></div><div class="cr21-16-grid"><div><h3>PREFERRED CREATORS</h3><div id="cr2116-pc"></div><input id="cr2116-creator" placeholder="Creator UUID"><button data-add="creator">Add preference</button></div><div><h3>REDUCED CREATORS</h3><div id="cr2116-ac"></div></div><div><h3>PREFERRED TOPICS</h3><div id="cr2116-pt"></div><input id="cr2116-topic" placeholder="Topic or category"><button data-add="topic">Add preference</button></div><div><h3>REDUCED TOPICS</h3><div id="cr2116-at"></div></div></div><h3>PREFERENCE HISTORY</h3><div id="cr2116-history">Loading…</div><div class="cr21-16-actions"><button id="cr2116-save">Save preferences</button><button id="cr2116-reset">Reset all personalization</button></div><div id="cr2116-status"></div></section>';
   root.querySelector("#cr2116-intensity").value=prefs.intensity;root.querySelector("#cr2116-enabled").checked=prefs.personalizationEnabled;
   const chip=(id,arr,kind)=>root.querySelector(id).innerHTML=arr.map(v=>'<span class="cr21-16-chip">'+esc(v)+' <button data-kind="'+kind+'" data-value="'+esc(v)+'">×</button></span>').join("");
   chip("#cr2116-pc",prefs.preferCreators,"pc");chip("#cr2116-ac",prefs.avoidCreators,"ac");chip("#cr2116-pt",prefs.topics,"pt");chip("#cr2116-at",prefs.avoidTopics,"at");
   root.querySelectorAll(".cr21-16-chip button").forEach(b=>b.onclick=async()=>{const m={pc:"preferCreators",ac:"avoidCreators",pt:"topics",at:"avoidTopics"}[b.dataset.kind];prefs[m]=prefs[m].filter(v=>v!==b.dataset.value);await save("updated")});
   root.querySelector("[data-add=creator]").onclick=async()=>{const v=root.querySelector("#cr2116-creator").value.trim();if(v&&!prefs.preferCreators.includes(v))prefs.preferCreators.push(v);await save("updated")};
   root.querySelector("[data-add=topic]").onclick=async()=>{const v=root.querySelector("#cr2116-topic").value.trim();if(v&&!prefs.topics.includes(v))prefs.topics.push(v);await save("updated")};
   root.querySelector("#cr2116-save").onclick=async()=>{prefs.intensity=root.querySelector("#cr2116-intensity").value;prefs.personalizationEnabled=root.querySelector("#cr2116-enabled").checked;await save("updated");root.querySelector("#cr2116-status").textContent="Preferences synchronized."};
   root.querySelector("#cr2116-reset").onclick=async()=>{if(confirm("Reset all personalization preferences?")){prefs=await rt.reset(db,user);render()}};
   history();
  }
  render();
  const channel=db.channel("crowspace-21-16-preferences-"+user.id).on("postgres_changes",{event:"*",schema:"public",table:"crowspace_recommendation_preferences",filter:"user_id=eq."+user.id},async()=>{prefs=await rt.load(db,user);render()});
  channel.subscribe();
  return{refresh:async()=>{prefs=await rt.load(db,user);render()},channel};
 }
 function install(){if(document.getElementById("cr21-16-style"))return;const s=document.createElement("style");s.id="cr21-16-style";s.textContent='.cr21-16{max-width:1000px;margin:30px auto;padding:28px;border:1px solid rgba(255,255,255,.12);border-radius:24px;background:rgba(8,8,16,.82)}.cr21-16-kicker{font-size:.7rem;letter-spacing:.2em;opacity:.55}.cr21-16 h2{margin:8px 0}.cr21-16 p{opacity:.65;line-height:1.5}.cr21-16-top{display:flex;gap:20px;flex-wrap:wrap}.cr21-16 label{display:block;margin:16px 0}.cr21-16-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin:24px 0}.cr21-16-grid>div{padding:16px;border:1px solid rgba(255,255,255,.1);border-radius:16px}.cr21-16 h3{font-size:.72rem;letter-spacing:.13em}.cr21-16 input,.cr21-16 select,.cr21-16 button{padding:9px 11px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:inherit}.cr21-16 button{cursor:pointer}.cr21-16-chip{display:inline-flex;gap:6px;margin:4px;padding:6px 9px;border-radius:999px;background:rgba(255,255,255,.07);font-size:.78rem}.cr21-16-chip button{border:0;padding:0}.cr21-16-history-row{display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)}.cr21-16-history-row time{opacity:.55;font-size:.75rem;flex:1}.cr21-16-actions{display:flex;gap:10px;margin-top:20px}@media(max-width:700px){.cr21-16-grid{grid-template-columns:1fr}}';document.head.appendChild(s)}
 return{version,init,install};
})();