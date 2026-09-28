/* CrowSpace interaction layer — local preview mode until Supabase is connected. */
document.addEventListener("DOMContentLoaded",()=>{
  const root=document.documentElement;
  const saved=localStorage.getItem("crowspace-theme");
  if(saved)root.dataset.theme=saved;
  document.querySelectorAll("[data-action]").forEach(el=>{
    el.addEventListener("click",()=>{
      const action=el.dataset.action;
      const key="crowspace-"+action;
      if(action==="like"||action==="save"||action==="repost"||action==="follow"){
        const active=localStorage.getItem(key)==="1";
        localStorage.setItem(key,active?"0":"1");
        el.classList.toggle("active",!active);
        const labels={like:["♡ Like","♥ Liked"],save:["🔖 Save","🔖 Saved"],repost:["↗ Repost","↗ Reposted"],follow:["Follow","Following"]};
        if(labels[action])el.textContent=(!active?labels[action][1]:labels[action][0]);
      }
    });
  });
  document.querySelectorAll(".reaction-bar button").forEach(btn=>btn.addEventListener("click",()=>{
    btn.classList.toggle("active");
  }));
  document.querySelectorAll(".comment-box").forEach(box=>{
    const input=box.querySelector("input"), button=box.querySelector("button");
    button?.addEventListener("click",()=>{
      if(!input?.value.trim())return;
      const p=document.createElement("p");p.className="comment-preview";p.textContent="You: "+input.value.trim();
      box.before(p);input.value="";
    });
  });
  loadCounts();
});
async function loadCounts(){
  if(!window.CROW_CONFIG?.supabaseUrl||!window.CROW_CONFIG?.supabaseKey)return;
  try{
    const h={apikey:window.CROW_CONFIG.supabaseKey,Authorization:"Bearer "+window.CROW_CONFIG.supabaseKey};
    const [m,c]=await Promise.all([
      fetch(window.CROW_CONFIG.supabaseUrl+"/rest/v1/crowrules_members?select=id",{headers:h}),
      fetch(window.CROW_CONFIG.supabaseUrl+"/rest/v1/crowspace_posts?select=id",{headers:h})
    ]);
    if(m.ok){const d=await m.json();document.getElementById("memberCount")?.replaceChildren(document.createTextNode(d.length))}
    if(c.ok){const d=await c.json();document.getElementById("cawCount")?.replaceChildren(document.createTextNode(d.length))}
  }catch(e){console.warn("CrowSpace live counts unavailable",e)}
}