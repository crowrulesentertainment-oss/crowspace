/* CrowSpace Admin Shell — 21.50.53
 * Reuses CrowSpaceAuth + CrowSpaceUniversal. No service-role or worker secret is exposed.
 */
(function(){
'use strict';
const WORKER='worker-control-center.html';
const HUB='admin-operations-hub-21-50-54.html';
function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function inject(){
  if(document.getElementById('cs-admin-menu'))return;
  const host=document.querySelector('.cs-nav')||document.querySelector('.global-nav');
  if(!host)return;
  const wrap=document.createElement('div');wrap.className='cs-nav-menu cs-admin-menu-wrap';wrap.id='cs-admin-menu';
  const btn=document.createElement('button');btn.type='button';btn.className='cs-nav-menu-btn';btn.setAttribute('aria-expanded','false');
  btn.innerHTML='<span>ADMIN</span><b>⌄</b>';
  const panel=document.createElement('div');panel.className='cs-nav-dropdown';panel.setAttribute('role','menu');
  panel.innerHTML='<a href="'+HUB+'" role="menuitem" class="'+(location.pathname.endsWith(HUB)?'cs-active':'')+'">▣ Admin Operations Hub</a><a href="'+WORKER+'" role="menuitem" class="'+(location.pathname.endsWith(WORKER)?'cs-active':'')+'">⚙ Worker Control Center</a>';
  wrap.append(btn,panel);host.appendChild(wrap);
  btn.onclick=e=>{e.stopPropagation();const open=wrap.classList.toggle('is-open');btn.setAttribute('aria-expanded',String(open))};
  document.addEventListener('click',e=>{if(!wrap.contains(e.target)){wrap.classList.remove('is-open');btn.setAttribute('aria-expanded','false')}});
}
async function start(){
  try{
    const auth=window.CrowSpaceAuth;
    if(!auth?.ready)return;
    const db=await auth.ready;
    const user=auth.user;
    if(!db||!user)return;
    const r=await db.rpc('crowspace_governance_worker_status_21_50_51');
    if(r.error)return;
    inject();
    const page=document.body;
    page.dataset.crowspaceAdmin='true';
    const badge=document.createElement('div');
    badge.className='cs-admin-ribbon';
    badge.innerHTML='<span>ADMIN</span><small>Governance Operations</small>';
    page.appendChild(badge);
  }catch(e){console.debug('[CrowSpace Admin Shell] Admin access not granted.')}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();