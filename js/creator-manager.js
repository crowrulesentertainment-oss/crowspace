import{createClient}from"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL="https://cevylpnoexugwgygvtgu.supabase.co";
const SUPABASE_KEY="sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-";
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY);

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmtDate=v=>v?new Date(v).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}):"—";
const num=v=>Number(v||0).toLocaleString();
const errText=e=>esc(e?.message||e?.hint||"Data unavailable");

function setText(id,v){const el=document.getElementById(id);if(el)el.textContent=v}
function setHTML(id,v){const el=document.getElementById(id);if(el)el.innerHTML=v}

async function safe(label,fn,fallback=[]){
  try{
    const result=await fn();
    if(result?.error){console.warn("[CrowSpace]",label,result.error);return{data:fallback,error:result.error}}
    return{data:result?.data??result??fallback,error:null}
  }catch(error){
    console.warn("[CrowSpace]",label,error);
    return{data:fallback,error}
  }
}

function loading(){return '<div class="empty"><strong>Loading…</strong><br>Connecting to the CrowSpace data layer.</div>'}
function failed(label,error){
  return '<div class="empty"><strong>'+esc(label)+' could not load.</strong><br>'+errText(error)+'<br><small>Your cinematic workspace is still available. This section will not blank the page.</small></div>'
}
function cards(rows,type){
  if(!rows.length)return '<div class="empty"><strong>Nothing here yet</strong><br>New content will appear here as your CrowSpace universe grows.</div>';
  return rows.map(r=>{
    let icon="📝",title="",body="",meta="",metrics="",actions="";
    if(type==="posts"){icon="📝";title=r.body?String(r.body).slice(0,80):"Untitled Post";body=r.body||"No post text.";meta=r.visibility||"public";metrics=fmtDate(r.created_at);actions='<a href="create.html">Create Post</a>'}
    if(type==="caws"){icon="🎬";title=r.caption?String(r.caption).slice(0,80):"Untitled Caw";body="Short-form video";meta=r.visibility||"public";metrics=num(r.views)+" views · "+num(r.likes)+" likes · "+fmtDate(r.created_at);actions='<a href="create.html">Create Caw</a>'}
    if(type==="pictures"){icon="📸";title=r.alt_text||"Picture";body=r.media_type||"image";meta="MEDIA";metrics=fmtDate(r.created_at);actions=r.public_url?'<a href="'+esc(r.public_url)+'" target="_blank" rel="noopener">Open</a>':""}
    if(type==="groups"){icon="👥";title=r.name||"Untitled Group";body=r.description||"CrowSpace community";meta=r.privacy||"public";metrics=num(r.member_count)+" members · "+fmtDate(r.created_at);actions='<a href="groups.html">Open Groups</a>'}
    if(type==="live"){icon="🔴";title=r.title||"Untitled Broadcast";body=r.description||"CrowSpace live broadcast";meta=r.status||"scheduled";metrics=num(r.viewer_count)+" viewers · "+fmtDate(r.scheduled_for||r.created_at);actions='<a href="live-studio.html">Open Studio</a>'}
    if(type==="replays"){icon="↻";title=r.recording_title||r.title||"Untitled Replay";body=r.description||"Archived CrowSpace broadcast";meta=r.recording_status||"archived";metrics=num(r.peak_viewers)+" peak viewers · "+fmtDate(r.archived_at||r.ended_at||r.created_at);actions='<a href="archive.html">Open Archive</a>'}
    return '<article class="item"><div class="thumb">'+icon+'</div><div class="info"><div class="meta">'+esc(meta)+'</div><h3>'+esc(title)+'</h3><p>'+esc(body)+'</p><div class="metrics"><span>'+metrics+'</span></div><div class="actions">'+actions+'<a href="account.html">Account</a></div></div></article>'
  }).join("")
}

function renderUser(user,account,profile){
  const name=account?.display_name||profile?.display_name||user?.email?.split("@")[0]||"Creator";
  setText("creatorName",name);
  setText("creatorHandle",account?.handle?"@"+account.handle:"CrowSpace Creator");
  setText("shellStatus","Live Data Layer");
  setText("membership",account?.universal_member?"Universal Member":"CrowSpace Account");
}

async function main(){
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){
    setText("shellStatus","Sign in required");
    setText("creatorName","Guest");
    setText("creatorHandle","Sign in to manage content");
    ["posts","caws","pictures","groups","live","replays"].forEach(x=>setHTML(x+"Data",'<div class="empty"><strong>Sign in to load your content.</strong><br>Your cinematic layout stays visible even without a session.<br><div class="actions" style="justify-content:center"><a href="account.html">Open Account</a></div></div>'));
    return;
  }

  const [account,profile,dash,posts,caws,pictures,groups,live,replays,postCount,cawCount,pictureCount,groupCount,liveCount,replayCount]=await Promise.all([
    safe("account",()=>supabase.from("crowspace_accounts").select("user_id,handle,display_name,universal_member").eq("user_id",user.id).maybeSingle(),null),
    safe("profile",()=>supabase.from("crowspace_profiles").select("user_id,bio,avatar_url,is_creator,is_verified,followers_count,following_count").eq("user_id",user.id).maybeSingle(),null),
    safe("dashboard",()=>supabase.from("crowspace_creator_dashboard").select("*").eq("user_id",user.id).maybeSingle(),null),
    safe("posts",()=>supabase.from("crowspace_posts").select("id,body,visibility,group_id,created_at,updated_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(12),[]),
    safe("caws",()=>supabase.from("crowspace_caws").select("id,caption,video_url,thumbnail_url,visibility,views,likes,comments_count,shares_count,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(12),[]),
    safe("pictures",()=>supabase.from("crowspace_media").select("id,post_id,media_type,public_url,width,height,duration_seconds,alt_text,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(12),[]),
    safe("groups",()=>supabase.from("crowspace_groups").select("id,owner_id,name,slug,description,cover_url,privacy,member_count,created_at,updated_at").eq("owner_id",user.id).order("created_at",{ascending:false}).limit(12),[]),
    safe("live",()=>supabase.from("crowspace_live_streams").select("id,host_id,title,description,status,thumbnail_url,scheduled_for,started_at,ended_at,viewer_count,peak_viewers,created_at,visibility").eq("host_id",user.id).order("created_at",{ascending:false}).limit(12),[]),
    safe("replays",()=>supabase.from("crowspace_live_streams").select("id,host_id,title,description,status,thumbnail_url,scheduled_for,started_at,ended_at,viewer_count,peak_viewers,recording_status,recording_title,recording_thumbnail_url,archived_at,created_at").eq("host_id",user.id).in("status",["ended"]).order("ended_at",{ascending:false}).limit(12)),
    safe("postCount",()=>supabase.from("crowspace_posts").select("id",{count:"exact",head:true}).eq("user_id",user.id),null),
    safe("cawCount",()=>supabase.from("crowspace_caws").select("id",{count:"exact",head:true}).eq("user_id",user.id),null),
    safe("pictureCount",()=>supabase.from("crowspace_media").select("id",{count:"exact",head:true}).eq("user_id",user.id),null),
    safe("groupCount",()=>supabase.from("crowspace_groups").select("id",{count:"exact",head:true}).eq("owner_id",user.id),null),
    safe("liveCount",()=>supabase.from("crowspace_live_streams").select("id",{count:"exact",head:true}).eq("host_id",user.id).in("status",["scheduled","live"]),null),
    safe("replayCount",()=>supabase.from("crowspace_live_streams").select("id",{count:"exact",head:true}).eq("host_id",user.id).eq("status","ended"),null)
  ]);

  renderUser(user,account.data||dash.data,profile.data);
  const totalLikes=(caws.data||[]).reduce((n,r)=>n+Number(r.likes||0),0);
  const totalViews=(caws.data||[]).reduce((n,r)=>n+Number(r.views||0),0);
  setText("postsKpi",num(postCount.data===null?dash.data?.posts_count:postCount.data?.length??0));
  setText("cawsKpi",num(cawCount.data===null?dash.data?.caws_count:cawCount.data?.length??0));
  setText("picturesKpi",num(pictureCount.data===null?0:pictureCount.data?.length??0));
  setText("groupsKpi",num(groupCount.data===null?dash.data?.groups_count:groupCount.data?.length??0));
  setText("liveKpi",num(liveCount.data===null?dash.data?.broadcasts_count:liveCount.data?.length??0));
  setText("replaysKpi",num(replayCount.data===null?dash.data?.replays_count:replayCount.data?.length??0));
  setText("viewsKpi",num(totalViews));
  setText("likesKpi",num(totalLikes));

  setHTML("postsData",posts.error?failed("Posts",posts.error):cards(posts.data,"posts"));
  setHTML("cawsData",caws.error?failed("Caws",caws.error):cards(caws.data,"caws"));
  setHTML("picturesData",pictures.error?failed("Pictures",pictures.error):cards(pictures.data,"pictures"));
  setHTML("groupsData",groups.error?failed("Groups",groups.error):cards(groups.data,"groups"));
  setHTML("liveData",live.error?failed("Live broadcasts",live.error):cards(live.data,"live"));
  setHTML("replaysData",replays.error?failed("Replays",replays.error):cards(replays.data,"replays"));

  const failures=[account,profile,dash,posts,caws,pictures,groups,live,replays,postCount,cawCount,pictureCount,groupCount,liveCount,replayCount].filter(x=>x?.error).length;
  setText("dataHealth",failures?failures+" data source"+(failures===1?"":"s")+" need attention":"All data sources responding");
}

main().catch(error=>{
  console.error("[CrowSpace] Live Data Layer fatal",error);
  setText("shellStatus","Data layer protected");
  document.querySelectorAll("[id$='Data']").forEach(el=>el.innerHTML=failed("CrowSpace data layer",error));
});