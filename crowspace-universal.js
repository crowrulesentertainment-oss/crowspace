/* CrowSpace Universal Surface Connector */
(function(){
'use strict';
const links=[
 ['⌂ Home','home.html'],['◉ Profile','profile.html'],['⌕ Search','search.html'],['▶ Caws','caws.html'],
 ['◌ Circles','circles.html'],['👥 Friends','friends.html'],['✉ Messages','messages.html'],['● Alerts','notifications.html'],
 ['◇ Discover','discovery.html'],['★ Members','members.html'],['▣ Groups','groups.html'],['📅 Events','events.html'],
 ['⚙ Settings','settings.html']
];
const sub=[['Feed','home.html#feed'],['Explore','explore.html'],['Holiday Bots','holiday-bots.html'],['Account','account.html'],['Caw Studio','caw-studio.html']];
function active(path){const p=location.pathname.split('/').pop()||'home.html';return p===path}
function nav(){
 const old=document.querySelector('.navin'),oldNav=old?.closest('.nav'),top=document.querySelector('.topbar');
 if(top){
   const nav=top.querySelector('.global-nav');
   if(nav){
     const existing=new Set([...nav.querySelectorAll('a')].map(a=>a.getAttribute('href')));
     links.forEach(([label,href])=>{if(!existing.has(href)){const a=document.createElement('a');a.href=href;a.textContent=label;nav.appendChild(a)}});
   }
   return;
 }
 const bar=document.createElement('header');bar.className='cs-globalbar';
 bar.innerHTML='<div class="cs-globalbar-inner"><a class="cs-brand" href="home.html">CROW<span>SPACE</span></a><nav class="cs-nav" aria-label="Universal CrowSpace navigation"></nav><div class="cs-account"><span class="cs-status"><i class="cs-dot"></i><span id="cs-status-text">CONNECTING</span></span><a href="login.html" id="cs-login">LOG IN</a><a class="cs-primary" href="signup.html" id="cs-join">JOIN</a></div></div><div class="cs-subbar"></div>';
 if(oldNav) oldNav.replaceWith(bar); else if(old) old.replaceWith(bar); else document.body.insertBefore(bar,document.body.firstChild);
 const n=bar.querySelector('.cs-nav');links.forEach(([label,href])=>{const a=document.createElement('a');a.href=href;a.textContent=label;if(active(href))a.className='cs-active';n.appendChild(a)});
 const sb=bar.querySelector('.cs-subbar');sub.forEach(([label,href])=>{const a=document.createElement('a');a.href=href;a.textContent=label;sb.appendChild(a)});
 const community=document.querySelector('.community-links');if(community)community.style.display='none';
}
function footer(){
 if(document.querySelector('.cs-footer'))return;
 const f=document.createElement('footer');f.className='cs-footer';f.innerHTML='<span>CrowSpace · CrowRules · One Account. One Universe.</span><span><a href="home.html">Home</a> · <a href="members.html">Members</a> · <a href="settings.html">Settings</a> · <a href="account.html">Account</a></span>';
 document.body.appendChild(f);
}
async function auth(){
 let ready=window.CrowSpaceAuth?.ready;
 if(!ready){
   await new Promise(resolve=>{const s=document.createElement('script');s.src='crowspace-auth.js';s.onload=resolve;s.onerror=resolve;document.head.appendChild(s)});
   ready=window.CrowSpaceAuth?.ready;
 }
 try{const db=await ready;const u=window.CrowSpaceAuth?.user||null;const st=document.getElementById('cs-status-text');if(st)st.textContent=u?'SIGNED IN':'GUEST';
   const login=document.getElementById('cs-login'),join=document.getElementById('cs-join');
   if(u){if(login)login.textContent='ACCOUNT';if(login)login.href='account.html';if(join){join.textContent='PROFILE';join.href='profile.html'}}
   window.CrowSpaceUniversal={db,user:u};
   document.dispatchEvent(new CustomEvent('crowspace-universal-ready',{detail:{db,user:u}}));
 }catch(e){const st=document.getElementById('cs-status-text');if(st)st.textContent='OFFLINE'}
}
document.addEventListener('DOMContentLoaded',()=>{nav();footer();auth()});
})();
