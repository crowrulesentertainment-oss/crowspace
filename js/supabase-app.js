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
 const [topics,affinity,adaptive,predictive,graph,cross,rec,groups,rooms,events,prefs]=await Promise.all([
  sb.rpc("crowspace_topic_recommendations",{p_user:user.id,p_limit:20}),
  sb.rpc("crowspace_affinity_score",{p_user:user.id,p_limit:100}),
  sb.rpc("crowspace_adaptive_recommendations",{p_user:user.id,p_limit:100}),
  sb.rpc("crowspace_predictive_trends",{p_limit:50}),
  sb.rpc("crowspace_graph_discovery",{p_user:user.id,p_limit:80}),
  sb.rpc("crowspace_cross_universe_discovery",{p_user:user.id,p_limit:120}),
  sb.rpc("crowspace_discovery_contextual_score",{p_user:user.id,p_limit:100}),
  sb.from("crowspace_groups").select("*").eq("visibility","public").eq("status","active").limit(100),
  sb.from("crowspace_rooms").select("*").eq("visibility","public").limit(100),
  sb.from("crowspace_events").select("*").eq("visibility","public").order("starts_at",{ascending:true}).limit(20),
  sb.from("crowspace_discovery_preferences").select("target_id,action").eq("user_id",user.id)
 ]);
 const hidden=new Set((prefs.data||[]).filter(x=>x.action==="dismiss"||x.action==="not_interested").map(x=>String(x.target_id)));
 const predictiveRows=(predictive.data||[]).map(x=>({...x,source:"predictive",kind:x.kind,target_id:x.entity_id,score:Number(x.momentum)+Math.max(0,Number(x.acceleration)),reason:x.explanation}));
 const graphRows=(graph.data||[]).map(x=>({...x,source:"graph",kind:x.target_kind,target_id:x.target_id,score:Number(x.score),reason:x.reason,via_kind:x.via_kind,via_id:x.via_id}));
 const adaptiveRows=(adaptive.data||[]).map(x=>({...x,source:"adaptive"}));
 const affinityRows=[...(affinity.data||[]),...adaptiveRows].map(x=>({...x,kind:x.kind,target_id:x.target_id,source:x.source||"affinity",score:x.score??x.affinity,reason:x.reason||x.explanation}));
 const merged=[...graphRows,...affinityRows,...predictiveRows,...(cross.data||[]).map(x=>({...x,source:"cross"})),...(rec.data||[]).map(x=>({...x,source:"context"}))];
 const byKey=new Map(); merged.forEach(x=>{const k=x.kind+":"+x.target_id;if(!hidden.has(String(x.target_id))&&(!byKey.has(k)||Number(x.score)>Number(byKey.get(k).score)))byKey.set(k,x)});
 const rows=[...byKey.values()].sort((a,b)=>Number(b.score)-Number(a.score));
 const ids=[...new Set(rows.filter(x=>x.kind==="person").map(x=>x.target_id))],people=await getProfiles(ids),pmap=new Map(people.map(p=>[p.user_id,p])),name=id=>pmap.get(id)?.display_name||pmap.get(id)?.username||"Member";
 const gb=new Map((groups.data||[]).map(x=>[String(x.id),x])),rb=new Map((rooms.data||[]).map(x=>[String(x.id),x])),eb=new Map((events.data||[]).map(x=>[String(x.id),x]));
 const predictiveCard=x=>{const o=x.kind==="group"?gb.get(String(x.target_id)):x.kind==="room"?rb.get(String(x.target_id)):x.kind==="event"?eb.get(String(x.target_id)):x.kind==="person"?pmap.get(x.target_id):null;const label=o?(o.name||o.title):x.kind;return card('<span class="kicker">'+esc(String(x.direction||"TREND").toUpperCase())+' · '+esc(x.kind.toUpperCase())+'</span><h2>'+esc(label)+'</h2><p class="muted">'+esc(x.reason||"Trend detected by CrowSpace intelligence.")+'</p><p>Momentum: <strong>'+esc(String(x.momentum))+'</strong> · Acceleration: <strong>'+esc(String(x.acceleration))+'</strong></p>')};
 const graphCard=x=>{const o=x.kind==="group"?gb.get(String(x.target_id)):x.kind==="room"?rb.get(String(x.target_id)):x.kind==="event"?eb.get(String(x.target_id)):x.kind==="person"?pmap.get(x.target_id):null;const label=o?(o.name||o.title):x.kind==="person"?name(x.target_id):x.kind;const href=x.kind==="person"?"profile.html?id="+encodeURIComponent(x.target_id):x.kind==="group"&&o?"group.html?id="+encodeURIComponent(o.slug):x.kind==="room"&&o?"room.html?id="+encodeURIComponent(o.slug):x.kind==="event"&&o?"event.html?id="+encodeURIComponent(o.id):"";return card('<span class="kicker">GRAPH CONNECTION · '+esc(x.kind.toUpperCase())+'</span><h2>'+esc(label)+'</h2><p class="muted">'+esc(x.reason||"Connected through your CrowSpace graph.")+'</p><p>Graph strength: <strong>'+esc(String(x.score))+'</strong></p>'+(href?'<a class="btn" href="'+href+'">Open</a> ':'')+'<button class="btn" data-act="discover:dismiss:'+x.kind+':'+x.target_id+'">Not now</button>')};
 const rising=(predictive.data||[]).filter(x=>x.direction==="rising"&&!hidden.has(String(x.entity_id))).slice(0,6).map(predictiveCard).join("")||card('<p class="muted">No rising trends detected yet.</p>');
 const emerging=(predictive.data||[]).filter(x=>Number(x.momentum)>0&&!hidden.has(String(x.entity_id))).slice(0,6).map(predictiveCard).join("")||card('<p class="muted">Emerging activity will appear as trend signals accumulate.</p>');
 const accelerating=(predictive.data||[]).filter(x=>["group","room","event"].includes(x.kind)&&Number(x.acceleration)>0&&!hidden.has(String(x.entity_id))).sort((a,b)=>Number(b.acceleration)-Number(a.acceleration)).slice(0,6).map(predictiveCard).join("")||card('<p class="muted">Community acceleration will appear as trend history accumulates.</p>');
 const graphHtml=graphRows.filter(x=>!hidden.has(String(x.target_id))).slice(0,8).map(graphCard).join("")||card('<p class="muted">Your graph is still building connections across CrowSpace.</p>');
 const peopleHtml=rows.filter(x=>x.kind==="person"&&x.source!=="predictive").slice(0,8).map(x=>card(avatar(name(x.target_id),pmap.get(x.target_id)?.avatar_url)+'<span class="kicker">'+esc(x.source==="graph"?"GRAPH CONNECTION":"RELEVANT TO YOU")+'</span><h2>'+esc(name(x.target_id))+'</h2><p class="muted">'+esc(x.reason)+'</p><p>Score: <strong>'+esc(String(x.score))+'</strong></p><button class="btn" data-act="friend:'+x.target_id+'">Add Friend</button> <button class="btn" data-act="follow:'+x.target_id+'">Follow</button> <button class="btn" data-act="discover:dismiss:person:'+x.target_id+'">Not now</button> <a class="btn" href="profile.html?id='+x.target_id+'">Profile</a>')).join("")||card('<p class="muted">Personal recommendations will appear as your activity grows.</p>');
 const crossHtml=rows.filter(x=>x.kind!=="person"&&x.source!=="predictive"&&x.source!=="graph").slice(0,10).map(x=>{const o=x.kind==="group"?gb.get(String(x.target_id)):x.kind==="room"?rb.get(String(x.target_id)):eb.get(String(x.target_id));if(!o)return "";const href=x.kind==="group"?"group.html?id="+encodeURIComponent(o.slug):x.kind==="room"?"room.html?id="+encodeURIComponent(o.slug):"event.html?id="+encodeURIComponent(o.id);return card('<span class="kicker">CROSS-UNIVERSE · '+esc(x.kind.toUpperCase())+'</span><h2>'+esc(o.name||o.title)+'</h2><p>'+esc(o.description||o.topic||"")+'</p><p class="muted">'+esc(x.reason)+' · score '+esc(String(x.score))+'</p><a class="btn" href="'+href+'">Open</a> <button class="btn" data-act="discover:dismiss:'+x.kind+':'+x.target_id+'">Not now</button>')}).join("")||card('<p class="muted">Cross-universe recommendations are still learning.</p>');
 const topicHtml=(topics.data||[]).slice(0,10).map(t=>'<span class="filter-chip active">'+esc(t.name)+' · '+esc(String(t.entity_count))+' connections</span>').join(" ")||'<span class="muted">Topics will appear after members create and engage with content.</span>';
 app.innerHTML=shell("Discover","Graph-powered predictive discovery across the CrowSpace universe.",card('<span class="kicker">CROWSPACE 4.23</span><h2>Graph-Powered Discovery</h2><p class="muted">CrowSpace now traverses people, topics, posts, communities, CrowRooms and events to build explainable discovery paths.</p><div class="filter-row"><button class="btn" data-act="discover:refresh">Refresh Intelligence</button><a class="btn" href="activity.html">Activity</a></div>')+'<h2>🌎 Explore Your Graph</h2><div class="grid">'+graphHtml+'</div><h2>🔮 What’s Rising</h2><div class="grid">'+rising+'</div><h2>🔥 Emerging Now</h2><div class="grid">'+emerging+'</div><h2>📈 Accelerating Communities</h2><div class="grid">'+accelerating+'</div><h2>🧠 Relevant to You</h2><div class="grid">'+peopleHtml+'</div><h2>🌎 Cross-Universe Trends</h2><div class="grid">'+crossHtml+'</div><h2>Your Topics</h2>'+card('<div class="filter-row">'+topicHtml+'</div>')+'<h2>Across Your Universe</h2><div class="grid">'+crossHtml+'</div>');
}

async function graph(){
 if(!user){app.innerHTML=shell("My Graph","Your personal CrowSpace universe.",gate());return}
 const focusKind=q("focus_kind"),focusId=q("focus_id"),expandedKind=q("expanded_kind"),expandedId=q("expanded_id"),shareToken=q("graph_share"),presentMode=q("graph_present")==="1";
 const sharedLayout=shareToken?(await sb.from("crowspace_graph_layouts").select("*").eq("share_token",shareToken).eq("is_shared",true).maybeSingle()).data:null;
 const graphUserId=sharedLayout?.user_id||user.id;
 window.__crowspaceGraphExpanded=window.__crowspaceGraphExpanded||new Set();
 window.__crowspaceGraphPositions=window.__crowspaceGraphPositions||{};
 window.__crowspaceGraphPhysics=window.__crowspaceGraphPhysics||{};
 window.__crowspaceGraphStudio=window.__crowspaceGraphStudio||{current:null,view:"everything"};
 window.__crowspaceGraphPhysics.running=window.__crowspaceGraphPhysics.running||false;
 window.__crowspaceGraphPhysics.paused=window.__crowspaceGraphPhysics.paused||false;
 window.__crowspaceGraphPhysics.strength=window.__crowspaceGraphPhysics.strength||1;
 window.__crowspaceGraphPhysics.attraction=window.__crowspaceGraphPhysics.attraction||1;
 window.__crowspaceGraphPhysics.repulsion=window.__crowspaceGraphPhysics.repulsion||1;
 window.__crowspaceGraphPhysics.collision=window.__crowspaceGraphPhysics.collision||58;
 window.__crowspaceGraphPhysics.frozen=window.__crowspaceGraphPhysics.frozen||new Set();
 if(expandedKind&&expandedId)window.__crowspaceGraphExpanded.add(expandedKind+":"+expandedId);
 const expandedKeys=[...window.__crowspaceGraphExpanded],expandedSpecs=expandedKeys.map(k=>{const z=k.split(":");return {kind:z[0],id:z.slice(1).join(":")}});
 const expandedCalls=await Promise.all(expandedSpecs.map(x=>sb.rpc("crowspace_graph_node_neighbors",{p_kind:x.kind,p_id:x.id,p_limit:100})));\n const [profile,edges,trends,sharedR,pathR]=await Promise.all([
  sb.from("crowspace_profiles").select("*").eq("user_id",graphUserId).single(),
  sb.rpc("crowspace_graph_expand",{p_user:graphUserId,p_depth:Number(q("depth")||2),p_limit:150}),
  sb.rpc("crowspace_predictive_trends",{p_limit:50}),
  sb.rpc("crowspace_shared_discovery",{p_user:graphUserId,p_limit:50}),
  focusId?sb.rpc("crowspace_graph_shortest_path",{p_user:graphUserId,p_target:focusId,p_max_depth:6}):Promise.resolve({data:[]})
 ]);
 const rows=[...(edges.data||[]),...expandedCalls.flatMap((r,i)=>(r.data||[]).map(x=>({...x,node_kind:x.node_kind,node_id:x.node_id,depth:1,path_text:"Expanded from "+expandedSpecs[i].kind+":"+expandedSpecs[i].id}))),], pathData=(pathR.data||[])[0]?.path||[], pathSet=new Set(pathData.map(x=>x.kind+":"+x.id)), nodes=new Map();
 rows.forEach(x=>{
  const other={kind:x.node_kind,id:x.node_id,edge:x};
  if(other&&!(other.kind==="person"&&other.id===user.id)){
   const key=other.kind+":"+other.id,prev=nodes.get(key);
   nodes.set(key,{...other,strength:Math.max(Number(prev?.strength||0),Number(other.edge.strength||0)),count:Math.max(Number(prev?.count||0),Number(other.edge.interaction_count||0)),relationship:other.edge.relationship,last_seen_at:other.edge.last_seen_at,depth:Number(other.edge.depth||1),via_kind:other.edge.via_kind,via_id:other.edge.via_id,path_text:other.edge.path_text});
  }
 });
 const ids=[...nodes.values()].filter(x=>x.kind==="person").map(x=>x.id), people=await getProfiles(ids),pmap=new Map(people.map(p=>[p.user_id,p]));
 const idsBy=k=>[...nodes.values()].filter(x=>x.kind===k).map(x=>x.id);
 const [groupsR,roomsR,eventsR]=await Promise.all([
  idsBy("group").length?sb.from("crowspace_groups").select("id,slug,name").in("id",idsBy("group")):Promise.resolve({data:[]}),
  idsBy("room").length?sb.from("crowspace_rooms").select("id,slug,name").in("id",idsBy("room")):Promise.resolve({data:[]}),
  idsBy("event").length?sb.from("crowspace_events").select("id,title").in("id",idsBy("event")):Promise.resolve({data:[]})
 ]);
 const meta={group:new Map((groupsR.data||[]).map(x=>[x.id,x])),room:new Map((roomsR.data||[]).map(x=>[x.id,x])),event:new Map((eventsR.data||[]).map(x=>[x.id,x]))};
 const label=(kind,id)=>kind==="person"?(pmap.get(id)?.display_name||pmap.get(id)?.username||"Member"):meta[kind]?.get(id)?.name||meta[kind]?.get(id)?.title||kind.replace("_"," ");
 const href=x=>x.kind==="person"?"profile.html?id="+encodeURIComponent(x.id):x.kind==="group"?"group.html?id="+encodeURIComponent(meta.group.get(x.id)?.slug||x.id):x.kind==="room"?"room.html?id="+encodeURIComponent(meta.room.get(x.id)?.slug||x.id):x.kind==="event"?"event.html?id="+encodeURIComponent(x.id):x.kind==="post"?"index.html#post-"+encodeURIComponent(x.id):null;
 const types=[...new Set([...nodes.values()].map(x=>x.kind))],rels=[...new Set([...nodes.values()].map(x=>x.relationship).filter(Boolean))],depth=Number(q("depth")||2);
 const allItems=[...nodes.values()].sort((a,b)=>b.strength-a.strength).slice(0,40);
 const viewKind=window.__crowspaceGraphStudio.view||"everything";
 const items=allItems.filter(x=>viewKind==="everything"||(viewKind==="people"&&x.kind==="person")||(viewKind==="communities"&&(x.kind==="group"||x.kind==="room"))||(viewKind==="events"&&x.kind==="event"));
 const pathKeys=pathData.map(x=>x.kind+":"+x.id), pathOnly=pathKeys.map(k=>nodes.get(k)).filter(Boolean);
 const routeNodes=[{kind:"person",id:graphUserId,strength:999,count:0,relationship:"start",depth:0},...pathOnly.filter(x=>!(x.kind==="person"&&x.id===graphUserId))];
 const regular=items.filter(x=>!pathSet.has(x.kind+":"+x.id));
 const zones={person:{x:170,y:150},group:{x:400,y:140},room:{x:630,y:150},event:{x:760,y:390},topic:{x:430,y:500},post:{x:180,y:430}};
 const zoneLabels=Object.entries(zones).map(([k,z])=>'<text class="cr-graph-zone-label" x="'+z.x+'" y="'+(z.y-75)+'" text-anchor="middle">'+esc(kindLegend[k]||k)+'</text>').join("");
 const positioned=[...routeNodes.map((x,i)=>({...x,x:120+(i*Math.max(1,660/Math.max(1,routeNodes.length-1))),y:320})),...regular.map((x,i)=>{const z=zones[x.kind]||{x:450,y:320},same=regular.filter(y=>y.kind===x.kind).length,idx=regular.slice(0,i).filter(y=>y.kind===x.kind).length,ring=Math.floor(idx/5),slot=idx%5,spread=55+ring*38;return {...x,x:z.x+(slot-2)*spread,y:z.y+(ring-Math.floor((Math.max(0,same-1)/5)/2))*spread}})];
 const forceNodes=positioned.filter(x=>!(x.kind==="person"&&x.id===graphUserId));
 const edgeWeight=(x,y)=>{const ex=(x.relationship||"").toLowerCase(),ey=(y.relationship||"").toLowerCase();return Math.max(0.15,Math.min(1,(Number(x.strength)||0.5)/5,(Number(y.strength)||0.5)/5))+(ex===ey ? .2 : 0);
 };
 const neighborRows=[...rows];
 const physicsLinks=[];
 for(const n of positioned){for(const m of positioned){if(n===m)continue;const nk=n.kind+":"+n.id,mk=m.kind+":"+m.id;if(neighborRows.some(r=>{const rk=r.node_kind+":"+r.node_id,vk=r.via_kind+":"+r.via_id;return (rk===nk&&vk===mk)||(rk===mk&&vk===nk)})){physicsLinks.push([n,m]);}}}
 const simulate=()=>{if(window.__crowspaceGraphPhysics.running)return;window.__crowspaceGraphPhysics.running=true;let frame=0;const tick=()=>{if(!document.getElementById("crGraphSvg")||frame++>120){window.__crowspaceGraphPhysics.running=false;return}for(const n of forceNodes){if(window.__crowspaceGraphPhysics.frozen.has(n.kind+":"+n.id))continue;let fx=0,fy=0;for(const m of forceNodes){if(n===m)continue;const dx=m.x-n.x,dy=m.y-n.y,d=Math.max(28,Math.hypot(dx,dy));const linked=physicsLinks.some(([a,b])=>(a===n&&b===m)||(a===m&&b===n));if(linked){const w=edgeWeight(n,m)*window.__crowspaceGraphPhysics.attraction*window.__crowspaceGraphPhysics.strength;fx+=(dx/d)*w*2.2;fy+=(dy/d)*w*2.2}else{const repel=180/(d*d)*window.__crowspaceGraphPhysics.repulsion*window.__crowspaceGraphPhysics.strength;fx-=(dx/d)*repel;fy-=(dy/d)*repel}if(d<window.__crowspaceGraphPhysics.collision){const push=(window.__crowspaceGraphPhysics.collision-d)*.9*window.__crowspaceGraphPhysics.strength;fx-=(dx/d)*push;fy-=(dy/d)*push}}const z=zones[n.kind]||{x:450,y:320};fx+=(z.x-n.x)*.004;fy+=(z.y-n.y)*.004;n.vx=(n.vx||0)*.78+fx;n.vy=(n.vy||0)*.78+fy;n.x=Math.max(42,Math.min(858,n.x+n.vx));n.y=Math.max(62,Math.min(578,n.y+n.vy))}window.__crowspaceGraphPositions={...window.__crowspaceGraphPositions,...Object.fromEntries(positioned.map(x=>[x.kind+":"+x.id,{x:x.x,y:x.y}]))};const svg=document.getElementById("crGraphSvg"),ns=svg?.querySelectorAll(".cr-graph-node");positioned.forEach((x,i)=>{const n=ns?.[i];n?.querySelector("circle")?.setAttribute("cx",x.x);n?.querySelector("circle")?.setAttribute("cy",x.y);n?.querySelector("text")?.setAttribute("x",x.x);n?.querySelector("text")?.setAttribute("y",x.y+4)});requestAnimationFrame(tick)};requestAnimationFrame(tick)};
 for(let iter=0;iter<8;iter++){for(const n of forceNodes){let fx=0,fy=0;for(const m of forceNodes){if(n===m)continue;const nk=n.kind+":"+n.id,mk=m.kind+":"+m.id;const linked=neighborRows.some(r=>{const rk=r.node_kind+":"+r.node_id,vk=r.via_kind+":"+r.via_id;return (rk===nk&&vk===mk)||(rk===mk&&vk===nk)});const dx=m.x-n.x,dy=m.y-n.y,d=Math.max(24,Math.hypot(dx,dy));if(linked){const w=edgeWeight(n,m);fx+=(dx/d)*w*12;fy+=(dy/d)*w*12}else{const repel=1200/(d*d);fx-=(dx/d)*repel;fy-=(dy/d)*repel}}const z=zones[n.kind]||{x:450,y:320};fx+=(z.x-n.x)*0.025;fy+=(z.y-n.y)*0.025;n.x=Math.max(40,Math.min(860,n.x+fx));n.y=Math.max(60,Math.min(580,n.y+fy))}}
 positioned.forEach(x=>{const k=x.kind+":"+x.id,p=window.__crowspaceGraphPositions[k];if(p){x.x=p.x;x.y=p.y}else if(!window.__crowspaceGraphForceInitialized){window.__crowspaceGraphPositions[k]={x:x.x,y:x.y}}});
 window.__crowspaceGraphForceInitialized=true;
 simulate();
 positioned.forEach(x=>{const k=x.kind+":"+x.id,p=window.__crowspaceGraphPositions[k];if(p){x.x=p.x;x.y=p.y}});
 const posMap=new Map(positioned.map(x=>[x.kind+":"+x.id,x]));
 const pathLineSvg=routeNodes.slice(0,-1).map((x,i)=>{const n=routeNodes[i+1],p=posMap.get(x.kind+":"+x.id),q=posMap.get(n.kind+":"+n.id);return p&&q?'<line class="cr-path-line cr-route-edge" x1="'+p.x.toFixed(1)+'" y1="'+p.y.toFixed(1)+'" x2="'+q.x.toFixed(1)+'" y2="'+q.y.toFixed(1)+'" stroke="currentColor" stroke-width="3" marker-end="url(#crGraphArrow)"/>':""}).join("");
 const isPresent=new URLSearchParams(location.search).get("graph_present")==="1";
 const nodeSvg=positioned.map((x,i)=>'<g class="cr-graph-node '+(focusId&&pathSet.has(x.kind+":"+x.id)?"cr-path-node":"")+(window.__crowspaceGraphSelected===x.kind+":"+x.id?" cr-selected-node":"")+'" tabindex="0" role="button" data-kind="'+esc(x.kind)+'" data-id="'+esc(x.id)+'" data-index="'+i+'"><circle cx="'+x.x.toFixed(1)+'" cy="'+x.y.toFixed(1)+'" r="28" fill="none" stroke="currentColor" stroke-width="1.8"/><text x="'+x.x.toFixed(1)+'" y="'+(x.y+4).toFixed(1)+'" text-anchor="middle" font-size="10" fill="currentColor">'+esc(label(x.kind,x.id).slice(0,13))+'</text></g>').join("");
 const lineSvg=regular.map(x=>'<line class="cr-graph-line" x1="'+(zones[x.kind]?.x||450).toFixed(1)+'" y1="'+(zones[x.kind]?.y||320).toFixed(1)+'" x2="'+x.x.toFixed(1)+'" y2="'+x.y.toFixed(1)+'" stroke="currentColor" opacity=".2"/>').join("");
 const userLabel=esc((profile.data?.display_name||"YOU").slice(0,18));
 const svg='<svg id="crGraphSvg" viewBox="0 0 900 640" role="img" aria-label="Interactive personal CrowSpace network graph" style="width:100%;height:auto;display:block;touch-action:none"><defs><marker id="crGraphArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="currentColor"/></marker></defs><g id="crGraphWorld">'+zoneLabels+lineSvg+'<circle cx="120" cy="320" r="36" fill="none" stroke="currentColor" stroke-width="2"/><text x="120" y="325" text-anchor="middle" font-size="13" fill="currentColor">'+userLabel+'</text>'+pathLineSvg+nodeSvg+'</g></svg>';
 const kindLegend={person:"People",group:"Communities",room:"CrowRooms",event:"Events",post:"Content",topic:"Topics"};
 const canvasLegend='<div class="cr-graph-legend">'+[...new Set(positioned.map(x=>x.kind))].map(k=>'<span class="cr-graph-legend-item"><strong>'+esc(kindLegend[k]||k)+'</strong></span>').join("")+'</div>';
 const studioControls='<div class="cr-graph-studio"><button class="btn" id="crGraphPresent" type="button">Present</button><button class="btn" id="crGraphUpdate" type="button">Update</button><button class="btn" id="crGraphDuplicate" type="button">Duplicate</button><button class="btn" id="crGraphDelete" type="button">Delete</button><input id="crGraphLayoutName" class="search" maxlength="80" placeholder="Layout name" aria-label="Layout name"><select id="crGraphView" class="search"><option value="everything">Everything</option><option value="people">People</option><option value="communities">Communities</option><option value="events">Events</option></select><button class="btn" id="crGraphSaveLayout" type="button">Save Layout</button><select id="crGraphSaved" class="search"><option value="">Saved layouts</option></select><button class="btn" id="crGraphLoadLayout" type="button">Restore</button><button class="btn" id="crGraphShareLayout" type="button">Share Read-Only</button></div>';
 async function loadGraphLayouts(){const r=await sb.from("crowspace_graph_layouts").select("id,name,view_kind,is_shared,share_token,updated_at").order("updated_at",{ascending:false});const s=document.getElementById("crGraphSaved");if(!s)return;s.innerHTML='<option value="">Saved layouts</option>'+(r.data||[]).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+(x.is_shared?" · shared":"")+'</option>').join("");}
 if(presentMode)document.documentElement.classList.add("cr-graph-present");
 if(sharedLayout){window.__crowspaceGraphStudio.current=sharedLayout.id;window.__crowspaceGraphStudio.view=sharedLayout.view_kind||"everything";window.__crowspaceGraphPositions={...window.__crowspaceGraphPositions,...(sharedLayout.positions||{})};window.__crowspaceGraphPhysics.frozen=new Set(sharedLayout.frozen_nodes||[]);Object.assign(window.__crowspaceGraphPhysics,sharedLayout.settings||{});}
 const sharedBanner=sharedLayout?'<div class="cr-shared-banner">READ-ONLY SHARED GRAPH · '+esc(sharedLayout.name)+'</div>':'';
 const presenceHtml="";
 const collaborationControls=sharedLayout?'<div class="cr-graph-collab"><span id="crGraphPresence">'+((window.__crowspaceGraphPresence||[]).length)+" member"+((window.__crowspaceGraphPresence||[]).length===1?"":"s")+" viewing live</span><button class="btn" id="crGraphFollow" type="button">Follow Owner</button></div>":"";
 const physicsControls='<div class="cr-physics-controls"><button class="btn" id="crGraphPhysicsToggle" type="button">Pause Physics</button><label>Strength <input id="crGraphPhysicsStrength" type="range" min="0" max="2" step=".1" value="'+window.__crowspaceGraphPhysics.strength+'"></label><label>Attraction <input id="crGraphPhysicsAttraction" type="range" min="0" max="2" step=".1" value="'+window.__crowspaceGraphPhysics.attraction+'"></label><label>Repulsion <input id="crGraphPhysicsRepulsion" type="range" min="0" max="2" step=".1" value="'+window.__crowspaceGraphPhysics.repulsion+'"></label><label>Collision <input id="crGraphPhysicsCollision" type="range" min="30" max="100" step="2" value="'+window.__crowspaceGraphPhysics.collision+'"></label><span class="cr-physics-help">Double-click a node to freeze or unfreeze it.</span></div>';
 const filters='<div class="filter-row"><button class="btn" id="crGraphClearPath" type="button">Clear Path</button><button class="btn" id="crGraphForce" type="button">Relationship Layout</button><select id="crGraphType" class="search"><option value="">All node types</option>'+types.map(x=>'<option value="'+esc(x)+'">'+esc(x.replace("_"," "))+'</option>').join("")+'</select><select id="crGraphRel" class="search"><option value="">All relationships</option>'+rels.map(x=>'<option value="'+esc(x)+'">'+esc(x)+'</option>').join("")+'</select><select id="crGraphDepth" class="search"><option value="1">1st degree</option><option value="2" selected>2nd degree</option><option value="3">3rd degree</option></select><button class="btn" id="crGraphReset" type="button">Reset View</button><button class="btn" id="crGraphZoomIn" type="button">＋ Zoom</button><button class="btn" id="crGraphZoomOut" type="button">− Zoom</button></div>';
 const cards=items.map((x,i)=>card('<span class="kicker">'+esc(x.kind.toUpperCase())+'</span><h2>'+esc(label(x.kind,x.id))+'</h2><p class="muted">'+esc(x.relationship||"connected")+' · Strength '+esc(String(x.strength))+' · Interactions '+esc(String(x.count))+' · Depth '+esc(String(x.depth))+'</p><a class="btn" href="'+esc(href(x)||"#")+'">Open</a> <button class="btn" type="button" data-cr-action="graph:select:'+i+'">Details</button> <button class="btn" type="button" data-cr-action="graph:expand:'+esc(x.kind)+':'+esc(x.id)+'">'+(window.__crowspaceGraphExpanded.has(x.kind+":"+x.id)?"Collapse":"Expand")+'</button>')).join("")||card('<p class="muted">Your personal graph is beginning to build. New relationships appear as you follow, connect, post, join communities, enter CrowRooms and RSVP to events.</p>');
 const sharedRows=sharedR.data||[];
 const pathHtml=focusId&&pathData.length?card('<span class="kicker">🛤️ SHORTEST CONNECTION PATH</span><h2>'+esc(pathData.map(x=>label(x.kind,x.id)).join(" → "))+'</h2><p class="muted">Connection distance: '+esc(String(Math.max(0,pathData.length-1)))+' step(s). Each node in this route is highlighted in the graph.</p>'):focusId?card('<p class="muted">No connection path was found within the current graph depth.</p>'):"";\n const sharedPeople=sharedRows.filter(x=>x.node_kind==="person");\n const sharedHtml=sharedRows.map(x=>card('<span class="kicker">'+esc(x.category)+'</span><h2>'+esc(label(x.node_kind,x.node_id))+'</h2><p class="muted">'+esc(x.explanation)+'</p><p>Shared connections: <strong>'+esc(String(x.shared_count))+'</strong></p><button class="btn" type="button" data-cr-action="graph:discover:'+esc(x.node_kind)+':'+esc(x.node_id)+'">Explore this connection</button>')).join("")||card('<p class="muted">No shared connections yet. Your discovery network will grow as you connect, join communities, enter rooms, RSVP to events, and interact with content.</p>');\n const trendHtml=(trends.data||[]).filter(x=>x.direction==="rising").slice(0,6).map(x=>card('<span class="kicker">RISING · '+esc(x.kind.toUpperCase())+'</span><h2>'+esc(x.kind)+'</h2><p class="muted">'+esc(x.explanation)+'</p><p>Momentum: <strong>'+esc(String(x.momentum))+'</strong> · Acceleration: <strong>'+esc(String(x.acceleration))+'</strong></p>')).join("")||card('<p class="muted">No rising graph trends yet.</p>');
 app.innerHTML=shell("My Graph","A live view of your personal CrowSpace universe.",card('<span class="kicker">CROWSPACE 4.43</span><h2>Live Graph Workspace</h2><p class="muted">'+esc(profile.data?.display_name||"Your")+" graph is actionable: select nodes for details, explore connection paths, open destinations, filter relationships, and discover multi-hop connections.</p>"+canvasLegend+(sharedLayout?sharedBanner:studioControls)+presenceHtml+collaborationControls+physicsControls+filters+'<div id="crGraphDetails" class="muted" aria-live="polite" style="margin-top:12px">Select a connection to see why it is in your graph.</div>')+pathHtml+'<section class="card cr-graph-canvas-card" style="overflow:hidden;margin-bottom:24px">'+svg+'</section><h2>🔗 Graph Connections</h2><div class="grid">'+cards+'</div><h2>🔥 Rising Around Your Universe</h2><div class="grid">'+trendHtml+'</div>');
 const svgEl=document.getElementById("crGraphSvg"),world=document.getElementById("crGraphWorld"),details=document.getElementById("crGraphDetails"),state={scale:1,x:0,y:0,drag:false,px:0,py:0};
 const apply=()=>{world.setAttribute("transform","translate("+state.x+" "+state.y+") scale("+state.scale+")")};
 const selectNode=x=>{window.__crowspaceGraphSelected=x.kind+":"+x.id;const destination=href(x);details.innerHTML='<strong>'+esc(label(x.kind,x.id))+'</strong> · '+esc(x.kind)+'<br><span class="muted">Relationship: '+esc(x.relationship||"connected")+' · Depth: '+esc(String(x.depth))+' · Strength: '+esc(String(x.strength))+' · Interactions: '+esc(String(x.count))+' · Last seen: '+esc(when(x.last_seen_at))+'</span><br><span class="muted">Path: '+esc(x.path_text||"Direct CrowSpace relationship.")+'</span><br><span class="muted">Why connected: '+esc(x.relationship==="follow"?"You follow this member.":x.relationship==="friend"?"You are connected as friends.":x.relationship==="member"?"You share a community or room.":x.relationship==="rsvp"?"You are connected through an event RSVP.":x.relationship==="authored"?"You created this content.":x.relationship==="commented"?"You interacted through a comment.":x.relationship==="reacted"?"You interacted through a reaction.":"This relationship was captured from your CrowSpace activity.")+'</span>'+(destination?' · <a href="'+esc(destination)+'">Open</a>':"");document.querySelectorAll(".cr-graph-node").forEach(n=>{n.style.opacity=n.dataset.index===String(x._index)?"1":"";n.classList.toggle("cr-selected-node",n.dataset.index===String(x._index))});};
 positioned.forEach((x,i)=>x._index=i);
 svgEl?.querySelectorAll(".cr-graph-node").forEach((n,i)=>{const x=positioned[i];if(window.__crowspaceGraphSelected===x.kind+":"+x.id)n.classList.add("cr-selected-node");n.addEventListener("click",()=>selectNode(x));
 n.addEventListener("dblclick",e=>{e.preventDefault();const k=x.kind+":"+x.id;window.__crowspaceGraphPhysics.frozen.has(k)?window.__crowspaceGraphPhysics.frozen.delete(k):window.__crowspaceGraphPhysics.frozen.add(k);n.classList.toggle("cr-frozen-node",window.__crowspaceGraphPhysics.frozen.has(k))});
 n.addEventListener("pointerdown",e=>{if(e.button!==0)return;e.stopPropagation();n.setPointerCapture?.(e.pointerId);const startX=e.clientX,startY=e.clientY,ox=x.x,oy=x.y;const move=ev=>{x.x=ox+(ev.clientX-startX)/state.scale;x.y=oy+(ev.clientY-startY)/state.scale;window.__crowspaceGraphPositions[x.kind+":"+x.id]={x:x.x,y:x.y};n.querySelector("circle")?.setAttribute("cx",x.x);n.querySelector("circle")?.setAttribute("cy",x.y);n.querySelector("text")?.setAttribute("x",x.x);n.querySelector("text")?.setAttribute("y",x.y+4);svgEl.querySelectorAll(".cr-graph-line").forEach((l,j)=>{const z=regular[j];if(z?.kind===x.kind&&z?.id===x.id){l.setAttribute("x2",x.x);l.setAttribute("y2",x.y)}});};const up=()=>{n.releasePointerCapture?.(e.pointerId);n.removeEventListener("pointermove",move);n.removeEventListener("pointerup",up)};n.addEventListener("pointermove",move);n.addEventListener("pointerup",up)});n.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectNode(x)}})});
 if(!sharedLayout)loadGraphLayouts();
 document.getElementById("crGraphView")?.addEventListener("change",e=>{window.__crowspaceGraphStudio.view=e.target.value;graph()});
 if(!sharedLayout)document.addEventListener("keydown",e=>{if(e.key==="Escape"&&new URLSearchParams(location.search).get("graph_present")==="1"){const u=new URL(location.href);u.searchParams.delete("graph_present");location.href=u.toString()}});
 document.getElementById("crGraphFollow")?.addEventListener("click",()=>{const u=new URL(location.href);u.searchParams.delete("focus_kind");u.searchParams.delete("focus_id");u.searchParams.set("depth","3");location.href=u.toString()});
 document.getElementById("crGraphPresent")?.addEventListener("click",()=>{const u=new URL(location.href);u.searchParams.set("graph_present","1");location.href=u.toString()});
 document.getElementById("crGraphUpdate")?.addEventListener("click",async()=>{const id=document.getElementById("crGraphSaved")?.value||window.__crowspaceGraphStudio.current;if(!id)return;const payload={name:(document.getElementById("crGraphLayoutName")?.value||"").trim()||"Untitled Layout",view_kind:window.__crowspaceGraphStudio.view||"everything",positions:window.__crowspaceGraphPositions||{},frozen_nodes:[...(window.__crowspaceGraphPhysics.frozen||new Set())],settings:{strength:window.__crowspaceGraphPhysics.strength,attraction:window.__crowspaceGraphPhysics.attraction,repulsion:window.__crowspaceGraphPhysics.repulsion,collision:window.__crowspaceGraphPhysics.collision},updated_at:new Date().toISOString()};const z=await sb.from("crowspace_graph_layouts").update(payload).eq("id",id).eq("user_id",user.id);if(z.error)alert(z.error.message);else await loadGraphLayouts()});
 document.getElementById("crGraphDuplicate")?.addEventListener("click",async()=>{const id=document.getElementById("crGraphSaved")?.value||window.__crowspaceGraphStudio.current;if(!id)return;const z=await sb.from("crowspace_graph_layouts").select("*").eq("id",id).eq("user_id",user.id).single();if(z.error)return alert(z.error.message);const d=z.data;const copy={user_id:user.id,name:(d.name||"Layout")+" Copy",view_kind:d.view_kind,positions:d.positions,frozen_nodes:d.frozen_nodes,settings:d.settings,is_shared:false,share_token:null};const ins=await sb.from("crowspace_graph_layouts").insert(copy).select("id").single();if(ins.error)alert(ins.error.message);else{window.__crowspaceGraphStudio.current=ins.data.id;await loadGraphLayouts()}});
 document.getElementById("crGraphDelete")?.addEventListener("click",async()=>{const id=document.getElementById("crGraphSaved")?.value||window.__crowspaceGraphStudio.current;if(!id||!confirm("Delete this saved graph layout?"))return;const z=await sb.from("crowspace_graph_layouts").delete().eq("id",id).eq("user_id",user.id);if(z.error)alert(z.error.message);else{window.__crowspaceGraphStudio.current=null;await loadGraphLayouts()}});
 document.getElementById("crGraphSaveLayout")?.addEventListener("click",async()=>{const name=(document.getElementById("crGraphLayoutName")?.value||"").trim();if(!name)return;const positions=window.__crowspaceGraphPositions||{};const frozen=[...(window.__crowspaceGraphPhysics.frozen||new Set())];const payload={user_id:user.id,name,view_kind:window.__crowspaceGraphStudio.view||"everything",positions,frozen_nodes:frozen,settings:{strength:window.__crowspaceGraphPhysics.strength,attraction:window.__crowspaceGraphPhysics.attraction,repulsion:window.__crowspaceGraphPhysics.repulsion,collision:window.__crowspaceGraphPhysics.collision}};const z=await sb.from("crowspace_graph_layouts").insert(payload).select("id").single();if(z.error)alert(z.error.message);else{window.__crowspaceGraphStudio.current=z.data.id;await loadGraphLayouts()}});
 if(!sharedLayout)document.getElementById("crGraphLoadLayout")?.addEventListener("click",async()=>{const id=document.getElementById("crGraphSaved")?.value;if(!id)return;const z=await sb.from("crowspace_graph_layouts").select("*").eq("id",id).single();if(z.error||!z.data)return;window.__crowspaceGraphStudio.current=id;window.__crowspaceGraphStudio.view=z.data.view_kind||"everything";window.__crowspaceGraphPositions=z.data.positions||{};window.__crowspaceGraphPhysics.frozen=new Set(z.data.frozen_nodes||[]);Object.assign(window.__crowspaceGraphPhysics,z.data.settings||{});graph()});
 if(!sharedLayout)document.getElementById("crGraphShareLayout")?.addEventListener("click",async()=>{const id=document.getElementById("crGraphSaved")?.value||window.__crowspaceGraphStudio.current;if(!id)return;const token=crypto.randomUUID();const z=await sb.from("crowspace_graph_layouts").update({is_shared:true,share_token:token}).eq("id",id).eq("user_id",user.id).select("share_token").single();if(z.error)alert(z.error.message);else alert(location.origin+location.pathname+"?graph_share="+encodeURIComponent(z.data.share_token))});
 document.getElementById("crGraphPhysicsToggle")?.addEventListener("click",()=>{window.__crowspaceGraphPhysics.paused=!window.__crowspaceGraphPhysics.paused;window.__crowspaceGraphPhysics.running=false;graph()});
 ["Strength","Attraction","Repulsion","Collision"].forEach(k=>document.getElementById("crGraphPhysics"+k)?.addEventListener("input",e=>{window.__crowspaceGraphPhysics[k.toLowerCase()]=Number(e.target.value);if(!window.__crowspaceGraphPhysics.paused){window.__crowspaceGraphPhysics.running=false;graph()}}));
 document.getElementById("crGraphForce")?.addEventListener("click",()=>{window.__crowspaceGraphForceInitialized=false;window.__crowspaceGraphPositions={};graph()});
 document.getElementById("crGraphDepth")?.addEventListener("change",e=>{const u=new URL(location.href);u.searchParams.set("depth",e.target.value);location.href=u.toString()});
 document.getElementById("crGraphType")?.addEventListener("change",e=>{const v=e.target.value;svgEl?.querySelectorAll(".cr-graph-node").forEach(n=>n.style.display=!v||n.dataset.kind===v?"":"none");svgEl?.querySelectorAll(".cr-graph-line").forEach((l,i)=>{const x=positioned[i];l.style.display=!v||x.kind===v?"":"none"})});
 document.getElementById("crGraphRel")?.addEventListener("change",e=>{const v=e.target.value;svgEl?.querySelectorAll(".cr-graph-node").forEach((n,i)=>n.style.display=(!v||positioned[i].relationship===v)?"":"none");svgEl?.querySelectorAll(".cr-graph-line").forEach((l,i)=>l.style.display=(!v||positioned[i].relationship===v)?"":"none")});
 document.getElementById("crGraphReset")?.addEventListener("click",()=>{state.scale=1;state.x=0;state.y=0;apply()});
 document.getElementById("crGraphClearPath")?.addEventListener("click",()=>{const u=new URL(location.href);u.searchParams.delete("focus_kind");u.searchParams.delete("focus_id");history.pushState({}, "", u);graph()});
 document.getElementById("crGraphZoomIn")?.addEventListener("click",()=>{state.scale=Math.min(2.5,state.scale+.15);apply()});
 document.getElementById("crGraphZoomOut")?.addEventListener("click",()=>{state.scale=Math.max(.6,state.scale-.15);apply()});
 svgEl?.addEventListener("wheel",e=>{e.preventDefault();state.scale=Math.max(.6,Math.min(2.5,state.scale+(e.deltaY<0?.12:-.12)));apply()},{passive:false});
 svgEl?.addEventListener("pointerdown",e=>{if(e.target.closest(".cr-graph-node"))return;state.drag=true;state.px=e.clientX;state.py=e.clientY;svgEl.setPointerCapture(e.pointerId)});
 svgEl?.addEventListener("pointermove",e=>{if(!state.drag)return;state.x+=(e.clientX-state.px);state.y+=(e.clientY-state.py);state.px=e.clientX;state.py=e.clientY;apply()});
 svgEl?.addEventListener("pointerup",()=>{state.drag=false});
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
 if(a.startsWith("graph:select:")){
  const i=Number(a.split(":")[2]);const n=document.querySelectorAll(".cr-graph-node")[i];if(n){n.dispatchEvent(new MouseEvent("click",{bubbles:true}))}return
 }
 if(a==="graph:refresh"){graph();return}
 if(a.startsWith("graph:expand:")){const z=a.split(":");const kind=z[2],id=z.slice(3).join(":");if(kind&&id){window.__crowspaceGraphExpanded=window.__crowspaceGraphExpanded||new Set();const key=kind+":"+id;if(window.__crowspaceGraphExpanded.has(key))window.__crowspaceGraphExpanded.delete(key);else window.__crowspaceGraphExpanded.add(key);graph()}return}
 if(a.startsWith("graph:discover:")){const z=a.split(":");const kind=z[2],id=z[3];if(kind&&id){const u=new URL("graph.html",location.href);u.searchParams.set("depth","3");u.searchParams.set("focus_kind",kind);u.searchParams.set("focus_id",id);location.href=u.toString()}return}

 if(a.startsWith("goto:")){location.href=a.slice(5);return} if(a.startsWith("discover:signal:")){if(!user){location.href="auth.html";return}const z=a.split(":");const action=z[2],kind=z[3],target=z[4];if(target)await sb.rpc("crowspace_record_discovery_signal",{p_target:target,p_kind:kind,p_action:action,p_weight:action==="not_interested"?-6:action==="dismiss"?-3:1});return} if(a.startsWith("discover:")){if(!user){location.href="auth.html";return}const z=a.split(":");if(z[1]==="refresh"){discover();return}const action=z[1],kind=z[2],target=z[3];if(target){await sb.from("crowspace_discovery_preferences").upsert({user_id:user.id,target_id:target,action},{onConflict:"user_id,target_id"});await sb.rpc("crowspace_record_adaptive_feedback",{p_user:user.id,p_kind:kind,p_target:target,p_action:action==="not_interested"?"not_interested":"dismiss",p_weight:action==="not_interested"?-6:-3});discover();return}}
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
 const graph=sb.channel("crowspace:graph",{config:{private:true}}); graph.on("broadcast",{event:"INSERT"},refresh).on("broadcast",{event:"UPDATE"},refresh).on("broadcast",{event:"DELETE"},refresh).subscribe(); liveChannels.push(graph);
 if(user&&page()==="graph.html"){const token=new URLSearchParams(location.search).get("graph_share");if(token){const topic="crowspace:graph-share:"+token;const shared=sb.channel(topic,{config:{private:true,presence:{key:user.id}}});shared.on("broadcast",{event:"INSERT"},refresh).on("broadcast",{event:"UPDATE"},async()=>{if(shareToken){const latest=(await sb.from("crowspace_graph_layouts").select("*").eq("share_token",shareToken).eq("is_shared",true).maybeSingle()).data;if(latest){window.__crowspaceGraphPositions={...(latest.positions||{})};window.__crowspaceGraphPhysics.frozen=new Set(latest.frozen_nodes||[]);Object.assign(window.__crowspaceGraphPhysics,latest.settings||{});}refresh()}}).on("broadcast",{event:"DELETE"},refresh);shared.on("presence",{event:"sync"},()=>{const state=shared.presenceState();window.__crowspaceGraphPresence=Object.values(state).flat();const el=document.getElementById("crGraphPresence");if(el)el.innerHTML=window.__crowspaceGraphPresence.length+" member"+(window.__crowspaceGraphPresence.length===1?"":"s")+" viewing live";});shared.subscribe(async status=>{if(status==="SUBSCRIBED"){await shared.track({user_id:user.id,display_name:user.user_metadata?.display_name||"CrowSpace member",viewing_at:new Date().toISOString()});}});liveChannels.push(shared)}}
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
 const p=page(), map={"index.html":feed,"profile.html":profile,"groups.html":groups,"group.html":group,"spaces.html":spaces,"rooms.html":rooms,"events.html":events,"event.html":events,"media.html":media,"photos.html":media,"videos.html":media,"notifications.html":notifications,"activity.html":activity,"friends.html":friends,"graph.html":graph,"discover.html":discover,"customize.html":customize,"create-post.html":createPost,"create-group.html":createGroup,"create-space.html":createSpace,"create-event.html":createEvent,"create-media.html":media};
 if(map[p])await map[p]();
 await startRealtime();
}
document.addEventListener("submit",submit);
document.addEventListener("click",e=>{const b=e.target.closest("[data-cr-action]");if(b)act(b.dataset.crAction)});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();