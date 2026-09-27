const CS=window.CS||{};CS.client=window.crowSupabase||null;
CS.escape=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
CS.user=async()=>{if(!CS.client)return null;try{const {data,error}=await CS.client.auth.getUser();return error?null:data?.user||null}catch{return null}};
CS.profile=async id=>{if(!CS.client||!id)return null;try{const {data,error}=await CS.client.rpc("crowspace_profile_public",{target:id});if(error)return null;return Array.isArray(data)?data[0]||null:data||null}catch{return null}};
CS.ensureProfile=async user=>{if(!user||!CS.client)return null;const meta=user.user_metadata||{},email=user.email||"",base=(email.split("@")[0]||"crowmember").toLowerCase().replace(/[^a-z0-9_]+/g,"").slice(0,30)||"crowmember";const {data:existing}=await CS.client.from("membership_profiles").select("id,display_name,username,bio,avatar_url").eq("id",user.id).maybeSingle();if(existing)return existing;const display_name=meta.display_name||meta.full_name||meta.name||email.split("@")[0]||"CrowSpace Member",avatar_url=meta.avatar_url||meta.picture||"";let username=(meta.username||base).toLowerCase().replace(/[^a-z0-9_]+/g,"").slice(0,30)||"crowmember";let {data,error}=await CS.client.from("membership_profiles").insert({id:user.id,display_name,username,bio:"",avatar_url,updated_at:new Date().toISOString()}).select().maybeSingle();if(error?.code==="23505"){username=(username.slice(0,23)||"crowmember")+"_"+user.id.replace(/-/g,"").slice(0,6);const retry=await CS.client.from("membership_profiles").insert({id:user.id,display_name,username,bio:"",avatar_url,updated_at:new Date().toISOString()}).select().maybeSingle();data=retry.data;error=retry.error}if(error){console.warn("CrowSpace profile:",error.message);return null}return data||null};
CS.navItems=[
 {label:"Home",href:"index.html",group:"core"},
 {label:"My Nest",href:"profile.html",group:"core"},
 {label:"People",href:"people.html",group:"connect"},
 {label:"Friends",href:"friends.html",group:"connect"},
 {label:"Caws",href:"caws.html",group:"create"},
 {label:"Photos",href:"albums.html",group:"create"},
 {label:"Groups",href:"groups.html",group:"connect"},
 {label:"Events",href:"events.html",group:"connect"},
 {label:"Dreamscapes",href:"dreamscapes.html",group:"universe"},
 {label:"Memorials",href:"memorials.html",group:"universe"},
 {label:"Command Center",href:"command-center.html",group:"universe"},
 {label:"Notifications",href:"notifications.html",group:"account"},
 {label:"Membership",href:"membership.html",group:"account"},
 {label:"Create Caw",href:"create-caw.html",group:"quick"},
 {label:"Create Album",href:"create-album.html",group:"quick"},
 {label:"Create Group",href:"create-group.html",group:"quick"},
 {label:"Create Event",href:"create-event.html",group:"quick"},
 {label:"Customize Nest",href:"customize.html",group:"quick"}
];
CS.installGlobalSearch=()=>{
 if(document.getElementById("crowGlobalSearch"))return;
 const header=document.querySelector(".site-header"); if(!header)return;
 const box=document.createElement("div"); box.id="crowGlobalSearch"; box.className="crow-global-search";
 box.innerHTML='<button type="button" class="crow-search-button" aria-label="Search CrowSpace">⌕</button><input id="crowSearchInput" type="search" autocomplete="off" placeholder="Search CrowSpace…"><div id="crowSearchResults" class="crow-search-results" hidden></div>';
 const nav=header.querySelector("nav"); if(nav)header.insertBefore(box,nav); else header.appendChild(box);
 const input=box.querySelector("#crowSearchInput"),results=box.querySelector("#crowSearchResults");
 const render=async()=>{
   const q=input.value.trim();
   if(q.length<2){results.hidden=true;results.innerHTML="";return}
   const {data,error}=await CS.client.rpc("crowspace_global_search",{search_text:q,result_limit:8,result_type_filter:null});
   if(error){results.innerHTML='<div class="crow-search-empty">Search unavailable.</div>';results.hidden=false;return}
   const rows=data||[];
   results.innerHTML=rows.map(r=>'<a class="crow-search-item" href="'+CS.escape(r.target_url||"#")+'"><strong>'+CS.escape(r.title||"Untitled")+'</strong><small>'+CS.escape((r.result_type||"result").toUpperCase())+' · '+CS.escape(r.subtitle||"")+'</small></a>').join("")+
     '<a class="crow-search-item crow-search-all" href="command-center.html?q='+encodeURIComponent(q)+'"><strong>Open Universal Command Center →</strong><small>View all People, Posts, Caws, Groups, Events, Dreamscapes and Memorials</small></a>';
   if(!rows.length)results.innerHTML='<div class="crow-search-empty">No quick matches.</div>'+results.innerHTML;
   results.hidden=false;
 };
 input.addEventListener("keydown",e=>{if(e.key==="Enter"&&input.value.trim().length>=2){e.preventDefault();location.href="command-center.html?q="+encodeURIComponent(input.value.trim())}});
 input.addEventListener("input",()=>{clearTimeout(box._timer);box._timer=setTimeout(render,180)});
 box.querySelector(".crow-search-button").addEventListener("click",()=>{if(input.value.trim().length>=2)location.href="command-center.html?q="+encodeURIComponent(input.value.trim());else input.focus()});
 document.addEventListener("click",e=>{if(!box.contains(e.target))results.hidden=true});
};
CS.injectGlobalNavStyles=()=>{if(document.getElementById("crow-global-nav-styles"))return;const s=document.createElement("style");s.id="crow-global-nav-styles";s.textContent=`
.site-header{gap:10px;position:relative;z-index:100}
.site-header>nav{display:flex!important;align-items:center;justify-content:flex-end;gap:8px;min-width:0;flex:0 0 auto}
.crow-nav-menu{position:relative}
.crow-nav-menu summary{list-style:none;display:flex;align-items:center;gap:8px;cursor:pointer;padding:9px 13px;border:1px solid var(--line,#ddd);border-radius:9px;background:#fff;color:var(--text,#222);font-weight:800;font-size:13px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.05)}
.crow-nav-menu summary::-webkit-details-marker{display:none}
.crow-nav-menu[open] summary,.crow-nav-menu summary:hover{background:var(--blue2,#eef5ff);color:var(--blue,#1877f2);border-color:#c8dcfa}
.crow-nav-chevron{font-size:11px;transition:transform .18s ease}
.crow-nav-menu[open] .crow-nav-chevron{transform:rotate(180deg)}
.crow-nav-panel{position:absolute;right:0;top:calc(100% + 8px);width:min(760px,calc(100vw - 24px));padding:12px;background:#fff;border:1px solid var(--line,#ddd);border-radius:14px;box-shadow:0 18px 45px rgba(0,0,0,.18);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;z-index:200}
.crow-nav-section{min-width:0}
.crow-nav-section h4{margin:0 0 6px;padding:0 6px;color:var(--muted,#6b7280);font-size:10px;text-transform:uppercase;letter-spacing:1px}
.crow-nav-section a{display:flex!important;align-items:center;justify-content:space-between;width:100%;box-sizing:border-box;padding:9px 10px;border-radius:8px;color:var(--text,#222);font-size:13px;font-weight:700;text-decoration:none}
.crow-nav-section a:hover,.crow-nav-section a.active{background:var(--blue2,#eef5ff);color:var(--blue,#1877f2)}
.crow-nav-section a.active:after{content:"•";font-size:16px}
.crow-nav-divider{height:1px;background:var(--line,#eee);margin:5px 0}
.crow-nav-mobile-toggle{display:none}
@media(max-width:900px){
 .crow-nav-panel{grid-template-columns:repeat(2,minmax(0,1fr));width:min(560px,calc(100vw - 24px))}
}
@media(max-width:800px){
 .site-header{flex-wrap:wrap}
 .site-header>nav{order:5;display:flex!important;flex:1 1 100%;justify-content:flex-end}
 .crow-nav-menu{width:auto}
 .crow-nav-panel{position:fixed;right:12px;top:70px;max-height:calc(100vh - 88px);overflow:auto;grid-template-columns:1fr;width:min(420px,calc(100vw - 24px))}
 .nav-toggle{display:none!important}
}
@media(max-width:480px){
 .crow-nav-panel{left:12px;right:12px;width:auto}
 .crow-nav-menu summary{padding:8px 11px}
}`;document.head.appendChild(s)};
CS.refreshHeader=async()=>{
 const currentUser=await CS.user();
 if(currentUser)await CS.ensureProfile(currentUser);
 const header=document.querySelector(".site-header");
 if(header){
   CS.injectGlobalNavStyles();
   let nav=header.querySelector("nav"); if(!nav){nav=document.createElement("nav");header.appendChild(nav)}
   const path=location.pathname.split("/").pop()||"index.html";
   const groups=[
     ["Start",CS.navItems.filter(x=>x.group==="core")],
     ["Connect",CS.navItems.filter(x=>x.group==="connect")],
     ["Create",CS.navItems.filter(x=>x.group==="create")],
     ["CrowRules",CS.navItems.filter(x=>x.group==="universe")],
     ["Account",CS.navItems.filter(x=>x.group==="account")],
     ["Quick Create",CS.navItems.filter(x=>x.group==="quick")]
   ];
   const link=x=>'<a href="'+x.href+'"'+(x.href===path?' class="active" aria-current="page"':"")+'>'+CS.escape(x.label)+'</a>';
   const sections=groups.filter(g=>g[1].length).map(g=>'<section class="crow-nav-section"><h4>'+CS.escape(g[0])+'</h4>'+g[1].map(link).join("")+'</section>').join("");
   nav.innerHTML='<details class="crow-nav-menu"><summary aria-label="Open CrowSpace navigation"><span>☰ Menu</span><span class="crow-nav-chevron">▼</span></summary><div class="crow-nav-panel">'+sections+'</div></details>';
   const menu=nav.querySelector(".crow-nav-menu");
   document.addEventListener("click",e=>{if(menu&&!menu.contains(e.target))menu.removeAttribute("open")},{once:false});
   nav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>menu.removeAttribute("open")));
   CS.installGlobalSearch();
 }
 const el=document.getElementById("account"); if(!el)return;
 if(currentUser){const p=await CS.profile(currentUser.id);el.innerHTML='<a href="profile.html">'+CS.escape(p?.display_name||currentUser.email)+'</a> · <a href="notifications.html" id="notificationLink">🔔 <span id="notificationBadge"></span></a> · <span id="membershipBadge"></span> · <button class="linkbtn" id="logoutBtn">Sign Out</button>';CS.startNotificationBadge();document.getElementById("logoutBtn").onclick=async()=>{await CS.client.auth.signOut();location.href="index.html"}}else el.innerHTML='<a href="login.html">Sign In</a>';
};
CS.renderUniverseBar=async()=>{let bar=document.getElementById("crowUniverseBar");if(!bar){bar=document.createElement("div");bar.id="crowUniverseBar";bar.className="crow-universe-bar";const header=document.querySelector(".site-header");if(header)header.insertAdjacentElement("afterend",bar)}if(!bar)return;const u=await CS.user();if(!u){bar.innerHTML='<div><strong>ONE ACCOUNT. ONE UNIVERSE.</strong><span>Connect your CrowRules identity across CrowSpace.</span></div><a class="btn primary" href="signup.html">Join CrowRules →</a>';return}const m=await CS.membership();const name=CS.escape((await CS.profile(u.id))?.display_name||u.email||"CrowRules Member");const plan=CS.escape(m?.plan?.name||"CROW · Free");bar.innerHTML='<div><strong>◉ '+name+'</strong><span>Universal CrowRules Membership · '+plan+'</span></div><div class="crow-universe-links"><a href="profile.html">My Nest</a><a href="membership.html">Membership</a><a href="people.html">People</a><a href="groups.html">Groups</a><a href="events.html">Events</a></div>'};
CS.heartbeat=async()=>{const u=await CS.user();if(!u)return;try{await CS.client.from("crowspace_presence").upsert({user_id:u.id,last_seen_at:new Date().toISOString()},{onConflict:"user_id"})}catch(e){console.warn("CrowSpace presence:",e.message)}};
CS.renderUniversalStats=async()=>{let el=document.getElementById("universalStats");const main=document.querySelector("body>main");if(!el&&main&&!main.classList.contains("auth")&&!location.pathname.endsWith("profile.html")){const section=document.createElement("section");section.id="universalStats";section.className="section universal-account-panel";section.innerHTML="<div class=\"section-head\"><div><p class=\"eyebrow\">UNIVERSAL ACCOUNT</p><h2>CrowRules Membership</h2></div><a href=\"membership.html\">Open Membership →</a></div>";main.insertBefore(section,main.firstElementChild);el=section}if(!el)return;const u=await CS.user();if(!u){el.innerHTML='<div class="card"><strong>Universal CrowRules Account</strong><p class="muted">Sign in to connect your CrowSpace identity, membership and activity.</p><a class="btn primary" href="login.html">Sign In →</a></div>';return}const m=await CS.membership();let points=0,watch=0;try{const {data:p}=await CS.client.from("membership_profiles").select("points,watch_hours").eq("id",u.id).maybeSingle();points=Number(p?.points||0);watch=Number(p?.watch_hours||0)}catch{}const renewal=m?.subscription?.current_period_end?new Date(m.subscription.current_period_end).toLocaleDateString():"—";const stats=[["Membership",m?.plan?.name||"CROW · Free"],["CrowPoints",points.toLocaleString()],["Watch Hours",watch.toFixed(1)],["Status",m?.status||"free"],["Renewal",renewal],["Multiplier",(Number(m?.plan?.crowpoints_multiplier||1))+"×"]];el.innerHTML='<div class="universal-stat-grid">'+stats.map(x=>'<div class="universal-stat"><small>'+CS.escape(x[0])+'</small><strong>'+CS.escape(String(x[1]))+'</strong></div>').join("")+'</div>'};
CS.homeFeed=async()=>{
 const box=document.getElementById("feed"); if(!box)return;
 const u=await CS.user();
 if(!u){box.innerHTML='<div class="card"><h3>Your Nest starts here.</h3><p>Sign in to build a personalized CrowSpace feed.</p><a class="btn primary" href="login.html">Sign In</a></div>';return}
 const {data,error}=await CS.client.rpc("crowspace_home_activity",{p_limit:40});
 if(error){box.innerHTML='<div class="card"><h3>Feed unavailable</h3><p>'+CS.escape(error.message)+'</p></div>';return}
 const items=data||[];
 box.innerHTML=items.map(x=>{
   const label=x.activity_type==="post"?"POST":x.activity_type==="caw"?"CAW":"EVENT";
   const link=x.activity_type==="post"?"profile.html?id="+encodeURIComponent(x.actor_id):x.target_url;
   const media=x.media_url&&x.activity_type==="caw"?'<video controls playsinline preload="metadata" src="'+CS.escape(x.media_url)+'"></video>':"";
   const actions=x.activity_type==="post"?'<div class="post-actions"><button class="btn feed-like" data-post="'+CS.escape(x.target_id)+'">♡ Like</button><button class="btn feed-comment" data-post="'+CS.escape(x.target_id)+'">💬 Comment</button></div>':"";
   return '<article class="post card"><div class="post-head"><a class="avatar sm" href="profile.html?id='+encodeURIComponent(x.actor_id)+'">'+CS.escape((x.actor_name||"C").slice(0,1).toUpperCase())+'</a><div><strong>'+CS.escape(x.actor_name||"CrowSpace Member")+'</strong><small>@'+CS.escape(x.actor_username||"member")+' · '+new Date(x.created_at).toLocaleString()+'</small></div></div><span class="event-tag">'+label+'</span><h3>'+CS.escape(x.title||"")+'</h3><p>'+CS.escape(x.body||"")+'</p>'+media+'<a class="btn" href="'+CS.escape(link||"#")+'">Open →</a>'+actions+'</article>';
 }).join("")||'<div class="card"><h3>Your feed is quiet.</h3><p>Find people, follow creators, join groups and come back as your CrowSpace grows.</p><a class="btn primary" href="people.html">Find People →</a></div>';
 box.querySelectorAll(".feed-like").forEach(b=>b.addEventListener("click",()=>CS.react(b.dataset.post)));
 box.querySelectorAll(".feed-comment").forEach(b=>b.addEventListener("click",()=>CS.commentPrompt(b.dataset.post)));
};
CS.feed=CS.homeFeed;
CS.react=async postId=>{const u=await CS.user();if(!u){location.href="login.html";return}await CS.client.from("crowspace_reactions").upsert({post_id:postId,user_id:u.id,reaction:"like"});};
CS.commentPrompt=async postId=>{const u=await CS.user();if(!u){location.href="login.html";return}const body=prompt("Comment");if(body)await CS.client.from("crowspace_comments").insert({post_id:postId,user_id:u.id,body});};
CS.follow=async target=>{const u=await CS.user();if(!u){location.href="login.html";return}if(u.id===target)return;const {data}=await CS.client.from("crowspace_follows").select("*").eq("follower_id",u.id).eq("followed_user_id",target).maybeSingle();if(data)await CS.client.from("crowspace_follows").delete().eq("follower_id",u.id).eq("followed_user_id",target);else{await CS.client.from("crowspace_follows").insert({follower_id:u.id,followed_user_id:target});}};

CS.socialGraph=async(limit=250)=>{const u=await CS.user();if(!u)return [];const {data,error}=await CS.client.rpc("crowspace_social_graph",{p_limit:limit});if(error){console.warn("CrowSpace social graph:",error.message);return []}return data||[]};
CS.socialGraphMap=async(limit=250)=>Object.fromEntries((await CS.socialGraph(limit)).map(p=>[p.id,p]));
CS.socialPersonMeta=p=>{if(!p)return "";const online=p.is_online?'<span class="online-dot">● Online</span>':'<span class="muted">Offline</span>';const rel=p.relationship==="friend"?"Friends":p.relationship==="incoming"?"Friend request":p.relationship==="outgoing"?"Request sent":"Not connected";return '<div class="social-meta">'+online+' · '+CS.escape(rel)+' · '+Number(p.mutual_friends_count||0)+' mutual · '+Number(p.friend_count||0)+' friends</div>'};
CS.personCard=(p,extra="")=>'<article class="card social-card"><a class="avatar sm" href="profile.html?id='+encodeURIComponent(p.id)+'">'+CS.escape((p.display_name||p.username||"C").slice(0,1).toUpperCase())+'</a><h3><a href="profile.html?id='+encodeURIComponent(p.id)+'">'+CS.escape(p.display_name||"CrowSpace Member")+'</a></h3><p class="muted">@'+CS.escape(p.username||"member")+'</p>'+CS.socialPersonMeta(p)+extra+'</article>';
CS.friendAction=async target=>{const u=await CS.user();if(!u){location.href="login.html";return}const p=(await CS.socialGraph()).find(x=>x.id===target);if(!p)return;if(p.relationship==="friend")return;if(p.relationship==="incoming"){const {error}=await CS.client.from("crowspace_friendships").update({status:"accepted"}).eq("requester_id",target).eq("addressee_id",u.id);if(error)alert(error.message);return}if(p.relationship==="outgoing")return;const {error}=await CS.client.rpc("crowspace_send_friend_request",{target_user_id:target});if(error)alert(error.message)};
CS.followAction=async target=>{const u=await CS.user();if(!u){location.href="login.html";return}const {data,error}=await CS.client.from("crowspace_follows").select("follower_id").eq("follower_id",u.id).eq("followed_user_id",target).maybeSingle();if(error){alert(error.message);return}const r=data?await CS.client.from("crowspace_follows").delete().eq("follower_id",u.id).eq("followed_user_id",target):await CS.client.from("crowspace_follows").insert({follower_id:u.id,followed_user_id:target});if(r.error)alert(r.error.message)};
CS.activityLinks=p=>'<div class="activity-links"><a href="profile.html?id='+encodeURIComponent(p.id)+'">Nest</a><a href="caws.html?user='+encodeURIComponent(p.id)+'">'+Number(p.caw_count||0)+' Caws</a><a href="albums.html?user='+encodeURIComponent(p.id)+'">'+Number(p.photo_count||0)+' Photos</a><a href="events.html?user='+encodeURIComponent(p.id)+'">'+Number(p.event_count||0)+' Events</a><span>'+Number(p.post_count||0)+' Posts</span><span>'+Number(p.group_count||0)+' Groups</span></div>';
CS.discovery=async()=>{const el=document.getElementById("discover");if(!el)return;const u=await CS.user();if(!u){el.innerHTML="";return}const {data,error}=await CS.client.rpc("crowspace_mutual_candidates",{p_limit:6});if(error){el.innerHTML="";return}el.innerHTML=(data||[]).map(p=>CS.personCard(p,'<a class="btn" href="profile.html?id='+encodeURIComponent(p.id)+'">Visit Nest →</a>')).join("")||'<p class="muted">No new people to discover yet.</p>'};
CS.unfriend=async target=>{const u=await CS.user();if(!u)return;const {data,error}=await CS.client.from("crowspace_friendships").select("id").or("and(requester_id.eq."+u.id+",addressee_id.eq."+target+"),and(requester_id.eq."+target+",addressee_id.eq."+u.id+")").eq("status","accepted").maybeSingle();if(error){alert(error.message);return}if(!data)return;const {error:e}=await CS.client.from("crowspace_friendships").delete().eq("id",data.id);if(e)alert(e.message);else location.reload()};
CS.refreshNotificationBadge=async()=>{const user=await CS.user();const b=document.getElementById("notificationBadge");if(!b||!user)return;const {count}=await CS.client.from("crowspace_notifications").select("id",{count:"exact",head:true}).eq("user_id",user.id).is("read_at",null);b.textContent=count?String(count):"";};
CS.startNotificationBadge=()=>{CS.refreshNotificationBadge();if(!CS._badgeTimer)CS._badgeTimer=setInterval(CS.refreshNotificationBadge,30000)};
CS.membership=async()=>{const u=await CS.user();if(!u)return null;const {data:subs,error}=await CS.client.from("membership_subscriptions").select("id,plan_id,status,current_period_end,cancel_at_period_end,created_at").eq("user_id",u.id).in("status",["active","trialing","past_due"]).order("created_at",{ascending:false}).limit(1);if(error||!subs?.length)return {plan:null,status:"free",subscription:null};const s=subs[0];const {data:plan}=await CS.client.from("membership_plans").select("id,plan_key,name,price_cents,billing_interval,description,features,crowpoints_multiplier").eq("id",s.plan_id).maybeSingle();return {plan:plan||null,status:s.status,subscription:s}};
CS.renderMembershipBadge=async()=>{const el=document.getElementById("membershipBadge");if(!el)return;const m=await CS.membership();el.innerHTML=!m?"<a href=\"membership.html\">Membership</a>":!m.plan?'<a href="membership.html">CROW · Free</a>':'<a href="membership.html">'+CS.escape(m.plan.name||"Membership")+"</a>"};
CS.renderMembershipHome=async()=>{const el=document.getElementById("membershipHome");if(!el)return;const u=await CS.user();if(!u){el.innerHTML='<strong>Universal CrowRules Membership</strong><p class="muted">Create one account to connect your CrowRules identity across the universe.</p><a class="btn primary" href="signup.html">Create Universal Account →</a>';return}const m=await CS.membership();if(!m?.plan){el.innerHTML='<strong>CROW · Free</strong><p class="muted">Your universal CrowRules account is active. Explore membership options when you are ready.</p><a class="btn primary" href="membership.html">View Membership Plans →</a>';return}el.innerHTML='<strong>'+CS.escape(m.plan.name||"Membership")+'</strong><p class="muted">'+CS.escape(m.status)+' · '+CS.escape(String(m.plan.crowpoints_multiplier||1))+'× CrowPoints</p><a class="btn" href="membership.html">Open Membership Center →</a>'};
CS.init=async()=>{if(CS._initialized)return;CS._initialized=true;try{await CS.refreshHeader();await CS.renderMembershipBadge();await CS.renderMembershipHome();await CS.renderUniverseBar();await CS.heartbeat();await CS.renderUniversalStats();if(CS.client&&!CS._authSubscription){CS._authSubscription=CS.client.auth.onAuthStateChange((event,session)=>{setTimeout(async()=>{try{await CS.refreshHeader();await CS.renderMembershipBadge();await CS.renderMembershipHome();await CS.renderUniverseBar();await CS.renderUniversalStats()}catch(e){console.warn("CrowSpace auth refresh:",e.message)}},0)})}}catch(e){console.warn("CrowSpace initialization:",e.message)}};
window.CS=CS;
document.addEventListener("DOMContentLoaded",()=>CS.init());
