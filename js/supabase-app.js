(()=> {
const URL="https://cevylpnoexugwgygvtgu.supabase.co";
const KEY="sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-";
let sb=null, user=null;
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const q=k=>new URLSearchParams(location.search).get(k);
const page=()=>location.pathname.split("/").pop()||"index.html";
const card=x=>`<article class="card">${x}</article>`;
const button=(label,action)=>`<button class="btn" data-cr-action="${esc(action)}">${esc(label)}</button>`;
const avatar=(name,url)=>url?`<img class="avatar-img" src="${esc(url)}" alt="">`:`<div class="avatar">${esc(String(name||"?").slice(0,2).toUpperCase())}</div>`;
const when=x=>x?new Date(x).toLocaleString([],{dateStyle:"medium",timeStyle:"short"}):"";
const shell=(title,sub,body)=>`<div class="wrap"><section class="hero"><span class="eyebrow">CROWSPACE 3.1 · SUPABASE</span><h1>${esc(title)}</h1><p>${esc(sub||"")}</p></section>${body}</div>`;
const gate=()=>card('<span class="kicker">ACCOUNT REQUIRED</span><h2>Sign in to continue</h2><p class="muted">This feature is persistent and requires a CrowSpace account.</p><a class="btn" href="auth.html">Sign In / Create Account</a>');
async function boot(){
 if(!window.supabase?.createClient){await new Promise(ok=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";s.onload=ok;s.onerror=ok;document.head.appendChild(s)})}
 if(!window.supabase?.createClient)return;
 sb=window.supabase.createClient(URL,KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 user=(await sb.auth.getUser()).data.user;
 await ensureProfile();
 await render();
 sb.auth.onAuthStateChange((_,u)=>{user=u;render()});
}
async function ensureProfile(){
 if(!user)return;
 const {data}=await sb.from("crowspace_profiles").select("user_id").eq("user_id",user.id).maybeSingle();
 if(!data)await sb.from("crowspace_profiles").insert({user_id:user.id,username:(user.email||"member").split("@")[0],display_name:user.user_metadata?.display_name||user.user_metadata?.full_name||"CrowSpace Member",profile_visibility:"public"});
}
async function getProfiles(ids){
 if(!ids.length)return [];
 return (await sb.from("crowspace_profiles").select("*").in("user_id",ids)).data||[];
}
async function feed(){
 const {data:posts,error}=await sb.from("crowspace_posts").select("*").eq("status","published").order("created_at",{ascending:false}).limit(60);
 if(error){app.innerHTML=shell("CrowFeed","Cloud feed error",card(esc(error.message)));return}
 const rows=posts||[], ids=[...new Set(rows.map(x=>x.author_id).filter(Boolean))], people=await getProfiles(ids);
 const comments=rows.length?(await sb.from("crowspace_comments").select("*").in("post_id",rows.map(x=>x.id)).order("created_at")).data||[]:[];
 const reactions=rows.length?(await sb.from("crowspace_post_reactions").select("*").in("post_id",rows.map(x=>x.id))).data||[]:[];
 const groups=(await sb.from("crowspace_groups").select("id,name,slug").eq("visibility","public").order("name")).data||[];
 const html=[];
 if(user)html.push(card(`<span class="kicker">SHARE WITH YOUR UNIVERSE</span><form id="crPost"><textarea class="search" name="body" rows="3" placeholder="What is happening in your space?" required></textarea><select class="search" name="group"><option value="">CrowFeed</option>${groups.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join("")}</select><button class="btn">Publish</button></form>`)); else html.push(gate());
 for(const p of rows){
  const author=people.find(x=>x.user_id===p.author_id), cs=comments.filter(x=>x.post_id===p.id), rs=reactions.filter(x=>x.post_id===p.id);
  const counts={};rs.forEach(x=>counts[x.reaction]=(counts[x.reaction]||0)+1);
  const chtml=cs.map(c=>{const a=people.find(x=>x.user_id===c.author_id);return `<div class="wall"><b>${esc(a?.display_name||"Member")}</b><p>${esc(c.content)}</p><small class="muted">${when(c.created_at)}</small></div>`}).join("");
  const reacts=["like","love","fire","laugh","idea"].map(x=>button(({like:"👍",love:"❤️",fire:"🔥",laugh:"😂",idea:"💡"})[x]+" "+(counts[x]||0),"react:"+p.id+":"+x)).join("");
  html.push(card(`<div class="post-head">${avatar(author?.display_name,author?.avatar_url)}<div><b>${esc(author?.display_name||"Member")}</b><div class="muted">${when(p.created_at)}</div></div></div><p class="post-copy">${esc(p.body)}</p><div class="signal">${reacts}</div><div class="comments">${chtml}${user?`<form class="inline-form" data-comment="${p.id}"><input class="search" name="body" placeholder="Add a comment…" required><button class="btn">Comment</button></form>`:""}</div>`));
 }
 app.innerHTML=shell("CrowFeed","The persistent community feed.",html.join("")||card("<p>No posts yet.</p>"));
}
async function profile(){
 const id=q("id")||user?.id;
 if(!id){app.innerHTML=shell("My Space","Your CrowSpace profile.",gate());return}
 const {data:u,error}=await sb.from("crowspace_profiles").select("*").eq("user_id",id).maybeSingle();
 if(error||!u){app.innerHTML=shell("Profile","Profile not found.",card("<p>This member has no public profile yet.</p>"));return}
 if(user&&user.id!==id)await sb.from("crowspace_profile_visits").upsert({profile_id:id,visitor_id:user.id,visited_at:new Date().toISOString()},{onConflict:"profile_id,visitor_id"});
 const posts=(await sb.from("crowspace_posts").select("*").eq("author_id",id).eq("status","published").order("created_at",{ascending:false}).limit(20)).data||[];
 const fr=(await sb.from("crowspace_friends").select("*").or("requester_id.eq."+id+",recipient_id.eq."+id).eq("status","accepted")).data||[];
 const ids=[...new Set(fr.flatMap(x=>[x.requester_id,x.recipient_id]).filter(x=>x!==id))], friends=await getProfiles(ids);
 let actions="";
 if(user&&user.id!==id)actions=button("CrowMail","message:"+id)+" "+button("Add Friend","friend:"+id)+" "+button("Follow","follow:"+id);
 if(user&&user.id===id)actions=button("Customize","goto:customize.html");
 const postsHtml=posts.map(p=>`<div class="wall"><p>${esc(p.body)}</p><small class="muted">${when(p.created_at)}</small></div>`).join("")||'<p class="muted">No posts yet.</p>';
 const friendHtml=friends.map(f=>`<p><a href="profile.html?id=${f.user_id}">${esc(f.display_name||f.username||"Member")}</a></p>`).join("")||'<p class="muted">No connections yet.</p>';
 app.innerHTML=shell(u.display_name||u.username||"My Space","Persistent profile.",`<section class="profile-cover" style="background-image:url(${esc(u.banner_url||u.background_url||"")})"><div class="profile-overlay">${avatar(u.display_name,u.avatar_url)}<div><span class="eyebrow">PROFILE</span><h1>${esc(u.display_name||u.username||"Member")}</h1><p>@${esc(u.username||"member")} · ${esc(u.location||"")}</p></div></div></section><div class="profile-actions">${actions}</div><div class="layout profile-layout"><main>${card('<span class="kicker">ABOUT</span><p>'+esc(u.bio||"This member has not added a bio yet.")+'</p><p class="muted">'+esc(u.interests||"")+'</p>')}${card('<span class="kicker">POSTS</span>'+postsHtml)}</main><aside>${card('<span class="kicker">PROFILE</span><p>Joined '+esc(new Date(u.created_at).toLocaleDateString())+'</p><p>'+esc(u.website_url||"")+'</p>')}${card('<span class="kicker">FRIENDS</span>'+friendHtml)}</aside></div>`);
}
async function groups(){
 const rows=(await sb.from("crowspace_groups").select("*").eq("visibility","public").order("created_at",{ascending:false})).data||[];
 app.innerHTML=shell("Groups","Persistent communities.",'<div class="grid">'+rows.map(g=>card('<span class="kicker">GROUP</span><h2>'+esc(g.name)+'</h2><p>'+esc(g.description||"")+'</p>'+button("Open","group:"+g.slug)+(user?" "+button("Join","join:"+g.id):""))).join("")+'</div>');
}
async function group(){
 const slug=q("id")||"g0",g=(await sb.from("crowspace_groups").select("*").eq("slug",slug).maybeSingle()).data;
 if(!g){app.innerHTML=shell("Group","Not found.",card("<p>Group not found.</p>"));return}
 const threads=(await sb.from("crowspace_group_threads").select("*").eq("group_id",g.id).order("created_at",{ascending:false}).limit(50)).data||[];
 const ids=[...new Set(threads.map(x=>x.author_id))],authors=await getProfiles(ids);
 const replies=threads.length?(await sb.from("crowspace_group_thread_replies").select("*").in("thread_id",threads.map(x=>x.id)).order("created_at")).data||[]:[];
 let html=user?card('<span class="kicker">START A DISCUSSION</span><form id="crThread"><input class="search" name="title" placeholder="Discussion title" required><textarea class="search" name="body" rows="3" placeholder="Start the conversation…" required></textarea><button class="btn">Create Discussion</button></form>'):gate();
 for(const t of threads){
  const a=authors.find(x=>x.user_id===t.author_id);
  const rr=replies.filter(x=>x.thread_id===t.id).map(x=>{const ra=authors.find(y=>y.user_id===x.author_id);return `<div class="reply"><b>${esc(ra?.display_name||"Member")}</b>: ${esc(x.body)}</div>`}).join("");
  html+=card(`<div class="feed-meta"><span class="feed-type">THREAD</span><span class="muted">${when(t.created_at)}</span></div><h3>${esc(t.title)}</h3><p>${esc(t.body)}</p><p class="muted">By ${esc(a?.display_name||"Member")}</p>${rr}${user?`<form class="inline-form" data-reply="${t.id}"><input class="search" name="body" placeholder="Reply…" required><button class="btn">Reply</button></form>`:""}`);
 }
 app.innerHTML=shell(g.name,g.description||"Community discussion.",html);
}
async function spaces(){
 const rows=(await sb.from("crowspace_spaces").select("*").eq("visibility","public").order("name")).data||[];
 app.innerHTML=shell("CrowSpaces","Persistent community hubs.",'<div class="grid">'+rows.map(s=>card('<span class="kicker">HUB</span><h2>'+esc(s.name)+'</h2><p>'+esc(s.description||"")+'</p><a class="btn" href="groups.html">Explore Groups</a>')).join("")+'</div>');
}
async function rooms(){
 const rows=(await sb.from("crowspace_rooms").select("*").eq("visibility","public").order("created_at")).data||[];
 app.innerHTML=shell("CrowRooms","Persistent live conversations.",'<div class="grid">'+rows.map(r=>card('<span class="kicker">CROWROOM</span><h2>'+esc(r.name)+'</h2><p>'+esc(r.topic||"")+'</p><a class="btn" href="room.html?id='+esc(r.slug)+'">Enter Room</a>')).join("")+'</div>');
}
async function events(){
 const rows=(await sb.from("crowspace_events").select("*").eq("visibility","public").order("starts_at")).data||[];
 const mine=user?(await sb.from("crowspace_event_members").select("event_id").eq("user_id",user.id)).data||[]:[];
 app.innerHTML=shell("Events","Persistent community calendar.",'<div class="grid">'+rows.map(e=>{const joined=mine.some(x=>x.event_id===e.id);return card('<span class="kicker">EVENT</span><h2>'+esc(e.title)+'</h2><p>'+esc(e.description||"")+'</p><p class="muted">'+when(e.starts_at)+' · '+esc(e.location||"")+'</p>'+(user?button(joined?"✓ Interested":"I’m Interested","rsvp:"+e.id):""))}).join("")+'</div>');
}
async function media(){
 let query=sb.from("crowspace_media").select("*").eq("visibility","public").order("created_at",{ascending:false});
 if(q("user"))query=query.eq("user_id",q("user"));
 const rows=(await query.limit(60)).data||[];
 let html=user?card('<span class="kicker">ADD MEDIA</span><form id="crMedia"><input class="search" name="title" placeholder="Title"><input class="search" name="url" placeholder="Media URL" required><select class="search" name="type"><option value="image">Photo</option><option value="video">Video</option><option value="audio">Audio</option></select><button class="btn">Add Media</button></form>'):gate();
 html+='<div class="media-grid">'+rows.map(m=>card(m.media_type==="image"?'<img class="media-thumb" src="'+esc(m.media_url)+'" alt="'+esc(m.title||"")+'"><h3>'+esc(m.title||"Untitled")+'</h3>':'<h3>'+esc(m.title||"Media")+'</h3><a class="btn" href="'+esc(m.media_url)+'" target="_blank" rel="noopener">Open '+esc(m.media_type)+'</a>')).join("")+'</div>';
 app.innerHTML=shell("Media Gallery","Persistent member media.",html);
}
async function notifications(){
 if(!user){app.innerHTML=shell("Notifications","Persistent activity inbox.",gate());return}
 const rows=(await sb.from("crowspace_notifications").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100)).data||[];
 app.innerHTML=shell("Notifications","Your persistent activity inbox.",card(button("Mark All Read","readall"))+(rows.map(n=>'<div class="notification '+(!n.is_read?"unread":"")+'"><span class="notify-dot"></span><div><b>'+esc(n.message||n.type)+'</b><p class="muted">'+when(n.created_at)+'</p></div></div>').join("")||'<p class="muted">You are all caught up.</p>'));
}
async function friends(){
 if(!user){app.innerHTML=shell("Friends","Your social graph.",gate());return}
 const rows=(await sb.from("crowspace_friends").select("*").or("requester_id.eq."+user.id+",recipient_id.eq."+user.id).order("created_at",{ascending:false})).data||[];
 const ids=[...new Set(rows.flatMap(x=>[x.requester_id,x.recipient_id]).filter(x=>x!==user.id))],people=await getProfiles(ids);
 const html=rows.map(r=>{const id=r.requester_id===user.id?r.recipient_id:r.requester_id,p=people.find(x=>x.user_id===id);return '<div class="person-row">'+avatar(p?.display_name,p?.avatar_url)+'<div><a href="profile.html?id='+id+'"><b>'+esc(p?.display_name||"Member")+'</b></a><p class="muted">'+esc(r.status)+'</p></div>'+(r.status==="pending"&&r.recipient_id===user.id?button("Accept","accept:"+r.id):"")+'</div>'}).join("");
 app.innerHTML=shell("Friends & Connections","Persistent social graph.",card('<span class="kicker">CONNECTIONS</span>'+ (html||'<p class="muted">No connections yet.</p>')));
}
async function discover(){
 const profileIds=((await sb.from("crowspace_profiles").select("user_id").eq("profile_visibility","public").limit(100)).data||[]).map(x=>x.user_id);
 const [people,groups,rooms]=await Promise.all([getProfiles(profileIds),sb.from("crowspace_groups").select("name,slug,description").eq("visibility","public"),sb.from("crowspace_rooms").select("name,slug,topic").eq("visibility","public")]);
 const term=(q("q")||"").toLowerCase(),ps=people.filter(x=>(x.display_name+" "+x.username+" "+(x.bio||"")).toLowerCase().includes(term));
 let html=ps.map(x=>card(avatar(x.display_name,x.avatar_url)+'<h2>'+esc(x.display_name||x.username)+'</h2><p>'+esc(x.bio||"")+'</p><a class="btn" href="profile.html?id='+x.user_id+'">Profile</a>')).join("");
 html+=(groups.data||[]).map(x=>card('<span class="kicker">GROUP</span><h2>'+esc(x.name)+'</h2><p>'+esc(x.description||"")+'</p><a class="btn" href="group.html?id='+x.slug+'">Open</a>')).join("");
 html+=(rooms.data||[]).map(x=>card('<span class="kicker">ROOM</span><h2>'+esc(x.name)+'</h2><p>'+esc(x.topic||"")+'</p><a class="btn" href="room.html?id='+x.slug+'">Open</a>')).join("");
 app.innerHTML=shell("Discover","Find people and communities.",'<div class="grid">'+html+'</div>');
}
async function customize(){
 if(!user){app.innerHTML=shell("Customize My Space","Persistent profile studio.",gate());return}
 const u=(await sb.from("crowspace_profiles").select("*").eq("user_id",user.id).single()).data;
 app.innerHTML=shell("Customize My Space","Changes are stored in Supabase.",card(`<form id="crProfile"><label>Display name</label><input class="search" name="display_name" value="${esc(u?.display_name||"")}"><label>Username</label><input class="search" name="username" value="${esc(u?.username||"")}"><label>Bio</label><textarea class="search" name="bio" rows="5">${esc(u?.bio||"")}</textarea><label>Location</label><input class="search" name="location" value="${esc(u?.location||"")}"><label>Avatar URL</label><input class="search" name="avatar_url" value="${esc(u?.avatar_url||"")}"><label>Banner URL</label><input class="search" name="banner_url" value="${esc(u?.banner_url||"")}"><label>Interests</label><input class="search" name="interests" value="${esc(u?.interests||"")}"><label>Music URL</label><input class="search" name="music_url" value="${esc(u?.music_url||"")}"><button class="btn">Save My Space</button></form>`));
}
async function createPost(){app.innerHTML=shell("Create Post","Publish a persistent CrowFeed post.",user?card('<form id="crPostFull"><textarea class="search" name="body" rows="7" placeholder="Tell your community more…" required></textarea><button class="btn">Publish Post</button></form>'):gate())}
async function createEvent(){app.innerHTML=shell("Create Event","Create a persistent community event.",user?card('<form id="crEvent"><input class="search" name="title" placeholder="Event name" required><textarea class="search" name="description" rows="4" placeholder="Description"></textarea><input class="search" name="starts_at" type="datetime-local" required><input class="search" name="location" placeholder="Location or CrowRoom"><button class="btn">Create Event</button></form>'):gate())}
async function createGroup(){app.innerHTML=shell("Create Group","Create a persistent community.",user?card('<form id="crGroup"><input class="search" name="name" placeholder="Group name" required><input class="search" name="slug" placeholder="group-slug" required><textarea class="search" name="description" rows="4" placeholder="Description"></textarea><button class="btn">Create Group</button></form>'):gate())}
async function createSpace(){app.innerHTML=shell("Create CrowSpace","Create a persistent community hub.",user?card('<form id="crSpace"><input class="search" name="name" placeholder="CrowSpace name" required><input class="search" name="slug" placeholder="hub-slug" required><textarea class="search" name="description" rows="4" placeholder="Description"></textarea><button class="btn">Create CrowSpace</button></form>'):gate())}
async function submit(e){
 const f=e.target;if(!sb)return;
 if(f.id==="crPost"||f.id==="crPostFull"){e.preventDefault();const d=new FormData(f),r=await sb.from("crowspace_posts").insert({author_id:user.id,body:String(d.get("body")).trim(),group_id:String(d.get("group")||"")||null,visibility:"public",status:"published"});if(r.error)alert(r.error.message);else feed()}
 if(f.id==="crThread"){e.preventDefault();const d=new FormData(f),g=(await sb.from("crowspace_groups").select("id").eq("slug",q("id")||"g0").single()).data,r=await sb.from("crowspace_group_threads").insert({group_id:g.id,author_id:user.id,title:String(d.get("title")).trim(),body:String(d.get("body")).trim()});if(r.error)alert(r.error.message);else group()}
 if(f.dataset.reply){e.preventDefault();const r=await sb.from("crowspace_group_thread_replies").insert({thread_id:f.dataset.reply,author_id:user.id,body:String(new FormData(f).get("body")).trim()});if(r.error)alert(r.error.message);else group()}
 if(f.dataset.comment){e.preventDefault();const r=await sb.from("crowspace_comments").insert({post_id:f.dataset.comment,author_id:user.id,content:String(new FormData(f).get("body")).trim()});if(r.error)alert(r.error.message);else feed()}
 if(f.id==="crProfile"){e.preventDefault();const d=new FormData(f),patch={display_name:String(d.get("display_name")).trim(),username:String(d.get("username")).trim(),bio:String(d.get("bio")).trim(),location:String(d.get("location")).trim(),avatar_url:String(d.get("avatar_url")).trim(),banner_url:String(d.get("banner_url")).trim(),interests:String(d.get("interests")).trim(),music_url:String(d.get("music_url")).trim(),updated_at:new Date().toISOString()},r=await sb.from("crowspace_profiles").update(patch).eq("user_id",user.id);if(r.error)alert(r.error.message);else profile()}
 if(f.id==="crMedia"){e.preventDefault();const d=new FormData(f),r=await sb.from("crowspace_media").insert({user_id:user.id,title:String(d.get("title")).trim(),media_url:String(d.get("url")).trim(),media_type:String(d.get("type")),visibility:"public"});if(r.error)alert(r.error.message);else media()}
 if(f.id==="crEvent"){e.preventDefault();const d=new FormData(f),r=await sb.from("crowspace_events").insert({owner_id:user.id,title:String(d.get("title")).trim(),description:String(d.get("description")).trim(),starts_at:new Date(String(d.get("starts_at"))).toISOString(),location:String(d.get("location")).trim(),visibility:"public"});if(r.error)alert(r.error.message);else events()}
 if(f.id==="crGroup"){e.preventDefault();const d=new FormData(f),r=await sb.from("crowspace_groups").insert({name:String(d.get("name")).trim(),slug:String(d.get("slug")).trim(),description:String(d.get("description")).trim(),owner_id:user.id,visibility:"public",status:"active"}).select().single();if(r.error){alert(r.error.message)}else{await sb.from("crowspace_group_members").upsert({group_id:r.data.id,user_id:user.id,role:"owner",status:"active"},{onConflict:"group_id,user_id"});location.href="group.html?id="+r.data.slug}}
 if(f.id==="crSpace"){e.preventDefault();const d=new FormData(f),r=await sb.from("crowspace_spaces").insert({name:String(d.get("name")).trim(),slug:String(d.get("slug")).trim(),description:String(d.get("description")).trim(),created_by:user.id,visibility:"public"});if(r.error)alert(r.error.message);else spaces()}
}
async function act(a){
 if(a.startsWith("goto:")){location.href=a.slice(5);return}
 if(a.startsWith("message:")){location.href="messages.html?user="+a.slice(8);return}
 if(a.startsWith("friend:")){if(!user){location.href="auth.html";return}const r=await sb.from("crowspace_friends").insert({requester_id:user.id,recipient_id:a.slice(7),status:"pending"});if(r.error&&r.error.code!=="23505")alert(r.error.message);else profile();return}
 if(a.startsWith("follow:")){if(!user){location.href="auth.html";return}const id=a.slice(7),x=(await sb.from("crowspace_follows").select("*").eq("follower_id",user.id).eq("following_id",id).maybeSingle()).data;if(x)await sb.from("crowspace_follows").delete().eq("follower_id",user.id).eq("following_id",id);else await sb.from("crowspace_follows").insert({follower_id:user.id,following_id:id});profile();return}
 if(a.startsWith("join:")){if(!user){location.href="auth.html";return}await sb.from("crowspace_group_members").upsert({group_id:a.slice(5),user_id:user.id,role:"member",status:"active"},{onConflict:"group_id,user_id"});group();return}
 if(a.startsWith("accept:")){await sb.from("crowspace_friends").update({status:"accepted",updated_at:new Date().toISOString()}).eq("id",a.slice(7)).eq("recipient_id",user.id);friends();return}
 if(a.startsWith("react:")){if(!user){location.href="auth.html";return}const z=a.split(":"),pid=z[1],reaction=z[2],x=(await sb.from("crowspace_post_reactions").select("*").eq("post_id",pid).eq("user_id",user.id).eq("reaction",reaction).maybeSingle()).data;if(x)await sb.from("crowspace_post_reactions").delete().eq("post_id",pid).eq("user_id",user.id).eq("reaction",reaction);else await sb.from("crowspace_post_reactions").insert({post_id:pid,user_id:user.id,reaction});feed();return}
 if(a.startsWith("rsvp:")){if(!user){location.href="auth.html";return}const id=a.slice(5),x=(await sb.from("crowspace_event_members").select("*").eq("event_id",id).eq("user_id",user.id).maybeSingle()).data;if(x)await sb.from("crowspace_event_members").delete().eq("event_id",id).eq("user_id",user.id);else await sb.from("crowspace_event_members").insert({event_id:id,user_id:user.id,status:"going"});events();return}
 if(a==="readall"){await sb.from("crowspace_notifications").update({is_read:true}).eq("user_id",user.id);notifications()}
}
async function render(){
 const p=page(), map={"index.html":feed,"profile.html":profile,"groups.html":groups,"group.html":group,"spaces.html":spaces,"rooms.html":rooms,"events.html":events,"event.html":events,"media.html":media,"photos.html":media,"videos.html":media,"notifications.html":notifications,"friends.html":friends,"discover.html":discover,"customize.html":customize,"create-post.html":createPost,"create-group.html":createGroup,"create-space.html":createSpace,"create-event.html":createEvent,"create-media.html":media};
 if(map[p])await map[p]();
}
document.addEventListener("submit",submit);
document.addEventListener("click",e=>{const b=e.target.closest("[data-cr-action]");if(b)act(b.dataset.crAction)});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();