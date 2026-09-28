document.addEventListener("DOMContentLoaded",async()=>{
 const q=new URLSearchParams(location.search),id=q.get("id"),root=document.querySelector(".share-dialog");
 if(!id||!root)return;
 const sb=window.CROW_CONFIG?.supabaseUrl?supabase.createClient(CROW_CONFIG.supabaseUrl,CROW_CONFIG.supabaseKey):null;
 if(!sb)return;
 const esc=v=>String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
 const {data:p}=await sb.from("crowspace_posts").select("id,user_id,body,created_at,media_url").eq("id",id).maybeSingle();
 if(!p){root.querySelector(".share-target")?.replaceChildren(document.createTextNode("Caw not found."));return}
 const {data:profile}=await sb.from("crowspace_profiles").select("username,display_name,avatar_url").eq("user_id",p.user_id).maybeSingle();
 const name=profile?.display_name||profile?.username||"CrowSpace Member";
 const href="caw.html?id="+encodeURIComponent(id);
 const media=p.media_url?'<div class="share-preview-media">'+(/(mp4|webm|quicktime|mov|m4v)(\?|$)/i.test(p.media_url)?'<video controls preload="metadata" src="'+esc(p.media_url)+'"></video>':'<img loading="lazy" src="'+esc(p.media_url)+'" alt="Shared Caw media">')+'</div>':"";
 root.querySelector(".share-target").innerHTML=(profile?.avatar_url?'<img class="avatar" src="'+esc(profile.avatar_url)+'" alt="">':'<div class="avatar">'+esc(name.slice(0,2).toUpperCase())+'</div>')+'<div><b>'+esc(name)+'</b><small class="muted">@'+esc(profile?.username||"member")+'</small></div>';
 root.querySelector("h2").textContent="Share this Caw";
 const ta=root.querySelector("textarea");ta.placeholder="Add a thought…";
 const preview=document.createElement("div");preview.className="share-caw-preview";preview.innerHTML='<a href="'+href+'"><div class="muted">CAW</div><p>'+esc(p.body)+'</p>'+media+'</a>';ta.after(preview);
 const url=new URL(href,location.href).href;
 root.querySelectorAll(".share-options button").forEach(btn=>{
  btn.addEventListener("click",async()=>{
   const type=btn.dataset.share;
   if(type==="copy"){await navigator.clipboard?.writeText(url);btn.textContent="✓ Link Copied";setTimeout(()=>btn.textContent="🔗 Copy Link",1500);return}
   if(type==="native"&&navigator.share){await navigator.share({title:"CrowSpace Caw",text:p.body.slice(0,180),url});return}
   if(type==="messenger"){location.href="messenger.html?share="+encodeURIComponent(id);return}
   if(type==="profile"){location.href="profile.html?share="+encodeURIComponent(id);return}
   if(type==="universe"){window.open(url,"_blank","noopener");}
  });
 });
 const repost=root.querySelector("#repostCaw");
 repost?.addEventListener("click",async()=>{
  const {data:{user}}=await sb.auth.getUser();
  if(!user){repost.textContent="Sign in to repost";return}
  const {data:existing}=await sb.from("crowspace_social_interactions").select("id").eq("user_id",user.id).eq("target_type","post").eq("target_id",id).eq("interaction_type","repost");
  if(existing?.length){repost.textContent="Already Reposted";return}
  const {error}=await sb.from("crowspace_social_interactions").insert({user_id:user.id,target_type:"post",target_id:id,interaction_type:"repost"});
  repost.textContent=error?"Repost failed":"✓ Reposted";
 });
});