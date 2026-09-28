document.addEventListener("DOMContentLoaded",async()=>{
  if(!window.CROW_CONFIG?.supabaseUrl||!window.CROW_CONFIG?.supabaseKey)return;
  const sb=supabase.createClient(CROW_CONFIG.supabaseUrl,CROW_CONFIG.supabaseKey);
  const feed=document.getElementById("feed"),status=document.getElementById("cawStatus"),body=document.getElementById("cawBody"),media=document.getElementById("cawMedia"),mediaName=document.getElementById("mediaName");
  let refreshTimer=null;
  let loading=false;
  const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const initials=s=>String(s||"CR").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"CR";
  async function load(){
    if(loading)return;
    loading=true;
    const {data:posts,error}=await sb.from("crowspace_posts").select("*").order("created_at",{ascending:false}).limit(50);
    if(error){feed.innerHTML='<div class="panel empty">Unable to load the Caw feed. '+esc(error.message)+'</div>';loading=false;return}
    if(!posts?.length){feed.innerHTML='<div class="panel empty">No Caws yet. Be the first to post.</div>';loading=false;return}
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
      const profileHref=p.username?'profile.html?username='+encodeURIComponent(p.username):'profile.html?user='+encodeURIComponent(x.user_id);
      const btn=(type,label,activeLabel)=>{const k=x.id+"|"+type;return '<button data-action="'+type+'" data-target-type="post" data-target-id="'+x.id+'" class="'+(mine.has(k)?"active":"")+'">'+(mine.has(k)?activeLabel:label)+' <span class="muted">'+(counts.get(k)||0)+'</span></button>'};
      const mediaHtml=x.media_url ? (/(mp4|webm|quicktime|mov|m4v)(\?|$)/i.test(x.media_url) ? '<video class="caw-media" controls preload="metadata" src="'+esc(x.media_url)+'"></video>' : '<img class="caw-media" loading="lazy" src="'+esc(x.media_url)+'" alt="Caw media">') : ''; 
      return '<article class="feed-card panel"><div class="user-row"><a href="'+profileHref+'" aria-label="View '+esc(name)+' profile">'+avatar+'</a><div><a href="'+profileHref+'"><b>'+esc(name)+'</b></a><div class="muted"><a href="'+profileHref+'">@'+esc(p.username||"member")+'</a></div></div><span class="muted">'+(x.created_at?new Date(x.created_at).toLocaleString():"")+'</span></div>'+mediaHtml+'<p>'+esc(x.body||"")+'</p><div class="reaction-bar">'+btn("like","♡ Like","♥ Liked")+btn("repost","↗ Repost","↗ Reposted")+btn("save","🔖 Save","🔖 Saved")+'<button>💬 Comment</button></div></article>';
    }).join("");
    loading=false;
  }
  document.addEventListener("crowspace:social-updated",()=>{
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(()=>load(),80);
  });
  feed.addEventListener("click",e=>{
    const comment=e.target.closest("button:not([data-action])");
    if(comment&&comment.textContent.includes("Comment")){
      const card=comment.closest(".feed-card");
      if(card){
        const existing=card.querySelector(".feed-comment-box");
        if(existing){existing.remove();return}
        const box=document.createElement("div");
        box.className="comment-box feed-comment-box";
        box.innerHTML='<input maxlength="2000" placeholder="Write a comment…"><button class="primary">Comment</button>';
        card.appendChild(box);
        box.querySelector("button").addEventListener("click",async()=>{
          const input=box.querySelector("input"),text=input.value.trim();
          if(!text)return;
          const {data:{user}}=await sb.auth.getUser();
          if(!user){input.value="";input.placeholder="Sign in to comment";return}
          const postId=card.querySelector('[data-target-id]')?.dataset.targetId;
          if(!postId)return;
          const {error}=await sb.from("crowspace_comments").insert({post_id:postId,user_id:user.id,body:text});
          if(error){input.placeholder=error.message;return}
          await load();
        });
        box.querySelector("input")?.focus();
      }
    }
  });
  document.getElementById("addMedia")?.addEventListener("click",()=>media?.click());
  media?.addEventListener("change",()=>{if(mediaName)mediaName.textContent=media.files?.[0]?.name||""});
  document.getElementById("postCaw")?.addEventListener("click",async()=>{
    const {data:{user}}=await sb.auth.getUser();
    if(!user){status.textContent="Sign in to post a Caw.";return}
    const text=body.value.trim();
    if(!text){status.textContent="Write something first.";return}
    if(text.length>5000){status.textContent="Caws must be 5,000 characters or less.";return}
    status.textContent="Posting…";
    let mediaUrl=null;
    const file=media?.files?.[0];
    if(file){
      if(file.size>50*1024*1024){status.textContent="Media must be 50 MB or smaller.";return}
      const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
      const path=user.id+"/"+Date.now()+"-"+safe;
      const {error:uploadError}=await sb.storage.from("crowspace-media").upload(path,file,{upsert:false,contentType:file.type});
      if(uploadError){status.textContent="Media upload failed: "+uploadError.message;return}
      mediaUrl=sb.storage.from("crowspace-media").getPublicUrl(path).data.publicUrl;
    }
    const {error}=await sb.from("crowspace_posts").insert({user_id:user.id,body:text,media_url:mediaUrl});
    if(error){status.textContent=error.message;return}
    body.value="";if(media)media.value="";if(mediaName)mediaName.textContent="";status.textContent="Caw posted ✓";await load();
  });
  await load();
});