(()=>{"use strict";
const SUPABASE_URL="https://cevylpnoexugwgygvtgu.supabase.co";
const SUPABASE_KEY="sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-";
const BUCKET="crowspace-caws";
const feed=document.querySelector(".cf-feed"),status=document.querySelector(".cf-status"),loadMore=document.querySelector(".cf-loadmore");
const tabs=[...document.querySelectorAll(".cf-tab")];
let supabase=null,user=null,mode="for-you",rows=[],page=0,busy=false,done=false;

const esc=v=>String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const media=x=>{
 if(x.video_url)return x.video_url;
 if(x.storage_path)return SUPABASE_URL+"/storage/v1/object/public/"+BUCKET+"/"+x.storage_path.split("/").map(encodeURIComponent).join("/");
 return "";
};
const setStatus=s=>{if(status)status.textContent=s};
function showError(message){
 feed.innerHTML='<div class="cf-empty"><h2>Caw Feed Error</h2><p>'+esc(message||"Unable to load Caws.")+'</p><button class="cf-retry" type="button">Try Again</button></div>';
 feed.querySelector(".cf-retry")?.addEventListener("click",()=>load(true));
 setStatus("Feed error");
}
async function makeClient(){
 if(window.crowSupabase?.from){return window.crowSupabase}
 if(!window.supabase?.createClient){
  await new Promise((resolve,reject)=>{
   const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";s.onload=resolve;s.onerror=()=>reject(new Error("Supabase library failed to load."));document.head.appendChild(s);
  });
 }
 supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 window.crowSupabase=supabase;
 return supabase;
}
async function init(){
 setStatus("Connecting to CrowSpace…");
 supabase=await makeClient();
 const {data,error}=await supabase.auth.getUser();
 if(error)throw error;
 user=data?.user||null;
 if(!user){location.href="login.html?next="+encodeURIComponent(location.href);return false}
 return true;
}
async function queryCaws(){
 const from=page*12,to=from+11;
 let q=supabase.from("crowspace_caws").select("id,user_id,title,caption,video_url,thumbnail_url,views,created_at,storage_path,mime_type,reward_featured_until").order("created_at",{ascending:false}).range(from,to);
 if(mode==="following"){
  const f=await supabase.from("crowspace_follows").select("followed_user_id").eq("follower_id",user.id);
  if(f.error)throw f.error;
  const ids=(f.data||[]).map(x=>x.followed_user_id);
  if(!ids.length)return [];
  q=q.in("user_id",ids);
 }
 const {data,error}=await q;
 if(error)throw error;
 let result=(data||[]).filter(x=>media(x));
 if(mode==="trending")result.sort((a,b)=>Number(b.views||0)-Number(a.views||0));
 return result;
}
async function profileMap(items){
 const ids=[...new Set(items.map(x=>x.user_id).filter(Boolean))];
 if(!ids.length)return {};
 const r=await supabase.from("crowspace_profiles").select("user_id,display_name,username,avatar_url").in("user_id",ids);
 if(r.error)return {};
 return Object.fromEntries((r.data||[]).map(x=>[x.user_id,x]));
}
function card(x,p){
 const featured=x.reward_featured_until&&new Date(x.reward_featured_until)>new Date();
 const name=p?.display_name||p?.username||"CrowSpace Member";
 const src=media(x);
 return '<article class="cf-card '+(featured?"cf-featured":"")+'" data-id="'+esc(x.id)+'">'+
 '<div class="cf-media"><video class="cf-video" src="'+esc(src)+'" '+(x.thumbnail_url?'poster="'+esc(x.thumbnail_url)+'" ':'')+'playsinline muted loop preload="metadata"></video>'+
 '<div class="cf-gradient"></div><div class="cf-creator">'+(p?.avatar_url?'<img src="'+esc(p.avatar_url)+'" alt="">':'<span>'+esc(name[0]||"C")+'</span>')+'<strong>'+esc(name)+'</strong></div>'+
 '<button class="cf-play" type="button">▶</button></div>'+
 '<div class="cf-info">'+(featured?'<div class="cf-feature-label">⭐ FEATURED CAW</div>':'')+'<h2>'+esc(x.title||"Untitled Caw")+'</h2><p>'+esc(x.caption||"")+'</p><small>'+Number(x.views||0).toLocaleString()+' views</small></div>'+
 '<div class="cf-actions"><button type="button" class="cf-act cf-like">♥</button><button type="button" class="cf-act cf-share">↗</button><a class="cf-act" href="profile.html?id='+encodeURIComponent(x.user_id)+'">Nest</a></div></article>';
}
async function render(items){
 if(!items.length)return;
 const profiles=await profileMap(items);
 feed.insertAdjacentHTML("beforeend",items.map(x=>card(x,profiles[x.user_id])).join(""));
 bindCards();
}
function bindCards(){
 feed.querySelectorAll(".cf-card:not([data-bound])").forEach(c=>{
  c.dataset.bound="1";
  const v=c.querySelector("video"),play=c.querySelector(".cf-play");
  play.onclick=()=>{if(v.paused){v.play().catch(()=>{});play.textContent="❚❚"}else{v.pause();play.textContent="▶"}};
  c.querySelector(".cf-share").onclick=async()=>{const u=new URL("caw-feed.html",location.href);u.searchParams.set("caw",c.dataset.id);try{await navigator.clipboard.writeText(u.href);setStatus("Caw link copied")}catch{}};
 });
}
let active=0;
function sync(){
 const cards=[...feed.querySelectorAll(".cf-card")];if(!cards.length)return;
 let best=0,dist=Infinity,top=feed.getBoundingClientRect().top;
 cards.forEach((c,i)=>{const d=Math.abs(c.getBoundingClientRect().top-top);if(d<dist){dist=d;best=i}});
 active=best;
 cards.forEach((c,i)=>{const v=c.querySelector("video");if(i===best){c.classList.add("active");v.play().catch(()=>{})}else{c.classList.remove("active");v.pause()}});
 if(active>=cards.length-2&&!done&&!busy)load(false);
}
function swipeSetup(){
 feed.addEventListener("scroll",()=>requestAnimationFrame(sync),{passive:true});
 let sy=0;
 feed.addEventListener("touchstart",e=>sy=e.touches[0].clientY,{passive:true});
 feed.addEventListener("touchend",e=>{const dy=e.changedTouches[0].clientY-sy;if(Math.abs(dy)>55){const cards=[...feed.querySelectorAll(".cf-card")];cards[Math.max(0,Math.min(cards.length-1,active+(dy<0?1:-1)))]?.scrollIntoView({behavior:"smooth"})}},{passive:true});
 window.addEventListener("keydown",e=>{if(["ArrowDown","PageDown"].includes(e.key)){e.preventDefault();move(1)}if(["ArrowUp","PageUp"].includes(e.key)){e.preventDefault();move(-1)}});
}
function move(delta){const cards=[...feed.querySelectorAll(".cf-card")];if(cards[active+delta])cards[active+delta].scrollIntoView({behavior:"smooth",block:"start"});}
async function load(reset=false){
 if(busy)return;
 if(reset){page=0;done=false;rows=[];feed.innerHTML="";setStatus("Loading Caws…")}
 busy=true;
 try{
  const data=await queryCaws();
  if(data.length<12)done=true;
  rows.push(...data);
  await render(data);
  page++;
  setStatus(rows.length?("CrowSpace · "+rows.length+" Caw"+(rows.length===1?"":"s")):"No Caws yet");
  loadMore.style.display=done?"none":"block";
  if(!rows.length)feed.innerHTML='<div class="cf-empty"><h2>No Caws Yet</h2><p>Upload a Caw to start the feed.</p><a href="create-caw.html">Create a Caw</a></div>';
  setTimeout(sync,100);
 }catch(e){console.error("Caw Feed:",e);if(!rows.length)showError(e.message)}finally{busy=false}
}
tabs.forEach(t=>t.addEventListener("click",()=>{tabs.forEach(x=>x.classList.remove("active"));t.classList.add("active");mode=t.dataset.mode;load(true)}));
document.querySelector(".cf-refresh")?.addEventListener("click",()=>load(true));
loadMore?.addEventListener("click",()=>load(false));
(async()=>{try{if(await init()){swipeSetup();await load(true)}}catch(e){console.error(e);showError(e.message)}})();
})();