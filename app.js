const postsEl=document.getElementById("posts");
let posts=[];
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function relativeTime(ts){const d=(Date.now()-new Date(ts).getTime())/1000;if(d<60)return"now";if(d<3600)return Math.floor(d/60)+"m";if(d<86400)return Math.floor(d/3600)+"h";return Math.floor(d/86400)+"d"}
async function loadPosts(){
 if(!postsEl)return;
 try{
  const db=await window.CrowSpaceAuth.ready;
  const [userRows,botRows]=await Promise.all([
   db.from("crowspace_posts").select("id,user_id,body,media_url,created_at,like_count,comment_count,title").order("created_at",{ascending:false}).limit(50),
   db.from("crowspace_holiday_bot_posts").select("id,bot_id,post_date,title,body,created_at").order("created_at",{ascending:false}).limit(50)
  ]);
  if(userRows.error)throw userRows.error;if(botRows.error)throw botRows.error;
  const rows=userRows.data||[], botPosts=botRows.data||[];
  const ids=[...new Set(rows.map(x=>x.user_id))];let profiles=[];
  if(ids.length){const p=await db.from("crowspace_profiles").select("user_id,username,display_name,avatar_url").in("user_id",ids);if(p.error)throw p.error;profiles=p.data||[]}
  const botIds=[...new Set(botPosts.map(x=>x.bot_id))];let bots=[];
  if(botIds.length){const b=await db.from("crowspace_holiday_bots").select("id,slug,display_name,holiday_name,avatar_url").in("id",botIds);if(b.error)throw b.error;bots=b.data||[]}
  const map=new Map(profiles.map(p=>[p.user_id,p])),botMap=new Map(bots.map(b=>[b.id,b]));
  let mine=new Set();
  const {data:{user}}=await db.auth.getUser();
  if(user&&rows.length){const r=await db.from("crowspace_reactions").select("post_id").eq("user_id",user.id).in("post_id",rows.map(x=>x.id));if(!r.error)mine=new Set((r.data||[]).map(x=>x.post_id))}
  const normal=(rows||[]).map(p=>{const pr=map.get(p.user_id)||{};return {...p,kind:"member",name:pr.display_name||pr.username||"Crow Member",handle:pr.username?"@"+pr.username:"@member",avatar:(pr.avatar_url||"").trim(),time:relativeTime(p.created_at),liked:mine.has(p.id),like_count:p.like_count||0,comment_count:p.comment_count||0}});
  const holiday=(botPosts||[]).map(p=>{const b=botMap.get(p.bot_id)||{};return {...p,kind:"bot",name:b.display_name||"Holiday Crow",handle:"@"+(b.slug||"holiday-crow"),avatar:(b.avatar_url||"").trim(),time:relativeTime(p.created_at),liked:false,like_count:0,comment_count:0}});
  posts=[...normal,...holiday].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,80);
  renderPosts();
 }catch(e){console.error("[CrowSpace feed]",e);postsEl.innerHTML='<div class="card" style="padding:20px">CrowSpace feed is temporarily unavailable. Please refresh.</div>'}
}
function renderPosts(){
 if(!postsEl)return;
 postsEl.innerHTML=posts.map(p=>{
  const avatar=p.avatar?'<img src="'+escapeHtml(p.avatar)+'" alt="">':escapeHtml((p.name||"CM").slice(0,2).toUpperCase());
  const botBadge=p.kind==="bot"?'<span style="margin-left:7px;padding:3px 7px;border-radius:999px;border:1px solid rgba(127,232,255,.25);font-size:9px;color:var(--cyan)">HOLIDAY BOT</span>':"";
  const actions=p.kind==="bot"?'<div class="post-actions"><button type="button" class="social-share">↗ Share</button></div>':'<div class="post-actions"><button type="button" class="social-like '+(p.liked?"on":"")+'"> '+(p.liked?"♥ ":"♡ ")+(p.like_count||0)+'</button><button type="button" class="social-comments">💬 '+(p.comment_count||0)+'</button><button type="button" class="social-share">↗ Share</button></div>';
  return '<article class="post card" data-post-id="'+escapeHtml(p.id)+'" data-post-kind="'+p.kind+'"><div class="post-head"><div class="avatar">'+avatar+'</div><div class="post-meta"><b>'+escapeHtml(p.name)+botBadge+'</b><small>'+escapeHtml(p.handle)+' · '+escapeHtml(p.time)+'</small></div></div>'+(p.title?'<div style="font-weight:800;margin-bottom:8px">'+escapeHtml(p.title)+'</div>':"")+'<div class="post-body">'+escapeHtml(p.body).replace(/#(\w+)/g,'<span style="color:var(--cyan)">#$1</span>')+'</div>'+(p.media_url?'<div class="post-media"><img src="'+escapeHtml(p.media_url)+'" alt="Post media" style="max-width:100%;border-radius:12px"></div>':"")+actions+'<div class="comments-inline" hidden></div></article>'
 }).join("")||'<div class="card" style="padding:20px">No posts yet. Be the first to post.</div>';
 document.querySelectorAll(".social-like").forEach(b=>b.onclick=async()=>{const id=b.closest("[data-post-id]").dataset.postId;try{await window.CrowSpaceSocial.toggleLike(id,b)}catch(e){if(e.message!=="AUTH_REQUIRED")alert(e.message||"Unable to like post")}});
 document.querySelectorAll(".social-comments").forEach(b=>b.onclick=async()=>{const article=b.closest("[data-post-id]"),id=article.dataset.postId,box=article.querySelector(".comments-inline");try{const comments=await window.CrowSpaceSocial.loadComments(id);box.hidden=false;box.innerHTML=(comments.length?comments.map(c=>'<div style="padding:7px 0"><b>'+escapeHtml(c.profile.display_name||c.profile.username||"Crow Member")+'</b> <span>'+escapeHtml(c.body)+'</span></div>').join(""):"<small>No comments yet.</small>")+'<form class="comment-form" style="display:flex;gap:8px;margin-top:8px"><input maxlength="500" placeholder="Add a comment…" style="flex:1"><button>Post</button></form>';box.querySelector("form").onsubmit=async e=>{e.preventDefault();const input=e.target.querySelector("input");try{await window.CrowSpaceSocial.addComment(id,input.value);input.value="";await loadPosts()}catch(err){if(err.message!=="AUTH_REQUIRED")alert(err.message||"Unable to comment")}}}catch(e){alert(e.message||"Unable to load comments")}});
 document.querySelectorAll(".social-share").forEach(b=>b.onclick=()=>{const id=b.closest("[data-post-id]").dataset.postId;navigator.clipboard?.writeText(location.href+"#post-"+id);b.textContent="✓ Shared"});
}
const modal=document.getElementById("composerModal"),open=()=>modal&&modal.classList.add("show"),close=()=>modal&&modal.classList.remove("show");
document.getElementById("openComposer")?.addEventListener("click",open);document.getElementById("composerButton")?.addEventListener("click",open);document.getElementById("closeComposer")?.addEventListener("click",close);
document.getElementById("publishPost")?.addEventListener("click",async()=>{const input=document.getElementById("postText"),body=input?.value.trim();if(!body)return;try{const db=await window.CrowSpaceAuth.ready;const {data:{user}}=await db.auth.getUser();if(!user){location.href="login.html";return}const {error}=await db.from("crowspace_posts").insert({user_id:user.id,body});if(error)throw error;input.value="";close();await loadPosts()}catch(e){console.error("[CrowSpace publish]",e);alert(e.message||"Unable to publish")}});
function seasonal(){const d=new Date(),m=d.getMonth()+1,day=d.getDate();let title="CROWSPACE // NIGHT CITY",txt="The universe is always changing.";if(m===10){title="CROWSPACE // HAUNTED CITY";txt="Halloween atmosphere activated. Shadows are moving."}else if(m===12){title="CROWSPACE // NORTH POLE";txt="Christmas mode is approaching. Santa Crow will be posting automatically."}else if(m===1&&day<=2){title="CROWSPACE // MIDNIGHT";txt="A new year begins in the CrowSpace universe."}const a=document.getElementById("seasonTitle"),b=document.getElementById("seasonText");if(a)a.textContent=title;if(b)b.textContent=txt)}
loadPosts();seasonal();