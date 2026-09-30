(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const initials=s=>String(s||'C').trim().slice(0,2).toUpperCase();
async function db(){return window.CrowSpaceUniversal?.db||window.CrowSpaceAuth?.client||null}
async function rows(table,select,limit=20,order='created_at'){const d=await db();if(!d)return[];try{let q=d.from(table).select(select);if(order)q=q.order(order,{ascending:false});q=q.limit(limit);const r=await q;return r.error?[]:(r.data||[])}catch(e){return[]}}
async function profiles(){return rows('crowspace_profiles','user_id,username,display_name,avatar_url,bio,created_at',40,'created_at')}
function person(p){const n=p.display_name||p.username||'CrowSpace Member';return '<div class="cs-row"><div class="cs-avatar">'+(p.avatar_url?'<img src="'+esc(p.avatar_url)+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover" alt="">':esc(initials(n)))+'</div><div class="cs-row-main"><b>'+esc(n)+'</b><small>'+esc(p.bio||'CrowSpace member')+'</small></div><a class="cs-btn" href="profile.html?user='+encodeURIComponent(p.user_id)+'">VIEW</a></div>'}
async function init(){
 await new Promise(r=>{if(window.CrowSpaceUniversal?.db)r();else document.addEventListener('crowspace-universal-ready',r,{once:true})});
 const d=await db(), u=window.CrowSpaceUniversal?.user||window.CrowSpaceAuth?.user||null, page=document.body.dataset.page;
 const root=document.getElementById('page-data');if(!root)return;
 if(page==='members'){
  const ps=await profiles();root.innerHTML='<div class="cs-grid">'+ps.map(person).join('')+'</div>';
 }else if(page==='friends'){
  if(!u){root.innerHTML='<div class="cs-card"><p>Sign in to view your friends and connections.</p><a class="cs-btn primary" href="login.html">LOG IN</a></div>';return}
  const [out,inc,fr]=await Promise.all([rows('crowspace_follows','followed_user_id',100,null),rows('crowspace_follows','follower_id',100,null),rows('crowspace_friendships','requester_id,addressee_id,status',100,null)]);
  const ids=new Set([...out.map(x=>x.followed_user_id),...inc.map(x=>x.follower_id)]);fr.filter(x=>x.status==='accepted').forEach(x=>ids.add(String(x.requester_id)===String(u.id)?x.addressee_id:x.requester_id));
  const ps=(await profiles()).filter(p=>ids.has(p.user_id));
  root.innerHTML=ps.length?'<div class="cs-grid">'+ps.map(person).join('')+'</div>':'<div class="cs-card"><p>No connections are visible yet. Start discovering members.</p><a class="cs-btn" href="members.html">DISCOVER MEMBERS</a></div>';
 }else if(page==='events'){
  const ev=await rows('crowspace_events','*',30,'created_at');
  root.innerHTML=ev.length?'<div class="cs-grid">'+ev.map(x=>'<article class="cs-card"><h3>'+esc(x.title||x.name||'CrowSpace Event')+'</h3><p class="cs-muted">'+esc(x.description||x.body||'Community event')+'</p><small class="cs-muted">'+esc(x.starts_at||x.event_at||x.created_at||'')+'</small></article>').join(''):'<div class="cs-card"><h3>Community Events</h3><p class="cs-muted">Events will appear here as CrowSpace events are created.</p></div>';
 }else if(page==='groups'){
  const gs=await rows('crowspace_groups','*',30,'created_at');
  root.innerHTML=gs.length?'<div class="cs-grid">'+gs.map(x=>'<article class="cs-card"><h3>'+esc(x.name||'CrowSpace Group')+'</h3><p class="cs-muted">'+esc(x.description||'Community group')+'</p></article>').join(''):'<div class="cs-card"><h3>Groups</h3><p class="cs-muted">Groups will appear here as the community grows.</p></div>';
 }else if(page==='settings'){
  if(!u){root.innerHTML='<div class="cs-card"><p>Sign in to manage your CrowSpace settings.</p><a class="cs-btn primary" href="login.html">LOG IN</a></div>';return}
  let s=null;try{s=(await d.from('crowspace_discovery_settings').select('*').eq('user_id',u.id).maybeSingle()).data}catch(e){}
  s=s||{personalization_enabled:true,adaptive_feed_enabled:true,recommendations_enabled:true,learning_retention_days:90};
  root.innerHTML='<form id="cs-settings" class="cs-card"><h2>Discovery Controls</h2>'+[['personalization_enabled','Personalized home'],['adaptive_feed_enabled','Adaptive feed'],['recommendations_enabled','Recommendations']].map(([k,l])=>'<label style="display:flex;gap:10px;padding:12px 0"><input type="checkbox" name="'+k+'" '+(s[k]!==false?'checked':'')+'> '+l+'</label>').join('')+'<label class="field">Learning retention days<input name="learning_retention_days" type="number" min="7" max="365" value="'+Number(s.learning_retention_days||90)+'"></label><button class="cs-btn primary" type="submit">SAVE SETTINGS</button><p id="cs-settings-msg" class="cs-muted"></p></form>';
  document.getElementById('cs-settings').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const payload={user_id:u.id,personalization_enabled:f.get('personalization_enabled')==='on',adaptive_feed_enabled:f.get('adaptive_feed_enabled')==='on',recommendations_enabled:f.get('recommendations_enabled')==='on',learning_retention_days:Number(f.get('learning_retention_days'))||90,updated_at:new Date().toISOString()};const r=await d.from('crowspace_discovery_settings').upsert(payload,{onConflict:'user_id'});document.getElementById('cs-settings-msg').textContent=r.error?r.error.message:'Settings saved.'};
 }else if(page==='feed'){
  const posts=await rows('crowspace_posts','id,user_id,title,body,created_at,like_count,comment_count',40,'created_at'),ps=await profiles(),map=Object.fromEntries(ps.map(p=>[p.user_id,p]));
  root.innerHTML=posts.length?'<div class="cs-list">'+posts.map(p=>'<article class="cs-card"><div class="cs-muted">'+esc(map[p.user_id]?.display_name||'CrowSpace Member')+' · '+esc(p.created_at||'')+'</div><h3>'+esc(p.title||'Community Post')+'</h3><p>'+esc(p.body||'')+'</p><small class="cs-muted">♥ '+Number(p.like_count||0)+' · '+Number(p.comment_count||0)+' comments</small></article>').join(''):'<div class="cs-card"><p>No posts are available yet. <a href="home.html#feed">Start the conversation.</a></p></div>';
 }
}
document.addEventListener('DOMContentLoaded',()=>init().catch(e=>console.error('[CrowSpace pages]',e)));
})();