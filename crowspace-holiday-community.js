/* CrowSpace Holiday Community V34 */
(function(){
'use strict';
const db=window.CrowSpaceAuth?.client||window.supabaseClient;
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const holidayNames=['New Year’s Eve','New Year’s Day','Martin Luther King Jr. Day','Valentine’s Day','Easter Sunday','Memorial Day','Juneteenth','Independence Day','Labor Day','Halloween','Veterans Day','Thanksgiving Day','Christmas Day'];
let selectedHoliday='';
function setStatus(el,msg,error=false){if(el){el.textContent=msg;el.dataset.error=error?'1':'0';}}
async function waitDB(){if(window.CrowSpaceAuth?.ready)try{await window.CrowSpaceAuth.ready}catch(e){} return window.CrowSpaceAuth?.client||window.supabaseClient||window.db||null}
function holidayMatch(h,txt){const n=(txt||'').toLowerCase();return n.includes(h.toLowerCase())}
async function loadCommunity(h){
 const host=document.getElementById('holiday-community');if(!host)return;
 const client=await waitDB(); if(!client){host.innerHTML='<div class="cs-community-empty">Supabase is not available yet.</div>';return}
 selectedHoliday=h.name;
 const [ev,posts,caws,bots]=await Promise.all([
  client.from('crowspace_events').select('id,title,description,event_type,location,starts_at,ends_at,image_url,link_url,is_online,created_by,holiday_name,holiday_year').eq('holiday_name',h.name).order('starts_at',{ascending:true}).limit(12),
  client.from('crowspace_posts').select('id,user_id,title,body,media_url,created_at,like_count,comment_count,holiday_name').eq('holiday_name',h.name).order('created_at',{ascending:false}).limit(12),
  client.from('crowspace_caws').select('id,user_id,title,caption,video_url,thumbnail_url,created_at,views,holiday_name').eq('holiday_name',h.name).order('created_at',{ascending:false}).limit(8),
  client.from('crowspace_holiday_bots').select('id,display_name,holiday_name,avatar_url,active,posts_per_holiday,countdown_enabled').eq('holiday_name',h.name).eq('active',true).limit(12)
 ]);
 const botIds=(bots.data||[]).map(x=>x.id);
 let botPosts=[];
 if(botIds.length){const bp=await client.from('crowspace_holiday_bot_posts').select('id,bot_id,title,body,post_date,created_at,post_type,scheduled_for').in('bot_id',botIds).order('created_at',{ascending:false}).limit(12);botPosts=bp.data||[]}
 const events=ev.data||[], shared=posts.data||[], cawsList=caws.data||[], botList=bots.data||[];
 host.innerHTML='<div class="cs-community-head"><div><span class="cs-holiday-kicker">V34 // HOLIDAY COMMUNITY</span><h3>'+h.emoji+' '+esc(h.name)+'</h3><p>One shared CrowSpace layer for events, celebrations, holiday Caws and Holiday Bot activity.</p></div><div class="cs-community-state">'+events.length+' EVENTS · '+shared.length+' CELEBRATIONS · '+cawsList.length+' CAWS · '+botList.length+' BOTS</div></div>'+
 '<div class="cs-community-actions"><button id="cs-open-event">CREATE HOLIDAY EVENT</button><button id="cs-open-post">SHARE CELEBRATION</button><a href="caw-studio.html?holiday='+encodeURIComponent(h.name)+'">POST HOLIDAY CAW</a><a href="holiday-bots.html">HOLIDAY BOTS</a></div>'+
 '<div class="cs-community-grid"><article><h4>COMMUNITY EVENTS</h4><div id="cs-community-events">'+renderEvents(events)+'</div></article><article><h4>CELEBRATIONS</h4><div>'+renderPosts(shared)+'</div></article><article><h4>HOLIDAY CAWS</h4><div>'+renderCaws(cawsList)+'</div></article><article><h4>HOLIDAY BOT ACTIVITY</h4><div>'+renderBots(botList,botPosts)+'</div></article></div>'+
 '<div id="cs-event-form" class="cs-community-form" hidden><h4>CREATE HOLIDAY EVENT</h4><div class="cs-form-grid"><input id="cs-event-title" maxlength="120" placeholder="Event title"><input id="cs-event-start" type="datetime-local"><input id="cs-event-location" maxlength="160" placeholder="Location or " + '"Online"'+"><input id="cs-event-link" maxlength="500" placeholder="Event link (optional)"></div><textarea id="cs-event-description" maxlength="2000" placeholder="What is happening?"></textarea><label class="cs-check"><input id="cs-event-online" type="checkbox"> Online event</label><div class="cs-form-actions"><button id="cs-save-event">PUBLISH EVENT</button><button id="cs-cancel-event">CANCEL</button><span id="cs-event-status"></span></div></div>'+
 '<div id="cs-post-form" class="cs-community-form" hidden><h4>SHARE A HOLIDAY CELEBRATION</h4><input id="cs-post-title" maxlength="120" placeholder="Celebration title"><textarea id="cs-post-body" maxlength="1000" placeholder="Share your holiday celebration with CrowSpace…"></textarea><div class="cs-form-actions"><button id="cs-save-post">SHARE</button><button id="cs-cancel-post">CANCEL</button><span id="cs-post-status"></span></div></div>';
 document.getElementById('cs-open-event').onclick=()=>document.getElementById('cs-event-form').hidden=false;
 document.getElementById('cs-cancel-event').onclick=()=>document.getElementById('cs-event-form').hidden=true;
 document.getElementById('cs-open-post').onclick=()=>document.getElementById('cs-post-form').hidden=false;
 document.getElementById('cs-cancel-post').onclick=()=>document.getElementById('cs-post-form').hidden=true;
 document.getElementById('cs-save-event').onclick=()=>createEvent(h,client);
 document.getElementById('cs-save-post').onclick=()=>createPost(h,client);
}
function renderEvents(a){if(!a.length)return '<div class="cs-community-empty">No community events yet. Be the first to create one.</div>';return a.map(x=>'<div class="cs-community-item"><strong>'+esc(x.title)+'</strong><span>'+new Date(x.starts_at).toLocaleString()+(x.is_online?' · ONLINE':'')+'</span><p>'+esc(x.description||'')+'</p>'+(x.location?'<small>'+esc(x.location)+'</small>':'')+(x.link_url?'<a href="'+esc(x.link_url)+'" target="_blank" rel="noopener">OPEN EVENT</a>':'')+'</div>').join('')}
function renderPosts(a){if(!a.length)return '<div class="cs-community-empty">No holiday celebrations shared yet.</div>';return a.map(x=>'<div class="cs-community-item"><strong>'+esc(x.title||'Holiday Celebration')+'</strong><span>'+new Date(x.created_at).toLocaleString()+' · '+(x.like_count||0)+' likes</span><p>'+esc(x.body)+'</p></div>').join('')}
function renderCaws(a){if(!a.length)return '<div class="cs-community-empty">No tagged holiday Caws yet. Use POST HOLIDAY CAW to create one.</div>';return a.map(x=>'<div class="cs-community-item"><strong>'+esc(x.title||'Holiday Caw')+'</strong><span>'+new Date(x.created_at).toLocaleString()+' · '+(x.views||0)+' views</span><p>'+esc(x.caption||'')+'</p><a href="caws.html#caw-'+encodeURIComponent(x.id)+'">VIEW CAW</a></div>').join('')}
function renderBots(b,posts){if(!b.length)return '<div class="cs-community-empty">No active Holiday Bots are assigned to this holiday.</div>';return b.map(x=>{const ps=posts.filter(p=>p.bot_id===x.id).slice(0,2);return '<div class="cs-community-item"><strong>'+esc(x.display_name)+'</strong><span>'+esc(x.holiday_name)+' · '+(x.countdown_enabled?'COUNTDOWN ON':'SEASONAL')+'</span><p>'+esc(ps[0]?.body||'Bot is active for this holiday.')+'</p></div>'}).join('')}
async function createEvent(h,client){
 const u=window.CrowSpaceAuth?.user;if(!u){alert('Please sign in to create a holiday event.');return}
 const status=document.getElementById('cs-event-status');setStatus(status,'Publishing…');
 const starts=document.getElementById('cs-event-start').value;
 if(!document.getElementById('cs-event-title').value.trim()||!starts){setStatus(status,'Title and start time are required.',true);return}
 const d=new Date(starts),row={created_by:u.id,title:document.getElementById('cs-event-title').value.trim(),description:document.getElementById('cs-event-description').value.trim()||null,event_type:'holiday',location:document.getElementById('cs-event-location').value.trim()||null,starts_at:d.toISOString(),link_url:document.getElementById('cs-event-link').value.trim()||null,is_online:document.getElementById('cs-event-online').checked,holiday_name:h.name,holiday_year:h.date.getFullYear()};
 const r=await client.from('crowspace_events').insert(row);if(r.error){setStatus(status,r.error.message,true);return}setStatus(status,'Published.');document.getElementById('cs-event-form').hidden=true;loadCommunity(h);
}
async function createPost(h,client){
 const u=window.CrowSpaceAuth?.user;if(!u){alert('Please sign in to share a celebration.');return}
 const status=document.getElementById('cs-post-status'),body=document.getElementById('cs-post-body').value.trim(),title=document.getElementById('cs-post-title').value.trim();
 if(!body){setStatus(status,'Write something first.',true);return}
 setStatus(status,'Sharing…');const r=await client.from('crowspace_posts').insert({user_id:u.id,title:title||null,body,holiday_name:h.name});
 if(r.error){setStatus(status,r.error.message,true);return}setStatus(status,'Shared.');document.getElementById('cs-post-form').hidden=true;loadCommunity(h);
}
window.CrowSpaceHolidayCommunity={load:loadCommunity};
window.addEventListener('crowspace-auth-ready',()=>{if(window.__holidayCommunityState)loadCommunity(window.__holidayCommunityState)});
})();