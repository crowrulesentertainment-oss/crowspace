(function(){
"use strict";
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const $=s=>document.querySelector(s);
const avatar=u=>u||"https://api.dicebear.com/9.x/thumbs/svg?seed=crowspace&backgroundColor=0b1020,172554&backgroundType=gradientLinear";
function toast(m){const x=document.createElement("div");x.className="toast";x.textContent=m;document.body.appendChild(x);setTimeout(()=>x.remove(),2600)}
function nav(){const n=$(".navin");if(!n)return;n.innerHTML='<a class="brand" href="home.html">CROW<span>SPACE</span></a><div class="navlinks"><a href="home.html">Home</a><a href="explore.html">Explore</a><a href="caws.html">Caws</a><a href="circles.html">Circles</a><a href="notifications.html">Alerts <span class="nav-badge" data-live-badge="alerts" hidden>0</span></a><a href="messages.html">Messages <span class="nav-badge" data-live-badge="messages" hidden>0</span></a><a href="profile.html">Profile</a><a href="account.html">Account</a><button id="logout">Logout</button></div>';$("#logout").onclick=async()=>{await CrowSpaceAuth.signOut();location.href="index.html"}}
async function auth(){return await CrowSpaceAuth.ready}
async function user(){const db=await auth();const r=await db.auth.getUser();return r.data.user}
async function profile(db,id){const r=await db.from("crowspace_profiles").select("user_id,username,display_name,avatar_url,bio").eq("user_id",id).maybeSingle();return r.data||{}}
async function guard(){const u=await user();if(!u){location.href="login.html";return null}return u}
function commandPalette(){
 if($("#crow-command-palette"))return;
 const wrap=document.createElement("div");
 wrap.id="crow-command-palette";
 wrap.className="command-palette";
 wrap.innerHTML='<div class="command-backdrop" data-close-command></div><div class="command-panel"><div class="command-top"><span>COMMAND CENTER</span><button class="btn" data-close-command>ESC</button></div><input id="command-input" class="command-input" placeholder="Search CrowSpace pages…" autocomplete="off"><div id="command-results" class="command-results"></div></div>';
 document.body.appendChild(wrap);
 const pages=[["home.html","Home","Command Feed"],["explore.html","Explore","Discover members"],["caws.html","Caws","Short-form video"],["circles.html","Circles","Communities"],["notifications.html","Alerts","Notifications"],["messages.html","Messages","Direct messages"],["holiday-bots.html","Holiday Network","Automated accounts"],["profile.html","Profile","Your identity"],["account.html","Account","Universal account"]];
 const input=wrap.querySelector("#command-input"),results=wrap.querySelector("#command-results");
 const draw=q=>{const v=q.toLowerCase().trim();results.innerHTML=pages.filter(p=>!v||p.join(" ").toLowerCase().includes(v)).map(p=>'<a class="command-result" href="'+p[0]+'"><b>'+esc(p[1])+'</b><span>'+esc(p[2])+'</span><kbd>↵</kbd></a>').join("")||'<div class="muted" style="padding:18px">No destination found.</div>'};
 const close=()=>{wrap.classList.remove("open");input.value="";draw("")};
 const open=()=>{wrap.classList.add("open");draw("");setTimeout(()=>input.focus(),30)};
 input.oninput=()=>draw(input.value);
 wrap.querySelectorAll("[data-close-command]").forEach(x=>x.onclick=close);
 document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();open()}if(e.key==="Escape")close()});
 draw("");
}
function appShell(){
 const p=document.body.dataset.page;
 if(["index","login","signup"].includes(p))return;
 const main=$(".shell");if(!main||main.dataset.shellReady)return;
 main.dataset.shellReady="1";
 const dup=[...main.querySelectorAll(":scope > .kicker")];dup.slice(1).forEach(x=>x.remove());
 const children=[...main.children];
 const frame=document.createElement("div");frame.className="pageframe";
 const side=document.createElement("aside");side.className="sidebar";
 const active=p==="notifications"?"notifications":p;
 const links=[["home.html","home","HOME","Command feed"],["explore.html","explore","EXPLORE","Find members"],["caws.html","caws","CAWS","Short-form video"],["circles.html","circles","CIRCLES","Communities"],["notifications.html","notifications","ALERTS","Signals"],["messages.html","messages","MESSAGES","Direct conversations"],["holiday-bots.html","holiday-bots","HOLIDAY","Bot network"],["profile.html","profile","PROFILE","Identity"],["account.html","account","ACCOUNT","Universal account"]];
 side.innerHTML='<div class="side-label">CROWSPACE OS</div>'+links.map(x=>'<a class="side-link '+(active===x[1]?"active":"")+'" href="'+x[0]+'"><b>'+x[2]+'</b><span>'+x[3]+'</span>'+(x[1]==="notifications"?'<em class="nav-badge side-badge" data-live-badge="alerts" hidden>0</em>':"")+(x[1]==="messages"?'<em class="nav-badge side-badge" data-live-badge="messages" hidden>0</em>':"")+'</a>').join("")+'<div class="side-status"><i></i><b data-live-status>CONNECTING</b><span>Supabase Realtime</span></div>';
 const content=document.createElement("div");content.className="content";
 children.forEach(x=>content.appendChild(x));
 frame.append(side,content);main.replaceChildren(frame);
 const top=document.createElement("div");top.className="commandbar";
 top.innerHTML='<span><b>COMMAND CENTER</b> <span class="muted">/ '+esc((document.title||"CrowSpace").split("—")[0].trim().toUpperCase())+'</span></span><button class="btn" id="open-command">⌘K / CTRL K</button>';
 content.prepend(top);
 $("#open-command").onclick=()=>document.dispatchEvent(new KeyboardEvent("keydown",{key:"k",ctrlKey:true}));
}

function communityChrome(page){
 const main=document.querySelector(".content");if(!main)return;
 const tabs='<div class="community-tabs"><a class="btn" href="home.html">Feed</a><a class="btn" href="explore.html">People</a><a class="btn" href="caws.html">Caws</a><a class="btn" href="circles.html">Circles</a><a class="btn" href="messages.html">Messages</a><a class="btn" href="notifications.html">Notifications</a><a class="btn" href="holiday-bots.html">Holiday Network</a></div>';
 const first=main.querySelector(".hero,.card");if(first)first.insertAdjacentHTML("beforebegin",tabs);
}
async function socialGraph(db,u){
 const box=document.querySelector("[data-social-graph]");if(!box)return;
 const following=await db.from("crowspace_follows").select("following_id").eq("follower_id",u.id);
 const ids=(following.data||[]).map(x=>x.following_id),p=await db.from("crowspace_profiles").select("user_id,display_name,username,avatar_url,bio").neq("user_id",u.id).limit(24),followSet=new Set(ids);
 const counts=await db.from("crowspace_follows").select("follower_id,following_id");
 const followerCount=new Map(),followingCount=new Map();(counts.data||[]).forEach(x=>{followerCount.set(x.following_id,(followerCount.get(x.following_id)||0)+1);followingCount.set(x.follower_id,(followingCount.get(x.follower_id)||0)+1)});
 box.innerHTML='<div class="social-graph-head"><div><span class="eyebrow">SOCIAL GRAPH</span><h2>YOUR NETWORK.</h2></div><span class="muted">'+ids.length+' following · '+(followerCount.get(u.id)||0)+' followers</span></div><div class="member-grid">'+(p.data||[]).map(x=>'<article class="member-card"><img src="'+esc(x.avatar_url||avatar(x))+'"><b>'+esc(x.display_name||x.username||"Member")+'</b><small>@'+esc(x.username||"member")+'</small><div class="muted">'+(followerCount.get(x.user_id)||0)+' followers · '+(followingCount.get(x.user_id)||0)+' following</div><p>'+esc(x.bio||"CrowSpace member")+'</p><button class="btn '+(followSet.has(x.user_id)?"active":"")+'" data-follow="'+esc(x.user_id)+'">'+(followSet.has(x.user_id)?"Following":"Follow")+'</button></article>').join("")+'</div>';
 box.querySelectorAll("[data-follow]").forEach(b=>b.onclick=async()=>{const id=b.dataset.follow;if(followSet.has(id))await db.from("crowspace_follows").delete().eq("follower_id",u.id).eq("following_id",id);else await db.from("crowspace_follows").insert({follower_id:u.id,following_id:id});socialGraph(db,u)})
}
function liveLayer(db,u){
 if(window.CrowSpaceLive?.stop)window.CrowSpaceLive.stop();
 const state={channels:[],presence:0,online:[],status:"CONNECTING"};
 const setStatus=s=>{state.status=s;document.querySelectorAll("[data-live-status]").forEach(x=>{x.textContent=s;x.className="live-status "+s.toLowerCase()})};
 const refreshFeed=()=>{const el=$("#feed");if(el)renderFeed(el,document.querySelector("[data-feed-filter].active")?.dataset.feedFilter||"all")};
 const badge=(kind)=>{document.querySelectorAll("[data-live-badge='"+kind+"']").forEach(x=>{const n=Number(x.dataset.count||0)+1;x.dataset.count=n;x.textContent=n>99?"99+":n;x.hidden=false})};
 const channel=db.channel("crowspace-live");
 channel.on("postgres_changes",{event:"INSERT",schema:"public",table:"crowspace_posts"},()=>{refreshFeed();toast("New CrowSpace post received")});
 channel.on("postgres_changes",{event:"INSERT",schema:"public",table:"crowspace_holiday_bot_posts"},()=>{refreshFeed();toast("Holiday Bot activity received")});channel.on("postgres_changes",{event:"*",schema:"public",table:"crowspace_likes"},()=>refreshFeed());channel.on("postgres_changes",{event:"*",schema:"public",table:"crowspace_comments"},()=>refreshFeed());channel.on("postgres_changes",{event:"*",schema:"public",table:"crowspace_follows"},()=>socialGraph(db,u));
 channel.on("postgres_changes",{event:"INSERT",schema:"public",table:"crowspace_notifications",filter:"user_id=eq."+u.id},()=>{badge("alerts");toast("New notification")});
 channel.on("postgres_changes",{event:"INSERT",schema:"public",table:"crowspace_messages"},()=>{badge("messages");toast("New message activity")});

 const presence=db.channel("crowspace-presence",{config:{presence:{key:u.id}}});const typing=db.channel("crowspace-typing");typing.on("broadcast",{event:"typing"},p=>{const x=p.payload||{};if(x.user_id!==u.id)document.querySelectorAll("[data-typing]").forEach(e=>e.textContent=x.typing?((x.name||"Someone")+" is typing…"):"")});typing.subscribe();
 presence.on("presence",{event:"sync"},()=>{const p=presence.presenceState();const rows=[];Object.keys(p).forEach(k=>(p[k]||[]).forEach(v=>rows.push(v)));state.online=rows;state.presence=rows.length;document.querySelectorAll("[data-live-online]").forEach(x=>x.textContent=rows.length)});
 presence.on("presence",{event:"join"},()=>{state.presence=Object.keys(presence.presenceState()).length;document.querySelectorAll("[data-live-online]").forEach(x=>x.textContent=state.presence)});
 presence.on("presence",{event:"leave"},()=>{state.presence=Object.keys(presence.presenceState()).length;document.querySelectorAll("[data-live-online]").forEach(x=>x.textContent=state.presence)});
 state.channels=[channel,presence,typing];
 channel.subscribe((s)=>{if(s==="SUBSCRIBED")setStatus("LIVE");else if(s==="CHANNEL_ERROR"||s==="TIMED_OUT")setStatus("RECONNECTING")});
 presence.subscribe(async(s)=>{if(s==="SUBSCRIBED"){await presence.track({user_id:u.id,page:document.body.dataset.page,online_at:new Date().toISOString()})}});
 window.CrowSpaceLive={state,typing,stop:()=>state.channels.forEach(x=>db.removeChannel(x))};
 setStatus("CONNECTING");
}
\nfunction shell(){document.documentElement.dataset.crowspace="cinematic";nav();appShell();commandPalette();window.CrowSpaceUI={esc,toast,auth,user,profile,avatar,guard};}
async function feed(limit=60){
 const db=await auth();
 const [a,b]=await Promise.all([
  db.from("crowspace_posts").select("id,user_id,body,title,media_url,created_at,like_count,comment_count").order("created_at",{ascending:false}).limit(limit),
  db.from("crowspace_holiday_bot_posts").select("id,bot_id,title,body,created_at").order("created_at",{ascending:false}).limit(limit)
 ]);
 if(a.error)throw a.error;if(b.error)throw b.error;
 const rows=a.data||[],bp=b.data||[],ids=[...new Set(rows.map(x=>x.user_id))],bids=[...new Set(bp.map(x=>x.bot_id))];
 const [ps,bs]=await Promise.all([
  ids.length?db.from("crowspace_profiles").select("user_id,username,display_name,avatar_url").in("user_id",ids):Promise.resolve({data:[]}),
  bids.length?db.from("crowspace_holiday_bots").select("id,slug,display_name,avatar_url,holiday_name").in("id",bids):Promise.resolve({data:[]})
 ]);
 const pm=new Map((ps.data||[]).map(x=>[x.user_id,x])),bm=new Map((bs.data||[]).map(x=>[x.id,x]));
 return [...rows.map(p=>{const x=pm.get(p.user_id)||{};return {...p,kind:"member",name:x.display_name||x.username||"Crow Member",handle:x.username?"@"+x.username:"@member",avatar:avatar(x.avatar_url)}}),...bp.map(p=>{const x=bm.get(p.bot_id)||{};return {...p,kind:"bot",name:x.display_name||"Holiday Crow",handle:"@"+(x.slug||"holiday-crow"),avatar:avatar(x.avatar_url),bot_slug:x.slug}})].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
}
async function personalizedFeed(limit=60,mode="for-you"){
 const db=await auth(),u=await user();if(!u)return [];
 const f=await db.from("crowspace_follows").select("following_id").eq("follower_id",u.id);
 const ids=[u.id,...(f.data||[]).map(x=>x.following_id)];
 const rows=await feed(limit);
 if(mode==="following")return rows.filter(x=>x.kind==="member"&&ids.includes(x.user_id));
 const followed=rows.filter(x=>x.kind==="member"&&ids.includes(x.user_id));
 const bots=rows.filter(x=>x.kind==="bot");
 const own=rows.filter(x=>x.kind==="member"&&x.user_id===u.id);
 const community=rows.filter(x=>x.kind==="member"&&!ids.includes(x.user_id));
 return [...followed,...own,...bots,...community].slice(0,limit)
}
function postCard(p){
 return '<article class="card post" id="post-'+esc(p.id)+'"><div class="posthead"><img class="avatar" src="'+esc(p.avatar)+'"><div><b>'+ (p.kind==="bot"?'<a href="holiday-bot.html?bot='+encodeURIComponent(p.bot_slug)+'">'+esc(p.name)+'</a>':esc(p.name))+'</b><div class="muted">'+esc(p.handle)+' · '+new Date(p.created_at).toLocaleString()+'</div></div></div>'+(p.title?'<h3>'+esc(p.title)+'</h3>':'')+'<div class="postbody">'+esc(p.body)+'</div><div class="actions"><button class="btn" data-like="'+esc(p.id)+'">♡ <span>'+esc(p.like_count||0)+'</span></button><button class="btn" data-comment="'+esc(p.id)+'">Comment <span>'+esc(p.comment_count||0)+'</span></button><button class="btn" data-share="'+esc(p.id)+'">↗ Share</button></div></article>';
}
async function renderPersonalFeed(el,mode){const rows=await personalizedFeed(60,mode);el.innerHTML=rows.map(postCard).join("")||'<div class="card pad muted">Nothing here yet. Follow members to build your feed.</div>';}
function metric(label,value,detail){return '<div class="metric"><b>'+esc(value)+'</b><span>'+esc(label)+'</span><small>'+esc(detail)+'</small></div>'}
async function page(){
 shell();const p=document.body.dataset.page,db=await auth();communityChrome(p);
 if(p==="index")return;
 if(p==="login"||p==="signup")return authPage(p,db);\n const liveUser=await guard();if(!liveUser)return;liveLayer(db,liveUser);
 if(p==="home"){const u=await guard();if(!u)return;const d=await dashboardData(db,u);$("#welcome").textContent="Welcome back, "+(u.user_metadata?.display_name||u.email?.split("@")[0]||"Crow")+".";$("#welcome").insertAdjacentHTML("afterend",'<div id="dashmetrics" class="metric-grid"></div>');$("#dashmetrics").innerHTML=metric("Community posts",d.posts,"CrowSpace-wide")+metric("Members",d.profiles,"Profiles")+metric("Your alerts",d.alerts,"Notifications")+metric("Your messages",d.messages,"Conversation records")+metric("Caws",d.caws,"Media library")+metric("Holiday Bots",d.bots,"Active automated accounts");document.querySelectorAll("[data-feed-filter]").forEach(b=>b.onclick=async()=>{document.querySelectorAll("[data-feed-filter]").forEach(x=>x.classList.remove("active"));b.classList.add("active");await renderFeed($("#feed"),b.dataset.feedFilter)});document.querySelectorAll("[data-personal-feed]").forEach(b=>b.onclick=async()=>{document.querySelectorAll("[data-personal-feed]").forEach(x=>x.classList.remove("active"));b.classList.add("active");await renderPersonalFeed($("#feed"),b.dataset.personalFeed)});
$("#publish").onsubmit=async e=>{e.preventDefault();const body=$("#body").value.trim();if(!body)return;const r=await db.from("crowspace_posts").insert({user_id:u.id,body,title:$("#title").value.trim()||null});if(r.error){toast(r.error.message);return}$("#title").value="";$("#body").value="";toast("Posted to CrowSpace");await renderFeed($("#feed"))};await renderFeed($("#feed"));await renderPersonalFeed($("#feed"),"for-you");return}
 if(p==="profile")return profilePage(db);
 if(p==="account")return accountPage(db);
 if(p==="explore")return explorePage(db);
 if(p==="caws")return cawsPage(db);
 if(p==="circles")return circlesPage(db);
 if(p==="messages")return messagesPage(db);
 if(p==="notifications")return notificationsPage(db);
 if(p==="holiday-bots")return botsPage(db); if(p==="holiday-bot")return botPage(db);
}
async function authPage(kind,db){const form=$("#authForm"),msg=$("#msg");form.onsubmit=async e=>{e.preventDefault();msg.textContent="Connecting…";const email=$("#email").value.trim(),password=$("#password").value,display=$("#display")?.value.trim();let r;if(kind==="login")r=await db.auth.signInWithPassword({email,password});else r=await db.auth.signUp({email,password,options:{data:{display_name:display||email.split("@")[0]}}});if(r.error){msg.textContent=r.error.message;return}if(kind==="signup"&&r.data.user){await db.from("crowspace_profiles").upsert({user_id:r.data.user.id,username:display?display.toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,30):email.split("@")[0],display_name:display||email.split("@")[0]},{onConflict:"user_id"})}location.href="home.html"}}
async function profilePage(db){
 const viewer=(await db.auth.getUser()).data.user;
 const key=new URLSearchParams(location.search).get("u");
 const pr=key?await db.from("crowspace_profiles").select("*").eq("username",key).maybeSingle():await db.from("crowspace_profiles").select("*").eq("user_id",viewer.id).maybeSingle();
 const p=pr.data;if(pr.error||!p){$("#profile").innerHTML='<div class="card pad"><h2>Profile not found</h2><p class="muted">That CrowSpace profile does not exist.</p></div>';return}
 const isSelf=p.user_id===viewer.id;
 if(!isSelf)await db.from("crowspace_profile_visits").upsert({profile_id:p.id,visitor_id:viewer.id},{onConflict:"profile_id,visitor_id"});
 const [followers,following,posts,visits]=await Promise.all([
  db.from("crowspace_follows").select("follower_id").eq("followed_user_id",p.user_id),
  db.from("crowspace_follows").select("followed_user_id").eq("follower_id",p.user_id),
  db.from("crowspace_posts").select("id,body,title,media_url,created_at,like_count,comment_count").eq("user_id",p.user_id).order("created_at",{ascending:false}).limit(30),
  isSelf?db.from("crowspace_profile_visits").select("visitor_id,visited_at").eq("profile_id",p.id).order("visited_at",{ascending:false}).limit(20):Promise.resolve({data:[]})
 ]);
 const followerIds=(followers.data||[]).map(x=>x.follower_id),followingIds=(following.data||[]).map(x=>x.followed_user_id),mutualIds=followerIds.filter(x=>followingIds.includes(x));
 const interests=Array.isArray(p.profile_sections?.interests)?p.profile_sections.interests:[],social=p.social_links&&typeof p.social_links==="object"?p.social_links:{};
 const links=Object.entries(social).filter(([k,v])=>v).map(([k,v])=>'<a class="btn" target="_blank" rel="noopener" href="'+esc(v)+'">'+esc(k)+'</a>').join("");
 const media=(posts.data||[]).filter(x=>x.media_url);
 const wall=(posts.data||[]).map(x=>'<article class="wall-post"><div><b>'+esc(x.title||"Post")+'</b><small class="muted">'+new Date(x.created_at).toLocaleString()+'</small></div><p>'+esc(x.body||"")+'</p>'+(x.media_url?'<a href="'+esc(x.media_url)+'" target="_blank" rel="noopener"><img src="'+esc(x.media_url)+'" class="wall-media"></a>':"")+'<div class="muted">'+(x.like_count||0)+' likes · '+(x.comment_count||0)+' comments</div></article>').join("");
 const gallery=media.map(x=>'<a href="'+esc(x.media_url)+'" target="_blank" rel="noopener"><img src="'+esc(x.media_url)+'"></a>').join("");
 $("#profile").innerHTML='<div class="profile-v11"><section class="card cover-profile"><div class="cover" style="background-image:url('+esc(p.banner_url||"")+')"></div><div class="profilehead"><img class="profileavatar" src="'+esc(avatar(p.avatar_url))+'"><div class="profileidentity"><h1>'+esc(p.display_name||p.username||"Crow Member")+'</h1><div class="muted">@'+esc(p.username||"member")+'</div><span class="badge">'+esc(p.creator_category||"CROWSPACE MEMBER")+'</span><p>'+esc(p.portfolio_tagline||p.bio||"Building a story inside the CrowRules universe.")+'</p></div></div><div class="profile-stats"><span><b>'+followerIds.length+'</b> Followers</span><span><b>'+followingIds.length+'</b> Following</span><span><b>'+mutualIds.length+'</b> Mutual</span><span><b>'+(posts.data||[]).length+'</b> Posts</span></div></section><div class="profile-grid-v11"><aside class="profile-side"><section class="card pad"><h2>About</h2><p class="muted">'+esc(p.bio||"No bio yet.")+'</p><div class="interest-list">'+interests.map(x=>'<span>'+esc(x)+'</span>').join("")+'</div></section><section class="card pad"><h2>Links</h2><div class="profile-links">'+(links||'<span class="muted">No links yet.</span>')+'</div></section>'+(isSelf?'<section class="card pad"><h2>Recent Visitors</h2><div class="stat-list">'+((visits.data||[]).map(v=>'<div class="statrow"><span>Member</span><small>'+new Date(v.visited_at).toLocaleDateString()+'</small></div>').join("")||'<span class="muted">No visitors yet.</span>')+'</div></section>':"")+'</aside><main><section class="card pad"><span class="eyebrow">PROFILE WALL</span><h2>'+esc(isSelf?"YOUR ACTIVITY":"ACTIVITY")+'</h2><div class="profile-wall">'+(wall||'<p class="muted">No activity yet.</p>')+'</div></section><section class="card pad" style="margin-top:16px"><h2>Photos & Videos</h2><div class="media-grid">'+(gallery||'<span class="muted">No media shared yet.</span>')+'</div></section></main><aside class="profile-side"><section class="card pad"><h2>Connections</h2><div class="connection-counts"><div>Followers <b>'+followerIds.length+'</b></div><div>Following <b>'+followingIds.length+'</b></div><div>Mutual <b>'+mutualIds.length+'</b></div></div></section><section class="card pad"><h2>Public Profile</h2><code>'+esc(location.origin+location.pathname+'?u='+(p.username||""))+'</code></section></aside></div></div>';
}
async function accountPage(db){const u=await guard();if(!u)return;const p=await profile(db,u.id),sec=p.profile_sections&&typeof p.profile_sections==="object"?p.profile_sections:{},interests=Array.isArray(sec.interests)?sec.interests.join(", "):"";
 $("#account").innerHTML='<section class="hero"><div class="eyebrow">UNIVERSAL CROWRULES ACCOUNT</div><h1>YOUR PROFILE STUDIO.</h1><p class="muted">'+esc(u.email)+'</p><div class="grid"><div class="card pad"><h2>Identity</h2><div class="field"><label>Display name</label><input id="an" value="'+esc(p.display_name||"")+'"></div><div class="field"><label>Username</label><input id="au" value="'+esc(p.username||"")+'"></div><div class="field"><label>Bio</label><textarea id="ab">'+esc(p.bio||"")+'</textarea></div><div class="field"><label>Creator / profile category</label><input id="ac" value="'+esc(p.creator_category||"")+'"></div><div class="field"><label>Interests — comma separated</label><input id="ai" value="'+esc(interests)+'"></div></div><div class="card pad"><h2>Profile Design</h2><div class="field"><label>Avatar URL</label><input id="aa" value="'+esc(p.avatar_url||"")+'"></div><div class="field"><label>Cover photo URL</label><input id="abn" value="'+esc(p.banner_url||"")+'"></div><div class="field"><label>Profile theme</label><select id="at"><option value="neon">Neon</option><option value="classic">Classic</option><option value="sunset">Sunset</option><option value="midnight">Midnight</option></select></div><div class="field"><label>Social links JSON</label><textarea id="as">'+esc(JSON.stringify(p.social_links||{},null,2))+'</textarea></div></div></div><button id="save" class="btn primary" style="margin-top:16px">Save My Profile</button><div id="msg" class="status" style="margin-top:10px"></div></section>';
 $("#at").value=p.profile_theme||"neon";
 $("#save").onclick=async()=>{let links={};try{links=JSON.parse($("#as").value||"{}")}catch(e){$("#msg").textContent="Social links must be valid JSON.";return}const r=await db.from("crowspace_profiles").upsert({user_id:u.id,display_name:$("#an").value.trim(),username:$("#au").value.trim().toLowerCase(),bio:$("#ab").value.trim(),creator_category:$("#ac").value.trim(),avatar_url:$("#aa").value.trim(),banner_url:$("#abn").value.trim(),profile_theme:$("#at").value,profile_sections:{...sec,interests:$("#ai").value.split(",").map(x=>x.trim()).filter(Boolean)},social_links:links},{onConflict:"user_id"});$("#msg").textContent=r.error?r.error.message:"Profile saved. Your public profile is now updated.";if(!r.error)setTimeout(()=>location.href="profile.html",500)}}
async function explorePage(db){const r=await db.from("crowspace_profiles").select("user_id,username,display_name,avatar_url,bio").limit(30);$("#explore").innerHTML='<section class="hero"><div class="eyebrow">DISCOVER</div><h1>EXPLORE.</h1><p class="muted">Find members and the latest activity across CrowSpace.</p></section><section class="grid" style="margin-top:16px">'+(r.data||[]).map(p=>'<article class="card pad"><img class="avatar" src="'+esc(avatar(p.avatar_url))+'"><h3>'+esc(p.display_name||p.username||"Crow Member")+'</h3><div class="muted">@'+esc(p.username||"member")+'</div><p class="muted">'+esc(p.bio||"")+'</p></article>').join("")+'</section>'}
async function cawsPage(db){const r=await db.from("crowspace_caws").select("*").order("created_at",{ascending:false}).limit(50);$("#caws").innerHTML='<section class="hero"><div class="eyebrow">CROWSPACE // CAWS</div><h1>CAWS.</h1><p class="muted">The fast-moving video side of the CrowSpace community.</p></section><section class="grid" style="margin-top:16px">'+(r.data||[]).map(x=>'<article class="card pad"><h3>'+esc(x.title||"Caw")+'</h3><p class="muted">'+esc(x.caption||"")+'</p>'+(x.video_url?'<video controls playsinline style="width:100%;border-radius:12px" src="'+esc(x.video_url||x.media_url)+'"></video>':"")+'</article>').join("")+'</section>'}
async function circlesPage(db){const r=await db.from("crowspace_circles").select("*").order("created_at",{ascending:false}).limit(50);$("#circles").innerHTML='<section class="hero"><div class="eyebrow">COMMUNITIES</div><h1>CIRCLES.</h1><p class="muted">Topic-based communities inside CrowSpace.</p></section><section class="grid" style="margin-top:16px">'+(r.data||[]).map(x=>'<article class="card pad"><h3>'+esc(x.name||x.title||"Circle")+'</h3><p class="muted">'+esc(x.description||"")+'</p></article>').join("")+'</section>'}
async function messagesPage(db){
 const u=await guard();if(!u)return;
 const m=await db.from("crowspace_conversation_members").select("conversation_id,last_read_at").eq("user_id",u.id);
 const ids=(m.data||[]).map(x=>x.conversation_id);
 const r=ids.length?await db.from("crowspace_messages").select("*").in("conversation_id",ids).order("created_at",{ascending:false}).limit(100):{data:[]};
 const unread=(r.data||[]).filter(x=>x.sender_id!==u.id&&((m.data||[]).find(z=>z.conversation_id===x.conversation_id)?.last_read_at==null||new Date(x.created_at)>new Date((m.data||[]).find(z=>z.conversation_id===x.conversation_id).last_read_at))).length;
 $("#messages").innerHTML='<section class="hero"><div class="eyebrow">DIRECT MESSAGES</div><h1>MESSAGES.</h1><p class="muted">Your CrowSpace conversations. '+(unread?unread+" unread":"All caught up.")+'</p><div data-typing class="typing-indicator"></div></section><section class="card pad message-compose"><div class="field"><label>Conversation ID</label><input id="messageConversation" placeholder="Paste a conversation UUID"></div><div class="field"><label>Message</label><textarea id="messageBody" placeholder="Write a message…"></textarea></div><button id="sendMessage" class="btn primary">Send Message</button></section><section class="list" style="margin-top:16px">'+((r.data||[]).map(x=>'<article class="card pad"><div>'+esc(x.body)+'</div><small class="muted">'+new Date(x.created_at).toLocaleString()+'</small></article>').join("")||'<div class="card empty">No messages yet.</div>')+'</section>';
 const type=window.CrowSpaceLive?.typing;
 let timer;
 $("#messageBody").oninput=async()=>{if(!type)return;clearTimeout(timer);const name=(await profile(db,u.id)).display_name||"A member";await type.send({type:"broadcast",event:"typing",payload:{user_id:u.id,name,typing:true}});timer=setTimeout(()=>type.send({type:"broadcast",event:"typing",payload:{user_id:u.id,name,typing:false}}),900)};
 $("#sendMessage").onclick=async()=>{const conversation_id=$("#messageConversation").value.trim(),body=$("#messageBody").value.trim();if(!conversation_id||!body)return toast("Conversation ID and message are required");const q=await db.from("crowspace_messages").insert({conversation_id,sender_id:u.id,body});if(q.error)toast(q.error.message);else{$("#messageBody").value="";toast("Message sent")}};
 if(ids.length)await db.from("crowspace_conversation_members").update({last_read_at:new Date().toISOString()}).eq("user_id",u.id).in("conversation_id",ids);
}
async function botsPage(db){const r=await db.from("crowspace_holiday_bots").select("slug,display_name,holiday_name,bio,avatar_url,active").eq("active",true).order("display_name");$("#bots").innerHTML='<section class="hero"><div class="eyebrow">AUTOMATED ACCOUNTS</div><h1>HOLIDAY BOTS.</h1><p class="muted">Follow the personalities that keep CrowSpace moving through the year.</p></section><section class="grid" style="margin-top:16px">'+(r.data||[]).map(x=>'<article class="card pad"><a href="holiday-bot.html?bot='+encodeURIComponent(x.slug)+'"><img class="avatar" src="'+esc(avatar(x.avatar_url))+'"></a><h3><a href="holiday-bot.html?bot='+encodeURIComponent(x.slug)+'">'+esc(x.display_name)+'</a></h3><div class="muted">'+esc(x.holiday_name)+'</div><p class="muted">'+esc(x.bio||"")+'</p><a class="btn" href="holiday-bot.html?bot='+encodeURIComponent(x.slug)+'">View Profile</a></article>').join("")+'</section>'}
document.addEventListener("DOMContentLoaded",()=>page().catch(e=>{console.error("[CrowSpace rebuild]",e);toast("CrowSpace could not load this page.")}));
})();