/* CrowSpace interaction layer — Supabase-backed social actions. */
document.addEventListener("DOMContentLoaded",()=>{
  const root=document.documentElement;
  const saved=localStorage.getItem("crowspace-theme");
  if(saved)root.dataset.theme=saved;
  document.addEventListener("click",async e=>{
    const el=e.target.closest("[data-action]");
    if(!el)return;
    const action=el.dataset.action;
    if(!["like","save","repost","follow"].includes(action))return;
    const sb=window.CROW_CONFIG?.supabaseUrl&&window.CROW_CONFIG?.supabaseKey
      ? supabase.createClient(CROW_CONFIG.supabaseUrl,CROW_CONFIG.supabaseKey):null;
    if(!sb){return;}
    const {data:{user}}=await sb.auth.getUser();
    if(!user){el.textContent=action==="follow"?"Sign in to follow":"Sign in to interact";return;}
    const targetId=el.dataset.targetId;
    if(!targetId)return;
    el.disabled=true;
    try{
      if(action==="follow"){
        const followedUserId=el.dataset.followedUserId||targetId;
        if(followedUserId===user.id)return;
        const {data:existing}=await sb.from("crowspace_follows").select("follower_id").eq("follower_id",user.id).eq("followed_user_id",followedUserId).maybeSingle();
        if(existing){
          await sb.from("crowspace_follows").delete().eq("follower_id",user.id).eq("followed_user_id",followedUserId);
          el.classList.remove("active");el.textContent="Follow";
        }else{
          const {error}=await sb.from("crowspace_follows").insert({follower_id:user.id,followed_user_id:followedUserId});
          if(error)throw error;
          el.classList.add("active");el.textContent="Following";
        }
      }else{
        const {data:existing}=await sb.from("crowspace_social_interactions").select("id").eq("user_id",user.id).eq("target_type",el.dataset.targetType||"post").eq("target_id",targetId).eq("interaction_type",action);
        if(existing?.length){
          await sb.from("crowspace_social_interactions").delete().eq("user_id",user.id).eq("target_type",el.dataset.targetType||"post").eq("target_id",targetId).eq("interaction_type",action);
          el.classList.remove("active");
        }else{
          const {error}=await sb.from("crowspace_social_interactions").insert({user_id:user.id,target_type:el.dataset.targetType||"post",target_id:targetId,interaction_type:action});
          if(error)throw error;
          el.classList.add("active");
        }
        const labels={like:["♡ Like","♥ Liked"],save:["🔖 Save","🔖 Saved"],repost:["↗ Repost","↗ Reposted"]};
        if(labels[action])el.textContent=el.classList.contains("active")?labels[action][1]:labels[action][0];
      }
    }catch(err){
      console.warn("CrowSpace social action failed",err);
      el.title=err.message||"Action failed";
    }finally{el.disabled=false;document.dispatchEvent(new CustomEvent("crowspace:social-updated",{detail:{action,targetId}}));}
  });
  document.querySelectorAll(".comment-box").forEach(box=>{
    const input=box.querySelector("input"),button=box.querySelector("button");
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