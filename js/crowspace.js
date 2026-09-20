const SUPABASE_URL='https://cevylpnoexugwgygvtgu.supabase.co';
const SUPABASE_KEY='sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-';

window.cs={client:null,user:null,profile:null,member:null,membership:null,channel:null,ready:null};
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function msg(id,text,ok=false){const el=$(id);if(el){el.textContent=text;el.className=ok?'success':'muted'}}
function authRequired(){if(cs.user)return true;msg('#pageMsg','Sign in through Universal CrowRules Membership to use this feature.');return false}
async function ensureIdentity(){
  if(!cs.user)return;
  try{await CrowRulesMembership.ensureCrow()}catch(e){}
  const p=await cs.client.from('crowspace_profiles').select('*').eq('user_id',cs.user.id).maybeSingle();
  cs.profile=p.data||null;
  const m=await cs.client.from('crowspace_members').select('*').eq('user_id',cs.user.id).maybeSingle();
  cs.member=m.data||null;
}
async function csInit(){
  cs.client=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  await cs.client.auth.getUser().then(r=>{cs.user=r.data.user||null});
  if(cs.user)await ensureIdentity();
  try{cs.membership=await CrowRulesMembership.status()}catch(e){cs.membership=null}
  await csTheme();
  renderNav();
  cs.client.auth.onAuthStateChange(async(_event,session)=>{cs.user=session?.user||null;if(cs.user)await ensureIdentity();try{cs.membership=await CrowRulesMembership.status()}catch(e){}renderNav();});
  return cs.client;
}
function renderNav(){
  const el=$('#nav');if(!el)return;
  const links=[['index.html','HOME'],['network.html','DECK'],['profile.html','PROFILE'],['members.html','MEMBERS'],['friends.html','FRIENDS'],['messages.html','MESSAGES'],['pictures.html','MEDIA'],['videos.html','VIDEOS'],['groups.html','GROUPS'],['watch-parties.html','WATCH'],['favorites.html','FAVORITES'],['leaderboard.html','RANK'],['events.html','EVENTS'],['rate-member.html','RATE'],['enemies.html','BLOCK']];
  el.innerHTML=links.map(x=>'<a href="'+x[0]+'">'+x[1]+'</a>').join('');
  const box=$('#authStatus');if(box){
    const plan=cs.membership?.membership?.plan_name||cs.membership?.membership?.plan_key||'Universal ID';
    box.innerHTML=cs.user?'<span class="chip">● '+esc(cs.profile?.display_name||cs.user.email||'MEMBER')+'</span><span class="chip">'+esc(plan)+'</span><button class="btn" id="signOut">SIGN OUT</button>':'<a class="btn primary" href="membership.html">UNIVERSAL ID / SIGN IN</a>';
    $('#signOut')?.addEventListener('click',async()=>{await cs.client.auth.signOut();location.href='membership.html'});
  }
}
async function csTheme(){
  const {data}=await cs.client.from('crowspace_holiday_themes').select('*').eq('is_active',true);
  const now=new Date().toISOString().slice(0,10);const t=(data||[]).find(x=>now>=x.starts_on&&now<=x.ends_on);
  if(t?.css_class)document.body.classList.add(t.css_class);
}
function shell(title,eyebrow,body){return '<section class="card"><div class="eyebrow">'+esc(eyebrow)+'</div><h1 class="title">'+esc(title)+'</h1>'+body+'<div id="pageMsg" class="muted" style="margin-top:12px"></div></section>'}
async function initHome(){
  const name=cs.profile?.display_name||cs.profile?.username;
  if($('#welcome'))$('#welcome').innerHTML=name?'WELCOME BACK, <span class="neon">'+esc(name).toUpperCase()+'</span>':'ENTER THE <span class="neon">CROWSPACE</span>';
  const [m,p,g,e]=await Promise.all([
    cs.client.from('crowspace_profiles').select('*',{count:'exact',head:true}),
    cs.client.from('crowspace_posts').select('*',{count:'exact',head:true}),
    cs.client.from('crowspace_groups').select('*',{count:'exact',head:true}),
    cs.client.from('crowspace_events').select('*',{count:'exact',head:true})
  ]);
  $('#memberCount').textContent=m.count||0;$('#postCount').textContent=p.count||0;$('#groupCount').textContent=g.count||0;$('#eventCount').textContent=e.count||0;
  const feed=await cs.client.from('crowspace_posts').select('id,body,media_url,media_type,created_at,author_id,like_count,comment_count').eq('status','published').eq('visibility','public').order('created_at',{ascending:false}).limit(12);
  const ids=(feed.data||[]).map(x=>x.author_id).filter(Boolean);
  const members=ids.length?(await cs.client.from('crowspace_members').select('id,user_id,display_name,username,avatar_url').in('id',ids)).data||[]:[];
  const map=new Map(members.map(x=>[x.id,x]));
  const box=$('#feed');if(!box)return;
  box.innerHTML=(feed.data||[]).map(x=>{const a=map.get(x.author_id)||{};return '<article class="item"><div class="statusbar"><span class="dot"></span> '+esc(a.display_name||a.username||'CrowSpace Member')+' · '+new Date(x.created_at).toLocaleString()+'</div><p>'+esc(x.body||'')+'</p>'+(x.media_url?(x.media_type==='video'?'<video controls style="max-width:100%;border-radius:10px" src="'+esc(x.media_url)+'"></video>':'<img style="max-width:100%;border-radius:10px" src="'+esc(x.media_url)+'">'):'')+'<div class="muted">♥ '+(x.like_count||0)+' · comments '+(x.comment_count||0)+'</div><button class="btn" data-like="'+x.id+'">LIKE</button></article>'}).join('')||'<div class="muted">The network is quiet. Be the first signal.</div>';
  $$('[data-like]').forEach(b=>b.onclick=async()=>{if(!authRequired())return;const r=await cs.client.from('crowspace_likes').insert({post_id:b.dataset.like,user_id:cs.user.id});if(r.error?.code==='23505')await cs.client.from('crowspace_likes').delete().eq('post_id',b.dataset.like).eq('user_id',cs.user.id);initHome()});
}
async function initProfile(){
  const app=$('#app');if(!app)return;
  if(!cs.user){app.innerHTML='<div class="eyebrow">AUTH REQUIRED</div><h2>Universal ID required</h2><p class="muted">Sign in to edit your CrowSpace identity.</p><a class="btn primary" href="membership.html">OPEN UNIVERSAL MEMBERSHIP</a>';return}
  $('#displayName').value=cs.profile?.display_name||'';$('#avatar').value=cs.profile?.avatar_url||'';$('#bio').value=cs.profile?.bio||'';
  $('#saveProfile').onclick=async()=>{const payload={user_id:cs.user.id,display_name:$('#displayName').value.trim(),bio:$('#bio').value.trim(),avatar_url:$('#avatar').value.trim(),updated_at:new Date().toISOString()};const r=await cs.client.from('crowspace_profiles').upsert(payload,{onConflict:'user_id'});msg('#profileMsg',r.error?r.error.message:'PROFILE LINKED · IDENTITY UPDATED',!r.error);if(!r.error)await ensureIdentity()};
}
async function initPicturesVideos(type){
  const grid=$('#mediaGrid');if(!grid)return;
  const r=await cs.client.from('crowspace_media').select('*').eq('media_type',type).eq('visibility','public').order('created_at',{ascending:false}).limit(100);
  grid.innerHTML=(r.data||[]).map(x=>'<article class="item"><h3>'+esc(x.title||type.toUpperCase())+'</h3>'+ (type==='video'?'<video controls style="width:100%" src="'+esc(x.media_url)+'"></video>':'<img style="width:100%;border-radius:10px" src="'+esc(x.media_url)+'">')+'<p class="muted">'+esc(x.description||'')+'</p></article>').join('')||'<div class="muted">No public media yet.</div>';
  if(cs.user){$('#mediaForm')?.addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const r=await cs.client.from('crowspace_media').insert({user_id:cs.user.id,media_type:type,title:f.get('title'),description:f.get('description'),media_url:f.get('media_url'),visibility:'public'});msg('#mediaMsg',r.error?.message||'MEDIA LINKED TO CROWSPACE',!r.error);if(!r.error){e.currentTarget.reset();initPicturesVideos(type)}})}
}
async function initMembers(){
  const run=async()=>{const q=$('#memberSearch')?.value.trim();let query=cs.client.from('crowspace_profiles').select('user_id,username,display_name,bio,avatar_url').eq('profile_visibility','public').limit(50);if(q)query=query.or('username.ilike.%'+q+'%,display_name.ilike.%'+q+'%');const r=await query;const box=$('#memberResults');box.innerHTML=(r.data||[]).map(x=>'<div class="item"><b>'+esc(x.display_name||x.username||'Member')+'</b><div class="muted">@'+esc(x.username||'member')+'</div><p>'+esc(x.bio||'')+'</p><div class="row"><button class="btn" data-friend="'+x.user_id+'">ADD FRIEND</button><button class="btn" data-message="'+x.user_id+'">MESSAGE</button></div></div>').join('')||'<div class="muted">No members found.</div>';$$('[data-friend]').forEach(b=>b.onclick=async()=>{if(!authRequired())return;const r=await cs.client.from('crowspace_friends').upsert({requester_id:cs.user.id,recipient_id:b.dataset.friend,status:'pending'},{onConflict:'requester_id,recipient_id'});msg('#memberMsg',r.error?.message||'FRIEND REQUEST SENT',!r.error)});$$('[data-message]').forEach(b=>b.onclick=()=>{location.href='messages.html?to='+encodeURIComponent(b.dataset.message)})};$('#memberSearch')?.addEventListener('input',run);$('#memberSearchBtn')?.addEventListener('click',run);await run();
}
async function initFriends(){
  if(!cs.user){$('#friendList').innerHTML='<div class="muted">Sign in to view your connections.</div>';return}
  const r=await cs.client.from('crowspace_friends').select('*').or('requester_id.eq.'+cs.user.id+',recipient_id.eq.'+cs.user.id).order('created_at',{ascending:false});const rows=r.data||[];const ids=[...new Set(rows.flatMap(x=>[x.requester_id,x.recipient_id]).filter(id=>id!==cs.user.id))];const p=ids.length?(await cs.client.from('crowspace_profiles').select('user_id,display_name,username,avatar_url').in('user_id',ids)).data||[]:[];const map=new Map(p.map(x=>[x.user_id,x]));$('#friendList').innerHTML=rows.map(x=>{const other=x.requester_id===cs.user.id?x.recipient_id:x.requester_id;const u=map.get(other)||{};return '<div class="item"><b>'+esc(u.display_name||u.username||other)+'</b><div class="muted">'+esc(x.status)+'</div>'+(x.recipient_id===cs.user.id&&x.status==='pending'?'<button class="btn primary" data-accept="'+x.requester_id+'">ACCEPT</button>':'')+'</div>'}).join('')||'<div class="muted">No connection records yet.</div>';$$('[data-accept]').forEach(b=>b.onclick=async()=>{await cs.client.from('crowspace_friends').update({status:'accepted',updated_at:new Date().toISOString()}).eq('requester_id',b.dataset.accept).eq('recipient_id',cs.user.id);initFriends()});
}
async function initMessages(){
  const to=new URLSearchParams(location.search).get('to');const recipient=$('#recipient');if(to&&recipient)recipient.value=to;
  if(!cs.user){$('#chatlog').innerHTML='<div class="muted">Sign in to use live messaging.</div>';return}
  const load=async()=>{const rid=recipient?.value.trim();if(!rid){$('#chatlog').innerHTML='<div class="muted">Enter a member UUID or select one from Members.</div>';return}const r=await cs.client.from('crowspace_messages').select('*').or('and(sender_id.eq.'+cs.user.id+',recipient_id.eq.'+rid+'),and(sender_id.eq.'+rid+',recipient_id.eq.'+cs.user.id+')').order('created_at',{ascending:true}).limit(100);$('#chatlog').innerHTML=(r.data||[]).map(x=>'<div class="chat-bubble '+(x.sender_id===cs.user.id?'mine':'')+'">'+esc(x.content)+'<small>'+new Date(x.created_at).toLocaleString()+'</small></div>').join('')||'<div class="muted">No messages yet.</div>';if(r.data?.length)await cs.client.from('crowspace_messages').update({is_read:true}).eq('recipient_id',cs.user.id).eq('sender_id',rid)};$('#loadChat')?.addEventListener('click',load);$('#send')?.addEventListener('click',async()=>{if(!authRequired())return;const rid=recipient.value.trim(),content=$('#message').value.trim();if(!rid||!content)return;const r=await cs.client.from('crowspace_messages').insert({sender_id:cs.user.id,recipient_id:rid,content,is_read:false});if(r.error)msg('#messageMsg',r.error.message);else{$('#message').value='';await load()}});await load();
}
async function initGroups(){
  const load=async()=>{const r=await cs.client.from('crowspace_groups').select('*').in('status',['future','planned','active']).order('created_at',{ascending:false});const box=$('#groups');box.innerHTML=(r.data||[]).map(x=>'<div class="item"><h3>'+esc(x.name)+'</h3><p>'+esc(x.description||'')+'</p><div class="muted">'+esc(x.visibility||'public')+' · '+esc(x.status||'active')+'</div><button class="btn" data-join="'+x.id+'">JOIN</button></div>').join('')||'<div class="muted">No groups yet.</div>';$$('[data-join]').forEach(b=>b.onclick=async()=>{if(!authRequired())return;const r=await cs.client.from('crowspace_group_members').upsert({group_id:b.dataset.join,user_id:cs.user.id,role:'member',status:'active'},{onConflict:'group_id,user_id'});msg('#groupMsg',r.error?.message||'JOINED GROUP',!r.error)})};$('#createGroup')?.addEventListener('click',async()=>{if(!authRequired())return;const name=prompt('Group name');if(!name)return;const r=await cs.client.from('crowspace_groups').insert({name,slug:name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),owner_id:cs.user.id,description:'',visibility:'public',status:'active'});msg('#groupMsg',r.error?.message||'GROUP CREATED',!r.error);load()});await load();
}
async function initWatch(){
  const load=async()=>{const r=await cs.client.from('crowspace_watch_parties').select('*').order('created_at',{ascending:false});$('#parties').innerHTML=(r.data||[]).map(x=>'<div class="item"><h3>'+esc(x.title)+'</h3><div class="muted">'+esc(x.status)+' · '+(x.scheduled_for?new Date(x.scheduled_for).toLocaleString():'unscheduled')+'</div><button class="btn" data-party="'+x.id+'">JOIN</button></div>').join('')||'<div class="muted">No watch parties yet.</div>';$$('[data-party]').forEach(b=>b.onclick=async()=>{if(!authRequired())return;const r=await cs.client.from('crowspace_watch_party_members').upsert({party_id:b.dataset.party,user_id:cs.user.id,role:'viewer'},{onConflict:'party_id,user_id'});msg('#partyMsg',r.error?.message||'JOINED WATCH PARTY',!r.error)})};$('#createParty')?.addEventListener('click',async()=>{if(!authRequired())return;const title=prompt('Watch party name');if(!title)return;const r=await cs.client.from('crowspace_watch_parties').insert({host_id:cs.user.id,title,status:'scheduled',is_public:true});msg('#partyMsg',r.error?.message||'WATCH PARTY CREATED',!r.error);load()});await load();
}
async function initFavorites(){if(!cs.user){$('#favorites').innerHTML='<div class="muted">Sign in to view favorites.</div>';return}const r=await cs.client.from('crowspace_favorites').select('*').eq('user_id',cs.user.id).order('created_at',{ascending:false});$('#favorites').innerHTML=(r.data||[]).map(x=>'<div class="item"><b>'+esc(x.target_type)+'</b><div class="muted">'+esc(x.target_id)+'</div></div>').join('')||'<div class="muted">No favorites yet.</div>'}
async function initLeaderboard(){const r=await cs.client.from('crowspace_member_leaderboard').select('*').order('points',{ascending:false}).limit(50);$('#leaderboard').innerHTML=(r.data||[]).map((x,i)=>'<div class="item"><b class="neon">#'+(i+1)+' '+esc(x.display_name||x.username||'Member')+'</b><div class="muted">'+(x.points||0)+' points · '+(x.friends||0)+' friends · '+(x.posts||0)+' posts · '+(x.likes||0)+' likes</div></div>').join('')||'<div class="muted">No ranking signals yet.</div>'}
async function initEvents(){const r=await cs.client.from('crowspace_events').select('*').order('starts_at',{ascending:true});$('#events').innerHTML=(r.data||[]).map(x=>'<div class="item"><h3>'+esc(x.title)+'</h3><div class="muted">'+new Date(x.starts_at).toLocaleString()+' · '+esc(x.event_type)+'</div><p>'+esc(x.description||'')+'</p>'+(cs.user?'<button class="btn" data-rsvp="'+x.id+'">RSVP</button>':'')+'</div>').join('')||'<div class="muted">No events scheduled.</div>';$$('[data-rsvp]').forEach(b=>b.onclick=async()=>{if(!authRequired())return;const r=await cs.client.from('crowspace_event_members').upsert({event_id:b.dataset.rsvp,user_id:cs.user.id,status:'going'},{onConflict:'event_id,user_id'});msg('#eventMsg',r.error?.message||'RSVP SAVED',!r.error)})}
async function initEnemies(){if(!cs.user){$('#enemies').innerHTML='<div class="muted">Sign in to manage your private block list.</div>';return}const load=async()=>{const r=await cs.client.from('crowspace_enemies').select('*').eq('user_id',cs.user.id);$('#enemies').innerHTML=(r.data||[]).map(x=>'<div class="item">'+esc(x.enemy_id)+' <button class="btn" data-remove-enemy="'+x.enemy_id+'">REMOVE</button></div>').join('')||'<div class="muted">No enemies listed.</div>';$$('[data-remove-enemy]').forEach(b=>b.onclick=async()=>{await cs.client.from('crowspace_enemies').delete().eq('user_id',cs.user.id).eq('enemy_id',b.dataset.removeEnemy);load()})};$('#addEnemy')?.addEventListener('click',async()=>{const id=$('#enemyId').value.trim();if(!id||!authRequired())return;const r=await cs.client.from('crowspace_enemies').insert({user_id:cs.user.id,enemy_id:id});msg('#enemyMsg',r.error?.message||'BLOCK LIST UPDATED',!r.error);load()});await load()}
async function initRating(){if(!cs.user)return;$('#submitRating')?.addEventListener('click',async()=>{const r=await cs.client.from('crowspace_member_ratings').upsert({rater_id:cs.user.id,member_id:$('#memberId').value.trim(),rating:Number($('#rating').value),review:$('#review').value.trim(),updated_at:new Date().toISOString()},{onConflict:'rater_id,member_id'});msg('#ratingMsg',r.error?.message||'RATING SAVED',!r.error)})}
async function initNetwork(){const d=$('#networkTime');if(d)setInterval(()=>d.textContent=new Date().toLocaleTimeString(),1000);const r=await cs.client.from('crowspace_channels').select('*').eq('is_active',true).order('sort_order');$('#channelGrid').innerHTML=(r.data||[]).map(x=>'<a class="quick" href="index.html#feed"><i>'+esc(x.icon||'◈')+'</i>'+esc(x.name||x.channel_key)+'</a>').join('')||'<span class="muted">NETWORK CHANNELS OFFLINE</span>'}
async function initMembershipPage(){const box=$('#membershipStatus');if(!box)return;try{const s=await CrowRulesMembership.status();box.innerHTML=s.authenticated?'<div class="statusbar"><span class="dot"></span> UNIVERSAL ID ACTIVE</div><h2>'+esc(s.membership?.plan_name||s.membership?.plan_key||'Crow Membership')+'</h2><p class="muted">This identity is the same CrowRules account used across the CrowRules universe.</p><button class="btn" id="membershipSignOut">SIGN OUT</button>':'<div class="statusbar"><span class="dot"></span> UNIVERSAL ID READY</div><p class="muted">Use the main CrowRules Universal Membership page to sign in or create your account.</p><a class="btn primary" href="https://crowrulesentertainment-oss.github.io/crowrulesentertainment/membership.html">OPEN UNIVERSAL MEMBERSHIP</a>';$('#membershipSignOut')?.addEventListener('click',async()=>{await cs.client.auth.signOut();location.reload()})}catch(e){box.innerHTML='<div class="muted">Membership service unavailable right now.</div>'}}
document.addEventListener('DOMContentLoaded',async()=>{await csInit();const page=document.body.dataset.page;const jobs={home:initHome,profile:initProfile,pictures:()=>initPicturesVideos('picture'),videos:()=>initPicturesVideos('video'),members:initMembers,friends:initFriends,messages:initMessages,groups:initGroups,watch:initWatch,favorites:initFavorites,leaderboard:initLeaderboard,events:initEvents,enemies:initEnemies,rating:initRating,network:initNetwork,membership:initMembershipPage};if(jobs[page])await jobs[page]();});
