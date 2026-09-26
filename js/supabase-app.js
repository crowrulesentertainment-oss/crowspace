(()=> {
const URL="https://cevylpnoexugwgygvtgu.supabase.co";
const KEY="sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-";
let sb=null, user=null, liveChannels=[];const app=document.getElementById("app");
const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const q=k=>new URLSearchParams(location.search).get(k);
const page=()=>location.pathname.split("/").pop()||"index.html";
const card=x=>`<article class="card">${x}</article>`;
const button=(label,action)=>`<button class="btn" data-cr-action="${esc(action)}">${esc(label)}</button>`;
const avatar=(name,url)=>url?`<img class="avatar-img" src="${esc(url)}" alt="">`:`<div class="avatar">${esc(String(name||"?").slice(0,2).toUpperCase())}</div>`;
const when=x=>x?new Date(x).toLocaleString([],{dateStyle:"medium",timeStyle:"short"}):"";
const shell=(title,sub,body)=>`<div class="wrap"><section class="hero"><span class="eyebrow">CROWSPACE 4.0 · SUPABASE</span><h1>${esc(title)}</h1><p>${esc(sub||"")}</p></section>${body}</div>`;
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
async function activity(){
 if(!user){app.innerHTML=shell("Activity","Your unified CrowSpace social timeline.",gate());return}
 const modes={all:"ALL ACTIVITY",foryou:"FOR YOU",following:"FOLLOWING",friends:"FRIENDS",communities:"COMMUNITIES",local:"LOCAL",trending:"TRENDING",recent:"RECENT"};
 const mode=(q("mode")||"foryou").toLowerCase();
 const icons={friend:"👥",follow:"➕",post:"✦",comment:"💬",reaction:"⚡",event:"📅",group:"◈",room:"◉"};
 let rows=[];
 if(mode==="foryou"){
   const r=await sb.rpc("crowspace_activity_rank",{p_user:user.id,p_limit:120});
   if(r.error){app.innerHTML=shell("Activity","Personalized social timeline.",card("<p>"+esc(r.error.message)+"</p>"));return}
   rows=r.data||[];
 }else{
   const r=await sb.from("crowspace_activity").select("*").order("created_at",{ascending:false}).limit(200);
   if(r.error){app.innerHTML=shell("Activity","Unified social timeline.",card("<p>"+esc(r.error.message)+"</p>"));return}
   rows=r.data||[];
 }
 const ids=[...new Set(rows.map(x=>x.actor_id).filter(Boolean))],people=await getProfiles(ids);
 const me=people.find(x=>x.user_id===user.id);
 const friendIds=new Set(),followIds=new Set();
 const [fr,fo]=await Promise.all([
   sb.from("crowspace_friends").select("requester_id,recipient_id").eq("status","accepted").or("requester_id.eq."+user.id+",recipient_id.eq."+user.id),
   sb.from("crowspace_follows").select("following_id").eq("follower_id",user.id)
 ]);
 (fr.data||[]).forEach(x=>friendIds.add(x.requester_id===user.id?x.recipient_id:x.requester_id));
 (fo.data||[]).forEach(x=>followIds.add(x.following_id));
 const now=Date.now(),week=now-7*86400000;
 if(mode==="following")rows=rows.filter(x=>x.actor_id===user.id||followIds.has(x.actor_id));
 if(mode==="friends")rows=rows.filter(x=>x.actor_id===user.id||friendIds.has(x.actor_id));
 if(mode==="communities")rows=rows.filter(x=>["group","room","event"].includes(x.type));
 if(mode==="local"){
   const loc=(me?.location||"").trim().toLowerCase();
   rows=loc?rows.filter(x=>{const p=people.find(y=>y.user_id===x.actor_id);return (p?.location||"").trim().toLowerCase()===loc}):[];
 }
 if(mode==="recent")rows=rows.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 if(mode==="trending"){
   rows=rows.filter(x=>new Date(x.created_at).getTime()>=week);
   const counts={};rows.forEach(x=>{const k=x.type+"|"+(x.reference_id||x.id);counts[k]=(counts[k]||0)+1});
   rows.sort((a,b)=>(counts[b.type+"|"+(b.reference_id||b.id)]||0)-(counts[a.type+"|"+(a.reference_id||a.id)]||0)||new Date(b.created_at)-new Date(a.created_at));
 }
 const groups={};rows.forEach(x=>{const key=x.type+"|"+(x.reference_id||x.id);(groups[key]??=[]).push(x)});
 const name=id=>{const p=people.find(x=>x.user_id===id);return p?.display_name||p?.username||"Member"};
 const target=x=>x.type==="post"||x.type==="comment"||x.type==="reaction"?"index.html#post-"+(x.reference_id||""):x.type==="event"?"event.html?id="+(x.reference_id||""):x.type==="group"?"group.html":x.type==="room"?"room.html":x.actor_id?"profile.html?id="+x.actor_id:"friends.html";
 const cards=Object.values(groups).map(items=>{const x=items[0],count=items.length,actorIds=[...new Set(items.map(i=>i.actor_id).filter(Boolean))],names=actorIds.slice(0,3).map(name),more=Math.max(0,actorIds.length-3),who=names.join(", ")+(more?" + "+more+" more":"");const grouped=count>1&&(x.type==="reaction"||x.type==="comment"||x.type==="event"),msg=grouped?(x.type==="event"?count+" people responded to this event":who+" "+(x.type==="reaction"?"reacted to":"commented on")+" this post"):(x.message||modes[x.type]||"Activity");return card('<div class="activity-row"><div class="activity-icon">'+(icons[x.type]||"•")+'</div><div class="activity-main"><div class="feed-meta"><span class="feed-type">'+esc((modes[x.type]||x.type||"ACTIVITY").toUpperCase())+'</span><span class="muted">'+esc(when(x.created_at))+'</span></div><b>'+esc(msg)+'</b><p class="muted">'+(grouped?count+" events · ":"")+(x.actor_id?'<a href="profile.html?id='+x.actor_id+'">'+esc(name(x.actor_id))+"</a>":"")+'</p><a class="btn" href="'+esc(target(x))+'">Open</a></div></div>')}).join("")||card('<p class="muted">No activity matches this view yet.</p>');
 const chips=Object.entries(modes).map(([k,v])=>'<a class="filter-chip '+(mode===k?"active":"")+'" href="activity.html?mode='+k+'">'+v+'</a>').join("");
 app.innerHTML=shell("Activity","Personalized social intelligence across the CrowSpace universe.",card('<div class="community-head"><div><span class="kicker">ACTIVITY INTELLIGENCE</span><h2>'+esc(modes[mode]||modes.foryou)+'</h2><p class="muted">Realtime activity, personalized from your relationships, communities, location, recency and engagement.</p></div></div><div class="filter-row activity-filters">'+chips+'</div>')+cards);
}
async function notifications(){
 if(!user){app.innerHTML=shell("Notifications","Persistent activity inbox.",gate());return}
 const {data:rows,error}=await sb.from("crowspace_notifications").select("*").eq("user_id",user.id).order("created_at",{ascending:false}).limit(200);
 if(error){app.innerHTML=shell("Notifications","Live activity inbox.",card("<p>"+esc(error.message)+"</p>"));return}
 const list=rows||[],actorIds=[...new Set(list.map(n=>n.actor_id).filter(Boolean))],actors=await getProfiles(actorIds);
 const [friendRows,followRows]=await Promise.all([
   sb.from("crowspace_friends").select("id,requester_id,recipient_id,status").or("requester_id.eq."+user.id+",recipient_id.eq."+user.id),
   sb.from("crowspace_follows").select("follower_id,following_id").or("follower_id.eq."+user.id+",following_id.eq."+user.id)
 ]);
 const friends=friendRows.data||[], follows=followRows.data||[];
 const unread=list.filter(n=>!n.is_read).length;
 const label={friend_request:"FRIEND REQUEST",follow:"FOLLOW",comment:"COMMENT",reaction:"REACTION",event_rsvp:"EVENT RSVP"};
 const icon={friend_request:"👥",follow:"➕",comment:"💬",reaction:"⚡",event_rsvp:"📅"};
 const actorName=n=>{const a=actors.find(x=>x.user_id===n.actor_id);return a?.display_name||a?.username||"Member"};
 const target=n=>{
   if(n.type==="event_rsvp")return n.reference_id?"event.html?id="+n.reference_id:"events.html";
   if(n.type==="comment"||n.type==="reaction")return n.reference_id?"index.html#post-"+n.reference_id:"index.html";
   return n.actor_id?"profile.html?id="+n.actor_id:"friends.html";
 };
 const relationState=n=>{
   if(n.type==="friend_request"&&n.actor_id){const f=friends.find(x=>x.id===n.reference_id|| (x.requester_id===n.actor_id&&x.recipient_id===user.id));return f?.status||"pending"}
   if(n.type==="follow"&&n.actor_id)return follows.some(x=>x.follower_id===user.id&&x.following_id===n.actor_id)?"following":"not_following";
   return null;
 };
 const action=n=>{
   const a=[];
   if(n.type==="friend_request"){
     const state=relationState(n);
     if(state==="pending"){a.push(button("Accept","notifyaccept:"+n.id+":"+(n.actor_id||"")));a.push(button("Decline","notifydecline:"+n.id+":"+(n.actor_id||"")))}
     else a.push('<span class="muted">'+esc(state||"handled")+"</span>");
   }else if(n.type==="follow"){
     a.push(relationState(n)==="following"?'<span class="muted">Following back</span>':button("Follow Back","notifyfollow:"+n.id+":"+(n.actor_id||"")));
     a.push('<a class="btn" href="'+target(n)+'">View Profile</a>');
   }else if(n.type==="event_rsvp")a.push('<a class="btn" href="'+target(n)+'">View Event</a>');
   else if(n.type==="comment")a.push('<a class="btn" href="'+target(n)+'">Reply / View Post</a>');
   else if(n.type==="reaction")a.push('<a class="btn" href="'+target(n)+'">View Post</a>');
   if(!n.is_read)a.push(button("Mark Read","read:"+n.id));
   return a.join(" ");
 };
 const recentCutoff=Date.now()-24*60*60*1000;
 const aggregate=(type)=>{
   const items=list.filter(n=>(n.type||"activity")===type);
   if(!items.length)return [];
   const groups=[];
   const byRef={};
   for(const n of items){
     const ref=n.reference_id||"none",canGroup=(type==="reaction"||type==="comment"||type==="event_rsvp")&&new Date(n.created_at).getTime()>=recentCutoff;
     if(canGroup&&byRef[ref])byRef[ref].push(n);
     else if(canGroup){byRef[ref]=[n];groups.push(byRef[ref])}
     else groups.push([n]);
   }
   return groups.map(items=>{
     const first=items[0],count=items.length;
     if(count>1&&(type==="reaction"||type==="comment")){
       const names=[...new Set(items.slice(0,3).map(actorName))],more=Math.max(0,count-names.length);
       const who=names.join(", ")+(more?" + "+more+" more":"");
       const noun=type==="reaction"?"reacted to":"commented on";
       return '<article class="notification '+(items.some(x=>!x.is_read)?"unread":"")+'"><div class="notify-icon">'+icon[type]+'</div><div class="notification-body"><div><span class="kicker">'+label[type]+'</span><b>'+esc(who)+" "+noun+" your post</b></div><p class="muted">"+count+" "+(type==="reaction"?"reaction":"comment")+(count===1?"":"s")+" · "+esc(when(first.created_at))+'</p><div class="notification-actions"><a class="btn" href="'+target(first)+'">View Post</a>'+button("Mark Group Read","readgroup:"+items.map(x=>x.id).join(","))+'</div></div></article>';
     }
     if(type==="event_rsvp"&&count>1){
       return '<article class="notification '+(items.some(x=>!x.is_read)?"unread":"")+'"><div class="notify-icon">📅</div><div class="notification-body"><div><span class="kicker">EVENT RSVP</span><b>'+count+" people responded to your event</b></div><p class="muted">"+esc(when(first.created_at))+'</p><div class="notification-actions"><a class="btn" href="'+target(first)+'">View Event</a>'+button("Mark Group Read","readgroup:"+items.map(x=>x.id).join(","))+'</div></div></article>';
     }
     return items.map(n=>'<article class="notification '+(!n.is_read?"unread":"")+'"><div class="notify-icon">'+(icon[n.type]||"🔔")+'</div><div class="notification-body"><div><span class="kicker">'+esc(label[n.type]||"ACTIVITY")+'</span><b>'+esc(n.message||n.type||"Activity")+'</b></div><p class="muted">'+(n.actor_id?'<a href="profile.html?id='+n.actor_id+'">'+esc(actorName(n))+'</a> · ':"")+esc(when(n.created_at))+'</p><div class="notification-actions">'+action(n)+'</div></div></article>');
   }).flat();
 };
 const types=[...new Set(list.map(n=>n.type||"activity"))],sections=types.map(type=>'<section class="notification-group"><div class="feed-meta"><span class="feed-type">'+esc(label[type]||"ACTIVITY")+'</span><span class="muted">'+list.filter(n=>(n.type||"activity")===type).length+" events</span></div>"+aggregate(type).join("")+"</section>").join("");
 app.innerHTML=shell("Notification Center",unread?unread+" unread notification"+(unread===1?"":"s"):"You're all caught up.",card('<div class="inbox-toolbar">'+button("Mark All Read","readall")+'<span class="muted">Live aggregation · 24-hour grouping window</span></div>')+(sections||card('<p class="muted">No activity yet.</p>')));
}
async function friends(){
 if(!user){app.innerHTML=shell("Friends","Your social graph.",gate());return}
 const rows=(await sb.from("crowspace_friends").select("*").or("requester_id.eq."+user.id+",recipient_id.eq."+user.id).order("created_at",{ascending:false})).data||[];
 const ids=[...new Set(rows.flatMap(x=>[x.requester_id,x.recipient_id]).filter(x=>x!==user.id))],people=await getProfiles(ids);
 const html=rows.map(r=>{const id=r.requester_id===user.id?r.recipient_id:r.requester_id,p=people.find(x=>x.user_id===id);return '<div class="person-row">'+avatar(p?.display_name,p?.avatar_url)+'<div><a href="profile.html?id='+id+'"><b>'+esc(p?.display_name||"Member")+'</b></a><p class="muted">'+esc(r.status)+'</p></div>'+(r.status==="pending"&&r.recipient_id===user.id?button("Accept","accept:"+r.id):"")+'</div>'}).join("");
 app.innerHTML=shell("Friends & Connections","Persistent social graph.",card('<span class="kicker">CONNECTIONS</span>'+ (html||'<p class="muted">No connections yet.</p>')));
}
async async async async function discover(){
 if(!user){app.innerHTML=shell("Discover","Find people and communities across CrowSpace.",gate());return}
 const [ad,groups,rooms,events,acts,prefs,mygm]=await Promise.all([
  sb.rpc("crowspace_discovery_adaptive_score",{p_user:user.id,p_limit:60}),
  sb.from("crowspace_groups").select("*").eq("visibility","public").eq("status","active").limit(100),
  sb.from("crowspace_rooms").select("*").eq("visibility","public").limit(100),
  sb.from("crowspace_events").select("*").eq("visibility","public").order("starts_at",{ascending:true}).limit(20),
  sb.from("crowspace_activity").select("type,reference_id,actor_id,created_at").gte("created_at",new Date(Date.now()-7*86400000).toISOString()).limit(500),
  sb.from("crowspace_discovery_preferences").select("target_id,action").eq("user_id",user.id),
  sb.from("crowspace_group_members").select("group_id").eq("user_id",user.id).eq("status","active")
 ]);
 const adaptive=ad.data||[],hidden=new Set((prefs.data||[]).filter(x=>x.action==="dismiss"||x.action==="not_interested").map(x=>String(x.target_id)));
 const ids=[...new Set(adaptive.filter(x=>x.kind==="person"&&!hidden.has(String(x.target_id))).map(x=>x.target_id))],people=await getProfiles(ids),pmap=new Map(people.map(p=>[p.user_id,p]));
 const name=id=>pmap.get(id)?.display_name||pmap.get(id)?.username||"Member";
 const personHtml=adaptive.filter(x=>x.kind==="person"&&!hidden.has(String(x.target_id))).slice(0,10).map(x=>card(avatar(name(x.target_id),pmap.get(x.target_id)?.avatar_url)+'<span class="kicker">ADAPTIVE CONNECTION</span><h2>'+esc(name(x.target_id))+'</h2><p class="muted">'+esc(x.reason)+'</p><p>Recommendation score: <strong>'+x.score+'</strong> · '+x.signal_count+' activity signals</p><button class="btn" data-act="friend:'+x.target_id+'">Add Friend</button> <button class="btn" data-act="follow:'+x.target_id+'">Follow</button> <button class="btn" data-act="discover:dismiss:person:'+x.target_id+'">Not now</button> <a class="btn" href="profile.html?id='+x.target_id+'">Profile</a>')).join("")||card('<p class="muted">Your adaptive graph is learning. New connection suggestions will appear as you interact with CrowSpace.</p>');
 const activity=acts.data||[],trend=(type,id)=>activity.filter(x=>x.type===type&&String(x.reference_id)===String(id)).length,myGroups=new Set((mygm.data||[]).map(x=>x.group_id));
 const groupHtml=(groups.data||[]).filter(g=>!myGroups.has(g.id)&&!hidden.has(String(g.id))).map(g=>({...g,_t:trend("group",g.id)})).sort((a,b)=>b._t-a._t).slice(0,6).map(g=>card('<span class="kicker">GROUP RECOMMENDATION</span><h2>'+esc(g.name)+'</h2><p>'+esc(g.description||"")+'</p><p class="muted">'+g._t+' recent signals</p><a class="btn" href="group.html?id='+esc(g.slug)+'">Explore</a> <button class="btn" data-act="discover:signal:not_interested:group:'+g.id+'">Not interested</button>')).join("")||card('<p class="muted">No new group recommendations.</p>');
 const roomHtml=(rooms.data||[]).filter(r=>!hidden.has(String(r.id))).map(r=>({...r,_t:trend("room",r.id)})).sort((a,b)=>b._t-a._t).slice(0,6).map(r=>card('<span class="kicker">CROWROOM RECOMMENDATION</span><h2>'+esc(r.name)+'</h2><p>'+esc(r.topic||"")+'</p><p class="muted">'+r._t+' recent signals</p><a class="btn" href="room.html?id='+esc(r.slug)+'">Enter</a> <button class="btn" data-act="discover:signal:dismiss:room:'+r.id+'">Not now</button>')).join("")||card('<p class="muted">No new CrowRoom recommendations.</p>');
 const eventHtml=(events.data||[]).filter(e=>!hidden.has(String(e.id))).map(e=>card('<span class="kicker">EVENT RECOMMENDATION</span><h2>'+esc(e.title)+'</h2><p>'+esc(e.description||"")+'</p><p class="muted">'+esc(e.location||"")+' · '+esc(when(e.starts_at))+'</p><a class="btn" href="event.html?id='+e.id+'">View Event</a> <button class="btn" data-act="discover:signal:dismiss:event:'+e.id+'">Not now</button>')).join("")||card('<p class="muted">No upcoming public events found.</p>');
 const top=activity.reduce((m,x)=>{const k=x.type+"|"+(x.reference_id||x.id);m[k]=(m[k]||0)+1;return m},{}),trending=Object.entries(top).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,n])=>'<span class="filter-chip active">'+esc(k.split("|")[0].toUpperCase())+' · '+n+' signals</span>').join(" ")||'<span class="muted">Trending signals will appear as the community grows.</span>';
 app.innerHTML=shell("Discover","An adaptive CrowSpace recommendation home.",card('<span class="kicker">CROWSPACE 4.6</span><h2>Adaptive Discovery</h2><p class="muted">CrowSpace learns from your discovery actions and recent engagement to improve recommendations over time.</p><div class="filter-row"><button class="btn" data-act="discover:refresh">Refresh Recommendations</button><a class="btn" href="activity.html">Activity</a></div>')+'<h2>People</h2><div class="grid">'+personHtml+'</div><h2>Groups</h2><div class="grid">'+groupHtml+'</div><h2>CrowRooms</h2><div class="grid">'+roomHtml+'</div><h2>Events</h2><div class="grid">'+eventHtml+'</div><h2>Trending</h2>'+card('<div class="filter-row">'+trending+'</div>'));
}async function customize(){
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
 if(a.startsWith("goto:")){location.href=a.slice(5);return} if(a.startsWith("discover:signal:")){if(!user){location.href="auth.html";return}const z=a.split(":");await sb.rpc("crowspace_record_discovery_signal",{p_target:z[3],p_kind:z[2],p_action:z[1],p_weight:1});return} if(a.startsWith("discover:")){if(!user){location.href="auth.html";return}const z=a.split(":");if(z[1]==="refresh"){discover();return}const target=z[3];if(target){await sb.from("crowspace_discovery_preferences").upsert({user_id:user.id,target_id:target,action:z[1]},{onConflict:"user_id,target_id"});discover();return}}
 if(a.startsWith("message:")){location.href="messages.html?user="+a.slice(8);return}
 if(a.startsWith("friend:")){if(!user){location.href="auth.html";return}const r=await sb.from("crowspace_friends").insert({requester_id:user.id,recipient_id:a.slice(7),status:"pending"});if(r.error&&r.error.code!=="23505")alert(r.error.message);else profile();return}
 if(a.startsWith("follow:")){if(!user){location.href="auth.html";return}const id=a.slice(7),x=(await sb.from("crowspace_follows").select("*").eq("follower_id",user.id).eq("following_id",id).maybeSingle()).data;if(x)await sb.from("crowspace_follows").delete().eq("follower_id",user.id).eq("following_id",id);else await sb.from("crowspace_follows").insert({follower_id:user.id,following_id:id});profile();return}
 if(a.startsWith("join:")){if(!user){location.href="auth.html";return}await sb.from("crowspace_group_members").upsert({group_id:a.slice(5),user_id:user.id,role:"member",status:"active"},{onConflict:"group_id,user_id"});group();return}
 if(a.startsWith("accept:")){await sb.from("crowspace_friends").update({status:"accepted",updated_at:new Date().toISOString()}).eq("id",a.slice(7)).eq("recipient_id",user.id);friends();return}
 if(a.startsWith("react:")){if(!user){location.href="auth.html";return}const z=a.split(":"),pid=z[1],reaction=z[2],x=(await sb.from("crowspace_post_reactions").select("*").eq("post_id",pid).eq("user_id",user.id).eq("reaction",reaction).maybeSingle()).data;if(x)await sb.from("crowspace_post_reactions").delete().eq("post_id",pid).eq("user_id",user.id).eq("reaction",reaction);else await sb.from("crowspace_post_reactions").insert({post_id:pid,user_id:user.id,reaction});feed();return}
 if(a.startsWith("rsvp:")){if(!user){location.href="auth.html";return}const id=a.slice(5),x=(await sb.from("crowspace_event_members").select("*").eq("event_id",id).eq("user_id",user.id).maybeSingle()).data;if(x)await sb.from("crowspace_event_members").delete().eq("event_id",id).eq("user_id",user.id);else await sb.from("crowspace_event_members").insert({event_id:id,user_id:user.id,status:"going"});events();return}
 if(a==="readall"){await sb.from("crowspace_notifications").update({is_read:true}).eq("user_id",user.id).eq("is_read",false);if(window.__crowspaceInboxPaint)window.__crowspaceInboxPaint();notifications();return}
 if(a.startsWith("read:")){await sb.from("crowspace_notifications").update({is_read:true}).eq("id",a.slice(5)).eq("user_id",user.id);if(window.__crowspaceInboxPaint)window.__crowspaceInboxPaint();notifications();return}
 if(a.startsWith("readtype:")){await sb.from("crowspace_notifications").update({is_read:true}).eq("user_id",user.id).eq("type",a.slice(9)).eq("is_read",false);if(window.__crowspaceInboxPaint)window.__crowspaceInboxPaint();notifications();return}
 if(a.startsWith("readgroup:")){const ids=a.slice(10).split(",").filter(Boolean);if(ids.length)await sb.from("crowspace_notifications").update({is_read:true}).eq("user_id",user.id).in("id",ids);if(window.__crowspaceInboxPaint)window.__crowspaceInboxPaint();notifications();return}
 if(a.startsWith("notifyaccept:")){const z=a.split(":"),nid=z[1],actor=z[2];if(actor){const r=await sb.from("crowspace_friends").select("id").eq("requester_id",actor).eq("recipient_id",user.id).eq("status","pending").maybeSingle();if(r.data)await sb.from("crowspace_friends").update({status:"accepted",updated_at:new Date().toISOString()}).eq("id",r.data.id)}await sb.from("crowspace_notifications").update({is_read:true}).eq("id",nid).eq("user_id",user.id);if(window.__crowspaceInboxPaint)window.__crowspaceInboxPaint();notifications();return}
 if(a.startsWith("notifydecline:")){const z=a.split(":"),nid=z[1],actor=z[2];if(actor)await sb.from("crowspace_friends").update({status:"declined",updated_at:new Date().toISOString()}).eq("requester_id",actor).eq("recipient_id",user.id).eq("status","pending");await sb.from("crowspace_notifications").update({is_read:true}).eq("id",nid).eq("user_id",user.id);if(window.__crowspaceInboxPaint)window.__crowspaceInboxPaint();notifications();return}
 if(a.startsWith("notifyfollow:")){const z=a.split(":"),nid=z[1],actor=z[2];if(actor){const x=(await sb.from("crowspace_follows").select("id").eq("follower_id",user.id).eq("following_id",actor).maybeSingle()).data;if(!x)await sb.from("crowspace_follows").insert({follower_id:user.id,following_id:actor})}await sb.from("crowspace_notifications").update({is_read:true}).eq("id",nid).eq("user_id",user.id);if(window.__crowspaceInboxPaint)window.__crowspaceInboxPaint();notifications();return}
}
async function startRealtime(){
 if(!sb)return;
 for(const ch of liveChannels){try{await sb.removeChannel(ch)}catch(e){}}
 liveChannels=[];
 const refresh=()=>{clearTimeout(window.__crowspaceRT);window.__crowspaceRT=setTimeout(()=>render(),180)};
 const feed=sb.channel("crowspace:feed",{config:{private:true}});
 feed.on("broadcast",{event:"INSERT"},refresh).on("broadcast",{event:"UPDATE"},refresh).on("broadcast",{event:"DELETE"},refresh).subscribe();
 liveChannels.push(feed);
 if(user){
  const personal=sb.channel("crowspace:user:"+user.id,{config:{private:true}});
  personal.on("broadcast",{event:"INSERT"},refresh).on("broadcast",{event:"UPDATE"},refresh).on("broadcast",{event:"DELETE"},refresh).subscribe();
  liveChannels.push(personal);
 }
}
async function render(){
 const p=page(), map={"index.html":feed,"profile.html":profile,"groups.html":groups,"group.html":group,"spaces.html":spaces,"rooms.html":rooms,"events.html":events,"event.html":events,"media.html":media,"photos.html":media,"videos.html":media,"notifications.html":notifications,"activity.html":activity,"friends.html":friends,"discover.html":discover,"customize.html":customize,"create-post.html":createPost,"create-group.html":createGroup,"create-space.html":createSpace,"create-event.html":createEvent,"create-media.html":media};
 if(map[p])await map[p]();
 await startRealtime();
}
document.addEventListener("submit",submit);
document.addEventListener("click",e=>{const b=e.target.closest("[data-cr-action]");if(b)act(b.dataset.crAction)});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();