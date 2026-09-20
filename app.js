const SUPABASE_URL="https://cevylpnoexugwgygvtgu.supabase.co";
const SUPABASE_KEY="sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-";
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const divisions=[
 {key:"dreamscapes",name:"Dreamscapes",icon:"🌌",desc:"Ideas, creative rooms, projects and production.",path:"https://crowrulesentertainment-oss.github.io/dreamscapes/"},
 {key:"podcasting",name:"Podcasting",icon:"🎙️",desc:"Shows, episodes, clips and creator tools.",path:"https://crowrulesentertainment-oss.github.io/podcasting/"},
 {key:"sports",name:"Sports",icon:"🏟️",desc:"Sports communities, Pick'em and fan experiences.",path:"https://crowrulesentertainment-oss.github.io/sports/"},
 {key:"memorials",name:"Memorials",icon:"🕯️",desc:"Remember. Honor. Celebrate.",path:"https://crowrulesentertainment-oss.github.io/memorials/"},
 {key:"tv",name:"CrowRules TV",icon:"📺",desc:"Shows, channels, live and on-demand.",path:"https://crowrulesentertainment-oss.github.io/crowrulestv/"}
];
let state={user:null,profile:null,member:null,plan:null,access:{},posts:[],events:[],groups:[],projects:[],ideas:[],opportunities:[],challenges:[],achievements:[],notifications:[],friends:[],follows:[],enemies:[],leaderboard:[],roles:[],skills:[],preferences:null,privacy:null,earned:[]};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const initials=s=>String(s||"CS").split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase();
const timeAgo=s=>{const d=Date.now()-new Date(s).getTime(),m=Math.floor(d/60000);if(m<1)return"just now";if(m<60)return m+"m";const h=Math.floor(m/60);if(h<24)return h+"h";const day=Math.floor(h/24);return day+"d"};
function toast(m){const e=$("#status");e.textContent=m;e.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>e.classList.remove("show"),2800)}
function go(page){$$("[data-pageview]").forEach(x=>x.classList.toggle("active-page",x.dataset.pageview===page));$$("#nav a").forEach(x=>x.classList.toggle("active",x.dataset.page===page));location.hash=page;window.scrollTo(0,0);if(page==="opportunities")loadOpportunities();if(page==="ideas")loadIdeas();if(page==="challenges")loadChallenges();if(page==="dashboard")renderDashboard()}
function setupNav(){
 $$("nav#nav a").forEach(a=>a.onclick=()=>go(a.dataset.page));
 $$("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));
 $$("[data-toast]").forEach(b=>b.onclick=()=>toast(b.dataset.toast));
 $("#menu").onclick=()=>$(".sidebar").classList.toggle("open");
 $("#logout").onclick=async()=>{await db.auth.signOut();location.reload()};
 $("#notify").onclick=()=>{go("dashboard");toast("Notification center opened.");};
 $("#search").onkeydown=e=>{if(e.key==="Enter"&&e.target.value.trim())searchAll(e.target.value.trim())};
 $("#postComposer").onclick=()=>showPostComposer();
 $("#eventComposer").onclick=()=>showEventComposer();
 $("#ideaLaunch").onclick=()=>showIdeaForm();
 $("#opportunityLaunch").onclick=()=>go("opportunities");
 $("#newIdea").onclick=()=>showIdeaForm();
 $("#newOpportunity").onclick=()=>showOpportunityForm();
 $("#watchPartyButton").onclick=()=>toast("Watch Party builder connected to CrowRooms."); $("#opportunityFilter").onchange=renderOpportunities;
 $("#sendMessage").onclick=sendMessage;
}
function divisionAccess(key){return !!state.access[key]}
function renderDivisionNav(){const n=$("#divisionNav");n.innerHTML=divisions.map(d=>'<a class="division-link" data-division="'+d.key+'">'+d.icon+' <span>'+d.name+'</span><em class="'+(divisionAccess(d.key)?"":"locked")+'">'+(divisionAccess(d.key)?"MEMBER":"JOIN")+"</em></a>").join("");$$("[data-division]").forEach(a=>a.onclick=()=>openDivision(a.dataset.division))}
function openDivision(key){const d=divisions.find(x=>x.key===key);const id="division-"+key;if(!divisionAccess(key)){goGate(d);return}let sec=document.querySelector('[data-pageview="'+id+'"]');if(!sec){sec=document.createElement("section");sec.className="page";sec.dataset.pageview=id;sec.innerHTML='<div class="page-title"><small class="eyebrow">'+d.icon+" CROWRULES DIVISION</small><h2>"+d.name+'</h2><p>Division tools are unlocked because this account has active '+esc(d.name)+' access.</p></div><div class="feature-grid"><article><h3>Member Home</h3><p>Private division feed and announcements.</p></article><article><h3>Creator Tools</h3><p>Create, collaborate and manage division work.</p></article><article><h3>Community</h3><p>Groups, events and conversations for division members.</p></article><article><h3>Cross-Universe</h3><p>Share eligible work back into CrowSpace and the Spectrum Awards.</p></article></div>';$("#divisionPages").appendChild(sec)}go(id)}
function goGate(d){const id="division-"+d.key;let sec=document.querySelector('[data-pageview="'+id+'"]');if(!sec){sec=document.createElement("section");sec.className="page";sec.dataset.pageview=id;sec.innerHTML='<div class="gate"><span>'+d.icon+'</span><small class="eyebrow">CROWRULES DIVISION</small><h2>'+esc(d.name)+' access required</h2><p>Your Universal CrowRules account is active, but this division is not currently active for your account. Division membership controls private content and division-specific tools.</p><button class="primary" onclick="toast(\'Use Universal CrowRules Membership to join or activate this division.\')">View Membership</button></div>';$("#divisionPages").appendChild(sec)}go(id)}
async function loadContext(){
 const {data:{session}}=await db.auth.getSession();state.user=session?.user||null;if(!state.user){renderSignedOut();return}
 const uid=state.user.id;
 const results=await Promise.all([
  db.from("members").select("id,user_id,display_name,username,membership_type,role,status,points,watch_minutes,bio,avatar_url").eq("user_id",uid).maybeSingle(),
  db.from("crowspace_profiles").select("*").eq("user_id",uid).maybeSingle(),
  db.from("crowspace_memberships").select("membership_plan_id,status,membership_plans(plan_key,name,level)").eq("user_id",uid).eq("status","active").maybeSingle(),
  db.from("crowspace_posts").select("id,author_id,body,media_url,media_type,created_at,like_count,comment_count,group_id").eq("status","published").order("created_at",{ascending:false}).limit(30),
  db.from("crowspace_events").select("id,title,description,event_type,starts_at,location,stream_url,visibility").order("starts_at",{ascending:true}).limit(15),
  db.from("crowspace_groups").select("id,name,slug,description,visibility,status").in("status",["active","future"]).order("created_at",{ascending:false}).limit(12),
  db.from("crowspace_projects").select("id,owner_id,title,description,category,status,image_url,created_at").order("created_at",{ascending:false}).limit(12),
  db.from("crowspace_notifications").select("id,type,message,is_read,created_at").eq("user_id",uid).order("created_at",{ascending:false}).limit(20),
  db.from("crowspace_friends").select("requester_id,recipient_id,status,created_at").or("requester_id.eq."+uid+",recipient_id.eq."+uid).limit(50),
  db.from("crowspace_follows").select("follower_id,following_id,created_at").or("follower_id.eq."+uid+",following_id.eq."+uid).limit(50),
  db.from("crowspace_enemies").select("user_id,enemy_id,created_at").or("user_id.eq."+uid+",enemy_id.eq."+uid).limit(50),
  db.from("crowspace_member_leaderboard").select("user_id,display_name,username,friends,posts,likes,points").order("points",{ascending:false}).limit(20),
  db.from("crowspace_achievements").select("id,code,name,description,icon").order("created_at",{ascending:true}).limit(100),
  db.from("crowspace_user_achievements").select("achievement_id,earned_at").eq("user_id",uid)
 ]);
 state.member=results[0].data;state.profile=results[1].data;state.plan=results[2].data?.membership_plans||null;state.posts=results[3].data||[];state.events=results[4].data||[];state.groups=results[5].data||[];state.projects=results[6].data||[];state.notifications=results[7].data||[];state.friends=results[8].data||[];state.follows=results[9].data||[];state.enemies=results[10].data||[];state.leaderboard=results[11].data||[];state.achievements=results[12].data||[];state.earned=results[13].data||[];state.roles=(results[14].data||[]).map(x=>x.role);state.skills=(results[15].data||[]).map(x=>x.skill);state.preferences=results[16].data||null;state.privacy=results[17].data||null;
 const ctx=await db.rpc("crowspace_get_access");
state.access={};
if(!ctx.error && ctx.data?.crowspace===true)state.access.crowspace=true;
if(!ctx.error && Array.isArray(ctx.data?.divisions))ctx.data.divisions.forEach(x=>{if(x.status==="active")state.access[x.site_key]=true});
if(state.plan)state.access.crowspace=true;
if($("#membershipSummary"))$("#membershipSummary").innerHTML=state.plan
 ? '<b>🪪 Universal CrowRules Membership</b><span>'+esc(state.plan.name||state.plan.plan_key||"Crow")+' · Level '+Number(state.plan.level||1)+'</span><small>One Account · One Universe</small>'
 : '<b>🪪 Universal CrowRules Membership</b><span>Account connected</span><small>Choose a membership plan to unlock member access.</small>';
 render();loadIdeas();loadOpportunities();loadChallenges();renderProfile();setupRealtime();
}
function renderSignedOut(){document.body.innerHTML='<main style="min-height:100vh;display:grid;place-items:center;padding:30px"><div class="gate"><span>🐦</span><small class="eyebrow">CROWRULES ENTERTAINMENT</small><h2>CrowSpace requires your Universal CrowRules account</h2><p>Sign in through the same account used across CrowRules Entertainment.</p><a href="./login.html"><button class="primary">Sign in</button></a></div></main>'}
function render(){
 const name=state.profile?.display_name||state.member?.display_name||state.user.email?.split("@")[0]||"Crow Member",username=state.profile?.username||state.member?.username||"member",points=state.member?.points||0,level=Math.max(1,Math.floor(points/1000)+1);
 $("#accountCard").innerHTML='<div class="avatar">'+initials(name)+'</div><div><b>'+esc(name)+'</b><small>@'+esc(username)+" · Level "+level+"</small></div>";$("#topAvatar").textContent=initials(name);
 const unread=state.notifications.filter(x=>!x.is_read).length;$("#notifyCount").textContent=unread;$("#messageCount").textContent=state.notifications.filter(x=>x.type==="message"&&!x.is_read).length;
 $("#stats").innerHTML=[["CROWPOINTS",points.toLocaleString()],["LEVEL",level],["FRIENDS",state.friends.filter(x=>x.status==="accepted").length],["PROJECTS",state.projects.filter(x=>x.owner_id===state.user.id).length],["DIVISIONS",Object.keys(state.access).filter(k=>k!=="crowspace").length]].map(x=>'<div><small>'+x[0]+"</small><b>"+x[1]+"</b></div>").join("");
 renderDivisionNav();$("#divisions").innerHTML=divisions.map(d=>{const ok=divisionAccess(d.key);return '<article class="division-card '+(ok?"":"locked")+'"><span>'+d.icon+'</span><div><h3>'+d.name+'</h3><p>'+d.desc+'</p><strong>'+(ok?"● MEMBER ACCESS":"🔒 DIVISION ACCESS REQUIRED")+"</strong></div></article>"}).join("");
 renderFeed(name);renderEvents();renderGroups();renderRooms();renderLeaderboard();renderAchievements();renderPassport(name,username,points,level);renderSpectrum();renderProfile();renderDiscover();renderFriends();renderRivals();renderDashboard();
}
function renderFeed(name){const demo=state.posts.length?state.posts:[{id:"demo",author_id:state.user.id,body:"Welcome to CrowSpace — one social universe connecting members, creators, communities and CrowRules projects.",created_at:new Date().toISOString(),like_count:0,comment_count:0}];$("#feed").innerHTML=demo.map(p=>'<article class="post" data-post="'+p.id+'"><div class="post-head"><div class="avatar">'+initials(name)+'</div><div><b>'+esc(p.author_name||name)+'</b><span class="verified">✓ CrowSpace</span><small>'+timeAgo(p.created_at)+'</small></div></div><p>'+esc(p.body||"")+"</p>"+(p.media_url?'<div class="media"><video controls playsinline src="'+esc(p.media_url)+'"></video></div>':"")+'<div class="post-actions"><button data-like="'+p.id+'">❤️ Like <span>'+Number(p.like_count||0)+"</span></button><button data-comment='"+p.id+"'>💬 "+Number(p.comment_count||0)+"</button><button data-bookmark='"+p.id+"'>🔖 Save</button><button data-share='"+p.id+"'>↗ Share</button></div></article>').join("");
 $$("[data-like]").forEach(b=>b.onclick=async()=>{if(b.dataset.like==="demo"){toast("Demo post.");return}const r=await db.rpc("crowspace_toggle_like",{target_post_id:b.dataset.like});toast(r.error?r.error.message:"Like updated.");if(!r.error)loadContext()});
 $$("[data-bookmark]").forEach(b=>b.onclick=async()=>{if(b.dataset.bookmark==="demo")return toast("Demo post.");const r=await db.rpc("crowspace_toggle_bookmark",{target_post:b.dataset.bookmark});toast(r.error?r.error.message:"Saved.");});
 $$("[data-share]").forEach(b=>b.onclick=()=>navigator.clipboard?.writeText(location.href+"#post-"+b.dataset.share).then(()=>toast("Post link copied.")));
}
function renderEvents(){const list=state.events.length?state.events:[{id:"demo1",title:"Back Deck Live",description:"Unscripted Saturday conversation",starts_at:"2026-09-26T22:00:00Z",location:"Online"},{id:"demo2",title:"Dreamscapes Creative Room",description:"Collaborative project workshop",starts_at:"2026-09-27T20:00:00Z",location:"CrowSpace · Members"}];$("#eventsList").innerHTML=list.map(e=>{const d=new Date(e.starts_at);return '<article class="event"><div class="date"><b>'+d.getDate()+'</b><small>'+d.toLocaleString(undefined,{month:"short"}).toUpperCase()+'</small></div><div><h3>'+esc(e.title)+'</h3><p>'+esc(e.description||"")+" · "+esc(e.location||"Online")+'</p></div><button data-rsvp="'+e.id+'">Interested</button></article>'}).join("");$$("[data-rsvp]").forEach(b=>b.onclick=async()=>{if(b.dataset.rsvp.startsWith("demo"))return toast("RSVP preview.");const r=await db.from("crowspace_event_members").upsert({event_id:b.dataset.rsvp,user_id:state.user.id,status:"interested"});toast(r.error?r.error.message:"You're marked interested.")})}
function renderGroups(){const groups=state.groups.length?state.groups:[{name:"Dream Builders",description:"Ideas, writing and worldbuilding."},{name:"Podcasters",description:"Creators helping creators."},{name:"Tacoma Creators",description:"Local creative community."},{name:"CrowSpace Community",description:"Product, events and community."}];$("#groupsList").innerHTML=groups.map(g=>'<article><span>👥</span><h3>'+esc(g.name)+'</h3><p>'+esc(g.description||"Community")+'</p><button data-group="'+(g.id||"demo")+'">'+(g.id?"Join / Open":"Explore")+"</button></article>").join("");$$("[data-group]").forEach(b=>b.onclick=()=>b.dataset.group==="demo"?toast("Community preview."):db.rpc("crowspace_toggle_group_membership",{target_group:b.dataset.group}).then(r=>toast(r.error?r.error.message:"Group membership updated.")))}
function renderRooms(){$("#roomsList").innerHTML=['🟣 Community Chat','🌌 Dream Builders','🎙️ Podcast Crew','🎥 Watch Party'].map((x,i)=>'<div class="room" data-room="'+i+'">'+x+'<small>Open CrowRoom</small></div>').join("");$$("[data-room]").forEach(x=>x.onclick=()=>{$("#chatTitle").textContent=x.textContent.split("Open")[0].trim();toast("CrowRoom selected.")})}
function renderLeaderboard(){const rows=state.leaderboard.length?state.leaderboard:state.member?[{display_name:state.member.display_name||"You",username:state.member.username||"member",posts:0,likes:0,points:state.member.points||0}]:[];$("#leaderboard").innerHTML=rows.map((r,i)=>'<div class="leader-row"><b>'+(i+1)+"</b><strong>"+esc(r.display_name||r.username||"Crow Member")+"</strong><span>"+Number(r.posts||0)+" posts · "+Number(r.likes||0)+" likes</span><b>"+Number(r.points||0).toLocaleString()+"</b></div>").join("")||'<div class="empty">No leaderboard data yet.</div>'}
function renderAchievements(){const earned=new Set((state.earned||[]).map(x=>x.achievement_id));$("#achievementList").innerHTML=(state.achievements.length?state.achievements:[{id:"d1",name:"First Flight",description:"Join CrowSpace.",icon:"🐣"},{id:"d2",name:"First Post",description:"Publish your first post.",icon:"📝"},{id:"d3",name:"Dream Builder",description:"Move an idea toward reality.",icon:"🌌"},{id:"d4",name:"Community Builder",description:"Help another creator.",icon:"🤝"}]).map(a=>'<article class="'+(earned.has(a.id)?"earned":"")+'"><span>'+esc(a.icon||"🎖️")+'</span><div><b>'+esc(a.name)+'</b><p>'+esc(a.description)+'</p></div><strong>'+(earned.has(a.id)?"EARNED":"LOCKED")+"</strong></article>").join("")}
function renderPassport(name,username,points,level){$("#passport").innerHTML='<div class="passport-top"><div class="passport-photo">'+initials(name)+'</div><div><small class="eyebrow">CROWSPACE PASSPORT</small><h2>'+esc(name)+"</h2><p>@"+esc(username)+" · Level "+level+"</p></div><span class="passport-code">CROW-"+String(level).padStart(3,"0")+'</span></div><div class="passport-stats"><div><small>CROWPOINTS</small><b>'+points.toLocaleString()+'</b></div><div><small>MEMBERSHIP</small><b>'+esc(state.plan?.name||state.member?.membership_type||"CROW")+'</b></div><div><small>CREATOR MODE</small><b>'+(state.profile?.creator_mode?"ON":"OFF")+'</b></div><div><small>VERIFICATION</small><b>'+((state.profile?.verification_status==="verified")?"VERIFIED":"STANDARD")+'</b></div></div><div class="stamps"><span class="stamp">🐦 CrowSpace</span>'+divisions.map(d=>'<span class="stamp '+(divisionAccess(d.key)?"":"locked-stamp")+'">'+d.icon+" "+d.name+(divisionAccess(d.key)?"":" · Locked")+"</span>").join("")+"</div>"}
function renderSpectrum(){$("#spectrumData").innerHTML=[["🎬","Independent Production","Original productions and creative work."],["🎙️","Best Podcast","Compelling podcast concepts and episodes."],["🌌","Dream Builder","Ideas moved toward reality."],["🤝","Collaboration","The team behind the work."]].map(x=>'<article>'+x[0]+"<h3>"+x[1]+"</h3><p>"+x[2]+'</p><button data-toast="Spectrum category ready.">View entries</button></article>').join("");$$("[data-toast]").forEach(b=>b.onclick=()=>toast(b.dataset.toast))}
function renderDiscover(){$("#discoverGrid").innerHTML=[["👤","People & Creators","Friends, collaborators and verified public figures."],["🎥","Videos & Reels","Long-form video, clips, reels and live content."],["🚀","Projects","Ideas looking for teams and audiences."],["💼","Opportunities","Casting, writing, editing, production and volunteer roles."],["🔥","Challenges","Creator challenges powered by CrowPoints."],["📅","CrowCalendar","Events, watch parties and productions."],["🏆","Awards","Spectrum Awards and digital trophies."],["🗺️","CrowMap","Future public events and CrowRules community locations."]].map(x=>'<article><span>'+x[0]+"</span><h3>"+x[1]+"</h3><p>"+x[2]+"</p></article>").join("")}
function renderFriends(){const accepted=state.friends.filter(x=>x.status==="accepted");$("#friendsList").innerHTML=accepted.length?accepted.map(x=>'<div class="mini-row">👤 '+esc(x.requester_id===state.user.id?x.recipient_id:x.requester_id)+'</div>').join(""):'<div class="empty">No accepted friends yet. Use Discover to find your crew.</div>'}
function renderRivals(){$("#rivalsList").innerHTML=state.enemies.length?state.enemies.map(x=>'<div class="mini-row">⚔️ '+esc(x.user_id===state.user.id?x.enemy_id:x.user_id)+"</div>").join(""):'<div class="empty">No rivals added.</div>'}
function renderProfile(){
 const p=state.profile||{},m=state.member||{},pref=state.preferences||{};
 const name=p.display_name||m.display_name||state.user?.email?.split("@")[0]||"Crow Member", username=p.username||m.username||"member";
 const points=Number(m.points||0),level=Math.max(1,Math.floor(points/1000)+1);
 const verified=p.verification_status==="verified", roles=state.roles||[], skills=state.skills||[];
 const ownedProjects=state.projects.filter(x=>x.owner_id===state.user.id), ownedIdeas=state.ideas.filter(x=>x.owner_id===state.user.id);
 const badges=(state.earned||[]).map(e=>(state.achievements||[]).find(a=>a.id===e.achievement_id)).filter(Boolean);
 const divisionsActive=divisions.filter(d=>divisionAccess(d.key));
 $("#profilePage").innerHTML=`
 <div class="profile-hero" style="${p.banner_url?'background-image:linear-gradient(rgba(7,7,12,.35),rgba(7,7,12,.92)),url('${esc(p.banner_url)}')':''}">
   <div class="profile-avatar-wrap"><div class="profile-avatar">${p.avatar_url?'<img src="'+esc(p.avatar_url)+'" alt="">':initials(name)}</div></div>
   <div class="profile-head"><div class="eyebrow">CROW IDENTITY</div><h2>${esc(name)} ${verified?'<span class="verified">✓ '+esc(p.verified_display_label||"Verified")+'</span>':""}</h2><div class="handle">@${esc(username)} · Member since ${new Date(p.created_at||m.created_at||Date.now()).toLocaleDateString()}</div><p>${esc(p.bio||"Tell the CrowRules universe who you are.")}</p></div>
   <button class="primary" id="editProfileButton">✏️ Edit Profile</button>
 </div>
 <div class="identity-grid">
   <article class="identity-card"><div class="card-kicker">🪪 CROW PASSPORT</div><b>Level ${level}</b><span>${points.toLocaleString()} CrowPoints</span><small>${esc(state.plan?.name||m.membership_type||"Universal CrowRules")}</small></article>
   <article class="identity-card"><div class="card-kicker">🎬 CREATOR MODE</div><b>${pref.open_to_collaborate===false?"Taking a break":"Open to Collaborate"}</b><span>${esc(pref.availability||"Open to opportunities")}</span><small>${roles.length} roles · ${skills.length} skills</small></article>
   <article class="identity-card"><div class="card-kicker">🌌 MY UNIVERSE</div><b>${divisionsActive.length} Active Divisions</b><span>${divisionsActive.map(d=>d.icon+" "+d.name).join(" · ")||"CrowSpace"}</span><small>Division access is membership-controlled.</small></article>
 </div>
 <div class="profile-columns">
   <div>
    <article class="panel"><div class="profile-section-head"><h3>My Story</h3></div><p class="profile-copy">${esc(pref.story||"Add a short story about your creative journey.")}</p></article>
    <article class="panel"><div class="profile-section-head"><h3>Creator Identity</h3></div><div class="chips">${roles.length?roles.map(x=>'<span>'+esc(x)+'</span>').join(""):'<span>Choose your creator roles</span>'}</div><h4>Skills</h4><div class="chips">${skills.length?skills.map(x=>'<span>'+esc(x)+'</span>').join(""):'<span>Add the skills you can bring to a project</span>'}</div></article>
    <article class="panel"><div class="profile-section-head"><h3>Build With Me</h3><span>${pref.open_to_collaborate===false?"Not currently open":"Open"}</span></div><div class="looking-grid"><div><small>LOOKING FOR</small><p>${esc(pref.looking_for||"Collaborators, creators and new projects.")}</p></div><div><small>I CAN HELP WITH</small><p>${esc(pref.can_help_with||"Add what you can contribute.")}</p></div></div></article>
    <article class="panel"><div class="profile-section-head"><h3>My Projects</h3><span>${ownedProjects.length}</span></div>${ownedProjects.length?ownedProjects.map(x=>'<div class="profile-project"><b>'+esc(x.title)+'</b><small>'+esc(x.status||"building")+' · '+esc(x.category||"Creation")+'</small><p>'+esc(x.description||"")+'</p></div>').join(""):'<div class="empty">No projects yet. Start with Build With Me.</div>'}</article>
    <article class="panel"><div class="profile-section-head"><h3>My CrowIdeas</h3><span>${ownedIdeas.length}</span></div>${ownedIdeas.length?ownedIdeas.map(x=>'<div class="profile-project"><b>💡 '+esc(x.title)+'</b><small>'+esc(x.status||"submitted")+'</small><p>'+esc(x.description||"")+'</p></div>').join(""):'<div class="empty">No submitted ideas yet.</div>'}</article>
   </div>
   <aside>
    <article class="panel"><div class="profile-section-head"><h3>🏆 Achievements</h3><span>${badges.length}</span></div>${badges.length?badges.map(a=>'<div class="mini-row">'+esc(a.icon||"🎖️")+' '+esc(a.name)+'</div>').join(""):'<div class="empty">Your first badge is waiting.</div>'}</article>
    <article class="panel"><div class="profile-section-head"><h3>🌈 Spectrum</h3></div><div class="mini-row">Awards history will appear here as nominations and wins are recorded.</div></article>
    <article class="panel"><div class="profile-section-head"><h3>👥 The Crew</h3><span>${state.friends.filter(x=>x.status==="accepted").length}</span></div><div class="mini-row">Friends, collaborators and project teammates.</div></article>
    <article class="panel"><div class="profile-section-head"><h3>🔒 Privacy</h3></div><div class="mini-row">Profile: ${esc(p.profile_visibility||"public")} · Posts: ${p.show_posts?"visible":"hidden"} · Media: ${p.show_media?"visible":"hidden"}</div></article>
   </aside>
 </div>`;
 $("#editProfileButton").onclick=showProfileEditor;
}
function showProfileEditor(){
 const p=state.profile||{},pref=state.preferences||{}, privacy=state.privacy||{};
 $("#modal").classList.remove("hidden");
 $("#modalCard").innerHTML=`<h3>✏️ Edit Crow Identity</h3>
 <div class="form-row"><input id="profName" placeholder="Display name" value="${esc(p.display_name||state.member?.display_name||"")}"><input id="profUser" placeholder="Username" value="${esc(p.username||state.member?.username||"")}"></div>
 <textarea id="profBio" rows="3" placeholder="Short bio">${esc(p.bio||"")}</textarea>
 <textarea id="profStory" rows="4" placeholder="My story">${esc(pref.story||"")}</textarea>
 <div class="form-row"><input id="profRoles" placeholder="Creator roles, comma separated" value="${esc((state.roles||[]).join(", "))}"><input id="profSkills" placeholder="Skills, comma separated" value="${esc((state.skills||[]).join(", "))}"></div>
 <textarea id="profLooking" rows="2" placeholder="What are you looking for?">${esc(pref.looking_for||"")}</textarea>
 <textarea id="profHelp" rows="2" placeholder="What can you help with?">${esc(pref.can_help_with||"")}</textarea>
 <div class="form-row"><select id="profAvail"><option ${pref.availability==="Open to opportunities"?"selected":""}>Open to opportunities</option><option ${pref.availability==="Limited availability"?"selected":""}>Limited availability</option><option ${pref.availability==="Not available"?"selected":""}>Not available</option></select><select id="profDiv"><option value="">Favorite division</option>${divisions.map(d=>'<option value="'+d.key+'" '+(pref.favorite_division===d.key?"selected":"")+'>'+d.name+'</option>').join("")}</select></div>
 <div class="form-row"><input id="profAvatar" placeholder="Avatar image URL (optional)" value="${esc(p.avatar_url||"")}"><input id="profBanner" placeholder="Banner image URL (optional)" value="${esc(p.banner_url||"")}"></div>
 <div class="toolbar"><button class="primary" id="saveProfile">Save Profile</button><button id="cancelProfile">Cancel</button></div>`;
 $("#cancelProfile").onclick=()=>$("#modal").classList.add("hidden");
 $("#saveProfile").onclick=saveProfile;
}
async function saveProfile(){
 if(!state.user)return;
 const uid=state.user.id;
 const name=$("#profName").value.trim(),username=$("#profUser").value.trim();
 if(!name||!username)return toast("Display name and username are required.");
 const roles=[...new Set($("#profRoles").value.split(",").map(x=>x.trim()).filter(Boolean))].slice(0,12);
 const skills=[...new Set($("#profSkills").value.split(",").map(x=>x.trim()).filter(Boolean))].slice(0,30);
 const r1=await db.from("crowspace_profiles").upsert({user_id:uid,display_name:name,username,bio:$("#profBio").value.trim(),avatar_url:$("#profAvatar").value.trim()||null,banner_url:$("#profBanner").value.trim()||null},{onConflict:"user_id"});
 if(r1.error)return toast(r1.error.message);
 const r2=await db.from("crowspace_profile_preferences").upsert({user_id:uid,story:$("#profStory").value.trim(),looking_for:$("#profLooking").value.trim(),can_help_with:$("#profHelp").value.trim(),availability:$("#profAvail").value,open_to_collaborate:$("#profAvail").value!=="Not available",favorite_division:$("#profDiv").value||null},{onConflict:"user_id"});
 if(r2.error)return toast(r2.error.message);
 const del1=await db.from("crowspace_profile_roles").delete().eq("user_id",uid);if(del1.error)return toast(del1.error.message);
 if(roles.length){const rr=await db.from("crowspace_profile_roles").insert(roles.map(role=>({user_id:uid,role})));if(rr.error)return toast(rr.error.message);}
 const del2=await db.from("crowspace_profile_skills").delete().eq("user_id",uid);if(del2.error)return toast(del2.error.message);
 if(skills.length){const sr=await db.from("crowspace_profile_skills").insert(skills.map(skill=>({user_id:uid,skill})));if(sr.error)return toast(sr.error.message);}
 toast("Crow Identity updated.");
 $("#modal").classList.add("hidden");
 await loadContext();
}
function renderDashboard(){$("#dashboardData").innerHTML=[["🚀","My Projects",state.projects.filter(x=>x.owner_id===state.user.id).length,"Open Build With Me"],["💼","Open Opportunities",state.opportunities?.length||0,"Find collaborators"],["💡","My Ideas",state.ideas?.filter(x=>x.owner_id===state.user.id).length||0,"Track ideas"],["🎖️","Achievements",(state.earned||[]).length,"View badges"],["👥","Friends",state.friends.filter(x=>x.status==="accepted").length,"Grow your crew"],["🔔","Notifications",state.notifications.filter(x=>!x.is_read).length,"Review updates"]].map(x=>'<article><span>'+x[0]+"</span><h3>"+x[1]+"</h3><b>"+x[2]+"</b><small>"+x[3]+"</small></article>").join("")}
async function loadIdeas(){const r=await db.from("crowspace_ideas").select("id,owner_id,title,description,category,status,support_count,created_at").order("created_at",{ascending:false}).limit(30);if(!r.error)state.ideas=r.data||[];renderIdeas()}
function renderIdeas(){const list=state.ideas.length?state.ideas:[{title:"Build a CrowSpace creator collaboration hub",description:"Find the right people for media projects.",category:"Creation",status:"submitted",support_count:0}];$("#ideasList").innerHTML=list.map(i=>'<article class="idea-card"><div class="card-kicker">💡 '+esc(i.category||"Idea")+"</div><h3>"+esc(i.title)+"</h3><p>"+esc(i.description||"")+'</p><div class="card-meta"><span>'+esc(i.status)+'</span><b>❤️ '+Number(i.support_count||0)+"</b></div></article>").join("")}
async function loadOpportunities(){const r=await db.from("crowspace_opportunities").select("id,owner_id,title,description,category,division_key,role,status,created_at").eq("status","open").order("created_at",{ascending:false}).limit(40);if(!r.error)state.opportunities=r.data||[];renderOpportunities()}
function renderOpportunities(){const filter=$("#opportunityFilter")?.value||"";const list=(state.opportunities||[]).filter(o=>!filter||o.category===filter);$("#opportunityList").innerHTML=list.length?list.map(o=>'<article class="op-card"><div class="card-kicker">💼 '+esc(o.category||"Opportunity")+(o.division_key?" · "+esc(o.division_key):"")+"</div><h3>"+esc(o.title)+"</h3><p>"+esc(o.description||"")+"</p><div class="card-meta"><span>Role: "+esc(o.role||"Collaborator")+'</span><button data-apply="'+o.id+'">I can help</button></div></article>').join(""):'<div class="empty panel">No open opportunities match this filter.</div>';$$("[data-apply]").forEach(b=>b.onclick=()=>toast("Interest noted. A full application workflow can be connected next."))}
async function loadChallenges(){const r=await db.from("crowspace_challenges").select("id,title,description,category,points,starts_at,ends_at,status").order("created_at",{ascending:false}).limit(20);if(!r.error)state.challenges=r.data||[];renderChallenges()}
function renderChallenges(){const list=state.challenges.length?state.challenges:[{title:"First Flight",description:"Make your first CrowSpace post.",category:"Community",points:100,status:"open"}];$("#challengeList").innerHTML=list.map(c=>'<article class="challenge-card"><span>🔥</span><div><div class="card-kicker">'+esc(c.category||"Challenge")+"</div><h3>"+esc(c.title)+"</h3><p>"+esc(c.description||"")+'</p><b>+'+Number(c.points||0)+' CrowPoints</b></div><button data-challenge="'+(c.id||"demo")+'">Enter</button></article>').join("");$$("[data-challenge]").forEach(b=>b.onclick=()=>b.dataset.challenge==="demo"?toast("Challenge preview."):enterChallenge(b.dataset.challenge))}
async function enterChallenge(id){const r=await db.from("crowspace_challenge_entries").upsert({challenge_id:id,user_id:state.user.id,status:"submitted"},{onConflict:"challenge_id,user_id"});toast(r.error?r.error.message:"Challenge entry submitted.")}
function showPostComposer(){const p=$("#composerPanel");p.classList.remove("hidden");p.innerHTML='<h3>📝 New CrowSpace Post</h3><textarea id="postBody" rows="5" placeholder="What are you building?"></textarea><div class="toolbar"><button class="primary" id="publishPost">Publish</button><button id="cancelComposer">Cancel</button></div>';$("#cancelComposer").onclick=()=>p.classList.add("hidden");$("#publishPost").onclick=publishPost;p.scrollIntoView({behavior:"smooth",block:"center"})}
async function publishPost(){const body=$("#postBody").value.trim();if(!body)return toast("Write something first.");const r=await db.from("crowspace_posts").insert({author_id:state.user.id,body,visibility:"public",status:"published"});if(r.error)return toast(r.error.message);toast("Posted to CrowSpace.");$("#composerPanel").classList.add("hidden");await loadContext()}
function showIdeaForm(){const p=$("#modalCard");$("#modal").classList.remove("hidden");p.innerHTML='<h3>💡 Submit a CrowIdea</h3><input id="ideaTitle" placeholder="Idea title"><textarea id="ideaDescription" rows="5" placeholder="What should CrowRules build?"></textarea><input id="ideaCategory" placeholder="Category — film, podcast, sports, community…"><div class="toolbar"><button class="primary" id="saveIdea">Submit Idea</button><button id="cancelComposer">Cancel</button></div>';$("#cancelComposer").onclick=()=>$("#modal").classList.add("hidden");$("#saveIdea").onclick=async()=>{const title=$("#ideaTitle").value.trim();if(!title)return toast("Add an idea title.");const r=await db.from("crowspace_ideas").insert({owner_id:state.user.id,title,description:$("#ideaDescription").value.trim(),category:$("#ideaCategory").value.trim()||"Creation"});toast(r.error?r.error.message:"Idea submitted.");if(!r.error){$("#modal").classList.add("hidden");loadIdeas()}};go("build")}
function showOpportunityForm(){const p=$("#modalCard");$("#modal").classList.remove("hidden");p.innerHTML='<h3>💼 Post an Opportunity</h3><input id="oppTitle" placeholder="What do you need help with?"><textarea id="oppDescription" rows="4" placeholder="Describe the opportunity."></textarea><div class="form-row"><input id="oppCategory" placeholder="Category"><input id="oppRole" placeholder="Role"></div><input id="oppDivision" placeholder="Division key (optional)"><div class="toolbar"><button class="primary" id="saveOpp">Post</button><button id="cancelComposer">Cancel</button></div>';$("#cancelComposer").onclick=()=>$("#modal").classList.add("hidden");$("#saveOpp").onclick=async()=>{const title=$("#oppTitle").value.trim();if(!title)return toast("Add a title.");const r=await db.from("crowspace_opportunities").insert({owner_id:state.user.id,title,description:$("#oppDescription").value.trim(),category:$("#oppCategory").value.trim()||"Collaboration",role:$("#oppRole").value.trim()||"Collaborator",division_key:$("#oppDivision").value.trim()||null});toast(r.error?r.error.message:"Opportunity posted.");if(!r.error){$("#modal").classList.add("hidden");loadOpportunities()}};go("opportunities")}
function showEventComposer(){toast("Event builder is ready. Event rows and RSVP storage are already connected.")}
async function sendMessage(){const v=$("#messageInput").value.trim();if(!v)return;toast("Choose a CrowRoom member to send a direct message.")}
async function searchAll(q){const [p,g,pr]=await Promise.all([db.from("crowspace_profiles").select("user_id,username,display_name,bio").or("display_name.ilike.%"+q+"%,username.ilike.%"+q+"%").limit(10),db.from("crowspace_groups").select("id,name,description").ilike("name","%"+q+"%").limit(10),db.from("crowspace_projects").select("id,title,description").ilike("title","%"+q+"%").limit(10)]);$("#discoverGrid").innerHTML=[...(p.data||[]).map(x=>'<article><span>👤</span><h3>'+esc(x.display_name||x.username)+'</h3><p>'+esc(x.bio||"CrowSpace member")+"</p></article>"),...(g.data||[]).map(x=>'<article><span>👥</span><h3>'+esc(x.name)+'</h3><p>'+esc(x.description||"Group")+"</p></article>"),...(pr.data||[]).map(x=>'<article><span>🚀</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.description||"Project")+"</p></article>")].join("")||'<div class="empty panel">No matches found.</div>';go("discover")}
function setupRealtime(){if(window.__channel)return;window.__channel=db.channel("crowspace-live").on("postgres_changes",{event:"*",schema:"public",table:"crowspace_posts"},()=>loadContext()).on("postgres_changes",{event:"*",schema:"public",table:"crowspace_notifications",filter:"user_id=eq."+state.user.id},()=>loadContext()).subscribe()}
window.addEventListener("hashchange",()=>{const h=location.hash.slice(1);if(h)go(h)});
setupNav();loadContext();
/* CROWRULES SOCIAL UNIVERSE — CrowSpace 2.0 */
async function loadSocialMode(mode="for-you"){
  const feed=$("#feed"), highlights=$("#socialHighlights"); if(!feed)return;
  highlights.innerHTML='<article><span>🌌</span><b>Dreamscapes</b><small>Bring an idea to life.</small><button data-go="build">Build</button></article><article><span>🎙️</span><b>Podcasting</b><small>Find shows and creators.</small><button data-go="discover">Explore</button></article><article><span>🕯️</span><b>Memorials</b><small>Remember. Honor. Celebrate.</small><button data-go="discover">Explore</button></article><article><span>📺</span><b>CrowRules TV</b><small>Watch, talk and connect.</small><button data-go="events">Watch</button></article>';
  highlights.querySelectorAll("[data-go]").forEach(x=>x.onclick=()=>go(x.dataset.go));
  if(mode==="reels"){
    const r=await db.from("crowspace_reels").select("id,user_id,title,description,video_url,thumbnail_url,views_count,created_at").eq("visibility","public").order("created_at",{ascending:false}).limit(12);
    feed.innerHTML=(r.data||[]).map(x=>'<article class="social-card reel-card"><div class="media">'+(x.video_url?'<video controls playsinline src="'+esc(x.video_url)+'"></video>':'<div class="media-placeholder">🎞️ REEL</div>')+'</div><h3>'+esc(x.title||"Crow Reel")+'</h3><p>'+esc(x.description||"")+'</p><div class="social-meta">▶ '+Number(x.views_count||0).toLocaleString()+' views · '+timeAgo(x.created_at)+'</div></article>').join("")||'<div class="empty panel">No public Reels yet.</div>';
    return;
  }
  if(mode==="photos"){
    const r=await db.from("crowspace_media").select("id,user_id,title,description,media_url,thumbnail_url,media_type,created_at").eq("visibility","public").eq("media_type","photo").order("created_at",{ascending:false}).limit(12);
    feed.innerHTML=(r.data||[]).map(x=>'<article class="social-card photo-card">'+(x.media_url?'<img loading="lazy" src="'+esc(x.media_url)+'" alt="'+esc(x.title||"CrowSpace photo")+'">':'<div class="media-placeholder">📸 PHOTO</div>')+'<h3>'+esc(x.title||"CrowSpace Photo")+'</h3><p>'+esc(x.description||"")+'</p></article>').join("")||'<div class="empty panel">No public photos yet.</div>';
    return;
  }
  if(mode==="crows"){
    const r=await db.from("crowspace_statuses").select("user_id,status_text,mood,music_text,location_text,updated_at").order("updated_at",{ascending:false}).limit(20);
    feed.innerHTML=(r.data||[]).map(x=>'<article class="crow-status"><div class="avatar">🐦</div><div><b>@Crow</b><p>'+esc(x.status_text||"")+'</p><small>'+esc(x.mood||"")+(x.music_text?" · 🎵 "+esc(x.music_text):"")+(x.location_text?" · 📍 "+esc(x.location_text):"")+' · '+timeAgo(x.updated_at)+'</small></div></article>').join("")||'<div class="empty panel">No Crows posted yet.</div>';
    return;
  }
  let q=db.from("crowspace_posts").select("id,author_id,body,media_url,media_type,created_at,like_count,comment_count,group_id").eq("status","published").order("created_at",{ascending:false}).limit(30);
  if(mode==="following"){
    const ids=(state.follows||[]).filter(x=>x.follower_id===state.user?.id).map(x=>x.following_id);
    if(ids.length)q=q.in("author_id",ids); else {feed.innerHTML='<div class="empty panel">Follow creators to build your Following feed.</div>';return;}
  }
  const r=await q; const rows=r.data||[];
  feed.innerHTML=rows.map(p=>'<article class="post social-post" data-post="'+p.id+'"><div class="post-head"><div class="avatar">🐦</div><div><b>Crow Member</b><span class="verified">✓ CrowSpace</span><small>'+timeAgo(p.created_at)+'</small></div></div><p>'+esc(p.body||"")+'</p>'+(p.media_url?'<div class="media"><video controls playsinline src="'+esc(p.media_url)+'"></video></div>':"")+'<div class="post-actions"><button data-like="'+p.id+'">❤️ '+Number(p.like_count||0)+'</button><button data-comment="'+p.id+'">💬 '+Number(p.comment_count||0)+'</button><button data-share="'+p.id+'">↗ Share</button></div></article>').join("")||'<div class="empty panel">Your CrowSpace feed is ready for the next story.</div>';
  feed.querySelectorAll("[data-like]").forEach(b=>b.onclick=async()=>{const r=await db.rpc("crowspace_toggle_like",{target_post_id:b.dataset.like});toast(r.error?r.error.message:"Like updated.");if(!r.error)loadSocialMode(mode)});
  feed.querySelectorAll("[data-comment]").forEach(b=>b.onclick=()=>showCommentComposer(b.dataset.comment));
  feed.querySelectorAll("[data-share]").forEach(b=>b.onclick=()=>navigator.clipboard?.writeText(location.href+"#post-"+b.dataset.share).then(()=>toast("Post link copied.")));
}
async function showCommentComposer(postId){
  $("#modal").classList.remove("hidden");$("#modalCard").innerHTML='<h3>💬 Join the conversation</h3><textarea id="commentBody" rows="4" placeholder="Write a thoughtful reply…"></textarea><div class="toolbar"><button class="primary" id="sendComment">Reply</button><button id="cancelComment">Cancel</button></div>';
  $("#cancelComment").onclick=()=>$("#modal").classList.add("hidden");
  $("#sendComment").onclick=async()=>{const content=$("#commentBody").value.trim();if(!content)return toast("Write a reply first.");const r=await db.from("crowspace_comments").insert({post_id:postId,author_id:state.user.id,content});toast(r.error?r.error.message:"Reply posted.");if(!r.error)$("#modal").classList.add("hidden");};
}
function bindSocialTabs(){
  $$("#feedTabs [data-feed-mode]").forEach(b=>b.onclick=()=>{$$("#feedTabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");loadSocialMode(b.dataset.feedMode)});
  const df=$("#discoverFilter"); if(df&&!df.dataset.bound){df.dataset.bound="1";df.oninput=()=>{const q=df.value.toLowerCase();$$("#discoverGrid article").forEach(x=>x.style.display=x.textContent.toLowerCase().includes(q)?"":"none")};}
}
async function enhanceCrowSpace(){
  bindSocialTabs();
  await loadSocialMode("for-you");
  const tabButtons=$$(".discover-tabs button");
  tabButtons.forEach(b=>b.onclick=()=>{tabButtons.forEach(x=>x.classList.remove("active"));b.classList.add("active");const label=b.textContent.trim();const map={Creators:"profile",Groups:"groups",Projects:"build",Divisions:"discover",Videos:"discover",Photos:"discover"};if(map[label]&&label!=="discover")go(map[label]);else toast(label+" discovery is active.");});
}
setTimeout(enhanceCrowSpace,900);
