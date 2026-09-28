const CS=window.CS||{};CS.client=window.crowSupabase||null;
(function(){if(window.__CROWPOINTS_WATCHER__)return;window.__CROWPOINTS_WATCHER__=true;
CS.rewardToast=function(points,reason){points=Number(points||0);if(!points)return;let t=document.getElementById("crowpoints-toast");if(!t){t=document.createElement("div");t.id="crowpoints-toast";t.style.cssText="position:fixed;right:18px;bottom:18px;z-index:99999;max-width:320px;padding:14px 18px;border:1px solid #59e7ff55;border-radius:14px;background:linear-gradient(135deg,#081626ee,#251039ee);box-shadow:0 18px 50px #0009;color:#fff;font:700 12px/1.5 Montserrat,Arial,sans-serif;backdrop-filter:blur(12px)";document.body.appendChild(t)}t.innerHTML='<strong style="display:block;color:#59e7ff;font:800 13px Orbitron,Arial,sans-serif">+ '+points.toLocaleString()+' CrowPoints</strong><span style="display:block;margin-top:4px;color:#b9c4d4">'+CS.escape(reason||"CrowSpace activity")+'</span>';clearTimeout(t._timer);t._timer=setTimeout(()=>t.remove(),4200)};
CS.watchCrowPoints=async function(){if(!CS.client||window.__CROWPOINTS_POLL__)return;const u=await CS.user();if(!u)return;window.__CROWPOINTS_POLL__=true;let since=sessionStorage.getItem("crowpoints_seen_at")||new Date().toISOString();const poll=async()=>{try{const {data,error}=await CS.client.from("crowspace_point_events").select("id,points,action,created_at").eq("user_id",u.id).gt("created_at",since).order("created_at",{ascending:true}).limit(20);if(error)return;(data||[]).forEach(r=>{since=r.created_at;sessionStorage.setItem("crowpoints_seen_at",since);CS.rewardToast(r.points,String(r.action||"CrowSpace activity").replace(/_/g," "));});}catch{}};await poll();setInterval(poll,2500)};
document.addEventListener("DOMContentLoaded",()=>setTimeout(()=>CS.watchCrowPoints(),1200));
})();
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
 {label:"Production Pipeline",href:"production-pipeline.html",group:"universe"},
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
.site-header{gap:10px;position:relative;z-index:100}\n.nav-toggle{display:none!important}
.site-header>nav{display:flex!important;align-items:center;justify-content:flex-end;gap:5px;min-width:0;flex:1 1 auto;overflow:visible}
.crow-nav-shell{display:flex;align-items:center;gap:5px;width:100%;min-width:0}
.crow-nav-home{display:inline-flex;align-items:center;justify-content:center;padding:9px 11px;border-radius:9px;color:var(--text,#222);font-weight:800;font-size:12px;white-space:nowrap}
.crow-nav-home:hover,.crow-nav-home.active{background:var(--blue2,#eef5ff);color:var(--blue,#1877f2)}
.crow-nav-groups{display:flex;align-items:center;gap:4px;min-width:0;flex:1;justify-content:flex-end}
.crow-nav-group{position:relative;flex:0 0 auto}
.crow-nav-trigger{appearance:none;border:0;background:transparent;color:var(--text,#222);display:inline-flex;align-items:center;gap:5px;cursor:pointer;padding:9px 10px;border-radius:9px;font-weight:800;font-size:12px;white-space:nowrap}
.crow-nav-trigger:hover,.crow-nav-trigger.is-open{background:var(--blue2,#eef5ff);color:var(--blue,#1877f2)}
.crow-nav-trigger .chevron{font-size:9px;opacity:.65;transition:transform .15s ease}
.crow-nav-trigger.is-open .chevron{transform:rotate(180deg)}
.crow-nav-panel{position:absolute;right:0;top:calc(100% + 7px);width:240px;background:#fff;border:1px solid var(--line,#ddd);border-radius:12px;padding:7px;box-shadow:0 15px 38px rgba(0,0,0,.16);z-index:500;display:none}
.crow-nav-panel.is-open{display:block}
.crow-nav-panel-title{padding:7px 9px 5px;color:var(--muted,#6b7280);font-size:10px;font-weight:900;letter-spacing:1px;text-transform:uppercase}
.crow-nav-panel a{display:flex!important;align-items:center;justify-content:space-between;padding:10px 11px;border-radius:8px;color:var(--text,#222);font-size:13px;font-weight:700;text-decoration:none}
.crow-nav-panel a:hover,.crow-nav-panel a.active{background:var(--blue2,#eef5ff);color:var(--blue,#1877f2)}
.crow-nav-panel a.active:after{content:"•";font-size:16px}
@media(max-width:1100px){
 .crow-nav-trigger{font-size:11px;padding:8px}
 .crow-nav-home{padding:8px 9px}
}
@media(max-width:900px){
 .site-header>nav{flex-basis:100%;order:5;overflow:visible}
 .crow-nav-shell{flex-wrap:wrap}
 .crow-nav-groups{justify-content:center;flex-wrap:wrap;width:100%}
 .crow-nav-group{flex:1 1 auto}
 .crow-nav-trigger{width:100%;justify-content:center}
 .crow-nav-panel{position:fixed;left:12px;right:12px;top:74px;width:auto;max-height:calc(100vh - 90px);overflow:auto}
}
@media(max-width:520px){
 .crow-nav-home{flex:1}
 .crow-nav-trigger{font-size:11px;padding:9px 6px}
 .crow-nav-group{min-width:30%}
}
`;document.head.appendChild(s)};
CS.refreshHeader=async()=>{
 const currentUser=await CS.user();
 if(currentUser)await CS.ensureProfile(currentUser);
 const header=document.querySelector(".site-header");
 if(header){
   // Navigation is owned exclusively by js/global-nav.js.
   // crowspace.js handles account state and shared search only.
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
   const media=x.media_url&&x.activity_type==="caw"?'<video data-caw-id="'+CS.escape(x.target_id)+'" controls playsinline preload="metadata" src="'+CS.escape(x.media_url)+'"></video>':"";
   const actions=x.activity_type==="post"?'<div class="post-actions"><button class="btn feed-like" data-post="'+CS.escape(x.target_id)+'">♡ Like</button><button class="btn feed-comment" data-post="'+CS.escape(x.target_id)+'">💬 Comment</button></div>':"";
   return '<article class="post card"><div class="post-head"><a class="avatar sm" href="profile.html?id='+encodeURIComponent(x.actor_id)+'">'+CS.escape((x.actor_name||"C").slice(0,1).toUpperCase())+'</a><div><strong>'+CS.escape(x.actor_name||"CrowSpace Member")+'</strong><small>@'+CS.escape(x.actor_username||"member")+' · '+new Date(x.created_at).toLocaleString()+'</small></div></div><span class="event-tag">'+label+'</span><h3>'+CS.escape(x.title||"")+'</h3><p>'+CS.escape(x.body||"")+'</p>'+media+'<a class="btn" href="'+CS.escape(link||"#")+'">Open →</a>'+actions+'</article>';
 }).join("")||'<div class="card"><h3>Your feed is quiet.</h3><p>Find people, follow creators, join groups and come back as your CrowSpace grows.</p><a class="btn primary" href="people.html">Find People →</a></div>';
 box.querySelectorAll(".feed-like").forEach(b=>b.addEventListener("click",()=>CS.react(b.dataset.post)));\n CS.bindCawViewTracking(box);
 box.querySelectorAll(".feed-comment").forEach(b=>b.addEventListener("click",()=>CS.commentPrompt(b.dataset.post)));
};
CS.feed=CS.homeFeed;
CS.react=async postId=>{const u=await CS.user();if(!u){location.href="login.html";return}await CS.client.from("crowspace_reactions").upsert({post_id:postId,user_id:u.id,reaction:"like"});};
CS.commentPrompt=async postId=>{const u=await CS.user();if(!u){location.href="login.html";return}const body=prompt("Comment");if(body)await CS.client.from("crowspace_comments").insert({post_id:postId,user_id:u.id,body});};
CS.trackCawView=async(cawId)=>{
 if(!cawId||!CS.client)return false;
 try{
   const key="crowspace_caw_viewer_token";
   let token=localStorage.getItem(key);
   if(!token){token=(crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(36).slice(2));localStorage.setItem(key,token);}
   const u=await CS.user();
   const payload={caw_id:cawId,viewer_token:u?null:token,viewed_at:new Date().toISOString()};
   if(u)payload.user_id=u.id;
   const r=await CS.client.from("crowspace_caw_views").insert(payload);
   if(r.error&&r.error.code!=="23505")throw r.error;
   return !r.error||r.error.code==="23505";
 }catch(e){console.warn("CrowSpace Caw view:",e.message);return false}
};
CS.trackCawWatchTime=async(cawId,seconds,durationSeconds,title)=>{\n if(!cawId||!CS.client||!seconds)return false;\n try{\n  const u=await CS.user();if(!u)return false;\n  const n=Math.min(30,Math.max(0,Math.floor(Number(seconds)||0)));if(!n)return false;\n  const {error}=await CS.client.rpc("crowspace_record_caw_watch_time",{p_caw_id:cawId,p_watched_seconds:n,p_duration_seconds:Number.isFinite(Number(durationSeconds))?Math.floor(Number(durationSeconds)):null,p_title:title||null});\n  if(error)throw error;return true;\n }catch(e){console.warn("CrowSpace Caw watch time:",e.message);return false}\n};\nCS.bindCawWatchTime=(root=document)=>{\n root.querySelectorAll("video[data-caw-id]").forEach(video=>{\n  if(video.dataset.cawWatchBound==="1")return;video.dataset.cawWatchBound="1";\n  let accumulated=0,lastTime=null,playing=false,sending=false;\n  const flush=async(force=false)=>{if(sending||accumulated<1||(!force&&accumulated<10))return;const seconds=Math.min(30,Math.floor(accumulated));if(seconds<1)return;accumulated-=seconds;sending=true;try{await CS.trackCawWatchTime(video.dataset.cawId,seconds,video.duration,video.closest(".cf-card,.caw-card,.post")?.querySelector("h2,h3")?.textContent||"Caw")}finally{sending=false}};\n  video.addEventListener("play",()=>{playing=true;lastTime=video.currentTime||0},{passive:true});\n  video.addEventListener("pause",()=>{playing=false;flush(true)},{passive:true});\n  video.addEventListener("ended",()=>{playing=false;flush(true)},{passive:true});\n  video.addEventListener("timeupdate",()=>{const now=video.currentTime||0;if(playing&&lastTime!==null){const delta=now-lastTime;if(delta>0&&delta<=2)accumulated+=delta;else if(delta<0||delta>2)accumulated=0}lastTime=now;if(accumulated>=10)flush(false)},{passive:true});\n  video.addEventListener("seeking",()=>{lastTime=null},{passive:true});\n });\n};\nCS.bindCawViewTracking=(root=document)=>{\n root.querySelectorAll("video[data-caw-id]").forEach(video=>{\n  if(video.dataset.cawViewBound!=="1"){video.dataset.cawViewBound="1";let tracked=false;const track=async()=>{if(tracked)return;tracked=true;await CS.trackCawView(video.dataset.cawId)};video.addEventListener("play",track,{passive:true});video.addEventListener("timeupdate",()=>{if(video.currentTime>=2)track()},{passive:true})}\n });\n CS.bindCawWatchTime(root);\n};\nCS.follow=async target=>{const u=await CS.user();if(!u){location.href="login.html";return}if(u.id===target)return;const {data}=await CS.client.from("crowspace_follows").select("*").eq("follower_id",u.id).eq("followed_user_id",target).maybeSingle();if(data)await CS.client.from("crowspace_follows").delete().eq("follower_id",u.id).eq("followed_user_id",target);else{await CS.client.from("crowspace_follows").insert({follower_id:u.id,followed_user_id:target});}};

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
CS.hydrateAvatars=async()=>{const els=[...document.querySelectorAll(".avatar[href*='profile.html?id=']")];if(!els.length||!CS.client)return;const ids=[...new Set(els.map(el=>{try{return new URL(el.href,location.href).searchParams.get("id")}catch{return null}}).filter(Boolean))];if(!ids.length)return;let data=[];try{const r=await CS.client.rpc("crowspace_public_profiles_by_ids",{ids});if(r.error)throw r.error;data=r.data||[]}catch(e){return}const map=Object.fromEntries(data.map(p=>[p.id,p]));els.forEach(el=>{let id;try{id=new URL(el.href,location.href).searchParams.get("id")}catch{}const p=map[id];if(!p)return;const name=p.display_name||p.username||"CrowSpace Member";const initial=name.trim().slice(0,1).toUpperCase()||"C";el.classList.add("avatar-has-image");el.innerHTML=p.avatar_url?'<img src="'+CS.escape(p.avatar_url)+'" alt="'+CS.escape(name)+'" loading="lazy">':CS.escape(initial);el.setAttribute("aria-label",name+" avatar")})};
CS.loadCinematicStyles=()=>{if(document.getElementById("crowspace-cinematic-css"))return;const l=document.createElement("link");l.id="crowspace-cinematic-css";l.rel="stylesheet";l.href="css/crowspace-cinematic.css?v=20260928-1";document.head.appendChild(l)};
CS.enhancePage=()=>{CS.loadCinematicStyles();
 if(document.body.classList.contains("crow-cinematic"))return;
 document.body.classList.add("crow-cinematic");
 const main=document.querySelector("main");
 if(main){
   main.classList.add("crow-main");
   const path=(location.pathname.split("/").pop()||"index.html").replace(".html","");
   main.dataset.page=path;
   main.querySelectorAll(":scope > .section, :scope > .hero, :scope > .nest-shell, :scope > .auth-card").forEach((el,i)=>{
     el.classList.add("cinematic-surface");
     el.style.setProperty("--surface-index",i);
   });
   if("IntersectionObserver" in window){
     const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("is-visible");io.unobserve(entry.target)}}),{threshold:.08});
     main.querySelectorAll(".cinematic-surface").forEach(el=>io.observe(el));
   }else main.querySelectorAll(".cinematic-surface").forEach(el=>el.classList.add("is-visible"));
 }
 const pulse=document.createElement("div");pulse.className="crow-ambient-pulse";pulse.setAttribute("aria-hidden","true");document.body.appendChild(pulse);
};
CS.init=async()=>{if(CS._initialized)return;CS._initialized=true;try{CS.enhancePage();await CS.refreshHeader();await CS.hydrateAvatars();await CS.renderMembershipBadge();await CS.renderMembershipHome();await CS.renderUniverseBar();await CS.heartbeat();await CS.renderUniversalStats();if(CS.client&&!CS._authSubscription){CS._authSubscription=CS.client.auth.onAuthStateChange((event,session)=>{setTimeout(async()=>{try{await CS.refreshHeader();await CS.renderMembershipBadge();await CS.renderMembershipHome();await CS.renderUniverseBar();await CS.renderUniversalStats()}catch(e){console.warn("CrowSpace auth refresh:",e.message)}},0)})}}catch(e){console.warn("CrowSpace initialization:",e.message)}};
window.CS=CS;
document.addEventListener("DOMContentLoaded",()=>CS.init());
