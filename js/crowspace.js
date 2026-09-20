const SUPABASE_URL=window.CrowSpaceConfig?.url||'https://cevylpnoexugwgygvtgu.supabase.co';
const SUPABASE_KEY=window.CrowSpaceConfig?.key||'sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-';

window.cs={client:null,user:null,profile:null,member:null,membership:null,channel:null,ready:null};
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function msg(id,text,ok=false){const el=$(id);if(el){el.textContent=text;el.className=ok?'success':'muted'}}
function authRequired(){if(cs.user)return true;msg('#pageMsg','Sign in through Universal CrowRules Membership to use this feature.');return false}
async function ensureIdentity(){
  if(!cs.user)return;
  // Automatically provision the user's MySpace-style CrowSpace identity on first login.
  try{await CrowRulesMembership.ensureCrow()}catch(e){}
  const meta=cs.user.user_metadata||{};
  const emailName=(cs.user.email||'member').split('@')[0];
  const base=String(meta.username||meta.user_name||emailName).toLowerCase().replace(/[^a-z0-9_]+/g,'_').replace(/^_+|_+$/g,'').slice(0,30)||'crowmember';
  const display=String(meta.full_name||meta.name||meta.display_name||emailName||'CrowSpace Member').trim().slice(0,80);
  let p=await cs.client.from('crowspace_profiles').select('*').eq('user_id',cs.user.id).maybeSingle();
  if(!p.data){
    const username=base+'_'+cs.user.id.replace(/-/g,'').slice(0,6);
    const seed={user_id:cs.user.id,username,display_name:display,bio:'Welcome to my CrowSpace. Building my place in the CrowRules universe.',avatar_url:meta.avatar_url||meta.picture||null,theme:'crow-dark',accent_color:'#e10600',profile_visibility:'public',guestbook_visibility:'public'};
    const created=await cs.client.from('crowspace_profiles').insert(seed).select('*').single();
    p={data:created.data,error:created.error};
  }
  if(p.error)console.warn('CrowSpace profile provisioning:',p.error.message);
  cs.profile=p.data||null;
  if(cs.profile){
    const memberSeed={user_id:cs.user.id,display_name:cs.profile.display_name,username:cs.profile.username,bio:cs.profile.bio,avatar_url:cs.profile.avatar_url,location:cs.profile.location,website_url:cs.profile.website_url,is_public:cs.profile.profile_visibility!=='private'};
    const existing=await cs.client.from('crowspace_members').select('id').eq('user_id',cs.user.id).maybeSingle();
    if(!existing.data)await cs.client.from('crowspace_members').insert(memberSeed);
    else await cs.client.from('crowspace_members').update(memberSeed).eq('user_id',cs.user.id);
  }
  const m=await cs.client.from('crowspace_members').select('*').eq('user_id',cs.user.id).maybeSingle();
  cs.member=m.data||null;
}
async function csInit(){
  if(window.CrowSpaceSupabase?.connect) await window.CrowSpaceSupabase.connect();
  cs.client=window.CrowSpaceSupabaseClient||(window.CrowSpaceSupabase&&await window.CrowSpaceSupabase.connect())||window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  await cs.client.auth.getUser().then(r=>{cs.user=r.data.user||null});
  if(cs.user)await ensureIdentity();
  try{cs.membership=await CrowRulesMembership.status()}catch(e){cs.membership=null}
  await csTheme();
  renderNav();
  window.dispatchEvent(new CustomEvent('crowspace:ready'));
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
  const app=$('#app'); if(!app)return;
  const params=new URLSearchParams(location.search);
  const requested=(params.get('u')||params.get('username')||'').trim();
  const requestedId=(params.get('id')||'').trim();
  let target=null;
  if(requested){
    const r=await cs.client.from('crowspace_profiles').select('*').ilike('username',requested).maybeSingle();
    target=r.data||null;
  }else if(requestedId){
    const r=await cs.client.from('crowspace_profiles').select('*').eq('user_id',requestedId).maybeSingle();
    target=r.data||null;
  }else if(cs.profile){
    target=cs.profile;
  }
  if(!target){
    app.innerHTML='<section class="card"><div class="eyebrow">PROFILE NOT FOUND</div><h1 class="title">NO SIGNAL</h1><p class="muted">That CrowSpace identity does not exist or is not public.</p><a class="btn primary" href="members.html">FIND MEMBERS</a></section>';
    return;
  }
  const owner=!!cs.user&&cs.user.id===target.user_id;
  const targetMemberR=await cs.client.from('crowspace_members').select('id,user_id').eq('user_id',target.user_id).maybeSingle();
  const targetMember=targetMemberR.data||null;
  if(target.profile_visibility==='private'&&!owner){
    app.innerHTML='<section class="card"><div class="eyebrow">PRIVATE PROFILE</div><h1 class="title">ACCESS RESTRICTED</h1><p class="muted">This member has limited public profile visibility.</p></section>';
    return;
  }
  const escA=esc(target.avatar_url||'');
  const banner=target.banner_url||target.background_url||'';
  document.body.style.setProperty('--profile-accent',target.accent_color||'#e10600');
  const [friendsR,postsR,mediaR,groupsR,ratingsR,statusR,badgesR,guestR]=await Promise.all([
    cs.client.from('crowspace_friends').select('requester_id,recipient_id').eq('status','accepted').or('requester_id.eq.'+target.user_id+',recipient_id.eq.'+target.user_id),
    cs.client.from('crowspace_posts').select('id,body,media_url,media_type,created_at,like_count,comment_count,author_id').eq('status','published').eq('visibility','public').order('created_at',{ascending:false}).limit(12),
    cs.client.from('crowspace_media').select('*').eq('user_id',target.user_id).eq('visibility','public').order('created_at',{ascending:false}).limit(12),
    cs.client.from('crowspace_group_members').select('group_id,role,status').eq('user_id',target.user_id).eq('status','active').limit(12),
    cs.client.from('crowspace_member_ratings').select('rating,review,created_at').eq('member_id',target.user_id).order('created_at',{ascending:false}).limit(12),
    cs.client.from('crowspace_statuses').select('*').eq('user_id',target.user_id).maybeSingle(),
    cs.client.from('crowspace_user_achievements').select('earned_at,achievement:crowspace_achievements(id,code,name,description,icon)').eq('user_id',target.user_id).order('earned_at',{ascending:false}).limit(12),
    cs.client.from('crowspace_guestbook').select('id,author_id,message,created_at,status').eq('profile_id',target.user_id).order('created_at',{ascending:false}).limit(20)
  ]);
  const friendRows=friendsR.data||[];
  const friendIds=[...new Set(friendRows.flatMap(x=>[x.requester_id,x.recipient_id]).filter(x=>x!==target.user_id))].slice(0,12);
  const fp=friendIds.length?(await cs.client.from('crowspace_profiles').select('user_id,username,display_name,avatar_url').in('user_id',friendIds)).data||[]:[];
  const friendMap=new Map(fp.map(x=>[x.user_id,x]));
  const groups=groupsR.data||[];
  const gp=groups.length?(await cs.client.from('crowspace_groups').select('id,name,slug').in('id',groups.map(x=>x.group_id))).data||[]:[];
  const groupMap=new Map(gp.map(x=>[x.id,x]));
  const postRows=(postsR.data||[]).filter(x=>x.author_id===targetMember?.id||x.author_id===target.user_id);
  const posts=postRows;
  const ratings=ratingsR.data||[];
  const avg=ratings.length?(ratings.reduce((s,x)=>s+Number(x.rating||0),0)/ratings.length).toFixed(1):'—';
  const status=statusR.data||{};
  const badges=badgesR.data||[];
  const guestbook=guestR.data||[];
  const media=mediaR.data||[];
  const pictures=media.filter(x=>x.media_type==='picture');
  const videos=media.filter(x=>x.media_type==='video');
  const profileUrl='profile.html?u='+encodeURIComponent(target.username||'');
  const website=target.website_url?'<a class="btn" target="_blank" rel="noopener" href="'+esc(target.website_url)+'">VISIT WEBSITE</a>':'';
  const avatar=escA?'<img class="profile-avatar-lg" src="'+escA+'" alt="">':'<div class="profile-avatar-lg avatar-placeholder">CROW</div>';
  const bg=banner?'style="--profile-banner:url(\''+esc(banner).replace(/'/g,"%27")+'\')"':'';
  app.innerHTML='<section class="profile-page theme-'+esc(target.theme||'crow-dark')+'" '+bg+'>'+
    '<div class="profile-cover"><div class="profile-cover-overlay"></div><div class="profile-identity">'+avatar+
    '<div><div class="eyebrow">CROWSPACE IDENTITY</div><h1 class="profile-name">'+esc(target.display_name||target.username||'CrowSpace Member')+'</h1><div class="profile-handle">@'+esc(target.username||'member')+'</div>'+
    '<div class="row profile-meta">'+(target.location?'<span class="chip">⌖ '+esc(target.location)+'</span>':'')+'<span class="chip">● UNIVERSAL ID</span><span class="chip">'+esc(target.theme||'crow-dark').toUpperCase()+'</span></div></div></div></div>'+
    '<div class="profile-actions row">'+(owner?'<a class="btn primary" href="#edit-profile">EDIT MY PROFILE</a>':'<button class="btn primary" data-profile-friend="'+esc(target.user_id)+'">ADD FRIEND</button><button class="btn" data-profile-message="'+esc(target.user_id)+'">MESSAGE</button><button class="btn" data-profile-favorite="'+esc(target.user_id)+'">♥ FAVORITE</button><a class="btn" href="rate-member.html?member='+encodeURIComponent(target.user_id)+'">RATE MEMBER</a><button class="btn danger" data-profile-block="'+esc(target.user_id)+'">BLOCK</button>')+website+'</div>'+
    '<div class="profile-stats"><div><b>'+friendRows.length+'</b><span>FRIENDS</span></div><div><b>'+posts.length+'</b><span>POSTS</span></div><div><b>'+pictures.length+'</b><span>PICTURES</span></div><div><b>'+videos.length+'</b><span>VIDEOS</span></div><div><b>'+avg+'</b><span>RATING</span></div></div>'+
    '<div class="profile-layout"><div class="profile-main">'+
      '<section class="card profile-section"><div class="section-kicker">ABOUT ME</div><h2>'+esc(target.display_name||'My CrowSpace')+'</h2><p class="profile-bio">'+esc(target.bio||'No bio signal yet.')+'</p><div class="about-grid">'+(status.mood?'<div><b>MOOD</b><span>'+esc(status.mood)+'</span></div>':'')+(status.location_text?'<div><b>NOW AT</b><span>'+esc(status.location_text)+'</span></div>':'')+(status.music_text?'<div><b>NOW PLAYING</b><span>♫ '+esc(status.music_text)+'</span></div>':'')+'</div></section>'+
      '<section class="card profile-section"><div class="section-kicker">LATEST POSTS</div><div class="list">'+(posts.map(x=>'<article class="item"><div class="statusbar"><span class="dot"></span>'+new Date(x.created_at).toLocaleString()+'</div><p>'+esc(x.body||'')+'</p>'+(x.media_url?(x.media_type==='video'?'<video controls src="'+esc(x.media_url)+'"></video>':'<img src="'+esc(x.media_url)+'">'):'')+'<div class="muted">♥ '+(x.like_count||0)+' · '+(x.comment_count||0)+' comments</div></article>').join('')||'<div class="muted">No public posts yet.</div>')+'</div></section>'+
      '<section class="card profile-section"><div class="section-kicker">PICTURES</div><div class="media-grid profile-media">'+(pictures.map(x=>'<a href="'+esc(x.media_url)+'" target="_blank" rel="noopener"><img src="'+esc(x.thumbnail_url||x.media_url)+'" alt="'+esc(x.title||'Picture')+'"></a>').join('')||'<div class="muted">No public pictures yet.</div>')+'</div></section>'+
      '<section class="card profile-section"><div class="section-kicker">VIDEOS</div><div class="media-grid profile-media">'+(videos.map(x=>'<article><video controls poster="'+esc(x.thumbnail_url||'')+'" src="'+esc(x.media_url)+'"></video><div class="muted">'+esc(x.title||'CrowSpace Video')+'</div></article>').join('')||'<div class="muted">No public videos yet.</div>')+'</div></section>'+
      '<section class="card profile-section"><div class="section-kicker">GUESTBOOK</div><div id="guestbook" class="list">'+(guestbook.map(x=>'<article class="item"><div class="statusbar">'+new Date(x.created_at).toLocaleString()+'</div><p>'+esc(x.message)+'</p><div class="muted">Guestbook entry</div></article>').join('')||'<div class="muted">Be the first to sign the guestbook.</div>')+'</div>'+
      (target.guestbook_visibility!=='private'&&cs.user&&!owner?'<div class="guestbook-form"><textarea id="guestbookMessage" class="textarea" placeholder="Leave a message on this profile..."></textarea><button id="signGuestbook" class="btn primary">SIGN GUESTBOOK</button><span id="guestbookMsg" class="muted"></span></div>':'')+'</section>'+
    '</div><aside class="profile-side">'+
      '<section class="card profile-section"><div class="section-kicker">TOP FRIENDS</div><div class="top-friends">'+(fp.map(x=>'<a href="profile.html?u='+encodeURIComponent(x.username||'')+'">'+(x.avatar_url?'<img src="'+esc(x.avatar_url)+'" alt="">':'<div class="avatar-placeholder small">◉</div>')+'<span>'+esc(x.display_name||x.username||'Member')+'</span></a>').join('')||'<div class="muted">No public friends yet.</div>')+'</div></section>'+
      '<section class="card profile-section"><div class="section-kicker">GROUPS</div><div class="list">'+(gp.map(x=>'<a class="item" href="groups.html"><b>'+esc(x.name)+'</b><div class="muted">CrowSpace group</div></a>').join('')||'<div class="muted">No groups yet.</div>')+'</div></section>'+
      '<section class="card profile-section"><div class="section-kicker">BADGES</div><div class="badge-grid">'+(badges.map(x=>'<div class="badge"><strong>'+esc(x.achievement?.icon||'◆')+'</strong><b>'+esc(x.achievement?.name||'Achievement')+'</b><span>'+esc(x.achievement?.description||'')+'</span></div>').join('')||'<div class="muted">No badges earned yet.</div>')+'</div></section>'+
      '<section class="card profile-section"><div class="section-kicker">FAVORITES / SIGNAL</div><div class="terminal"><b>NETWORK STATUS:</b> ACTIVE<br><b>THEME:</b> '+esc(target.theme||'crow-dark')+'<br><b>MEDIA:</b> '+media.length+' public items<br><b>RATING:</b> '+avg+'</div></section>'+
      (owner?'<section id="edit-profile" class="card profile-section"><div class="section-kicker">CUSTOMIZE PROFILE</div><div class="form"><label>Display name<input id="displayName" class="input" value="'+esc(target.display_name||'')+'"></label><label>Username<input id="username" class="input" disabled value="'+esc(target.username||'')+'"></label><label>Avatar URL<input id="avatar" class="input" value="'+esc(target.avatar_url||'')+'"></label><label>Banner URL<input id="banner" class="input" value="'+esc(target.banner_url||'')+'"></label><label>Background URL<input id="background" class="input" value="'+esc(target.background_url||'')+'"></label><label>Location<input id="location" class="input" value="'+esc(target.location||'')+'"></label><label>Website<input id="website" class="input" value="'+esc(target.website_url||'')+'"></label><label>Bio<textarea id="bio" class="textarea">'+esc(target.bio||'')+'</textarea></label><label>Theme<select id="theme" class="select"><option value="crow-dark">Crow Dark</option><option value="cyberpunk">Cyberpunk</option><option value="halloween">Halloween</option><option value="christmas">Christmas</option></select></label><label>Accent color<input id="accent" class="input" value="'+esc(target.accent_color||'#e10600')+'"></label><label>Profile visibility<select id="visibility" class="select"><option value="public">Public</option><option value="private">Private</option></select></label><label>Guestbook visibility<select id="guestVisibility" class="select"><option value="public">Public</option><option value="private">Private</option></select></label><button id="saveProfile" class="btn primary">SAVE PROFILE DESIGN</button><div id="profileMsg" class="muted"></div></div></section>':'')+
    '</aside></div></section>';
  if(owner){
    $('#theme').value=target.theme||'crow-dark';$('#visibility').value=target.profile_visibility||'public';$('#guestVisibility').value=target.guestbook_visibility||'public';
    $('#saveProfile').onclick=async()=>{const payload={user_id:cs.user.id,display_name:$('#displayName').value.trim(),bio:$('#bio').value.trim(),avatar_url:$('#avatar').value.trim(),banner_url:$('#banner').value.trim(),background_url:$('#background').value.trim(),location:$('#location').value.trim(),website_url:$('#website').value.trim(),theme:$('#theme').value,accent_color:$('#accent').value.trim()||'#e10600',profile_visibility:$('#visibility').value,guestbook_visibility:$('#guestVisibility').value,updated_at:new Date().toISOString()};const r=await cs.client.from('crowspace_profiles').upsert(payload,{onConflict:'user_id'});msg('#profileMsg',r.error?.message||'PROFILE DESIGN SAVED',!r.error);if(!r.error){await ensureIdentity();location.href=profileUrl}};
  }
  $('[data-profile-friend]')?.addEventListener('click',async()=>{if(!authRequired())return;const r=await cs.client.from('crowspace_friends').upsert({requester_id:cs.user.id,recipient_id:target.user_id,status:'pending'},{onConflict:'requester_id,recipient_id'});msg('#pageMsg',r.error?.message||'FRIEND REQUEST SENT',!r.error)});
  $('[data-profile-message]')?.addEventListener('click',()=>location.href='messages.html?to='+encodeURIComponent(target.user_id));
  $('[data-profile-favorite]')?.addEventListener('click',async()=>{if(!authRequired())return;const r=await cs.client.from('crowspace_favorites').upsert({user_id:cs.user.id,target_type:'member',target_id:target.user_id});msg('#pageMsg',r.error?.message||'PROFILE FAVORITED',!r.error)});
  $('[data-profile-block]')?.addEventListener('click',async()=>{if(!authRequired())return;const r=await cs.client.from('crowspace_enemies').upsert({user_id:cs.user.id,enemy_id:target.user_id});msg('#pageMsg',r.error?.message||'MEMBER BLOCKED',!r.error)});
  $('#signGuestbook')?.addEventListener('click',async()=>{if(!authRequired())return;const message=$('#guestbookMessage').value.trim();if(!message)return;const r=await cs.client.from('crowspace_guestbook').insert({profile_id:target.user_id,author_id:cs.user.id,message,status:'approved'});msg('#guestbookMsg',r.error?.message||'GUESTBOOK ENTRY ADDED',!r.error);if(!r.error)location.reload()});
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
async function enhanceProfileEditor(){
  const params=new URLSearchParams(location.search);
  if(params.get('u')||params.get('username')||params.get('id')||!cs.user)return;
  const target=cs.profile;if(!target)return;
  const editor=$('#edit-profile');if(!editor)return;
  const old=editor.querySelector('.profile-customization-plus');if(old)old.remove();
  const friends=(await cs.client.from('crowspace_friends').select('requester_id,recipient_id').eq('status','accepted').or('requester_id.eq.'+cs.user.id+',recipient_id.eq.'+cs.user.id)).data||[];
  const ids=[...new Set(friends.flatMap(x=>[x.requester_id,x.recipient_id]).filter(x=>x!==cs.user.id))].slice(0,40);
  const rows=ids.length?(await cs.client.from('crowspace_profiles').select('user_id,username,display_name,avatar_url').in('user_id',ids)).data||[]:[];
  const hidden=new Set((target.profile_layout?.hidden)||[]);
  const top=new Set(Array.isArray(target.top_friends)?target.top_friends:[]);
  const box=document.createElement('div');box.className='profile-customization-plus editor-panel';
  box.innerHTML='<div class="section-kicker">MYSPACE PERSONALIZATION</div><p class="muted">Choose what appears publicly and build your classic Top 8.</p>'+
    '<div class="editor-panel"><b>PUBLIC SECTIONS</b><div class="checkgrid">'+['about','friends','posts','pictures','videos','groups','favorites','guestbook','badges','music'].map(k=>'<label><input type="checkbox" data-visibility="'+k+'" '+(!hidden.has(k)?'checked':'')+'> '+k.toUpperCase()+'</label>').join('')+'</div></div>'+
    '<div class="editor-panel"><b>TOP 8 FRIENDS</b><div class="top8-picker">'+(rows.map(x=>'<label class="top8-option"><input type="checkbox" data-top8 value="'+esc(x.user_id)+'" '+(top.has(x.user_id)?'checked':'')+'><span>'+(x.avatar_url?'<img src="'+esc(x.avatar_url)+'" alt="">':'<i>◉</i>')+esc(x.display_name||x.username||'Member')+'</span></label>').join('')||'<span class="muted">Accept friends to populate your Top 8.</span>')+'</div></div>'+
    '<div class="editor-panel"><b>PROFILE LAYOUT</b><div class="muted">Drag-and-drop ordering will use this section map in the next editor layer. Your visibility choices are saved now.</div></div>';
  editor.appendChild(box);
  editor.querySelector('#saveProfile')?.addEventListener('click',async()=>{
    const hiddenSections=$('[data-visibility]').filter(x=>!x.checked).map(x=>x.dataset.visibility);
    const top8=$('[data-top8]:checked').map(x=>x.value).slice(0,8);
    const payload={profile_layout:{order:['about','friends','posts','pictures','videos','groups','favorites','guestbook','badges','music'],hidden:hiddenSections},top_friends:top8,show_badges:!hiddenSections.includes('badges'),show_music:!hiddenSections.includes('music'),show_favorites:!hiddenSections.includes('favorites'),show_groups:!hiddenSections.includes('groups'),show_guestbook:!hiddenSections.includes('guestbook'),show_posts:!hiddenSections.includes('posts'),show_media:!hiddenSections.includes('pictures')&&!hiddenSections.includes('videos'),updated_at:new Date().toISOString()};
    const r=await cs.client.from('crowspace_profiles').update(payload).eq('user_id',cs.user.id);
    msg('#profileMsg',r.error?.message||'MYSPACE PERSONALIZATION SAVED',!r.error);
    if(!r.error)setTimeout(()=>location.reload(),500);
  },{once:true});
}
\ndocument.addEventListener('DOMContentLoaded',async()=>{await csInit();const page=document.body.dataset.page;const jobs={home:initHome,profile:initProfile,pictures:()=>initPicturesVideos('picture'),videos:()=>initPicturesVideos('video'),members:initMembers,friends:initFriends,messages:initMessages,groups:initGroups,watch:initWatch,favorites:initFavorites,leaderboard:initLeaderboard,events:initEvents,enemies:initEnemies,rating:initRating,network:initNetwork,membership:initMembershipPage};if(jobs[page]){await jobs[page]();if(page==='profile')await enhanceProfileEditor();}});
