/* CrowSpace Universal Surface Connector — V21 Universal Interaction Layer */
(function(){
'use strict';
const links=[
 ['⌂ Home','home.html'],['◉ Profile','profile.html'],['⌕ Search','search.html'],['▶ Caws','caws.html'],
 ['◌ Circles','circles.html'],['👥 Friends','friends.html'],['✉ Messages','messages.html'],['● Alerts','notifications.html'],
 ['◇ Discover','discovery.html'],['★ Members','members.html'],['✨ For You','recommendations.html'],['🏆 Rankings','rankings.html'],['🎂 Birthdays','birthdays.html'],['▣ Groups','groups.html'],['◉ Circles','circles.html'],['📅 Events','events.html'],['📰 News','news.html'],['🎬 Creator Studio','creator-studio.html'],['🎉 Holiday Hub','holiday-hub.html'],['⚡ Activity','activity.html'],['⚙ Settings','settings.html']
];
const sub=[['Feed','feed.html'],['For You','recommendations.html'],['Explore','explore.html'],['Holiday Bots','holiday-bots.html'],['Account','account.html'],['Caw Studio','caw-studio.html'],['Birthdays','birthdays.html'],['Holiday Hub','holiday-hub.html'],['News','news.html'],['Creator Studio','creator-studio.html'],['Activity','activity.html']];
const active=path=>{const p=location.pathname.split('/').pop()||'home.html';return p===path};
function makeLink(label,href,activeClass=''){const a=document.createElement('a');a.href=href;a.textContent=label;if(activeClass)a.className=activeClass;return a}
function nav(){
 const old=document.querySelector('.navin'),oldNav=old?.closest('.nav'),top=document.querySelector('.topbar');
 const groups=[
  ['HOME',[['⌂ Home','home.html'],['✨ For You','recommendations.html'],['▣ Feed','feed.html']]],
  ['SOCIAL',[['◉ Profile','profile.html'],['👥 Friends','friends.html'],['★ Members','members.html'],['✉ Messages','messages.html'],['● Alerts','notifications.html'],['◌ Circles','circles.html']]],
  ['DISCOVER',[['⌕ Search','search.html'],['◇ Discover','discovery.html'],['⚡ Activity','activity.html'],['🏆 Rankings','rankings.html'],['🎂 Birthdays','birthdays.html']]],
  ['CONTENT',[['▶ Caws','caws.html'],['▣ Groups','groups.html'],['📅 Events','events.html'],['📰 News','news.html']]],
  ['CREATE',[['🎬 Creator Studio','creator-studio.html'],['◈ Caw Studio','caw-studio.html']]],
  ['CROWRULES',[['🎉 Holiday Hub','holiday-hub.html'],['🤖 Holiday Bots','holiday-bots.html']]],
  ['ACCOUNT',[['⚙ Settings','settings.html'],['◉ Account','account.html']]]
 ];
 const makeMenu=(label,items)=>{
  const wrap=document.createElement('div');wrap.className='cs-nav-menu';
  const btn=document.createElement('button');btn.className='cs-nav-menu-btn';btn.type='button';btn.setAttribute('aria-expanded','false');btn.innerHTML='<span>'+label+'</span><b>⌄</b>';
  const panel=document.createElement('div');panel.className='cs-nav-dropdown';panel.setAttribute('role','menu');
  items.forEach(([text,href])=>{const a=makeLink(text,href,active(href)?'cs-active':'');a.setAttribute('role','menuitem');panel.appendChild(a)});
  btn.addEventListener('click',e=>{e.stopPropagation();document.querySelectorAll('.cs-nav-menu.is-open').forEach(x=>{if(x!==wrap){x.classList.remove('is-open');x.querySelector('button')?.setAttribute('aria-expanded','false')}});const open=wrap.classList.toggle('is-open');btn.setAttribute('aria-expanded',String(open))});
  wrap.append(btn,panel);return wrap;
 };
 const build=(host)=>{
  host.innerHTML='';
  groups.forEach(([label,items])=>host.appendChild(makeMenu(label,items)));
 };
 if(top){
  const nav=top.querySelector('.global-nav');
  if(nav){build(nav);nav.classList.add('cs-organized-nav');injectTools(top);}
  return;
 }
 const bar=document.createElement('header');bar.className='cs-globalbar';
 bar.innerHTML='<div class="cs-globalbar-inner"><a class="cs-brand" href="home.html">CROW<span>SPACE</span></a><nav class="cs-nav" aria-label="Universal CrowSpace navigation"></nav><div class="cs-universal-tools"><button class="cs-tool cs-desktop-search" id="cs-search-btn" aria-label="Search">⌕</button><button class="cs-tool cs-universal-mobile" id="cs-mobile-btn" aria-label="Menu">☰</button></div><div class="cs-account cs-account-wrap"><span class="cs-status"><i class="cs-dot"></i><span id="cs-status-text">CONNECTING</span></span><a href="login.html" id="cs-login">LOG IN</a><a class="cs-primary" href="signup.html" id="cs-join">JOIN</a></div></div><div class="cs-subbar"></div>';
 if(oldNav)oldNav.replaceWith(bar);else if(old)old.replaceWith(bar);else document.body.insertBefore(bar,document.body.firstChild);
 build(bar.querySelector('.cs-nav'));
 const sb=bar.querySelector('.cs-subbar');
 sub.forEach(([label,href])=>sb.appendChild(makeLink(label,href)));
 injectTools(bar);
 const community=document.querySelector('.community-links');if(community)community.style.display='none';
 document.addEventListener('click',()=>document.querySelectorAll('.cs-nav-menu.is-open').forEach(x=>{x.classList.remove('is-open');x.querySelector('button')?.setAttribute('aria-expanded','false')}));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.cs-nav-menu.is-open').forEach(x=>x.classList.remove('is-open'))});
}
function injectTools(top){
 if(top.querySelector('#cs-search-btn'))return;
 const actions=top.querySelector('.top-actions')||top.querySelector('.cs-account');
 if(!actions)return;
 const tools=document.createElement('div');tools.className='cs-universal-tools';
 tools.innerHTML='<button class="cs-tool cs-desktop-search" id="cs-search-btn" aria-label="Global search">⌕</button><button class="cs-tool cs-universal-mobile" id="cs-mobile-btn" aria-label="Navigation menu">☰</button>';
 actions.parentNode.insertBefore(tools,actions);
}
function footer(){
 if(document.querySelector('.cs-footer'))return;
 const f=document.createElement('footer');f.className='cs-footer';
 f.innerHTML='<span>CrowSpace · CrowRules · One Account. One Universe.</span><span><a href="home.html">Home</a> · <a href="members.html">Members</a> · <a href="rankings.html">Rankings</a> · <a href="settings.html">Settings</a> · <a href="account.html">Account</a></span>';
 document.body.appendChild(f);
}
function overlays(){
 if(document.getElementById('cs-search-overlay'))return;
 const o=document.createElement('div');o.id='cs-search-overlay';o.className='cs-search-overlay';
 o.innerHTML='<div class="cs-search-box"><button class="cs-search-close" id="cs-search-close" aria-label="Close">✕</button><div class="cs-menu-label">CROWSPACE GLOBAL SEARCH</div><input id="cs-global-search" autocomplete="off" placeholder="Search members, posts, Caws, circles, groups…"><div id="cs-search-results" class="cs-search-results"><div class="cs-search-result"><span>⌕</span><span>Type to search CrowSpace.</span></div></div></div>';
 document.body.appendChild(o);
 document.getElementById('cs-search-close').onclick=()=>o.classList.remove('open');
 o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open')});
 document.getElementById('cs-search-btn')?.addEventListener('click',()=>{o.classList.add('open');setTimeout(()=>document.getElementById('cs-global-search')?.focus(),30)});
 document.getElementById('cs-global-search').addEventListener('input',()=>globalSearch());
 document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();o.classList.add('open');document.getElementById('cs-global-search').focus()}if(e.key==='Escape')o.classList.remove('open')});
}
async function globalSearch(){
 const input=document.getElementById('cs-global-search'),box=document.getElementById('cs-search-results'),q=input?.value.trim();
 if(!box)return;
 if(!q){box.innerHTML='<div class="cs-search-result"><span>⌕</span><span>Type to search CrowSpace.</span></div>';return}
 const db=window.CrowSpaceUniversal?.db;if(!db){box.innerHTML='<div class="cs-search-result">Connecting…</div>';return}
 const like='%'+q.replace(/[%_]/g,'')+'%';
 try{
  const [p,c]=await Promise.all([
   db.from('crowspace_profiles').select('user_id,username,display_name,bio').or('display_name.ilike.'+like+',username.ilike.'+like+',bio.ilike.'+like).limit(8),
   db.from('crowspace_posts').select('id,user_id,title,body').or('title.ilike.'+like+',body.ilike.'+like).limit(8)
  ]);
  const html=[];
  (p.data||[]).forEach(x=>html.push('<a class="cs-search-result" href="profile.html?user='+encodeURIComponent(x.user_id)+'"><span>◉</span><span><b>'+esc(x.display_name||x.username||'Member')+'</b><small>Member profile</small></span></a>'));
  (c.data||[]).forEach(x=>html.push('<a class="cs-search-result" href="home.html#feed"><span>▣</span><span><b>'+esc(x.title||'Community post')+'</b><small>'+esc((x.body||'').slice(0,90))+'</small></span></a>'));
  box.innerHTML=html.join('')||'<div class="cs-search-result">No matching CrowSpace results.</div>';
 }catch(e){box.innerHTML='<div class="cs-search-result">Search is temporarily unavailable.</div>'}
}
function esc(s){return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
async function badges(db,u){
 if(!u||!db)return;
 const [n,m]=await Promise.all([
  db.from('crowspace_notifications').select('id',{count:'exact',head:true}).eq('user_id',u.id).is('read_at',null),
  db.from('crowspace_conversation_members').select('conversation_id',{count:'exact',head:true}).eq('user_id',u.id).is('last_read_at',null)
 ]);
 setBadge('notifications.html',n.count||0);setBadge('messages.html',m.count||0);
}
function setBadge(href,count){
 if(!count)return;
 const a=[...document.querySelectorAll('a')].find(x=>x.getAttribute('href')===href);if(!a)return;
 const b=document.createElement('span');b.className='cs-badge';b.textContent=count>99?'99+':count;a.style.position='relative';a.appendChild(b);
}
function accountMenu(u){
 const host=document.querySelector('.cs-account-wrap')||document.querySelector('.cs-account')||document.querySelector('.top-actions');if(!host)return;
 host.classList.add('cs-account-wrap');
 if(host.querySelector('.cs-account-menu'))return;
 const m=document.createElement('div');m.className='cs-account-menu';
 m.innerHTML='<div class="cs-menu-label">YOUR CROWSPACE</div><a href="profile.html">◉ My Profile</a><a href="account.html">⚙ Account</a><a href="settings.html">◌ Settings</a><a href="friends.html">👥 Friends</a><a href="notifications.html">● Alerts</a><a href="messages.html">✉ Messages</a><button id="cs-signout">↪ Sign out</button>';
 host.appendChild(m);
 const trigger=host.querySelector('#cs-login')||host.querySelector('.cs-status')||host.querySelector('a');
 if(u)trigger?.addEventListener('click',e=>{e.preventDefault();m.classList.toggle('open')});
 document.addEventListener('click',e=>{if(!host.contains(e.target))m.classList.remove('open')});
 document.getElementById('cs-signout')?.addEventListener('click',async()=>{try{await window.CrowSpaceAuth.signOut();location.href='index.html'}catch(e){}});
}
function mobile(){
 const btn=document.getElementById('cs-mobile-btn');if(!btn)return;
 btn.addEventListener('click',()=>{
  const n=document.querySelector('.cs-nav,.global-nav');if(n){n.classList.toggle('cs-mobile-open');if(n.classList.contains('cs-mobile-open'))n.scrollIntoView({block:'nearest'})}
 });
}
async function auth(){
 let ready=window.CrowSpaceAuth?.ready;
 if(!ready){await new Promise(resolve=>{const s=document.createElement('script');s.src='crowspace-auth.js';s.onload=resolve;s.onerror=resolve;document.head.appendChild(s)});ready=window.CrowSpaceAuth?.ready}
 try{
  const db=await ready,u=window.CrowSpaceAuth?.user||null,st=document.getElementById('cs-status-text');
  if(st)st.textContent=u?'SIGNED IN':'GUEST';
  const login=document.getElementById('cs-login'),join=document.getElementById('cs-join');
  if(u){if(login){login.textContent='ACCOUNT';login.href='#cs-account'}if(join){join.textContent='PROFILE';join.href='profile.html'}}
  const social={
 follow: async target => db.rpc('crowspace_follow',{target_user:target}),
 unfollow: async target => db.rpc('crowspace_unfollow',{target_user:target}),
 friend: async target => db.rpc('crowspace_friend_request',{target_user:target}),
 respond: async (id,status) => db.rpc('crowspace_friend_respond',{friendship:id,new_status:status}),
 remove: async id => db.rpc('crowspace_friend_remove',{friendship:id}),
 relationships: async target => {
   const [fwd,rev,fr] = await Promise.all([
    db.from('crowspace_follows').select('follower_id,followed_user_id').eq('follower_id',u?.id||'00000000-0000-0000-0000-000000000000').eq('followed_user_id',target),
    db.from('crowspace_follows').select('follower_id,followed_user_id').eq('follower_id',target).eq('followed_user_id',u?.id||'00000000-0000-0000-0000-000000000000'),
    db.from('crowspace_friendships').select('id,requester_id,addressee_id,status').or('requester_id.eq.'+(u?.id||'00000000-0000-0000-0000-000000000000')+',addressee_id.eq.'+(u?.id||'00000000-0000-0000-0000-000000000000'))
   ]);
   const friendship=(fr.data||[]).find(x=>x.requester_id===target||x.addressee_id===target)||null;
   return {following:!!fwd.data?.length, followsYou:!!rev.data?.length, friendship};
  }
};
window.CrowSpaceUniversal={db,user:u,social};
  accountMenu(u);badges(db,u);overlays();mobile();
  document.dispatchEvent(new CustomEvent('crowspace-universal-ready',{detail:{db,user:u}}));
  db.channel('crowspace-universal-live')
 .on('postgres_changes',{event:'*',schema:'public',table:'crowspace_notifications',filter:'user_id=eq.'+(u?.id||'00000000-0000-0000-0000-000000000000')},()=>{badges(db,u);document.dispatchEvent(new CustomEvent('crowspace-social-update'))})
 .on('postgres_changes',{event:'*',schema:'public',table:'crowspace_messages'},()=>badges(db,u))
 .on('postgres_changes',{event:'*',schema:'public',table:'crowspace_follows'},()=>document.dispatchEvent(new CustomEvent('crowspace-social-update')))
 .on('postgres_changes',{event:'*',schema:'public',table:'crowspace_friendships'},()=>document.dispatchEvent(new CustomEvent('crowspace-social-update')))
 .subscribe();
 }catch(e){const st=document.getElementById('cs-status-text');if(st)st.textContent='OFFLINE';overlays();mobile()}
}

function toast(message){const t=document.createElement('div');t.className='cs-toast';t.textContent=message;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
function relationTargetFromHref(href){
 try{const u=new URL(href,location.href),q=u.searchParams;return q.get('user')||q.get('u')||q.get('id')||null}catch(e){return null}
}
async function resolveRelationshipTarget(value){
 const db=window.CrowSpaceUniversal?.db;if(!db||!value)return null;
 if(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))return value;
 try{const r=await db.from('crowspace_profiles').select('user_id').eq('username',value).maybeSingle();return r.data?.user_id||null}catch(e){return null}
}
async function dbSafe(table,select,filter){
 const db=window.CrowSpaceUniversal?.db;if(!db)return [];
 try{let q=db.from(table).select(select);if(filter)q=q.or(filter);const r=await q.limit(500);return r.data||[]}catch(e){return []}
}
async function relationshipState(target){
 const api=window.CrowSpaceUniversal?.social,me=window.CrowSpaceUniversal?.user;
 if(!api||!me||!target||me.id===target)return {self:me?.id===target,following:false,followsYou:false,friendship:null,mutual:0};
 const [state,mine,theirs]=await Promise.all([
  api.relationships(target),
  dbSafe('crowspace_friendships','id,requester_id,addressee_id,status','or(requester_id.eq.'+me.id+',addressee_id.eq.'+me.id+')'),
  dbSafe('crowspace_friendships','id,requester_id,addressee_id,status','or(requester_id.eq.'+target+',addressee_id.eq.'+target+')')
 ]);
 const mineFriends=new Set((mine||[]).filter(x=>x.status==='accepted').map(x=>x.requester_id===me.id?x.addressee_id:x.requester_id));
 const theirFriends=new Set((theirs||[]).filter(x=>x.status==='accepted').map(x=>x.requester_id===target?x.addressee_id:x.requester_id));
 let mutual=0;mineFriends.forEach(x=>{if(theirFriends.has(x))mutual++});
 return {...state,mutual};
}
function relationButton(target,state){
 const me=window.CrowSpaceUniversal?.user;
 if(!me)return '<a class="cs-rel-btn" href="login.html">Log in to connect</a>';
 if(state.self)return '';
 const f=state.friendship;let friendLabel='Add Friend',friendAction='friend';
 if(f?.status==='accepted'){friendLabel='Remove Friend';friendAction='remove'}
 else if(f?.status==='pending'&&f.addressee_id===me.id){friendLabel='Accept';friendAction='accept'}
 else if(f?.status==='pending'){friendLabel='Request Sent';friendAction='cancel'}
 const followLabel=state.following?'Following':'Follow',followAction=state.following?'unfollow':'follow';
 return '<button class="cs-rel-btn '+(state.following?'is-on':'')+'" data-rel-action="'+followAction+'" data-rel-target="'+target+'">'+followLabel+'</button>'+
 (friendLabel==='Request Sent'?'<button class="cs-rel-btn is-muted" data-rel-action="'+friendAction+'" data-rel-target="'+(f?.id||'')+'">'+friendLabel+'</button>':'<button class="cs-rel-btn '+(f?.status==='accepted'?'is-on':'')+'" data-rel-action="'+friendAction+'" data-rel-target="'+(f?.id||target)+'">'+friendLabel+'</button>');
}
async function mountRelationshipCard(host,target){
 if(!host||!target||host.dataset.csRelationReady==='loading')return;
 host.dataset.csRelationReady='loading';
 const state=await relationshipState(target);
 host.dataset.csTarget=target;
 host.innerHTML='<div class="cs-rel-controls">'+relationButton(target,state)+'</div><div class="cs-rel-meta"><span>'+Number(state.mutual||0)+' mutual connections</span><span>'+(state.followsYou?'Follows you':'')+'</span></div>';
 host.dataset.csRelationReady='1';
 host.querySelectorAll('[data-rel-action]').forEach(btn=>btn.addEventListener('click',async()=>{
  btn.disabled=true;const action=btn.dataset.relAction,value=btn.dataset.relTarget;let result;
  try{
   if(action==='follow')result=await window.CrowSpaceUniversal.social.follow(value);
   else if(action==='unfollow')result=await window.CrowSpaceUniversal.social.unfollow(value);
   else if(action==='friend')result=await window.CrowSpaceUniversal.social.friend(value);
   else if(action==='accept')result=await window.CrowSpaceUniversal.social.respond(value,'accepted');
   else if(action==='remove')result=await window.CrowSpaceUniversal.social.remove(value);
   else if(action==='cancel')result=await window.CrowSpaceUniversal.social.respond(value,'declined');
  }catch(e){result={error:e}}
  if(result?.error){btn.disabled=false;toast(result.error.message||'Connection update failed');return}
  host.dataset.csRelationReady='';mountRelationshipCard(host,target);
  }));
}
function relationshipEnhance(){
 const db=window.CrowSpaceUniversal?.db,me=window.CrowSpaceUniversal?.user;if(!db)return;
 const urlTarget=relationTargetFromHref(location.href);
 if(urlTarget&&me)resolveRelationshipTarget(urlTarget).then(t=>{
  if(!t||t===me.id)return;
  let dock=document.getElementById('cs-profile-relationship');
  if(!dock){dock=document.createElement('section');dock.id='cs-profile-relationship';dock.className='cs-relationship-dock';const main=document.querySelector('main')||document.body;main.prepend(dock)}
  mountRelationshipCard(dock,t);
 });
 document.querySelectorAll('[data-user-id]').forEach(el=>{const value=el.getAttribute('data-user-id');if(!value||el.dataset.csRelationLink)return;el.dataset.csRelationLink='1';const controls=document.createElement('span');controls.className='cs-inline-relation';el.appendChild(controls);mountRelationshipCard(controls,value)});
 document.querySelectorAll('a[href*="profile.html"]').forEach(a=>{
  const value=relationTargetFromHref(a.href);if(!value||a.dataset.csRelationLink)return;a.dataset.csRelationLink='1';
  const wrap=document.createElement('span');wrap.className='cs-rel-link-wrap';a.parentNode?.insertBefore(wrap,a);wrap.appendChild(a);
  const controls=document.createElement('span');controls.className='cs-inline-relation';wrap.appendChild(controls);
  resolveRelationshipTarget(value).then(t=>{if(t&&me&&t!==me.id)mountRelationshipCard(controls,t)});
 });
}
document.addEventListener('crowspace-social-update',()=>{document.querySelectorAll('.cs-inline-relation,.cs-relationship-dock').forEach(x=>{x.dataset.csRelationReady='';});relationshipEnhance();});

function loadV28Recommendations(){
 if(location.pathname.split('/').pop()==='index.html')return;
 if(!document.querySelector('script[data-crowspace-v28]')){
  const s=document.createElement('script');s.src='crowspace-recommendations.js';s.dataset.crowspaceV28='1';s.onload=()=>window.CrowSpaceRecommendations?.refresh?.();document.body.appendChild(s);
 }else window.CrowSpaceRecommendations?.refresh?.();
}
function loadV24Discovery(){
 if(location.pathname.split('/').pop()==='index.html')return;
 if(!document.querySelector('script[data-crowspace-v24]')){const s=document.createElement('script');s.src='crowspace-discovery.js';s.dataset.crowspaceV24='1';s.onload=()=>window.CrowSpaceDiscovery?.refresh?.();document.body.appendChild(s)}else window.CrowSpaceDiscovery?.refresh?.();
 if(!document.querySelector('script[data-crowspace-v25]')){const s=document.createElement('script');s.src='crowspace-content-graph.js';s.dataset.crowspaceV25='1';s.onload=()=>window.CrowSpaceContentGraph?.refresh?.();document.body.appendChild(s)}else window.CrowSpaceContentGraph?.refresh?.();
}
document.addEventListener('DOMContentLoaded',()=>{nav();footer();auth().then(()=>setTimeout(()=>{relationshipEnhance();loadV24Discovery();loadV28Recommendations()},250))});
})();