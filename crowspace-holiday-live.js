/* CrowSpace Holiday Live Center V35 */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
let channel=null,timer=null;
const db=()=>window.CrowSpaceUniversal?.db||window.CrowSpaceAuth?.client||null;
function liveLabel(start,end,now){const s=new Date(start),e=end?new Date(end):null;if(e&&now>=s&&now<e)return ['LIVE NOW','live'];if(now<s)return ['UPCOMING','upcoming'];return ['ENDED','ended']}
function countdown(start){const ms=Math.max(0,new Date(start)-Date.now()),s=Math.floor(ms/1000);return Math.floor(s/86400)+'d '+String(Math.floor(s%86400/3600)).padStart(2,'0')+'h '+String(Math.floor(s%3600/60)).padStart(2,'0')+'m'}
async function load(h){
 const host=document.getElementById('holiday-live-center');if(!host)return;
 const client=db();if(!client)return;
 const [e,p,c,b]=await Promise.all([
  client.from('crowspace_events').select('id,title,description,starts_at,ends_at,location,is_online,link_url,created_by,holiday_name').eq('holiday_name',h.name).order('starts_at',{ascending:true}).limit(20),
  client.from('crowspace_posts').select('id,user_id,title,body,created_at,like_count,comment_count,holiday_name').eq('holiday_name',h.name).order('created_at',{ascending:false}).limit(20),
  client.from('crowspace_caws').select('id,user_id,title,caption,created_at,views,holiday_name').eq('holiday_name',h.name).order('created_at',{ascending:false}).limit(12),
  client.from('crowspace_holiday_bots').select('id,display_name,active,countdown_enabled,holiday_name').eq('holiday_name',h.name).eq('active',true).limit(12)
 ]);
 const events=e.data||[],posts=p.data||[],caws=c.data||[],bots=b.data||[],now=new Date();
 const happening=events.filter(x=>liveLabel(x.starts_at,x.ends_at,now)[1]==='live');
 const upcoming=events.filter(x=>liveLabel(x.starts_at,x.ends_at,now)[1]==='upcoming').slice(0,5);
 host.innerHTML='<div class="cs-live-head"><div><span class="cs-holiday-kicker">V35 // HOLIDAY LIVE CENTER</span><h3>🔴 HAPPENING NOW · '+esc(h.name)+'</h3><p>Realtime community activity for this holiday.</p></div><div class="cs-live-pulse"><i></i> LIVE SYNC</div></div>'+
 '<div class="cs-live-now">'+(happening.length?happening.map(renderEvent).join(''):'<div class="cs-live-empty">Nothing is happening right now. Upcoming holiday activity will appear here automatically.</div>')+'</div>'+
 '<div class="cs-live-grid"><article><h4>UPCOMING LIVE EVENTS</h4>'+renderUpcoming(upcoming)+'</article><article><h4>CELEBRATION FEED</h4>'+renderPosts(posts)+'</article><article><h4>HOLIDAY CAWS</h4>'+renderCaws(caws)+'</article><article><h4>HOLIDAY BOT LIVE ACTIVITY</h4>'+renderBots(bots)+'</article></div>'+
 '<div class="cs-live-footer"><span id="cs-live-updated">LIVE · '+now.toLocaleTimeString()+'</span><button id="cs-live-refresh">REFRESH NOW</button></div>';
 host.querySelector('#cs-live-refresh').onclick=()=>load(h);
 if(timer)clearInterval(timer);timer=setInterval(()=>refreshTimes(h),1000);
 subscribe(h);
}
function renderEvent(x){const [label,cls]=liveLabel(x.starts_at,x.ends_at,new Date());return '<div class="cs-live-event '+cls+'"><div><b>'+esc(x.title)+'</b><span>'+label+' · '+new Date(x.starts_at).toLocaleString()+(x.is_online?' · ONLINE':'')+'</span><p>'+esc(x.description||'')+'</p></div>'+(x.link_url?'<a href="'+esc(x.link_url)+'" target="_blank" rel="noopener">JOIN</a>':'')+'</div>'}
function renderUpcoming(a){return a.length?a.map(x=>'<div class="cs-live-item"><b>'+esc(x.title)+'</b><span>'+countdown(x.starts_at)+' · '+new Date(x.starts_at).toLocaleString()+'</span></div>').join(''):'<div class="cs-live-empty">No upcoming events.</div>'}
function renderPosts(a){return a.length?a.slice(0,6).map(x=>'<div class="cs-live-item"><b>'+esc(x.title||'Holiday Celebration')+'</b><span>'+new Date(x.created_at).toLocaleString()+' · '+(x.like_count||0)+' likes</span><p>'+esc(x.body||'')+'</p></div>').join(''):'<div class="cs-live-empty">No celebrations yet.</div>'}
function renderCaws(a){return a.length?a.slice(0,6).map(x=>'<div class="cs-live-item"><b>'+esc(x.title||'Holiday Caw')+'</b><span>'+new Date(x.created_at).toLocaleString()+' · '+(x.views||0)+' views</span><p>'+esc(x.caption||'')+'</p></div>').join(''):'<div class="cs-live-empty">No holiday Caws yet.</div>'}
function renderBots(a){return a.length?a.map(x=>'<div class="cs-live-item"><b>🤖 '+esc(x.display_name)+'</b><span>'+esc(x.holiday_name)+' · '+(x.countdown_enabled?'COUNTDOWN ACTIVE':'SEASONAL MODE')+'</span><p>Holiday Bot is active.</p></div>').join(''):'<div class="cs-live-empty">No active Holiday Bots.</div>'}
function refreshTimes(h){const host=document.getElementById('holiday-live-center');if(!host)return;host.querySelectorAll('.cs-live-event').forEach((el,i)=>{});const stamp=host.querySelector('#cs-live-updated');if(stamp)stamp.textContent='LIVE · '+new Date().toLocaleTimeString()}
function subscribe(h){
 const client=db();if(!client||!client.channel)return;
 if(channel)try{client.removeChannel(channel)}catch(e){}
 channel=client.channel('holiday-live-'+encodeURIComponent(h.name))
 .on('postgres_changes',{event:'*',schema:'public',table:'crowspace_events',filter:'holiday_name=eq.'+h.name},()=>load(h))
 .on('postgres_changes',{event:'*',schema:'public',table:'crowspace_posts',filter:'holiday_name=eq.'+h.name},()=>load(h))
 .on('postgres_changes',{event:'*',schema:'public',table:'crowspace_caws',filter:'holiday_name=eq.'+h.name},()=>load(h))
 .subscribe();
}
window.CrowSpaceHolidayLive={load};
window.addEventListener('crowspace-universal-ready',()=>{if(window.__holidayCommunityState)load(window.__holidayCommunityState)});
window.addEventListener('crowspace-holiday-selected',e=>{if(e.detail)load(e.detail)});
})();