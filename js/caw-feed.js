(()=>{"use strict";

const SUPABASE_URL="https://cevylpnoexugwgygvtgu.supabase.co";
const SUPABASE_KEY="sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-";
const BUCKET="crowspace-caws";
const PAGE_SIZE=12;

const feed=document.querySelector(".cf-feed");
const status=document.querySelector(".cf-status");
const loadMore=document.querySelector(".cf-loadmore");
const tabs=[...document.querySelectorAll(".cf-tab")];

let supabase=null,user=null,mode="for-you",page=0,busy=false,done=false;
let cards=[],active=0,observer=null;

const esc=v=>String(v??"").replace(/[&<>\"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const media=x=>{
  if(x.video_url)return x.video_url;
  if(x.storage_path)return SUPABASE_URL+"/storage/v1/object/public/"+BUCKET+"/"+x.storage_path.split("/").map(encodeURIComponent).join("/");
  return "";
};
const setStatus=s=>{if(status)status.textContent=s};

async function makeClient(){
  if(window.crowSupabase?.from){supabase=window.crowSupabase;return supabase}
  if(!window.supabase?.createClient){
    await new Promise((resolve,reject)=>{
      const s=document.createElement("script");
      s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.onload=resolve;s.onerror=()=>reject(new Error("Supabase library failed to load."));
      document.head.appendChild(s);
    });
  }
  supabase=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  window.crowSupabase=supabase;
  return supabase;
}

async function init(){
  setStatus("Connecting to CrowSpace…");
  await makeClient();
  const {data,error}=await supabase.auth.getUser();
  if(error)throw error;
  user=data?.user||null;
  if(!user){
    location.href="login.html?next="+encodeURIComponent(location.href);
    return false;
  }
  return true;
}

async function trackView(id){
  if(!id||!supabase)return;
  try{
    const key="crowspace_caw_viewer_token";
    let token=localStorage.getItem(key);
    if(!token){
      token=crypto.randomUUID?crypto.randomUUID():Date.now()+"-"+Math.random().toString(36).slice(2);
      localStorage.setItem(key,token);
    }
    const payload={caw_id:id,viewer_token:token,viewed_at:new Date().toISOString()};
    if(user)payload.user_id=user.id;
    const r=await supabase.from("crowspace_caw_views").insert(payload);
    if(r.error&&r.error.code!=="23505")console.warn("Caw view:",r.error.message);
  }catch(e){console.warn("Caw view:",e.message)}
}

async function queryCaws(){
  const from=page*PAGE_SIZE,to=from+PAGE_SIZE-1;
  let q=supabase.from("crowspace_caws")
    .select("id,user_id,title,caption,video_url,thumbnail_url,views,created_at,storage_path,mime_type,reward_featured_until")
    .order("created_at",{ascending:false}).range(from,to);

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
  if(r.error){console.warn(r.error.message);return {}}
  return Object.fromEntries((r.data||[]).map(x=>[x.user_id,x]));
}

function card(x,p){
  const featured=x.reward_featured_until&&new Date(x.reward_featured_until)>new Date();
  const name=p?.display_name||p?.username||"CrowSpace Member";
  const src=media(x);
  const avatar=p?.avatar_url
    ? '<img src="'+esc(p.avatar_url)+'" alt="" loading="lazy">'
    : '<span>'+esc((name[0]||"C").toUpperCase())+"</span>";

  return '<article class="cf-card '+(featured?"cf-featured":"")+'" data-id="'+esc(x.id)+'">'+
    '<div class="cf-media">'+
      '<video class="cf-video" src="'+esc(src)+'" '+(x.thumbnail_url?'poster="'+esc(x.thumbnail_url)+'" ':"")+'autoplay playsinline muted loop preload="auto"></video>'+
      '<div class="cf-media-shade"></div>'+
      '<div class="cf-topbar"><div class="cf-avatar">'+avatar+'</div><div><strong>'+esc(name)+'</strong><small>@'+esc(p?.username||"member")+'</small></div></div>'+
      '<button class="cf-play" type="button" aria-label="Play or pause">▶</button>'+
      '<div class="cf-bottom-fade"></div>'+
      '<div class="cf-slide-number"></div>'+
    '</div>'+
    '<div class="cf-info">'+
      (featured?'<div class="cf-feature-label">⭐ FEATURED CAW</div>':"")+
      '<h2>'+esc(x.title||"Untitled Caw")+'</h2>'+
      '<p>'+esc(x.caption||"")+'</p>'+
      '<div class="cf-meta">'+Number(x.views||0).toLocaleString()+" views · "+new Date(x.created_at).toLocaleDateString()+"</div>"+
    '</div>'+
    '<div class="cf-actions">'+
      '<button type="button" class="cf-act cf-like" aria-label="Like">♥</button>'+
      '<button type="button" class="cf-act cf-share" aria-label="Share">↗</button>'+
      '<a class="cf-act" href="profile.html?id='+encodeURIComponent(x.user_id)+'">Nest</a>'+
    '</div>'+
  '</article>';
}

function updateNumbers(){
  cards=[...feed.querySelectorAll(".cf-card")];
  cards.forEach((c,i)=>{
    const n=c.querySelector(".cf-slide-number");
    if(n)n.textContent=(i+1)+" / "+cards.length;
  });
}

function pauseOthers(except){
  cards.forEach((c,i)=>{
    const v=c.querySelector("video");
    if(i!==except){c.classList.remove("active");if(v)v.pause()}
  });
}

function activate(index,scroll=false){
  cards=[...feed.querySelectorAll(".cf-card")];
  if(!cards.length)return;
  index=Math.max(0,Math.min(cards.length-1,index));
  active=index;
  pauseOthers(index);
  const c=cards[index],v=c.querySelector("video");
  c.classList.add("active");
  if(v){v.muted=true;v.autoplay=true;v.play().catch(()=>{})}
  if(scroll)c.scrollIntoView({behavior:"smooth",block:"start"});
  cards.forEach((x,i)=>x.setAttribute("aria-current",i===index?"true":"false"));
  if(index>=cards.length-3&&!done&&!busy)load(false);
}

function move(delta){
  cards=[...feed.querySelectorAll(".cf-card")];
  if(!cards.length)return;
  activate(active+delta,true);
}

function observeCards(){
  observer?.disconnect();
  observer=new IntersectionObserver(entries=>{
    let best=null;
    for(const entry of entries){
      if(entry.isIntersecting&&(!best||entry.intersectionRatio>best.intersectionRatio))best=entry;
    }
    if(best){
      const i=cards.indexOf(best.target);
      if(i>=0)activate(i,false);
    }
  },{root:feed,threshold:[0.55,0.75,0.9]});
  cards.forEach(c=>observer.observe(c));
}

function bindCards(){
  cards=[...feed.querySelectorAll(".cf-card")];
  cards.forEach((c,i)=>{
    if(c.dataset.bound)return;
    c.dataset.bound="1";
    const v=c.querySelector("video"),play=c.querySelector(".cf-play");
    if(v){v.muted=true;v.autoplay=true;v.setAttribute("autoplay","");v.addEventListener("canplay",()=>{if(c.classList.contains("active"))v.play().catch(()=>{})},{once:true});}
    let tracked=false;
    const track=()=>{if(!tracked){tracked=true;trackView(c.dataset.id)}};
    v?.addEventListener("play",track,{passive:true});
    v?.addEventListener("timeupdate",()=>{if(v.currentTime>=2)track()},{passive:true});
    play?.addEventListener("click",e=>{
      e.stopPropagation();
      if(!v)return;
      if(v.paused){v.muted=true;v.play().catch(()=>{});play.textContent="❚❚"}else{v.pause();play.textContent="▶"}
    });
    c.querySelector(".cf-share")?.addEventListener("click",async()=>{
      const u=new URL("caw-feed.html",location.href);u.searchParams.set("caw",c.dataset.id);
      try{await navigator.clipboard.writeText(u.href);setStatus("Caw link copied")}catch{setStatus("Copy unavailable")}
    });
    c.addEventListener("click",e=>{
      if(e.target.closest("button,a"))return;
      activate(i,true);
    });
  });
  updateNumbers();
  observeCards();
}

function showError(message){
  feed.innerHTML='<div class="cf-empty"><h2>Couldn’t Load Caws</h2><p>'+esc(message||"Unable to load the Caw feed.")+'</p><button class="cf-retry" type="button">Try Again</button></div>';
  feed.querySelector(".cf-retry")?.addEventListener("click",()=>load(true));
  setStatus("Feed error");
}

async function render(items){
  if(!items.length)return;
  const profiles=await profileMap(items);
  feed.insertAdjacentHTML("beforeend",items.map(x=>card(x,profiles[x.user_id])).join(""));
  bindCards();
}

async function load(reset=false){
  if(busy)return;
  if(reset){
    page=0;done=false;active=0;feed.innerHTML="";setStatus("Loading Caws…");
  }
  busy=true;
  try{
    const data=await queryCaws();
    if(data.length<PAGE_SIZE)done=true;
    await render(data);
    page++;
    cards=[...feed.querySelectorAll(".cf-card")];
    setStatus(cards.length?("Caw "+(active+1)+" of "+cards.length):"No Caws yet");
    if(loadMore)loadMore.style.display=done?"none":"block";
    if(!cards.length)feed.innerHTML='<div class="cf-empty"><h2>No Caws Yet</h2><p>Be the first to share something with CrowSpace.</p><a href="create-caw.html">Create a Caw</a></div>';
    else activate(Math.min(active,cards.length-1),false);
  }catch(e){
    console.error("Caw Feed:",e);
    if(!cards.length)showError(e.message);
  }finally{busy=false}
}

tabs.forEach(t=>t.addEventListener("click",()=>{
  tabs.forEach(x=>x.classList.remove("active"));
  t.classList.add("active");
  mode=t.dataset.mode||"for-you";
  load(true);
}));

document.querySelector(".cf-refresh")?.addEventListener("click",()=>load(true));
loadMore?.addEventListener("click",()=>load(false));

feed.addEventListener("wheel",e=>{
  if(Math.abs(e.deltaY)<15)return;
  e.preventDefault();
  move(e.deltaY>0?1:-1);
},{passive:false});

let touchStartY=0,touchStartX=0;
feed.addEventListener("touchstart",e=>{
  touchStartY=e.touches[0].clientY;touchStartX=e.touches[0].clientX;
},{passive:true});
feed.addEventListener("touchend",e=>{
  const dy=e.changedTouches[0].clientY-touchStartY;
  const dx=e.changedTouches[0].clientX-touchStartX;
  if(Math.abs(dy)>50&&Math.abs(dy)>Math.abs(dx))move(dy<0?1:-1);
},{passive:true});

window.addEventListener("keydown",e=>{
  if(["ArrowDown","PageDown"," "].includes(e.key)){e.preventDefault();move(1)}
  if(["ArrowUp","PageUp"].includes(e.key)){e.preventDefault();move(-1)}
  if(e.key==="Home"){e.preventDefault();activate(0,true)}
  if(e.key==="End"){e.preventDefault();cards=[...feed.querySelectorAll(".cf-card")];activate(cards.length-1,true)}
});

(async()=>{try{if(await init())await load(true)}catch(e){console.error(e);showError(e.message)}})();
})();