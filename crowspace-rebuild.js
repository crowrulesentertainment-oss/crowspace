/* V44 — Recommendation Explanation Center */
async function recommendationWhy(targetId,targetType="content"){
 try{const db=window.CrowSpaceAuth?.client||window.CrowSpaceDB;if(!db||!targetId)return[];const r=await db.rpc("crowspace_recommendation_explanations_for",{p_target:targetId,p_type:targetType});if(r.error)throw r.error;return r.data||[]}catch(e){return[]}
}
function recommendationReasonFallback(item={}){
 const out=[]; if(item.following)out.push("Because you follow this creator."); if(item.interaction)out.push("Because you've interacted with similar content."); if(item.trending)out.push("Trending within your interests."); if(item.exploration)out.push("A new discovery related to your interests."); if(item.recent)out.push("Based on your recent activity."); return out.length?out:["Recommended from your CrowSpace activity."]
}
window.CrowSpaceRecommendationExplanations={why:recommendationWhy,fallback:recommendationReasonFallback};
/* V43 — Content Suppression & Recovery Engine */
async function setContentPreference(targetId,targetType,preference){
 try{const db=window.CrowSpaceAuth?.client||window.CrowSpaceDB;if(!db||!targetId)return null;const r=await db.rpc("crowspace_set_content_preference",{p_target:targetId,p_type:targetType||"content",p_preference:preference});if(r.error)throw r.error;await loadContentPreferences();return r.data}catch(e){console.debug("CrowSpace content preference skipped",e);return null}
}
async function loadContentPreferences(){
 try{const db=window.CrowSpaceAuth?.client||window.CrowSpaceDB;if(!db)return{};const r=await db.rpc("crowspace_content_preference_signals");if(r.error)throw r.error;const m={};(r.data||[]).forEach(x=>m[(x.target_type||"content")+":"+x.target_id]=Number(x.signal)||0);window.CrowSpaceContentPreferences=m;return m}catch(e){return window.CrowSpaceContentPreferences||{}}
}
window.CrowSpaceContentPreferences={};
window.CrowSpaceSuppression={set:setContentPreference,load:loadContentPreferences};
/* V42 — Real-Time Recommendation Re-Ranking */
async function refreshLiveRecommendationSignals(){
 try{const db=window.CrowSpaceAuth?.client||window.CrowSpaceDB;if(!db)return{};const r=await db.rpc("crowspace_live_recommendation_signals");if(r.error)throw r.error;const m={};(r.data||[]).forEach(x=>m[(x.target_type||"content")+":"+x.target_id]=Number(x.signal)||0);window.CrowSpaceLiveSignals=m;return m}catch(e){return window.CrowSpaceLiveSignals||{}}
}
window.CrowSpaceLiveSignals={};
window.CrowSpaceLiveRecommendations={refresh:refreshLiveRecommendationSignals};
/* V41 — Recommendation Feedback Loop */
async function recommendationFeedback(targetId,targetType,feedback){
 try{const db=window.CrowSpaceAuth?.client||window.CrowSpaceDB;if(!db||!targetId)return null;const r=await db.rpc("crowspace_record_recommendation_feedback",{p_target:targetId,p_type:targetType||"content",p_feedback:feedback});if(r.error)throw r.error;return r.data}catch(e){console.debug("CrowSpace recommendation feedback skipped",e);return null}
}
async function loadRecommendationFeedback(){
 try{const db=window.CrowSpaceAuth?.client||window.CrowSpaceDB;if(!db)return[];const r=await db.rpc("crowspace_recommendation_feedback_signals");if(r.error)throw r.error;window.CrowSpaceRecommendationFeedback={signals:r.data||[]};return r.data||[]}catch(e){return[]}
}
window.CrowSpaceRecommendationFeedback={record:recommendationFeedback,load:loadRecommendationFeedback};
/* V40 — Recommendation Exploration & Diversity */
async function diverseRecommendations(limit=30){
 try{const db=window.CrowSpaceAuth?.client||window.CrowSpaceDB;if(!db)return[];const r=await db.rpc("crowspace_diverse_recommendations",{p_limit:limit});if(r.error)throw r.error;window.CrowSpaceDiversity={items:r.data||[]};return r.data||[]}catch(e){console.debug("CrowSpace diversity recommendations skipped",e);return[]}
}
window.CrowSpaceDiversity={load:diverseRecommendations};
/* V39 — Interest-Aware Recommendations */
async function interestRecommendations(limit=30){
 try{const db=window.CrowSpaceAuth?.client||window.CrowSpaceDB;if(!db)return[];const r=await db.rpc("crowspace_interest_recommendations",{p_limit:limit});if(r.error)throw r.error;window.CrowSpaceRecommendations={items:r.data||[]};return r.data||[]}catch(e){console.debug("CrowSpace recommendations skipped",e);return[]}
}
window.CrowSpaceRecommendations={load:interestRecommendations};
/* V38 — Semantic Interest Graph */
async function refreshInterestGraph(){
 try{const db=window.CrowSpaceAuth?.client||window.CrowSpaceDB;if(!db)return null;const r=await db.rpc("crowspace_refresh_interest_graph");if(r.error)throw r.error;window.CrowSpaceInterestGraph={profile:r.data||null,graph:r.data?.interest_graph||{}};return window.CrowSpaceInterestGraph}catch(e){console.debug("CrowSpace interest graph skipped",e);return null}
}
window.CrowSpaceInterestGraph={refresh:refreshInterestGraph};
/* V37 — Interest & Creator Affinity Engine */
async function refreshAffinities(){
 try{const db=window.CrowSpaceAuth?.client||window.CrowSpaceDB;if(!db)return null;const r=await db.rpc("crowspace_refresh_affinities");if(r.error)throw r.error;window.CrowSpaceAffinity={profile:r.data||null,affinities:r.data?.affinities||{}};return window.CrowSpaceAffinity}catch(e){console.debug("CrowSpace affinity refresh skipped",e);return null}
}
window.CrowSpaceAffinity={refresh:refreshAffinities};
/* V36 — Cross-Device Learning Sync */
async function syncLearningProfile(){
 try{
  const db=window.CrowSpaceAuth?.client||window.CrowSpaceDB;if(!db)return null;
  const r=await db.rpc("crowspace_sync_learning_profile");if(r.error)throw r.error;
  const s=await db.rpc("crowspace_learning_snapshot");if(s.error)throw s.error;
  const snap=s.data||{};if(window.user?.id){
   localStorage.setItem("crowspace_learning_"+window.user.id,JSON.stringify({interests:snap.interests||{},creators:snap.creators||{},synced_at:snap.synced_at,version:snap.version}));
  }
  window.CrowSpaceLearningSync={snapshot:snap,synced:true};
  return snap;
 }catch(e){console.debug("CrowSpace learning sync skipped",e);return null}
}
window.CrowSpaceLearningSync={sync:syncLearningProfile};

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
 const pages=[["home.html","Home","Command Feed"],["explore.html","Explore","Discover members"],["search.html","Search","Universal Discovery Hub"],["caws.html","Caws","Short-form video"],["circles.html","Circles","Communities"],["notifications.html","Alerts","Notifications"],["messages.html","Messages","Direct messages"],["holiday-bots.html","Holiday Network","Automated accounts"],["profile.html","Profile","Your identity"],["account.html","Account","Universal account"]];
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
 const links=[["home.html","home","HOME","Command feed"],["explore.html","explore","EXPLORE","Find members"],["search.html","search","SEARCH","Universal discovery"],["caws.html","caws","CAWS","Short-form video"],["circles.html","circles","CIRCLES","Communities"],["notifications.html","notifications","ALERTS","Signals"],["messages.html","messages","MESSAGES","Direct conversations"],["holiday-bots.html","holiday-bots","HOLIDAY","Bot network"],["profile.html","profile","PROFILE","Identity"],["account.html","account","ACCOUNT","Universal account"]];
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
 const following=await db.from("crowspace_follows").select("followed_user_id").eq("follower_id",u.id);
 const ids=(following.data||[]).map(x=>x.followed_user_id),p=await db.from("crowspace_profiles").select("user_id,display_name,username,avatar_url,bio").neq("user_id",u.id).limit(24),followSet=new Set(ids);
 const visibleProfiles=(p.data||[]).filter(x=>x.privacy_connections!=="private"); const counts=await db.from("crowspace_follows").select("follower_id,followed_user_id");
 const followerCount=new Map(),followingCount=new Map();(counts.data||[]).forEach(x=>{followerCount.set(x.followed_user_id,(followerCount.get(x.followed_user_id)||0)+1);followingCount.set(x.follower_id,(followingCount.get(x.follower_id)||0)+1)});
 box.innerHTML='<div class="social-graph-head"><div><span class="eyebrow">SOCIAL GRAPH</span><h2>YOUR NETWORK.</h2></div><span class="muted">'+ids.length+' following · '+(followerCount.get(u.id)||0)+' followers</span></div><div class="member-grid">'+visibleProfiles.map(x=>'<article class="member-card"><img src="'+esc(x.avatar_url||avatar(x))+'"><b>'+esc(x.display_name||x.username||"Member")+'</b><small>@'+esc(x.username||"member")+'</small><div class="muted">'+(followerCount.get(x.user_id)||0)+' followers · '+(followingCount.get(x.user_id)||0)+' following</div><p>'+esc(x.bio||"CrowSpace member")+'</p><button class="btn '+(followSet.has(x.user_id)?"active":"")+'" data-follow="'+esc(x.user_id)+'">'+(followSet.has(x.user_id)?"Following":"Follow")+'</button></article>').join("")+'</div>';
 box.querySelectorAll("[data-follow]").forEach(b=>b.onclick=async()=>{const id=b.dataset.follow;if(followSet.has(id))await db.from("crowspace_follows").delete().eq("follower_id",u.id).eq("followed_user_id",id);else await db.from("crowspace_follows").insert({follower_id:u.id,followed_user_id:id});socialGraph(db,u)})
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


/* V35 — Adaptive Feed Intelligence */
async function refreshAdaptiveFeed(){
 try{
  const db=window.CrowSpaceAuth?.client||window.CrowSpaceDB;if(!db)return;
  const r=await db.rpc("crowspace_refresh_feed_profile");if(r.error)throw r.error;
  const s=await db.rpc("crowspace_adaptive_feed_signals");window.CrowSpaceAdaptive={profile:r.data||null,signals:s.data||[]};
  return window.CrowSpaceAdaptive;
 }catch(e){console.debug("CrowSpace adaptive learning skipped",e);return null}
}
window.CrowSpaceAdaptiveFeed={refresh:refreshAdaptiveFeed};

/* V34 — Personal Feed Learning */
async function recordFeedLearning(eventType,targetId=null,targetType=null,queryText=null,weight=1,metadata={}){
 try{const _u=await user();if(_u)learnLocal(_u.id,targetType||eventType,String(targetId||queryText||"unknown"),Number(weight)||1);const db=window.CrowSpaceAuth?.client||window.CrowSpaceDB;if(!db)return; await db.rpc("crowspace_record_feed_event",{p_event_type:eventType,p_target_id:targetId,p_target_type:targetType,p_query_text:queryText,p_weight:weight,p_metadata:metadata});}catch(e){console.debug("CrowSpace learning skipped",e)}
}
function learnLocal(userId,type,id,weight=1){try{const k="crowspace_learning_"+userId,s=JSON.parse(localStorage.getItem(k)||"{}");s[type]=s[type]||{};s[type][id]=(s[type][id]||0)+weight;localStorage.setItem(k,JSON.stringify(s));}catch(e){}}
window.CrowSpaceLearning={record:recordFeedLearning,signal:(u,t,i,w)=>{learnLocal(u,t,i,w);return recordFeedLearning(t,i,t,null,w)}};

function shell(){document.documentElement.dataset.crowspace="cinematic";nav();appShell();commandPalette();
 const year=document.querySelector("[data-year]");if(year)year.textContent=new Date().getFullYear();
 window.CrowSpaceUI={esc,toast,auth,user,profile,avatar,guard,privacyCan,privacyBanner}; window.CrowSpacePrivacy={can:privacyCan,banner:privacyBanner};
}

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
 const f=await db.from("crowspace_follows").select("followed_user_id").eq("follower_id",u.id);
 const ids=[u.id,...(f.data||[]).map(x=>x.followed_user_id)];
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
async function privacyCan(db,target,setting){if(!target)return false;const r=await db.rpc("crowspace_can_view",{target,setting});return !r.error&&r.data===true}
async function privacyProfileMap(db,rows,setting="profile"){
 const ids=[...new Set((rows||[]).map(x=>x.user_id).filter(Boolean))]; if(!ids.length)return new Map();
 const r=await db.from("crowspace_profiles").select("user_id,username,display_name,avatar_url,bio,privacy_profile,privacy_posts,privacy_media,privacy_activity,privacy_connections");
 return new Map((r.data||[]).filter(x=>ids.includes(x.user_id)).map(x=>[x.user_id,x]));
}
function privacyBanner(text="Some content is hidden by the owner's privacy settings."){return '<div class="card pad muted privacy-banner">🔒 '+esc(text)+'</div>'}

async function universalSearch(db,q){
 const _u=await user(); if(_u&&String(q||"").trim().length>=2) recordFeedLearning("search",null,"search",String(q).trim(),1);
 const term=String(q||"").trim();
 if(term.length<2)return {term,results:[]};
 const like="%"+term.replace(/[%_]/g,"\\$&")+"%";
 const out=[];
 const [pr,po,ca,ci,bo,bp]=await Promise.all([
  db.from("crowspace_profiles").select("user_id,username,display_name,avatar_url,bio,privacy_profile").or("display_name.ilike."+like+",username.ilike."+like+",bio.ilike."+like).limit(20),
  db.from("crowspace_posts").select("id,user_id,title,body,created_at,privacy_posts").or("title.ilike."+like+",body.ilike."+like).order("created_at",{ascending:false}).limit(30),
  db.from("crowspace_caws").select("id,user_id,title,caption,thumbnail_url,video_url,created_at").or("title.ilike."+like+",caption.ilike."+like).order("created_at",{ascending:false}).limit(20),
  db.from("crowspace_circles").select("*").or("name.ilike."+like+",title.ilike."+like+",description.ilike."+like).limit(20),
  db.from("crowspace_holiday_bots").select("id,slug,display_name,holiday_name,bio,avatar_url,active").eq("active",true).or("display_name.ilike."+like+",holiday_name.ilike."+like+",bio.ilike."+like).limit(20),
  db.from("crowspace_holiday_bot_posts").select("id,bot_id,title,body,created_at").or("title.ilike."+like+",body.ilike."+like).order("created_at",{ascending:false}).limit(20)
 ]);
 const profileIds=new Set((pr.data||[]).filter(x=>x.privacy_profile!=="private").map(x=>x.user_id));
 (pr.data||[]).filter(x=>profileIds.has(x.user_id)).forEach(x=>out.push({kind:"member",id:x.user_id,title:x.display_name||x.username||"Crow Member",meta:"@"+(x.username||"member"),body:x.bio||"",url:"profile.html?u="+encodeURIComponent(x.username||"")}));
 const postOwners=[...new Set((po.data||[]).map(x=>x.user_id))];
 const postProfiles=postOwners.length?await db.from("crowspace_profiles").select("user_id,privacy_posts").in("user_id",postOwners):{data:[]};
 const postAllowed=new Set((postProfiles.data||[]).filter(x=>x.privacy_posts!=="private").map(x=>x.user_id));
 (po.data||[]).filter(x=>postAllowed.has(x.user_id)).forEach(x=>out.push({kind:"post",id:x.id,title:x.title||"CrowSpace Post",meta:new Date(x.created_at).toLocaleString(),body:x.body||"",url:"#post-"+x.id}));
 const cOwners=[...new Set((ca.data||[]).map(x=>x.user_id))];
 const cProfiles=cOwners.length?await db.from("crowspace_profiles").select("user_id,privacy_media").in("user_id",cOwners):{data:[]};
 const cAllowed=new Set((cProfiles.data||[]).filter(x=>x.privacy_media!=="private").map(x=>x.user_id));
 (ca.data||[]).filter(x=>cAllowed.has(x.user_id)).forEach(x=>out.push({kind:"caw",id:x.id,title:x.title||"Caw",meta:new Date(x.created_at).toLocaleString(),body:x.caption||"",url:"caw.html?id="+encodeURIComponent(x.id)}));
 (ci.data||[]).forEach(x=>out.push({kind:"circle",id:x.id,title:x.name||x.title||"Circle",meta:"Circle",body:x.description||"",url:"circles.html#"+encodeURIComponent(x.id)}));
 (bo.data||[]).forEach(x=>out.push({kind:"holiday",id:x.id,title:x.display_name||x.holiday_name||"Holiday Bot",meta:"Holiday Network",body:x.bio||"",url:"holiday-bot.html?bot="+encodeURIComponent(x.slug)}));
 const botIds=new Set((bo.data||[]).map(x=>x.id));
 (bp.data||[]).filter(x=>botIds.has(x.bot_id)).forEach(x=>out.push({kind:"holiday-post",id:x.id,title:x.title||"Holiday Update",meta:new Date(x.created_at).toLocaleString(),body:x.body||"",url:"holiday-bot.html"}));
 return {term,results:out};
}
function universalSearchUI(db){
 if($("#crow-universal-search"))return;
 const host=document.querySelector(".commandbar")||document.querySelector(".navin");
 if(!host)return;
 const wrap=document.createElement("div");wrap.id="crow-universal-search";wrap.className="universal-search";
 wrap.innerHTML='<input id="crow-search-input" aria-label="Search CrowSpace" placeholder="Search CrowSpace…"><div id="crow-search-results" class="universal-search-results" hidden></div>';
 host.appendChild(wrap);
 const input=wrap.querySelector("#crow-search-input"),results=wrap.querySelector("#crow-search-results");
 let timer;
 const draw=()=>{clearTimeout(timer);timer=setTimeout(async()=>{const q=input.value.trim();if(q.length<2){results.hidden=true;return}results.hidden=false;results.innerHTML='<div class="search-result"><b>SEARCHING CROWSPACE…</b></div>';const data=await universalSearch(db,q);results.innerHTML=(data.results||[]).slice(0,8).map(x=>'<a class="search-result" href="'+esc(x.url)+'"><b>'+esc(x.title)+'</b><span>'+esc(x.kind.toUpperCase())+' · '+esc(x.meta)+'</span></a>').join("")+'<a class="search-result search-all" href="search.html?q='+encodeURIComponent(q)+'"><b>VIEW ALL RESULTS</b><span>Open the CrowSpace Discovery Hub</span></a>'||'<div class="muted" style="padding:14px">No public results found.</div>'},180)};
 input.oninput=draw;
 input.onkeydown=e=>{if(e.key==="Enter"&&input.value.trim().length>=2)location.href="search.html?q="+encodeURIComponent(input.value.trim())};
 document.addEventListener("click",e=>{if(!wrap.contains(e.target))results.hidden=true});
}
function metric(label,value,detail){return '<div class="metric"><b>'+esc(value)+'</b><span>'+esc(label)+'</span><small>'+esc(detail)+'</small></div>'}
async function page(){
 shell();const p=document.body.dataset.page,db=await auth();communityChrome(p);universalSearchUI(db);
 if(p==="index")return;
 if(p==="login"||p==="signup")return authPage(p,db);
 const liveUser=await guard();if(!liveUser)return;liveLayer(db,liveUser);
 if(p==="home"){const u=await guard();if(!u)return;const d=await dashboardData(db,u);$("#welcome").textContent="Welcome back, "+(u.user_metadata?.display_name||u.email?.split("@")[0]||"Crow")+".";$("#welcome").insertAdjacentHTML("afterend",'<div id="dashmetrics" class="metric-grid"></div>');$("#dashmetrics").innerHTML=metric("Community posts",d.posts,"CrowSpace-wide")+metric("Members",d.profiles,"Profiles")+metric("Your alerts",d.alerts,"Notifications")+metric("Your messages",d.messages,"Conversation records")+metric("Caws",d.caws,"Media library")+metric("Holiday Bots",d.bots,"Active automated accounts");document.querySelectorAll("[data-feed-filter]").forEach(b=>b.onclick=async()=>{document.querySelectorAll("[data-feed-filter]").forEach(x=>x.classList.remove("active"));b.classList.add("active");await renderFeed($("#feed"),b.dataset.feedFilter)});document.querySelectorAll("[data-personal-feed]").forEach(b=>b.onclick=async()=>{document.querySelectorAll("[data-personal-feed]").forEach(x=>x.classList.remove("active"));b.classList.add("active");await renderPersonalFeed($("#feed"),b.dataset.personalFeed)});
$("#publish").onsubmit=async e=>{e.preventDefault();const body=$("#body").value.trim();if(!body)return;const r=await db.from("crowspace_posts").insert({user_id:u.id,body,title:$("#title").value.trim()||null});if(r.error){toast(r.error.message);return}$("#title").value="";$("#body").value="";toast("Posted to CrowSpace");await renderFeed($("#feed"))};await renderPersonalFeed($("#feed"),"for-you");return}
 if(p==="profile")return profilePage(db);
 if(p==="account")return accountPage(db);
 if(p==="explore")return explorePage(db);
 if(p==="search")return searchPage(db);
 if(p==="caws")return cawsPage(db);
 if(p==="circles")return circlesPage(db);
 if(p==="messages")return messagesPage(db);
 if(p==="notifications")return notificationsPage(db);
 if(p==="holiday-bots")return botsPage(db); if(p==="holiday-bot")return botPage(db);
}
async function authPage(kind,db){const form=$("#authForm"),msg=$("#msg");form.onsubmit=async e=>{e.preventDefault();msg.textContent="Connecting…";const email=$("#email").value.trim(),password=$("#password").value,display=$("#display")?.value.trim();let r;if(kind==="login")r=await db.auth.signInWithPassword({email,password});else r=await db.auth.signUp({email,password,options:{data:{display_name:display||email.split("@")[0]}}});if(r.error){msg.textContent=r.error.message;return}if(r.data.user)await CrowSpaceAuth.ensureProfile?.(r.data.user);if(kind==="signup"&&!r.data.session){msg.textContent="Account created. Check your email if confirmation is required, then log in.";return}location.href="home.html"}}
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
async function explorePage(db){const r=await db.from("crowspace_profiles").select("user_id,username,display_name,avatar_url,bio,privacy_profile,privacy_connections").limit(30);const rows=(r.data||[]).filter(x=>x.privacy_profile!=="private"&&x.privacy_connections!=="private");$("#explore").innerHTML='<section class="hero"><div class="eyebrow">DISCOVER</div><h1>EXPLORE.</h1><p class="muted">Find members and the latest activity across CrowSpace.</p></section><section class="grid" style="margin-top:16px">'+rows.map(p=>'<article class="card pad"><img class="avatar" src="'+esc(avatar(p.avatar_url))+'"><h3>'+esc(p.display_name||p.username||"Crow Member")+'</h3><div class="muted">@'+esc(p.username||"member")+'</div><p class="muted">'+esc(p.bio||"")+'</p></article>').join("")+'</section>'}
async function cawsPage(db){const r=await db.from("crowspace_caws").select("*").order("created_at",{ascending:false}).limit(50);const owners=[...new Set((r.data||[]).map(x=>x.user_id).filter(Boolean))];const op=owners.length?await db.from("crowspace_profiles").select("user_id,privacy_media").in("user_id",owners):{data:[]};const allowed=new Set((op.data||[]).filter(x=>x.privacy_media!=="private").map(x=>x.user_id));r.data=(r.data||[]).filter(x=>allowed.has(x.user_id));$("#caws").innerHTML='<section class="hero"><div class="eyebrow">CROWSPACE // CAWS</div><h1>CAWS.</h1><p class="muted">The fast-moving video side of the CrowSpace community.</p></section><section class="grid" style="margin-top:16px">'+(r.data||[]).map(x=>'<article class="card pad"><h3>'+esc(x.title||"Caw")+'</h3><p class="muted">'+esc(x.caption||"")+'</p>'+(x.video_url?'<video controls playsinline style="width:100%;border-radius:12px" src="'+esc(x.video_url||x.media_url)+'"></video>':"")+'</article>').join("")+'</section>'}
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
async function notificationsPage(db){
 const u=await guard();if(!u)return;
 const r=await db.from("crowspace_notifications").select("id,actor_id,type,body,post_id,caw_id,interaction_type,read_at,created_at").eq("user_id",u.id).order("created_at",{ascending:false}).limit(100);
 const rows=r.data||[],ids=[...new Set(rows.map(x=>x.actor_id).filter(Boolean))];
 const p=ids.length?await db.from("crowspace_profiles").select("user_id,username,display_name,avatar_url").in("user_id",ids):{data:[]};
 const pm=new Map((p.data||[]).map(x=>[x.user_id,x]));
 const unread=rows.filter(x=>!x.read_at).length;
 $("#notifications").innerHTML='<section class="hero"><div class="eyebrow">CROWRULES // LIVE SIGNALS</div><h1>ALERTS.</h1><p class="muted">'+(unread?unread+' unread notification'+(unread===1?'':'s'):'You are all caught up.')+'</p><div class="actions"><button id="markAlertsRead" class="btn primary">Mark all read</button></div></section><section class="list" style="margin-top:16px">'+(rows.map(x=>{const a=pm.get(x.actor_id)||{};return '<article class="card pad '+(!x.read_at?'unread':'')+'"><div class="post-head"><img class="avatar" src="'+esc(avatar(a.avatar_url))+'"><div><b>'+esc(a.display_name||a.username||'CrowSpace')+'</b><small class="muted">'+esc(x.type||x.interaction_type||'activity')+' · '+new Date(x.created_at).toLocaleString()+'</small></div></div><p>'+esc(x.body||'You have new CrowSpace activity.')+'</p></article>'}).join('')||'<div class="card empty">No notifications yet.</div>')+'</section>';
 $("#markAlertsRead").onclick=async()=>{const q=await db.from("crowspace_notifications").update({read_at:new Date().toISOString()}).eq("user_id",u.id).is("read_at",null);if(q.error)toast(q.error.message);else{toast("Notifications marked read");notificationsPage(db)}};
}
async function botPage(db){
 const slug=new URLSearchParams(location.search).get("bot");
 if(!slug){location.href="holiday-bots.html";return}
 const r=await db.from("crowspace_holiday_bots").select("*").eq("slug",slug).maybeSingle();
 if(r.error||!r.data){$("#bot").innerHTML='<div class="card empty">Holiday Bot not found.</div>';return}
 const b=r.data,posts=await db.from("crowspace_holiday_bot_posts").select("id,title,body,post_type,post_date,created_at").eq("bot_id",b.id).order("created_at",{ascending:false}).limit(50);
 $("#bot").innerHTML='<section class="hero"><div class="eyebrow">HOLIDAY NETWORK // BOT PROFILE</div><img class="avatar" src="'+esc(avatar(b.avatar_url))+'"><h1>'+esc(b.display_name||b.holiday_name||'Holiday Bot')+'</h1><p class="muted">'+esc(b.holiday_name||'CrowSpace Holiday Bot')+'</p><p>'+esc(b.bio||'Automated CrowSpace holiday personality.')+'</p><div class="actions"><a class="btn" href="holiday-bots.html">All Holiday Bots</a></div></section><section class="card pad" style="margin-top:16px"><h2>Bot Activity</h2>'+((posts.data||[]).map(x=>'<article class="post"><h3>'+esc(x.title||x.post_type||'Holiday Update')+'</h3><div class="muted">'+new Date(x.created_at||x.post_date).toLocaleString()+'</div><p>'+esc(x.body||'')+'</p></article>').join('')||'<div class="empty">No posts yet.</div>')+'</section>';
}
async function botsPage(db){const r=await db.from("crowspace_holiday_bots").select("slug,display_name,holiday_name,bio,avatar_url,active").eq("active",true).order("display_name");$("#bots").innerHTML='<section class="hero"><div class="eyebrow">AUTOMATED ACCOUNTS</div><h1>HOLIDAY BOTS.</h1><p class="muted">Follow the personalities that keep CrowSpace moving through the year.</p></section><section class="grid" style="margin-top:16px">'+(r.data||[]).map(x=>'<article class="card pad"><a href="holiday-bot.html?bot='+encodeURIComponent(x.slug)+'"><img class="avatar" src="'+esc(avatar(x.avatar_url))+'"></a><h3><a href="holiday-bot.html?bot='+encodeURIComponent(x.slug)+'">'+esc(x.display_name)+'</a></h3><div class="muted">'+esc(x.holiday_name)+'</div><p class="muted">'+esc(x.bio||"")+'</p><a class="btn" href="holiday-bot.html?bot='+encodeURIComponent(x.slug)+'">View Profile</a></article>').join("")+'</section>'}
document.addEventListener("DOMContentLoaded",()=>page().catch(e=>{console.error("[CrowSpace rebuild]",e);toast("CrowSpace could not load this page.")}));
})();