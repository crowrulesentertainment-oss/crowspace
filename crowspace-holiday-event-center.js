/* CrowSpace Holiday Event Center — V39
   Generated global holiday calendar + holiday Caws + celebration feed.
   Uses the shared CrowSpace Supabase client; no Universal Discovery/Content Graph.
*/
(function(){
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const $=id=>document.getElementById(id);
const client=()=>window.CrowSpaceUniversal?.db||window.CrowSpaceAuth?.client||null;
const holidayYear=()=>new Date().getFullYear();

const GLOBAL_EVENT_TEMPLATES={
 "New Year’s Eve":[
  ["Sydney New Year Countdown","Sydney, Australia","Australia","Iconic harbour countdown and fireworks atmosphere.","fireworks",0],
  ["Tokyo Year-End Celebration","Tokyo, Japan","Japan","Year-end city celebrations and countdown programming.","culture",-1],
  ["London New Year Celebration","London, United Kingdom","United Kingdom","Citywide countdown programming leading into midnight.","countdown",-1],
  ["New York Times Square Countdown","New York City, USA","United States","Global countdown coverage and Times Square celebration atmosphere.","countdown",0],
  ["Rio New Year Celebration","Rio de Janeiro, Brazil","Brazil","Beachfront year-end celebration atmosphere and music.","music",-1]
 ],
 "New Year’s Day":[
  ["Auckland First Sunrise","Auckland, New Zealand","New Zealand","New-year sunrise and first-day celebrations.","sunrise",0],
  ["London New Year’s Day","London, United Kingdom","United Kingdom","New-year parades, public gatherings and cultural programming.","parade",0],
  ["New York New Year’s Day","New York City, USA","United States","First-day community events and seasonal programming.","community",0],
  ["Sydney New Year Festival","Sydney, Australia","Australia","New-year public celebrations and waterfront programming.","festival",0]
 ],
 "Martin Luther King Jr. Day":[
  ["Atlanta MLK Commemoration","Atlanta, USA","United States","Community remembrance, service and educational programming.","service",-7],
  ["Washington DC MLK Observance","Washington, USA","United States","Public remembrance and service-oriented programming.","remembrance",-3],
  ["Memphis MLK Legacy Events","Memphis, USA","United States","Educational and community programs connected to the King legacy.","education",-2]
 ],
 "Valentine’s Day":[
  ["Paris Valentine Season","Paris, France","France","Romance-themed cultural programming leading into Valentine’s Day.","culture",-7],
  ["New York Valentine Week","New York City, USA","United States","Citywide date-night, arts and community programming.","arts",-5],
  ["Seoul Valentine Celebration","Seoul, South Korea","South Korea","Seasonal relationship and gift-culture programming.","culture",-3],
  ["Tokyo Valentine Season","Tokyo, Japan","Japan","Seasonal shopping, food and cultural programming.","food",-7]
 ],
 "Easter Sunday":[
  ["Rome Easter Week","Rome, Italy","Italy","Holy Week and Easter observances centered on Rome.","faith",-7],
  ["Jerusalem Easter Observances","Jerusalem","Israel","Holy Week observances and pilgrimage activity.","faith",-7],
  ["London Easter Weekend","London, United Kingdom","United Kingdom","Easter weekend cultural and community programming.","community",-3],
  ["New York Easter Events","New York City, USA","United States","Community, family and seasonal Easter programming.","family",-3]
 ],
 "Memorial Day":[
  ["Washington Memorial Observances","Washington, USA","United States","National remembrance and memorial programming.","remembrance",-7],
  ["Arlington Memorial Weekend","Arlington, USA","United States","Memorial weekend remembrance programming.","remembrance",-3],
  ["National Memorial Day Weekend","New York City, USA","United States","Community remembrance and civic programming.","community",-2]
 ],
 "Juneteenth":[
  ["Galveston Juneteenth Commemoration","Galveston, USA","United States","Commemorative programming connected to the 1865 Galveston announcement.","history",-14],
  ["Atlanta Juneteenth Celebration","Atlanta, USA","United States","Community, cultural and educational Juneteenth programming.","culture",-7],
  ["Washington Juneteenth Events","Washington, USA","United States","Community celebrations and educational programming.","community",-7],
  ["Los Angeles Juneteenth Festival","Los Angeles, USA","United States","Music, culture and community events.","music",-5]
 ],
 "Independence Day":[
  ["Washington Independence Week","Washington, USA","United States","Independence Day ceremonies, concerts and civic programming.","civic",-7],
  ["New York Fourth of July","New York City, USA","United States","Independence Day celebration programming and fireworks atmosphere.","fireworks",-3],
  ["Philadelphia Independence Week","Philadelphia, USA","United States","Historical and civic programming around July 4.","history",-7],
  ["Boston Harbor Independence Events","Boston, USA","United States","Waterfront concerts and Independence Day programming.","music",-3]
 ],
 "Labor Day":[
  ["Chicago Labor Day Weekend","Chicago, USA","United States","End-of-summer community and labor-themed programming.","community",-7],
  ["New York Labor Day Weekend","New York City, USA","United States","Parades, community gatherings and end-of-summer events.","parade",-3],
  ["London Workers’ Heritage Events","London, United Kingdom","United Kingdom","Workers’ history and community programming.","history",-7]
 ],
 "Halloween":[
  ["Salem Halloween Season","Salem, USA","United States","Historic Salem hosts a long seasonal run of Halloween programming.","spooky",-30],
  ["Transylvania Halloween Season","Brașov, Romania","Romania","Castle and folklore-themed Halloween season atmosphere.","folklore",-14],
  ["Tokyo Halloween Week","Tokyo, Japan","Japan","Costume, pop-culture and nightlife programming around Halloween.","culture",-7],
  ["Dublin Halloween Season","Dublin, Ireland","Ireland","Halloween traditions, folklore and seasonal cultural programming.","folklore",-14],
  ["New Orleans Halloween Season","New Orleans, USA","United States","Music, costume and seasonal events leading into Halloween.","music",-14]
 ],
 "Veterans Day":[
  ["Washington Veterans Day Observances","Washington, USA","United States","National remembrance and veterans recognition programming.","remembrance",-7],
  ["Arlington Veterans Day Week","Arlington, USA","United States","Ceremonies and remembrance activities around Veterans Day.","remembrance",-3],
  ["New York Veterans Recognition","New York City, USA","United States","Community programs recognizing veterans and service.","community",-5]
 ],
 "Thanksgiving Day":[
  ["New York Thanksgiving Parade Season","New York City, USA","United States","Holiday week programming leading into the Thanksgiving parade.","parade",-7],
  ["Plymouth Thanksgiving Week","Plymouth, USA","United States","Historical and community programming surrounding Thanksgiving.","history",-7],
  ["London Thanksgiving Community Events","London, United Kingdom","United Kingdom","Community and food-focused Thanksgiving gatherings.","food",-5],
  ["Toronto Thanksgiving Season","Toronto, Canada","Canada","Autumn community and harvest-themed programming.","harvest",-30]
 ],
 "Christmas Day":[
  ["London Christmas Season","London, United Kingdom","United Kingdom","Lights, markets and seasonal programming leading into Christmas.","lights",-30],
  ["Vienna Christmas Markets","Vienna, Austria","Austria","Winter market and concert season leading into Christmas.","market",-30],
  ["Strasbourg Christmas Season","Strasbourg, France","France","Historic Christmas market and winter celebration season.","market",-30],
  ["New York Christmas Season","New York City, USA","United States","Lights, performances, markets and seasonal programming.","lights",-30],
  ["Tokyo Christmas Illumination Season","Tokyo, Japan","Japan","Winter illuminations and seasonal city programming.","lights",-30],
  ["Sydney Christmas Season","Sydney, Australia","Australia","Summer Christmas markets, lights and community events.","summer",-21]
 ]
};

function calcHolidayDate(name,year){
 const y=year;
 if(name==="New Year’s Eve") return new Date(y,11,31);
 if(name==="New Year’s Day") return new Date(y,0,1);
 if(name==="Valentine’s Day") return new Date(y,1,14);
 if(name==="Juneteenth") return new Date(y,5,19);
 if(name==="Independence Day") return new Date(y,6,4);
 if(name==="Halloween") return new Date(y,9,31);
 if(name==="Veterans Day") return new Date(y,10,11);
 if(name==="Christmas Day") return new Date(y,11,25);
 if(name==="Martin Luther King Jr. Day"){let d=new Date(y,0,1);while(d.getDay()!==1)d.setDate(d.getDate()+1);d.setDate(d.getDate()+14);return d}
 if(name==="Labor Day"){let d=new Date(y,8,1);while(d.getDay()!==1)d.setDate(d.getDate()+1);return d}
 if(name==="Memorial Day"){let d=new Date(y,4,31);while(d.getDay()!==1)d.setDate(d.getDate()-1);return d}
 if(name==="Thanksgiving Day"){let d=new Date(y,10,1);while(d.getDay()!==4)d.setDate(d.getDate()+1);d.setDate(d.getDate()+21);return d}
 if(name==="Easter Sunday"){
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
  return new Date(y,mo-1,day);
 }
 return null;
}
function selectedHoliday(){
 return window.__holidayCommunityState?.name||window.__holidayExperience||'Halloween';
}
function generatedEvents(name,year){
 const target=calcHolidayDate(name,year);
 return (GLOBAL_EVENT_TEMPLATES[name]||[]).map((e,i)=>{
  const d=new Date(target);d.setDate(d.getDate()+Number(e[5]||0));
  return {id:'generated-'+year+'-'+i,title:e[0],city:e[1],country:e[2],description:e[3],kind:e[4],date:d,source:'CrowSpace Global Holiday Calendar',generated:true};
 }).sort((a,b)=>a.date-b.date);
}
function statusFor(d,now){
 const day=(d-now)/86400000;
 if(Math.abs(day)<1 && d.toDateString()===now.toDateString()) return ['TODAY','today'];
 if(day>0) return [day<1?'NEXT':'IN '+Math.ceil(day)+' DAYS','upcoming'];
 return ['COMPLETED','ended'];
}
function fmtDate(d){return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}
function fmtTime(d){return d.toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'})}

async function safe(table,select,limit=50){
 const c=client();if(!c)return[];
 try{const r=await c.from(table).select(select).order('created_at',{ascending:false}).limit(limit);return r.error?[]:(r.data||[])}catch(e){return[]}
}
function rowText(row){return row?.body||row?.content||row?.caption||row?.title||row?.text||''}

async function load(name=selectedHoliday()){
 const year=holidayYear(),now=new Date(),host=$('holiday-event-center');if(!host)return;
 const events=generatedEvents(name,year);
 const [dbEvents,posts,caws]=await Promise.all([
  safe('crowspace_events','id,title,description,starts_at,location,city,country,link,holiday_name,holiday_year,created_at,online',100),
  safe('crowspace_posts','id,title,body,content,media_url,created_at,user_id,holiday_name,holiday_year',100),
  safe('crowspace_caws','id,title,caption,video_url,thumbnail_url,created_at,user_id,holiday_name,holiday_year,views',100)
 ]);
 const matchingEvents=dbEvents.filter(e=>e.holiday_name===name&&(e.holiday_year==null||Number(e.holiday_year)===year));
 const merged=[...events,...matchingEvents.map(e=>({id:e.id,title:e.title,city:e.city||e.location||'Community',country:e.country||'',description:e.description||'',date:e.starts_at?new Date(e.starts_at):new Date(e.created_at),link:e.link||'events.html',source:'CrowSpace Community',generated:false,online:e.online}))].sort((a,b)=>a.date-b.date);
 const holidayPosts=posts.filter(p=>p.holiday_name===name&&(p.holiday_year==null||Number(p.holiday_year)===year));
 const holidayCaws=caws.filter(c=>c.holiday_name===name&&(c.holiday_year==null||Number(c.holiday_year)===year));
 const upcoming=merged.filter(e=>e.date>=now);
 const next=upcoming[0];
 const active=merged.filter(e=>e.date.toDateString()===now.toDateString());

 host.innerHTML='<section class="cs-event-center-head"><div><span class="cs-holiday-kicker">V39 // HOLIDAY EVENT CENTER</span><h2>🌍 '+esc(name)+'</h2><p>Automatically assembled global events leading into the holiday, plus holiday Caws and the celebration feed.</p></div><div class="cs-event-center-meta"><strong>'+merged.length+'</strong><span>GLOBAL EVENTS</span></div></section>'+
 '<div class="cs-event-center-toolbar"><button id="cs-event-refresh">REFRESH</button><span>'+esc(fmtDate(calcHolidayDate(name,year)))+' · '+upcoming.length+' upcoming</span><span class="cs-event-sync">AUTO-CURATED · '+new Date().toLocaleTimeString()+'</span></div>'+
 '<div class="cs-event-center-grid">'+
 '<article class="cs-event-panel cs-global-events"><h3>🌎 EVENTS AROUND THE WORLD</h3><div class="cs-event-list">'+(merged.length?merged.map(e=>{const s=statusFor(e.date,now);return '<div class="cs-event-card '+s[1]+'"><div class="cs-event-date"><b>'+e.date.getDate()+'</b><span>'+e.date.toLocaleDateString(undefined,{month:'short'})+'</span></div><div class="cs-event-main"><strong>'+esc(e.title)+'</strong><span>'+esc(e.city)+(e.country?' · '+esc(e.country):'')+'</span><p>'+esc(e.description)+'</p><small>'+esc(e.source)+(e.generated?' · AUTO-GENERATED':' · COMMUNITY')+'</small></div><div class="cs-event-state">'+s[0]+'</div></div>'}).join(''):'<div class="cs-event-empty">No events are currently available for this holiday.</div>')+'</div></article>'+
 '<aside class="cs-event-side"><article class="cs-event-panel"><h3>⏳ NEXT GLOBAL EVENT</h3>'+(next?'<div class="cs-next-event"><b>'+esc(next.title)+'</b><span>'+fmtDate(next.date)+' · '+fmtTime(next.date)+'</span><small>'+esc(next.city)+(next.country?' · '+esc(next.country):'')+'</small><strong id="cs-event-countdown"></strong></div>':'<div class="cs-event-empty">The holiday event window has ended.</div>')+'</article>'+
 '<article class="cs-event-panel"><h3>🎉 HAPPENING TODAY</h3>'+(active.length?active.map(e=>'<div class="cs-mini-event"><b>'+esc(e.title)+'</b><span>'+esc(e.city)+' · '+fmtTime(e.date)+'</span></div>').join(''):'<div class="cs-event-empty">Nothing scheduled today. The next events are shown above.</div>')+'</article></aside></div>'+
 '<div class="cs-holiday-content-grid"><article class="cs-event-panel"><h3>🐦 HOLIDAY CAWS</h3><div class="cs-holiday-items">'+(holidayCaws.length?holidayCaws.map(c=>'<a class="cs-holiday-content-item" href="caws.html#caw-'+encodeURIComponent(c.id)+'"><strong>'+esc(c.title||'Holiday Caw')+'</strong><span>'+esc(c.caption||'')+'</span><small>'+new Date(c.created_at).toLocaleString()+'</small></a>').join(''):'<div class="cs-event-empty">No holiday Caws yet. Post a Caw tagged '+esc(name)+'.</div>')+'</div></article>'+
 '<article class="cs-event-panel"><h3>🎊 CELEBRATION FEED</h3><div class="cs-holiday-items">'+(holidayPosts.length?holidayPosts.map(p=>'<a class="cs-holiday-content-item" href="feed.html#post-'+encodeURIComponent(p.id)+'"><strong>'+esc(p.title||'Celebration from CrowSpace')+'</strong><span>'+esc(rowText(p))+'</span><small>'+new Date(p.created_at).toLocaleString()+'</small></a>').join(''):'<div class="cs-event-empty">No holiday celebrations yet. Share a celebration to start the feed.</div>')+'</div></article></div>'+
 '<div class="cs-event-center-foot">Global event entries are generated from the selected holiday and year; community events remain separate and are never overwritten. Holiday Caws and celebration posts are read from the shared CrowSpace Supabase tables.</div>';
 const refresh=$('cs-event-refresh');if(refresh)refresh.onclick=()=>load(name);
 if(next){const el=$('cs-event-countdown');const tick=()=>{const x=Math.max(0,next.date-new Date()),s=Math.floor(x/1000),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60),sec=s%60;el.textContent=x<=0?'HAPPENING NOW':d+'d '+String(h).padStart(2,'0')+'h '+String(m).padStart(2,'0')+'m '+String(sec).padStart(2,'0')+'s'};tick();clearInterval(window.__holidayEventTick);window.__holidayEventTick=setInterval(tick,1000)}
}
window.CrowSpaceHolidayEventCenter={load};
document.addEventListener('crowspace-holiday-selected',e=>{if(e.detail?.name)load(e.detail.name)});
document.addEventListener('crowspace-universal-ready',()=>load(selectedHoliday()));
})();
