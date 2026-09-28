document.addEventListener("DOMContentLoaded",async()=>{
  if(!window.CROW_CONFIG?.supabaseUrl||!window.CROW_CONFIG?.supabaseKey)return;
  const sb=supabase.createClient(CROW_CONFIG.supabaseUrl,CROW_CONFIG.supabaseKey);
  const feed=document.getElementById("feed"),status=document.getElementById("cawStatus"),body=document.getElementById("cawBody");
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const initials=s=>String(s||"CR").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"CR";
  async function load(){
    const {data:posts,error}=await sb.from("crowspace_posts").select("*").order("created_at",{ascending:false}).limit(50);
    if(error){feed.innerHTML='<div class="panel empty">Unable to load the Caw feed. '+esc(error.message)+'</div>';return}
    if(!posts?.length){feed.innerHTML='<div class="panel empty">No Caws yet. Be the first to post.</div>';return}
    const ids=[...new Set(posts.map(x=>x.user_id))];
    const [{data:profiles},{data:interactions},{data:{user}}]=await Promise.all([
      sb.from("crowspace_profiles").select("user_id,username,display_name,avatar_url").in("user_id",ids),
      sb.from("crowspace_social_interactions").select("user_id,target_id,interaction_type").eq("target_type","post").in("target_id",posts.map(x=>x.id)),
      sb.auth.getUser()
    ]);
    const pm=new Map((profiles||[]).map(p=>[p.user_id,p]));
    const counts=new Map(),mine=new Set();
    for(const i of interactions||[]){
      const k=i.target_id+"|"+i.interaction_type;
      counts.set(k,(counts.get(k)||0)+1);
      if(user&&i.user_id===user.id)mine.add(k);
    }
    feed.innerHTML=posts.map(x=>{
      const p=pm.get(x.user_id)||{};
      const name=p.display_name||p.username||"CrowSpace Member";
      const avatar=p.avatar_url?'<img class="avatar" src="'+esc(p.avatar_url)+'" alt="">':'<div class="avatar">'+esc(initials(name))+'</div>';
      const btn=(type,label,activeLabel)=>{const k=x.id+"|"+type;return '<button data-action="'+type+'" data-target-type="post" data-target-id="'+x.id+'" class="'+(mine.has(k)?"active":"")+'">'+(mine.has(k)?activeLabel:label)+' <span class="muted">'+(counts.get(k)||0)+'</span></button>'};
      return '<article class="feed-card panel"><div class="user-row">'+avatar+'<div><b>'+esc(name)+'</b><div class="muted">@'+esc(p.username||"member")+'</div></div><span class="muted">'+(x.created_at?new Date(x.created_at).toLocaleString():"")+'</span></div><p>'+esc(x.body||"")+'</p><div class="reaction-bar">'+btn("like","♡ Like","♥ Liked")+btn("repost","↗ Repost","↗ Reposted")+btn("save","🔖 Save","🔖 Saved")+'<button>💬 Comment</button></div></article>';
    }).join("");
  }
  document.getElementById("postCaw")?.addEventListener("click",async()=>{
    const {data:{user}}=await sb.auth.getUser();
    if(!user){status.textContent="Sign in to post a Caw.";return}
    const text=body.value.trim();
    if(!text){status.textContent="Write something first.";return}
    if(text.length>5000){status.textContent="Caws must be 5,000 characters or less.";return}
    status.textContent="Posting…";
    const {error}=await sb.from("crowspace_posts").insert({user_id:user.id,body:text});
    if(error){status.textContent=error.message;return}
    body.value="";status.textContent="Caw posted ✓";await load();
  });
  await load();
});