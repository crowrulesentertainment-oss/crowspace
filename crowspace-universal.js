/* CrowSpace Universal Surface Connector — V21 Universal Interaction Layer */
(function(){
'use strict';
const links=[
 ['⌂ Home','home.html'],['◉ Profile','profile.html'],['⌕ Search','search.html'],['▶ Caws','caws.html'],
 ['◌ Circles','circles.html'],['👥 Friends','friends.html'],['✉ Messages','messages.html'],['● Alerts','notifications.html'],
 ['◇ Discover','discovery.html'],['★ Members','members.html'],['▣ Groups','groups.html'],['📅 Events','events.html'],['⚙ Settings','settings.html']
];
const sub=[['Feed','feed.html'],['Explore','explore.html'],['Holiday Bots','holiday-bots.html'],['Account','account.html'],['Caw Studio','caw-studio.html']];
const active=path=>{const p=location.pathname.split('/').pop()||'home.html';return p===path};
function makeLink(label,href,activeClass=''){const a=document.createElement('a');a.href=href;a.textContent=label;if(activeClass)a.className=activeClass;return a}
function nav(){
 const old=document.querySelector('.navin'),oldNav=old?.closest('.nav'),top=document.querySelector('.topbar');
 if(top){
   const nav=top.querySelector('.global-nav');
   if(nav){
     const existing=new Set([...nav.querySelectorAll('a')].map(a=>a.getAttribute('href')));
     links.forEach(([label,href])=>{if(!existing.has(href))nav.appendChild(makeLink(label,href,active(href)?'active':' '))});
     injectTools(top);
   }
   return;
 }
 const bar=document.createElement('header');bar.className='cs-globalbar';
 bar.innerHTML='<div class="cs-globalbar-inner"><a class="cs-brand" href="home.html">CROW<span>SPACE</span></a><nav class="cs-nav" aria-label="Universal CrowSpace navigation"></nav><div class="cs-universal-tools"><button class="cs-tool cs-desktop-search" id="cs-search-btn" aria-label="Search">⌕</button><button class="cs-tool cs-universal-mobile" id="cs-mobile-btn" aria-label="Menu">☰</button></div><div class="cs-account cs-account-wrap"><span class="cs-status"><i class="cs-dot"></i><span id="cs-status-text">CONNECTING</span></span><a href="login.html" id="cs-login">LOG IN</a><a class="cs-primary" href="signup.html" id="cs-join">JOIN</a></div></div><div class="cs-subbar"></div>';
 if(oldNav)oldNav.replaceWith(bar);else if(old)old.replaceWith(bar);else document.body.insertBefore(bar,document.body.firstChild);
 const n=bar.querySelector('.cs-nav');links.forEach(([label,href])=>n.appendChild(makeLink(label,href,active(href)?'cs-active':'')));
 const sb=bar.querySelector('.cs-subbar');sub.forEach(([label,href])=>sb.appendChild(makeLink(label,href)));
 injectTools(bar);
 const community=document.querySelector('.community-links');if(community)community.style.display='none';
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
 f.innerHTML='<span>CrowSpace · CrowRules · One Account. One Universe.</span><span><a href="home.html">Home</a> · <a href="members.html">Members</a> · <a href="settings.html">Settings</a> · <a href="account.html">Account</a></span>';
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
  window.CrowSpaceUniversal={db,user:u};
  accountMenu(u);badges(db,u);overlays();mobile();
  document.dispatchEvent(new CustomEvent('crowspace-universal-ready',{detail:{db,user:u}}));
  db.channel('crowspace-universal-live').on('postgres_changes',{event:'*',schema:'public',table:'crowspace_notifications',filter:'user_id=eq.'+(u?.id||'00000000-0000-0000-0000-000000000000')},()=>badges(db,u)).on('postgres_changes',{event:'*',schema:'public',table:'crowspace_messages'},()=>badges(db,u)).subscribe();
 }catch(e){const st=document.getElementById('cs-status-text');if(st)st.textContent='OFFLINE';overlays();mobile()}
}
document.addEventListener('DOMContentLoaded',()=>{nav();footer();auth()});
})();