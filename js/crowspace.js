import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
const SUPABASE_URL="https://cevylpnoexugwgygvtgu.supabase.co";
const SUPABASE_KEY="sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-";
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY);
const root=document.querySelector("#app"),page=location.pathname.split("/").pop()||"index.html";
const nav=[
 ["index.html","Home"],["nest.html","Nests"],["caws.html","Caws"],["pictures.html","Pictures"],
 ["groups.html","Groups"],["live.html","Live"],["live-studio.html","Studio"],["dreamscapes.html","Dreamscapes"],["memorials.html","Memorials"],
 ["search.html","Search"],["notifications.html","🔔"],["create.html","Create"],["account.html","Account"]
];
const universe=[
 ["https://crowrulesentertainment-oss.github.io/dreamscapes/","Dreamscapes"],
 ["https://crowrulesentertainment-oss.github.io/memorials/","Memorials"],
 ["https://crowrulesentertainment-oss.github.io/sports/","Sports"],
 ["https://crowrulesentertainment-oss.github.io/podcasting/","Podcasting"],
 ["https://crowrulesentertainment-oss.github.io/crowrulestv/","CrowRules TV"],
 ["https://crowrulesentertainment-oss.github.io/spectrum/","Spectrum Awards"]
];
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function layout(title,body){
 root.innerHTML='<header class="top"><nav class="nav"><a class="brand" href="index.html">CROWSPACE</a>'+nav.map(([u,n])=>'<a class="'+(page===u?"active":"")+'" href="'+u+'">'+n+'</a>').join("")+'</nav></header><main class="shell">'+body+'</main><footer class="shell footer"><div><strong>CrowSpace 2.0</strong> • One CrowRules Account → One CrowSpace Identity → One Connected Universe.</div><div class="universe">'+universe.map(([u,n])=>'<a href="'+u+'">'+n+'</a>').join(" · ")+'</div></footer>';
 document.title=title+" — CrowSpace";
}
async function session(){const{data}=await supabase.auth.getSession();return data.session}
async function account(){const s=await session();if(!s)return null;const{data}=await supabase.from("crowspace_accounts").select("*,crowspace_profiles(*)").eq("user_id",s.user.id).maybeSingle();return{session:s,account:data}}
function profileCard(x){
 const p=x.crowspace_profiles||x.profile||{};
 return '<article class="card profile-card">'+(p.avatar_url?'<img class="avatar" src="'+esc(p.avatar_url)+'" alt="">':'<div class="avatar placeholder">🪶</div>')+
 '<h2>@'+esc(x.handle)+'</h2><h3>'+esc(x.display_name||x.handle)+'</h3><p class="muted">'+esc(p.headline||p.bio||"Welcome to CrowSpace.")+'</p>'+
 '<div class="stats"><span>'+Number(p.followers_count||0)+' followers</span><span>'+Number(p.caws_count||0)+' Caws</span><span>'+Number(p.posts_count||0)+' posts</span></div>'+
 '<span class="pill">'+(p.is_creator?"CREATOR":"MEMBER")+(p.is_verified?" • VERIFIED":"")+'</span>'+
 '<div class="actions"><a class="btn" href="nest.html?handle='+encodeURIComponent(x.handle)+'">Open Nest</a></div></article>'
}
async function home(){
 const a=await account();
 const[{data:posts},{data:caws},{data:live}]=await Promise.all([
  supabase.from("crowspace_posts").select("id,user_id,body,created_at,group_id").eq("visibility","public").order("created_at",{ascending:false}).limit(10),
  supabase.from("crowspace_caws").select("*").eq("visibility","public").order("created_at",{ascending:false}).limit(6),
  supabase.from("crowspace_live_streams").select("*").in("status",["live","scheduled"]).order("scheduled_for",{ascending:true}).limit(4)
 ]);
 layout("Home",'<section class="hero"><div class="eyebrow">CrowRules Social Universe • CrowSpace 2.0</div><h1>One community layer for the entire CrowRules universe.</h1><p>Nests, Caws, Pictures, Posts, Groups and Live — connected to Dreamscapes, Memorials, Sports, Podcasting, CrowRules TV and Spectrum Awards.</p><div class="hero-actions"><a class="btn" href="'+(a?"create.html":"account.html")+'">'+(a?"Create something":"Join CrowSpace")+'</a><a class="btn alt" href="search.html">Universal Search</a></div></section>'+
 '<section><h2>Explore CrowSpace</h2><div class="grid">'+[
 ["🪶","Nests","Profiles, creators, followers and identity.","nest.html"],
 ["🎬","Caws","Vertical short-form video.","caws.html"],
 ["📸","Pictures","Photo posts and personal galleries.","pictures.html"],
 ["📝","Posts","The community conversation.","index.html"],
 ["👥","Groups","Communities around the universe.","groups.html"],
 ["🔴","Live","Broadcasts and real-time chat.","live.html"],
 ["🔔","Notifications","One social activity center.","notifications.html"],
 ["🔎","Search","People, content and connected CrowRules worlds.","search.html"]
 ].map(x=>'<div class="card"><div class="icon">'+x[0]+'</div><h3>'+x[1]+'</h3><p class="muted">'+x[2]+'</p><a class="btn alt" href="'+x[3]+'">Open</a></div>').join("")+'</div></section>'+
 '<section><div class="section-head"><h2>Latest Community Posts</h2><a href="create.html">Create Post</a></div><div class="feed">'+((posts||[]).map(postCard).join("")||'<div class="card">No public posts yet. Start the first conversation.</div>')+'</div></section>'+
 '<section><div class="section-head"><h2>Fresh Caws</h2><a href="caws.html">See all</a></div><div class="grid">'+((caws||[]).map(cawCard).join("")||'<div class="card">No Caws yet.</div>')+'</div></section>'+
 '<section><div class="section-head"><h2>Live Now & Coming Up</h2><a href="live.html">Open Live</a></div><div class="grid">'+((live||[]).map(streamCard).join("")||'<div class="card">No broadcasts scheduled.</div>')+'</div></section>');
 subscribeRealtime();
}
function postCard(p){
 return '<article class="card post" data-id="'+esc(p.id)+'"><div class="pill">POST</div><p>'+esc(p.body||"")+'</p><div class="muted">'+new Date(p.created_at).toLocaleString()+'</div><div class="actions"><button class="btn alt react" data-type="post" data-id="'+esc(p.id)+'">♥ React</button><button class="btn alt comment" data-type="post" data-id="'+esc(p.id)+'">Comment</button></div></article>'
}
function cawCard(x){
 return '<article class="card caw-card"><div class="caw-frame">'+(x.video_url?'<video class="media vertical" controls playsinline preload="metadata" src="'+esc(x.video_url)+'"></video>':"")+'</div><p>'+esc(x.caption||"")+'</p><div class="stats"><span>👁 '+Number(x.views||0)+'</span><span>♥ '+Number(x.likes||0)+'</span><span>💬 '+Number(x.comments_count||0)+'</span></div><div class="actions"><button class="btn alt react" data-type="caw" data-id="'+esc(x.id)+'">♥ Like</button><button class="btn alt comment" data-type="caw" data-id="'+esc(x.id)+'">Comment</button></div></article>'
}
function streamCard(x){
 const watch='watch.html?id='+encodeURIComponent(x.id);
 return '<article class="card '+(x.status==="live"?"feature":"")+'"><span class="pill '+(x.status==="live"?"live":"")+'">'+esc(String(x.status||"").toUpperCase())+'</span><h3>'+esc(x.title)+'</h3><p class="muted">'+esc(x.description||"")+'</p><p class="muted">'+(x.scheduled_for?new Date(x.scheduled_for).toLocaleString():"Now")+'</p><p class="stats"><span>👁 '+Number(x.viewer_count||0)+' viewers</span><span>Provider: '+esc(x.provider||"custom")+'</span></p><a class="btn" href="'+watch+'">'+(x.status==="live"?"Watch Live":"View Broadcast")+'</a></article>'
}
function bindSocialActions(){
 document.querySelectorAll(".react").forEach(b=>b.onclick=async()=>{
  const a=await account();if(!a){location.href="account.html";return}
  const{error}=await supabase.from("crowspace_reactions").upsert({user_id:a.session.user.id,target_type:b.dataset.type,target_id:b.dataset.id,reaction:"like"},{onConflict:"user_id,target_type,target_id"});
  b.textContent=error?"Reaction unavailable":"♥ Reacted";
 });
 document.querySelectorAll(".comment").forEach(b=>b.onclick=async()=>{
  const a=await account();if(!a){location.href="account.html";return}
  const body=prompt("Write a comment:");if(!body)return;
  const{error}=await supabase.from("crowspace_comments").insert({user_id:a.session.user.id,target_type:b.dataset.type,target_id:b.dataset.id,body});
  b.textContent=error?error.message:"Comment added";
 });
}
function subscribeRealtime(){
 supabase.channel("crowspace-feed").on("postgres_changes",{event:"INSERT",schema:"public",table:"crowspace_posts"},()=>{if(page==="index.html"||page==="")home()}).subscribe();
 bindSocialActions();
}
async function nest(){
 const handle=new URLSearchParams(location.search).get("handle");
 if(handle){
  const{data:x}=await supabase.from("crowspace_accounts").select("*,crowspace_profiles(*)").eq("handle",handle).maybeSingle();
  if(!x){layout("Nest","<section class='hero'><h1>Nest not found</h1><p class='muted'>That CrowSpace identity does not exist.</p><a class='btn' href='nest.html'>Back to Nests</a></section>");return}
  const[{data:followers},{data:following},{data:posts}]=await Promise.all([
   supabase.from("crowspace_follows").select("follower_id",{count:"exact",head:true}).eq("following_id",x.user_id),
   supabase.from("crowspace_follows").select("following_id",{count:"exact",head:true}).eq("follower_id",x.user_id),
   supabase.from("crowspace_posts").select("*").eq("user_id",x.user_id).eq("visibility","public").order("created_at",{ascending:false}).limit(10)
  ]);
  const p=x.crowspace_profiles||{};
  layout("Nest",'<section class="profile-hero" style="'+(p.cover_url?'background-image:url('+esc(p.cover_url)+')':"")+'"><div class="profile-overlay"><div class="avatar large">'+(p.avatar_url?'<img src="'+esc(p.avatar_url)+'" alt="">':"🪶")+'</div><div><div class="eyebrow">CrowSpace Nest</div><h1>@'+esc(x.handle)+'</h1><h2>'+esc(x.display_name||"")+'</h2></div></div></section><section class="grid"><div class="card"><span class="pill">'+(p.is_creator?"CREATOR":"MEMBER")+(p.is_verified?" • VERIFIED":"")+'</span><h2>'+esc(p.headline||"")+'</h2><p>'+esc(p.bio||"")+'</p><p class="muted">'+esc(p.location||"")+'</p>'+(p.website_url?'<a class="btn alt" target="_blank" rel="noopener" href="'+esc(p.website_url)+'">Website</a>':"")+'</div><div class="card"><h2>Community</h2><div class="stats"><span>'+(followers?.count||0)+' followers</span><span>'+(following?.count||0)+' following</span><span>'+Number(p.caws_count||0)+' Caws</span><span>'+Number(p.posts_count||0)+' posts</span></div></div></section><section><h2>Public Posts</h2><div class="feed">'+((posts||[]).map(postCard).join("")||'<div class="card">No public posts yet.</div>')+'</div></section>');
  bindSocialActions();return;
 }
 const{data}=await supabase.from("crowspace_accounts").select("*,crowspace_profiles(*)").eq("status","active").order("created_at",{ascending:false}).limit(40);
 layout("Nests",'<section class="hero"><div class="eyebrow">CrowSpace Identity</div><h1>Nests</h1><p>Your Nest is your social home: profile, creator identity, followers, posts and Caws.</p></section><div class="grid">'+(data||[]).map(profileCard).join("")+'</div>');
}
async function caws(){const{data}=await supabase.from("crowspace_caws").select("*").eq("visibility","public").order("created_at",{ascending:false}).limit(30);layout("Caws",'<section class="hero"><div class="eyebrow">Short-form video</div><h1>Caws</h1><p>Quick stories. Big ideas. Vertical CrowSpace video.</p></section><div class="caw-grid">'+(data||[]).map(cawCard).join("")+'</div>');bindSocialActions()}
async function pictures(){
 const{data}=await supabase.from("crowspace_media").select("*").eq("media_type","image").order("created_at",{ascending:false}).limit(60);
 layout("Pictures",'<section class="hero"><div class="eyebrow">Photos & Albums</div><h1>Pictures</h1><p>Share moments, production stills, community photos and CrowRules memories.</p><a class="btn" href="create.html">Upload Picture</a></section><div class="picture-grid">'+(data||[]).map(x=>'<article class="picture"><img src="'+esc(x.public_url)+'" alt="'+esc(x.alt_text||"CrowSpace picture")+'"><div class="picture-meta">'+esc(x.alt_text||"")+'</div></article>').join("")+'</div>')
}
async function groups(){
 const{data}=await supabase.from("crowspace_groups").select("*").eq("privacy","public").order("created_at",{ascending:false});
 layout("Groups",'<section class="hero"><div class="eyebrow">Communities</div><h1>Groups</h1><p>Build communities around shows, sports, Tacoma, Dreamscapes, Memorials and whatever comes next.</p></section><div class="grid">'+(data||[]).map(x=>'<article class="card">'+(x.cover_url?'<img class="media" src="'+esc(x.cover_url)+'" alt="">':"")+'<h2>'+esc(x.name)+'</h2><p class="muted">'+esc(x.description||"Community group")+'</p><span class="pill">'+Number(x.member_count||0)+' members</span></article>').join("")+'</div>')
}
async function live(){
 const{data}=await supabase.from("crowspace_live_streams").select("*").in("status",["scheduled","live"]).order("scheduled_for",{ascending:true}).limit(30);
 layout("Live",'<section class="hero"><div class="eyebrow">Broadcast Network</div><h1>Live</h1><p>Broadcasts, playback and real-time community chat. Video transport can connect to a streaming provider; CrowSpace manages the social layer.</p><div class="hero-actions"><a class="btn" href="live-studio.html">Open Live Studio</a><a class="btn alt" href="https://crowrulesentertainment-oss.github.io/crowrulestv/">CrowRules TV</a></div></section><div class="grid">'+(data||[]).map(streamCard).join("")+'</div>');
 supabase.channel("crowspace-live").on("postgres_changes",{event:"*",schema:"public",table:"crowspace_live_streams"},()=>{if(page==="live.html")live()}).subscribe();
}
async function watch(){
 const id=new URLSearchParams(location.search).get("id");
 if(!id){layout("Live","<section class='hero'><h1>Broadcast not found</h1><p class='muted'>Choose a broadcast from Live.</p><a class='btn' href='live.html'>Back to Live</a></section>");return}
 const{data:x,error}=await supabase.from("crowspace_live_streams").select("*").eq("id",id).maybeSingle();
 if(error||!x){layout("Live","<section class='hero'><h1>Broadcast not found</h1><p class='muted'>This broadcast is unavailable.</p><a class='btn' href='live.html'>Back to Live</a></section>");return}
 const a=await account();
 layout("Watch Live",'<section class="hero"><div class="eyebrow">'+(x.status==="live"?"🔴 LIVE":"CrowSpace Broadcast")+'</div><h1>'+esc(x.title)+'</h1><p>'+esc(x.description||"")+'</p><div class="stats"><span id="viewerCount">👁 '+Number(x.viewer_count||0)+' viewers</span><span>Provider: '+esc(x.provider||"custom")+'</span></div></section><section class="live-watch"><div class="card player-card">'+(x.playback_url?'<video class="media live-player" controls playsinline autoplay muted src="'+esc(x.playback_url)+'"></video>':'<div class="player-placeholder"><strong>Playback is not connected yet.</strong><span>When a streaming provider supplies a playback URL, the live player will appear here.</span></div>')+'</div><div class="card"><h2>Live Chat</h2><div id="chat" class="chat"></div>'+(a?'<form id="chatForm"><input id="chatBody" maxlength="500" placeholder="Say something…"><button class="btn">Send</button></form>':'<p class="muted">Sign in to join the conversation.</p>')+'</div></section>');
 if(a){
   await supabase.from("crowspace_live_viewers").upsert({stream_id:id,user_id:a.session.user.id,last_seen_at:new Date().toISOString()},{onConflict:"stream_id,user_id"});
   const heartbeat=setInterval(()=>supabase.from("crowspace_live_viewers").update({last_seen_at:new Date().toISOString()}).eq("stream_id",id).eq("user_id",a.session.user.id),30000);
   window.addEventListener("beforeunload",()=>{clearInterval(heartbeat);supabase.from("crowspace_live_viewers").delete().eq("stream_id",id).eq("user_id",a.session.user.id)});
   document.querySelector("#chatForm").onsubmit=async e=>{e.preventDefault();const body=document.querySelector("#chatBody").value.trim();if(!body)return;const{error}=await supabase.from("crowspace_live_messages").insert({stream_id:id,user_id:a.session.user.id,body});if(!error)document.querySelector("#chatBody").value=""};
 }
 const loadChat=async()=>{const{data}=await supabase.from("crowspace_live_messages").select("*").eq("stream_id",id).order("created_at",{ascending:true}).limit(100);document.querySelector("#chat").innerHTML=(data||[]).map(m=>'<div class="chat-line"><strong>'+esc(m.user_id===a?.session?.user?.id?"You":"CrowSpace Member")+'</strong><span>'+esc(m.body)+'</span><time>'+new Date(m.created_at).toLocaleTimeString()+'</time></div>').join("")||'<p class="muted">No messages yet.</p>'};
 await loadChat();
 const channel=supabase.channel("crowspace-watch-"+id).on("postgres_changes",{event:"INSERT",schema:"public",table:"crowspace_live_messages",filter:"stream_id=eq."+id},loadChat).on("postgres_changes",{event:"UPDATE",schema:"public",table:"crowspace_live_streams",filter:"id=eq."+id},payload=>{const v=document.querySelector("#viewerCount");if(v)v.textContent="👁 "+Number(payload.new.viewer_count||0)+" viewers"}).subscribe();
 if(x.status==="live"){
   const refresh=async()=>{const{count}=await supabase.from("crowspace_live_viewers").select("*",{count:"exact",head:true}).eq("stream_id",id).gte("last_seen_at",new Date(Date.now()-90000).toISOString());const v=document.querySelector("#viewerCount");if(v)v.textContent="👁 "+Number(count||0)+" live viewers"};
   await refresh(); setInterval(refresh,30000);
 }
}\nasync function studio(){
 const a=await account();
 layout("Live Studio",'<section class="hero"><div class="eyebrow">CrowSpace 2.1 • Creator Live Dashboard</div><h1>Creator Live Studio</h1><p>Control the CrowSpace broadcast state while your streaming provider handles video transport.</p></section><div class="grid"><div class="card"><h2>Camera Preview</h2><video id="preview" class="media" autoplay muted playsinline></video><div class="actions"><button class="btn" id="camera">Enable Camera + Mic</button><button class="btn alt" id="stop">Stop Camera</button></div><div id="studioStatus" class="status"></div></div><div class="card"><h2>Broadcast Control</h2><div id="dashboard">Loading your broadcasts…</div></div></div>');
 if(!a){document.querySelector("#dashboard").innerHTML='<p>Sign in required.</p><a class="btn" href="account.html">Open Account</a>';return}
 let stream;
 document.querySelector("#camera").onclick=async()=>{try{stream=await navigator.mediaDevices.getUserMedia({video:true,audio:true});document.querySelector("#preview").srcObject=stream;document.querySelector("#studioStatus").textContent="Camera and microphone ready."}catch(e){document.querySelector("#studioStatus").textContent=e.message}};
 document.querySelector("#stop").onclick=()=>{stream?.getTracks().forEach(t=>t.stop());document.querySelector("#preview").srcObject=null;document.querySelector("#studioStatus").textContent="Camera stopped."};
 const render=async()=>{const{data,error}=await supabase.from("crowspace_live_streams").select("*").eq("host_id",a.session.user.id).order("scheduled_for",{ascending:false,nullsFirst:false}).limit(12);const box=document.querySelector("#dashboard");if(error){box.innerHTML='<div class="status">'+esc(error.message)+'</div>';return}box.innerHTML=(data||[]).map(x=>'<article class="card live-dashboard-item"><span class="pill '+(x.status==="live"?"live":"")+'">'+esc(String(x.status).toUpperCase())+'</span><h3>'+esc(x.title)+'</h3><p class="muted">'+esc(x.description||"")+'</p><div class="stats"><span>👁 '+Number(x.viewer_count||0)+' viewers</span><span>Peak '+Number(x.peak_viewers||0)+'</span><span>Provider: '+esc(x.provider||"custom")+'</span></div><div class="actions">'+(x.status==="live"?'<button class="btn stop-live" data-id="'+x.id+'">Stop Broadcast</button>':'')+((x.status==="scheduled"||x.status==="ready")?'<button class="btn start-live" data-id="'+x.id+'">Start Broadcast</button>':'')+'<a class="btn alt" href="watch.html?id='+encodeURIComponent(x.id)+'">Open Watch Page</a></div></article>').join("")||'<div class="status">No broadcasts yet. Create one below.</div>'};
 await render();
 document.querySelector("#dashboard").addEventListener("click",async e=>{const b=e.target.closest("button[data-id]");if(!b)return;b.disabled=true;const fn=b.classList.contains("start-live")?"crowspace_start_live":"crowspace_stop_live";const{error}=await supabase.rpc(fn,{p_stream_id:b.dataset.id});b.disabled=false;if(error){document.querySelector("#studioStatus").textContent=error.message}else{document.querySelector("#studioStatus").textContent=fn.includes("start")?"Broadcast is LIVE.":"Broadcast ended.";await render()}});
 const form=document.createElement("form");form.className="card";form.innerHTML='<h2>Create Broadcast</h2><input id="stitle" placeholder="Stream title" required><textarea id="sdesc" placeholder="Description"></textarea><select id="provider"><option value="cloudflare_stream">Cloudflare Stream</option><option value="custom">Custom / Future Provider</option><option value="youtube">YouTube</option><option value="other">Other Provider</option></select><input id="playback" placeholder="Playback URL (provider output)"><input id="scheduled" type="datetime-local"><select id="visibility"><option value="public">Public</option><option value="members">Members only</option><option value="private">Private</option></select><label><input id="tvbridge" type="checkbox"> Enable CrowRules TV bridge metadata</label><input id="tvchannel" placeholder="TV channel key (optional)"><button class="btn">Create Broadcast</button><div id="createStatus" class="status"></div>';document.querySelector(".grid").appendChild(form);
 form.onsubmit=async e=>{e.preventDefault();const provider=document.querySelector("#provider").value;const payload={host_id:a.session.user.id,title:document.querySelector("#stitle").value.trim(),description:document.querySelector("#sdesc").value.trim()||null,provider,playback_url:document.querySelector("#playback").value.trim()||null,scheduled_for:document.querySelector("#scheduled").value?new Date(document.querySelector("#scheduled").value).toISOString():null,status:"scheduled",visibility:document.querySelector("#visibility").value,tv_bridge_enabled:document.querySelector("#tvbridge").checked,tv_channel_key:document.querySelector("#tvchannel").value.trim()||null};const result=await supabase.from("crowspace_live_streams").insert(payload).select("id").single();const status=document.querySelector("#createStatus");if(result.error){status.textContent=result.error.message;return}if(provider==="cloudflare_stream"){status.textContent="Provisioning secure Cloudflare Stream input…";const p=await supabase.functions.invoke("crowspace-live-provision",{body:{stream_id:result.data.id}});if(p.error||p.data?.error){status.textContent=p.data?.error||p.error?.message||"Provider provisioning failed."}else{status.innerHTML='<strong>Cloudflare Stream ready.</strong><br>RTMPS URL: <code>'+esc(p.data.ingest_url||"")+'</code><br>Stream Key: <code>'+esc(p.data.stream_key||"")+'</code><br><small class="muted">The stream key is shown only here to the signed-in creator and is not stored in CrowSpace.</small>'}}else status.textContent="Broadcast created.";form.reset();await render()};
}async function create(){
 const a=await account();
 layout("Create",'<section class="hero"><div class="eyebrow">Creator Tools</div><h1>Create on CrowSpace.</h1><p>Posts, pictures, Caws and communities share one social identity.</p></section><div class="grid"><form class="card" id="postForm"><h2>📝 New Post</h2><textarea id="body" placeholder="What are you thinking?"></textarea><button class="btn">Publish</button><div id="postStatus" class="status"></div></form><form class="card" id="pictureForm"><h2>📸 Picture</h2><input id="picture" type="file" accept="image/*" required><input id="pictureCaption" placeholder="Caption"><button class="btn">Upload Picture</button><div id="pictureStatus" class="status"></div></form><form class="card" id="cawForm"><h2>🎬 Caw</h2><input id="cawVideo" type="file" accept="video/*" required><input id="cawCaption" placeholder="Caw caption"><button class="btn">Upload Caw</button><div id="cawStatus" class="status"></div></form><form class="card" id="groupForm"><h2>👥 Group</h2><input id="gname" placeholder="Group name" required><input id="gslug" placeholder="group-slug" required><textarea id="gdesc" placeholder="Description"></textarea><button class="btn">Create Group</button><div id="groupStatus" class="status"></div></form></div>');
 if(!a){document.querySelectorAll("form").forEach(f=>f.innerHTML='<h2>Sign in required</h2><p class="muted">Use your CrowRules account first.</p><a class="btn" href="account.html">Open Account</a>');return}
 document.querySelector("#postForm").onsubmit=async e=>{e.preventDefault();const body=document.querySelector("#body").value.trim();if(!body)return;const{error}=await supabase.from("crowspace_posts").insert({user_id:a.session.user.id,body,visibility:"public"});document.querySelector("#postStatus").textContent=error?.message||"Posted.";if(!error)document.querySelector("#body").value=""};
 document.querySelector("#pictureForm").onsubmit=async e=>{e.preventDefault();const file=document.querySelector("#picture").files[0];if(!file)return;const id=crypto.randomUUID(),safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"),path=a.session.user.id+"/pictures/"+id+"-"+safe;document.querySelector("#pictureStatus").textContent="Uploading…";const up=await supabase.storage.from("crowspace-media").upload(path,file,{contentType:file.type,upsert:false});if(up.error){document.querySelector("#pictureStatus").textContent=up.error.message;return}const pub=supabase.storage.from("crowspace-media").getPublicUrl(path).data.publicUrl;const post=await supabase.from("crowspace_posts").insert({user_id:a.session.user.id,body:document.querySelector("#pictureCaption").value||"📷 Picture",visibility:"public"}).select("id").single();if(post.error){document.querySelector("#pictureStatus").textContent=post.error.message;return}const{error}=await supabase.from("crowspace_media").insert({user_id:a.session.user.id,post_id:post.data.id,media_type:"image",storage_path:path,public_url:pub,alt_text:document.querySelector("#pictureCaption").value||"CrowSpace picture"});document.querySelector("#pictureStatus").textContent=error?.message||"Picture uploaded and posted."};
 document.querySelector("#cawForm").onsubmit=async e=>{e.preventDefault();const file=document.querySelector("#cawVideo").files[0];if(!file)return;const id=crypto.randomUUID(),safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"),path=a.session.user.id+"/caws/"+id+"-"+safe;document.querySelector("#cawStatus").textContent="Uploading Caw…";const up=await supabase.storage.from("crowspace-media").upload(path,file,{contentType:file.type,upsert:false});if(up.error){document.querySelector("#cawStatus").textContent=up.error.message;return}const pub=supabase.storage.from("crowspace-media").getPublicUrl(path).data.publicUrl;const{error}=await supabase.from("crowspace_caws").insert({user_id:a.session.user.id,caption:document.querySelector("#cawCaption").value,video_path:path,video_url:pub,visibility:"public"});document.querySelector("#cawStatus").textContent=error?.message||"Caw published."};
 document.querySelector("#groupForm").onsubmit=async e=>{e.preventDefault();const{error}=await supabase.from("crowspace_groups").insert({owner_id:a.session.user.id,name:document.querySelector("#gname").value,slug:document.querySelector("#gslug").value.toLowerCase(),description:document.querySelector("#gdesc").value,privacy:"public"});document.querySelector("#groupStatus").textContent=error?.message||"Group created."};
}
async function accountPage(){
 const a=await account();
 layout("Account",'<section class="hero"><div class="eyebrow">Universal Account + CrowSpace Identity</div><h1>Your CrowSpace identity.</h1><p>One CrowRules login can power your CrowSpace identity while Universal Membership connects the wider CrowRules universe.</p></section><div class="card" id="acct"></div>');
 const box=document.querySelector("#acct");
 if(!a){box.innerHTML='<h2>Sign in / Create account</h2><input id="email" type="email" placeholder="Email"><input id="password" type="password" placeholder="Password"><button class="btn" id="signup">Create account</button> <button class="btn alt" id="signin">Sign in</button><div class="status" id="authStatus"></div>';document.querySelector("#signup").onclick=()=>auth("signup");document.querySelector("#signin").onclick=()=>auth("signin");return}
 const{data:m}=await supabase.from("crowspace_membership_status").select("*").eq("user_id",a.session.user.id).maybeSingle();
 const p=a.account?.crowspace_profiles||{};
 box.innerHTML='<div class="account-head">'+(p.avatar_url?'<img class="avatar" src="'+esc(p.avatar_url)+'" alt="">':'<div class="avatar placeholder">🪶</div>')+'<div><h2>@'+esc(a.account?.handle||"setup-needed")+'</h2><p>'+esc(a.account?.display_name||"")+'</p></div></div><div class="status">Universal Membership: <strong>'+(m?.is_universal_member?"ACTIVE":"NOT ACTIVE")+'</strong><br>Plan: '+esc(m?.membership_plan||"None")+'</div>'+
 (a.account?'<div class="grid"><div><h3>Social Identity</h3><p class="muted">'+esc(p.headline||"")+'</p><p>'+esc(p.bio||"")+'</p></div><div><h3>Stats</h3><div class="stats"><span>'+Number(p.followers_count||0)+' followers</span><span>'+Number(p.following_count||0)+' following</span><span>'+Number(p.caws_count||0)+' Caws</span><span>'+Number(p.posts_count||0)+' posts</span></div></div></div><button class="btn alt" id="signout">Sign out</button>':'<p>Finish your CrowSpace Nest below.</p><input id="handle" placeholder="Choose a CrowSpace handle"><input id="display" placeholder="Display name"><button class="btn" id="setup">Create CrowSpace Nest</button>');if(!a.account)document.querySelector("#setup").onclick=async()=>{const{error}=await supabase.rpc("crowspace_bootstrap_account",{p_handle:document.querySelector("#handle").value,p_display_name:document.querySelector("#display").value});document.querySelector("#acct").insertAdjacentHTML("beforeend",'<div class="status">'+(error?.message||"Nest created. Reload.")+'</div>')};else document.querySelector("#signout").onclick=()=>supabase.auth.signOut().then(()=>location.reload())
}
async function auth(mode){const email=document.querySelector("#email").value,password=document.querySelector("#password").value;const r=mode==="signup"?await supabase.auth.signUp({email,password}):await supabase.auth.signInWithPassword({email,password});document.querySelector("#authStatus").textContent=r.error?.message||"Success. Check your email if confirmation is enabled."}
async function notifications(){
 const a=await account();if(!a){layout("Notifications","<section class='hero'><h1>Notifications</h1><p>Sign in to view your CrowSpace activity.</p><a class='btn' href='account.html'>Open Account</a></section>");return}
 const{data}=await supabase.from("crowspace_notifications").select("*").eq("user_id",a.session.user.id).order("created_at",{ascending:false}).limit(50);
 layout("Notifications",'<section class="hero"><div class="eyebrow">Social Activity</div><h1>Notifications</h1><p>One notification center for follows, reactions, comments, groups, Caws and Live.</p></section><div class="feed">'+((data||[]).map(n=>'<article class="card '+(n.read_at?"":"feature")+'"><span class="pill">'+esc(n.notification_type||"activity")+'</span><p>'+esc(n.payload?.message||"You have new CrowSpace activity.")+'</p><div class="muted">'+new Date(n.created_at).toLocaleString()+'</div></article>').join("")||'<div class="card">You are all caught up.</div>')+'</div>');
 supabase.channel("crowspace-notifications").on("postgres_changes",{event:"INSERT",schema:"public",table:"crowspace_notifications",filter:"user_id=eq."+a.session.user.id},()=>{if(page==="notifications.html")notifications()}).subscribe();
}
async function searchPage(){
 const q=new URLSearchParams(location.search).get("q")||"";
 layout("Search",'<section class="hero"><div class="eyebrow">Connected Universe</div><h1>Universal Search</h1><p>Search people, Caws, posts, groups, Dreamscapes and Memorials from one CrowSpace entry point.</p><form id="searchForm"><input id="q" value="'+esc(q)+'" placeholder="Search the CrowRules universe…" required><button class="btn">Search</button></form></section><div id="results"></div>');
 if(q)runSearch(q);
 document.querySelector("#searchForm").onsubmit=e=>{e.preventDefault();const v=document.querySelector("#q").value.trim();if(v)location.href="search.html?q="+encodeURIComponent(v)}
}
async function runSearch(q){
 const term="%"+q.replace(/[%_]/g,"")+"%";
 const[people,caws,posts,groups,dream,memorials]=await Promise.all([
  supabase.from("crowspace_accounts").select("*,crowspace_profiles(*)").or("handle.ilike."+term+",display_name.ilike."+term).limit(8),
  supabase.from("crowspace_caws").select("*").ilike("caption",term).eq("visibility","public").limit(8),
  supabase.from("crowspace_posts").select("*").ilike("body",term).eq("visibility","public").limit(8),
  supabase.from("crowspace_groups").select("*").or("name.ilike."+term+",description.ilike."+term).eq("privacy","public").limit(8),
  supabase.from("ds_projects").select("id,title,slug,logline,description,status,visibility").eq("visibility","public").or("title.ilike."+term+",logline.ilike."+term+",description.ilike."+term).limit(8),
  supabase.from("memorials").select("id,slug,full_name,short_bio,known_for,portrait_url,published").eq("published",true).or("full_name.ilike."+term+",short_bio.ilike."+term+",known_for.ilike."+term).limit(8)
 ]);
 const out=document.querySelector("#results");
 out.innerHTML='<div class="search-section"><h2>People</h2><div class="grid">'+(people.data||[]).map(profileCard).join("")+'</div></div><div class="search-section"><h2>Caws</h2><div class="grid">'+(caws.data||[]).map(cawCard).join("")+'</div></div><div class="search-section"><h2>Posts</h2><div class="feed">'+(posts.data||[]).map(postCard).join("")+'</div></div><div class="search-section"><h2>Groups</h2><div class="grid">'+(groups.data||[]).map(x=>'<article class="card"><h3>'+esc(x.name)+'</h3><p>'+esc(x.description||"")+'</p></article>').join("")+'</div></div><div class="search-section"><h2>Dreamscapes</h2><div class="grid">'+(dream.data||[]).map(x=>'<article class="card feature"><span class="pill">'+esc(x.status||"PROJECT")+'</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.logline||x.description||"")+'</p><a class="btn" href="https://crowrulesentertainment-oss.github.io/dreamscapes/">Open Dreamscapes</a></article>').join("")+'</div></div><div class="search-section"><h2>Memorials</h2><div class="grid">'+(memorials.data||[]).map(x=>'<article class="card">'+(x.portrait_url?'<img class="media" src="'+esc(x.portrait_url)+'" alt="">':"")+'<h3>'+esc(x.full_name)+'</h3><p>'+esc(x.short_bio||x.known_for||"")+'</p><a class="btn alt" href="https://crowrulesentertainment-oss.github.io/memorials/">Open Memorials</a></article>').join("")+'</div></div>';
 bindSocialActions();
}
async function dreamscapes(){
 const{data}=await supabase.from("ds_projects").select("id,title,slug,logline,description,status,visibility,progress,created_at").eq("visibility","public").order("created_at",{ascending:false}).limit(20);
 layout("Dreamscapes",'<section class="hero"><div class="eyebrow">CrowRules Dreamscapes × CrowSpace</div><h1>Dreamscapes</h1><p>Discover public projects and creator ideas from the Dreamscapes universe.</p></section><div class="grid">'+(data||[]).map(x=>'<article class="card feature"><span class="pill">'+esc(x.status||"PROJECT")+'</span><h2>'+esc(x.title)+'</h2><p>'+esc(x.logline||x.description||"")+'</p>'+(x.progress!=null?'<div class="progress"><span style="width:'+Math.max(0,Math.min(100,Number(x.progress)))+'%"></span></div>':"")+'<a class="btn" href="https://crowrulesentertainment-oss.github.io/dreamscapes/">Open Dreamscapes</a></article>').join("")+'</div>')
}
async function memorials(){
 const{data}=await supabase.from("memorials").select("id,slug,full_name,birth_date,passing_date,short_bio,portrait_url,profession,known_for").eq("published",true).order("passing_date",{ascending:false}).limit(24);
 layout("Memorials",'<section class="hero"><div class="eyebrow">CrowRules Memorials × CrowSpace</div><h1>Memorials</h1><p>Discover remembrance pages and share memories with the community.</p></section><div class="grid">'+(data||[]).map(x=>'<article class="card">'+(x.portrait_url?'<img class="media" src="'+esc(x.portrait_url)+'" alt="'+esc(x.full_name)+'">':"")+'<h2>'+esc(x.full_name)+'</h2><p class="muted">'+esc(x.birth_date||"")+" — "+esc(x.passing_date||"")+'</p><p>'+esc(x.short_bio||x.known_for||"")+'</p><a class="btn" href="https://crowrulesentertainment-oss.github.io/memorials/">Open Memorials</a></article>').join("")+'</div>')
}
({ "index.html":home,"":home,"nest.html":nest,"caws.html":caws,"pictures.html":pictures,"groups.html":groups,"live.html":live,"watch.html":watch,"live-studio.html":studio,"create.html":create,"account.html":accountPage,"notifications.html":notifications,"search.html":searchPage,"dreamscapes.html":dreamscapes,"memorials.html":memorials }[page]||home)();