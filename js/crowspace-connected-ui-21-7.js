/* CrowSpace 21.7 — Visual Connected Universe Surface */
window.CrowSpaceConnectedUI21_7=(()=>{
 const esc=x=>String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
 const meta={
  creator:["CREATOR","crowspace/profile.html?id="],
  caw:["CAW","crowspace/caw.html?id="],
  event:["EVENT","crowspace/event.html?id="],
  group:["GROUP","crowspace/group.html?id="],
  circle:["CIRCLE","crowspace/circle.html?id="],
  post:["POST","crowspace/post.html?id="],
  project:["PROJECT","crowspace/project.html?id="],
  media_album:["MEDIA","crowspace/album.html?id="]
 };
 async function render(db,user){
  const host=document.getElementById("crow217grid"),state=document.getElementById("crow217state");
  if(!host||!db||!user||!window.CrowSpaceRecommendations21_2)return;
  const c=await CrowSpaceRecommendations21_2.context(db,user);
  const nodes=await CrowSpaceConnectedDiscovery21_6.forFollowedCreator(db,user,c.followed,80);
  const blocked=new Set((c.feedback||[]).filter(x=>["hidden","not_interested"].includes(x.feedback_type)).map(x=>x.target_type+":"+x.target_id));
  const filtered=nodes.filter(x=>!blocked.has(x.type+":"+x.id));
  const ids=(t)=>filtered.filter(x=>x.type===t).map(x=>x.id);
  const [p,ca,ev,gr,ci,po,pr,al]=await Promise.all([
   db.from("crowspace_profiles").select("user_id,display_name,username,avatar_url,creator_category").in("user_id",ids("creator")),
   db.from("crowspace_caws").select("id,title,caption,thumbnail_url,user_id").in("id",ids("caw")),
   db.from("crowspace_events").select("id,title,description,starts_at,is_live,image_url").in("id",ids("event")),
   db.from("crowspace_groups").select("id,name,description,image_url").in("id",ids("group")),
   db.from("crowspace_circles").select("id,name,description,image_url").in("id",ids("circle")),
   db.from("crowspace_posts").select("id,title,body,user_id").in("id",ids("post")),
   db.from("crowspace_creator_projects").select("id,title,description,project_type,cover_url").in("id",ids("project")),
   db.from("crowspace_albums").select("id,title,description,cover_url").in("id",ids("media_album"))
  ]);
  const maps={
   creator:new Map((p.data||[]).map(x=>[String(x.user_id),{title:x.display_name||x.username||"Creator",sub:x.creator_category||"Creator",img:x.avatar_url}])),
   caw:new Map((ca.data||[]).map(x=>[String(x.id),{title:x.title||"Caw",sub:x.caption||"Caw",img:x.thumbnail_url}])),
   event:new Map((ev.data||[]).map(x=>[String(x.id),{title:x.title||"Event",sub:x.is_live?"LIVE NOW":x.starts_at?new Date(x.starts_at).toLocaleString():"Event",img:x.image_url}])),
   group:new Map((gr.data||[]).map(x=>[String(x.id),{title:x.name||"Group",sub:x.description||"Community",img:x.image_url}])),
   circle:new Map((ci.data||[]).map(x=>[String(x.id),{title:x.name||"Circle",sub:x.description||"Circle",img:x.image_url}])),
   post:new Map((po.data||[]).map(x=>[String(x.id),{title:x.title||"Community Post",sub:x.body||"Post"}])),
   project:new Map((pr.data||[]).map(x=>[String(x.id),{title:x.title||"Project",sub:x.project_type||x.description||"Project",img:x.cover_url}])),
   media_album:new Map((al.data||[]).map(x=>[String(x.id),{title:x.title||"Media Album",sub:x.description||"Media",img:x.cover_url}]))
  };
  const items=window.CrowSpaceAdaptive21_5?CrowSpaceAdaptive21_5.decorate(filtered):filtered;
  host.innerHTML=items.slice(0,18).map(x=>{
   const v=maps[x.type]?.get(String(x.id)); if(!v)return "";
   const m=meta[x.type]||["DISCOVERY","#"];
   return '<article class="crow217-card"><div class="crow217-type">'+m[0]+'</div>'+(v.img?'<img src="'+esc(v.img)+'" alt="" loading="lazy">':'')+'<h3>'+esc(v.title)+'</h3><p>'+esc(v.sub)+'</p><small>'+esc(x.reasons?.[0]||"Connected to your universe")+'</small></article>';
  }).join("");
  state.textContent=items.length?items.length+" connected recommendations · updated live":"Follow creators to unlock connected Caws, events, communities, projects and media.";
 }
 function install(){
  const anchor=document.getElementById("crow212");
  if(!anchor||document.getElementById("crow217"))return;
  anchor.insertAdjacentHTML("beforebegin",'<section id="crow217" style="margin:28px 0;padding:22px;border:1px solid rgba(98,244,255,.2);border-radius:20px;background:linear-gradient(135deg,rgba(98,244,255,.045),rgba(155,108,255,.045))"><div style="font:800 11px Orbitron;letter-spacing:.2em;color:#62f4ff">CROWRULES // CONNECTED UNIVERSE 21.7</div><h2 style="font:800 28px Orbitron;margin:9px 0">BEYOND THE CREATOR.</h2><p id="crow217state" style="color:#8995aa">Following relationships become connected discoveries.</p><div id="crow217grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px"></div></section>');
 }
 async function start(){
  install(); await CrowSpaceAuth.ready; const u=CrowSpaceAuth.user;if(!u)return;
  const db=CrowSpaceAuth.client; await render(db,u);
  document.addEventListener("crowspace:recommendation-update",()=>render(db,u));
  document.addEventListener("crowspace:adaptive-ui-update",()=>render(db,u));
  document.addEventListener("crowspace:connected-universe-update",()=>render(db,u));
 }
 return {version:"21.7",install,render,start};
})();