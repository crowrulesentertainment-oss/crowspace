/* CrowSpace Universal Event Media
 * V1 — automatic YouTube player + live chat across event surfaces.
 */
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function videoId(value){
  if(!value)return '';
  const s=String(value).trim();
  if(/^[A-Za-z0-9_-]{11}$/.test(s))return s;
  try{
    const u=new URL(s,location.href);
    const host=u.hostname.replace(/^www\./,'').toLowerCase();
    if(host==='youtu.be')return u.pathname.split('/').filter(Boolean)[0]||'';
    if(host==='youtube.com'||host==='m.youtube.com'||host==='youtube-nocookie.com'){
      if(u.searchParams.get('v'))return u.searchParams.get('v');
      const m=u.pathname.match(/\/(?:embed|live|shorts)\/([A-Za-z0-9_-]{6,})/);
      return m?m[1]:'';
    }
  }catch(e){}
  const m=s.match(/(?:v=|youtu\.be\/|\/embed\/|\/live\/|\/shorts\/)([A-Za-z0-9_-]{6,})/);
  return m?m[1]:'';
}
function isLive(event){
  if(!event)return false;
  if(event.is_live===true||event.live===true)return true;
  const status=String(event.status||event.event_status||'').toLowerCase();
  return ['live','live_now','broadcasting','streaming','on_air'].includes(status);
}
function mediaMarkup(event,compact=false){
  const id=videoId(event.youtube_url||event.youtube||event.video_url||event.youtube_video_id||event.video_id);
  if(!id)return '';
  const live=isLive(event);
  const domain=location.hostname||'localhost';
  const player='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?rel=0&modestbranding=1';
  const chat=live?'https://www.youtube.com/live_chat?v='+encodeURIComponent(id)+'&embed_domain='+encodeURIComponent(domain):'';
  return '<section class="cs-youtube-event-media '+(live?'is-live ':'')+(compact?'is-compact':'')+'" data-youtube-id="'+esc(id)+'">'+
    '<div class="cs-youtube-head"><span class="cs-youtube-label">'+(live?'🔴 LIVE EVENT':'▶ EVENT VIDEO')+'</span><span class="cs-youtube-source">YouTube</span></div>'+
    '<div class="cs-youtube-layout"><div class="cs-youtube-player"><iframe src="'+esc(player)+'" title="'+esc(event.title||event.name||'CrowSpace Event')+'" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>'+
    (live?'<aside class="cs-youtube-chat"><div class="cs-youtube-chat-head">LIVE CHAT</div><iframe src="'+esc(chat)+'" title="YouTube Live Chat" loading="lazy"></iframe><div class="cs-chat-fallback">If chat is unavailable, <a href="https://www.youtube.com/watch?v='+encodeURIComponent(id)+'" target="_blank" rel="noopener">open YouTube</a>.</div></aside>':'')+
    '</div><div class="cs-youtube-actions"><a href="https://www.youtube.com/watch?v='+encodeURIComponent(id)+'" target="_blank" rel="noopener">WATCH ON YOUTUBE ↗</a></div></section>';
}
function injectStyles(){
 if(document.getElementById('cs-youtube-event-style'))return;
 const s=document.createElement('style');s.id='cs-youtube-event-style';s.textContent=
'.cs-youtube-event-media{margin-top:12px;border:1px solid rgba(102,232,255,.16);border-radius:14px;background:linear-gradient(145deg,rgba(4,10,20,.98),rgba(8,12,25,.95));overflow:hidden;box-shadow:0 18px 50px #0007}.cs-youtube-head{display:flex;justify-content:space-between;gap:10px;padding:9px 11px;border-bottom:1px solid #ffffff0d;font:800 8px Montserrat;letter-spacing:.08em}.cs-youtube-label{color:#66e8ff}.is-live .cs-youtube-label{color:#6dffc8}.cs-youtube-source{color:#8da0b6}.cs-youtube-layout{display:grid;grid-template-columns:minmax(0,1fr) 320px;min-height:220px}.cs-youtube-player{position:relative;aspect-ratio:16/9;background:#000;min-width:0}.cs-youtube-player iframe{position:absolute;inset:0;width:100%;height:100%;border:0}.cs-youtube-chat{min-width:0;border-left:1px solid #ffffff0d;background:#02050b;display:flex;flex-direction:column}.cs-youtube-chat-head{padding:9px 11px;border-bottom:1px solid #ffffff0d;color:#fff;font:800 8px Orbitron;letter-spacing:.1em}.cs-youtube-chat iframe{width:100%;height:100%;min-height:300px;border:0;background:#fff}.cs-chat-fallback{padding:7px 9px;color:#8090aa;font-size:7px;line-height:1.4}.cs-chat-fallback a,.cs-youtube-actions a{color:#66e8ff;text-decoration:none}.cs-youtube-actions{padding:8px 11px;border-top:1px solid #ffffff0d}.cs-youtube-actions a{font:800 7px Montserrat;letter-spacing:.08em}.cs-youtube-event-media.is-compact .cs-youtube-layout{grid-template-columns:1fr 270px}.cs-youtube-event-media.is-compact .cs-youtube-chat iframe{min-height:220px}@media(max-width:800px){.cs-youtube-layout,.cs-youtube-event-media.is-compact .cs-youtube-layout{grid-template-columns:1fr}.cs-youtube-chat{border-left:0;border-top:1px solid #ffffff0d}.cs-youtube-chat iframe{height:380px;min-height:380px}.cs-youtube-player{width:100%}}';
 document.head.appendChild(s);
}
function enhanceElement(el,event={}){
 if(!el||el.dataset.youtubeEnhanced==='1')return;
 const url=event.youtube_url||event.youtube||event.video_url||event.youtube_video_id||event.video_id||el.dataset.youtubeUrl;
 if(!videoId(url))return;
 el.dataset.youtubeEnhanced='1';
 el.insertAdjacentHTML('beforeend',mediaMarkup({...event,youtube_url:url},el.classList.contains('compact')||el.dataset.compact==='1'));
}
function scan(){
 injectStyles();
 document.querySelectorAll('[data-youtube-url]').forEach(el=>enhanceElement(el,{youtube_url:el.dataset.youtubeUrl,title:el.dataset.eventTitle||el.getAttribute('aria-label')}));
 document.querySelectorAll('.event-card,.cs-event-card,.crowspace-event-card,[data-event-card]').forEach(el=>enhanceElement(el,{
   youtube_url:el.dataset.youtubeUrl||el.querySelector('a[href*="youtu"],a[href*="youtube.com"]')?.href,
   title:el.dataset.eventTitle||el.querySelector('h1,h2,h3')?.textContent,
   is_live:el.dataset.live==='true'
 }));
}
async function db(){return window.CrowSpaceUniversal?.db||window.CrowSpaceAuth?.client||null}
async function loadEvents(){
 const d=await db();if(!d)return[];
 try{const r=await d.from('crowspace_events').select('*').order('starts_at',{ascending:true}).limit(12);if(r.error)throw r.error;return r.data||[]}catch(e){console.debug('[CrowSpace events]',e);return[]}
}
function eventCard(e){
 const title=e.title||e.name||'CrowSpace Event', desc=e.description||e.body||'Community event', when=e.starts_at||e.event_at||e.created_at||'';
 const id=videoId(e.youtube_url||e.youtube||e.video_url||e.youtube_video_id||e.video_id);
 return '<article class="cs-card cs-event-card" data-event-card data-youtube-url="'+esc(e.youtube_url||e.youtube||e.video_url||e.youtube_video_id||e.video_id||'')+'" data-event-title="'+esc(title)+'" data-live="'+(isLive(e)?'true':'false')+'"><div style="display:flex;justify-content:space-between;gap:10px"><div><h3>'+esc(title)+'</h3><p class="cs-muted">'+esc(desc)+'</p><small class="cs-muted">'+esc(when)+'</small></div>'+(isLive(e)?'<span style="color:#6dffc8;font:800 8px Montserrat">● LIVE</span>':'')+'</div>'+(!id?'<div style="margin-top:10px" class="cs-muted">Event details coming soon.</div>':'')+'</article>';
}
async function renderSurface(){
 const page=document.body.dataset.page||'';
 if(!['index','home','profile','feed','events'].includes(page))return;
 const events=await loadEvents(); if(!events.length){scan();return}
 if(page==='events'){
   const root=document.getElementById('page-data');
   if(root){root.innerHTML='<div class="cs-grid">'+events.map(eventCard).join('')+'</div>';scan()}
   return;
 }
 let host=null;
 if(page==='home') host=document.getElementById('cs-events-auto')||document.querySelector('[data-crowspace-events]');
 if(page==='feed') host=document.getElementById('cs-events-auto')||document.querySelector('[data-crowspace-events]');
 if(page==='index') host=document.getElementById('cs-events-auto')||document.querySelector('[data-crowspace-events]');
 if(page==='profile') host=document.getElementById('cs-events-auto')||document.querySelector('[data-crowspace-events]');
 if(!host){
   host=document.createElement('section');host.id='cs-events-auto';host.style.marginTop='14px';
   const target=document.querySelector('#feed,.feeditems,#page-data,#app,.shell,main')||document.body;
   target.prepend(host);
 }
 host.innerHTML='<div class="cs-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><div class="cs-eyebrow">CROWSPACE // EVENTS</div><h2 style="margin:5px 0">Watch & Connect</h2><p class="cs-muted" style="margin:0">Events with YouTube links automatically include the video. Live broadcasts include live chat.</p></div><a class="cs-btn" href="events.html">ALL EVENTS →</a></div><div class="cs-list" style="margin-top:10px">'+events.slice(0,4).map(eventCard).join('')+'</div></div>';
 scan();
}
function boot(){
 renderSurface().catch(e=>console.error('[CrowSpace event media]',e));
 const mo=new MutationObserver(()=>scan());mo.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
window.CrowSpaceYouTubeEvents={videoId,mediaMarkup,enhanceElement,loadEvents,scan};
})();