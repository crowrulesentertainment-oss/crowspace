(()=>{if(window.__CROWSPACE_GLOBAL_NAV__)return;window.__CROWSPACE_GLOBAL_NAV__=true;
const load=s=>new Promise((ok,no)=>{if([...document.scripts].some(x=>x.src&&x.src.includes(s.split("?")[0])))return ok();const x=document.createElement("script");x.src=s;x.onload=ok;x.onerror=no;document.head.appendChild(x)});
async function boot(){
 try{
  if(!window.supabase?.createClient)await load("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
  if(!window.CROW_CONFIG)await load("js/config.js?v=20260928");
  if(!window.crowSupabase)await load("js/supabase.js?v=20260928");
  if(!window.CS)await load("js/crowspace.js?v=20260928");
  const header=document.querySelector(".site-header");
  if(!header)return;
  let nav=header.querySelector("nav");
  if(!nav){nav=document.createElement("nav");header.insertBefore(nav,header.querySelector("#account")||null)}
  nav.innerHTML="";
  const current=(location.pathname.split("/").pop()||"index.html");
  const groups={core:"CrowSpace",connect:"Connect",create:"Create",universe:"Universe",account:"Account",quick:"Quick Create"};
  const order=["core","connect","create","universe","account","quick"];
  const home=document.createElement("a");home.className="crow-nav-home"+(current==="index.html"?" active":"");home.href="index.html";home.textContent="Home";nav.appendChild(home);
  const shell=document.createElement("div");shell.className="crow-nav-shell";
  const groupsBox=document.createElement("div");groupsBox.className="crow-nav-groups";
  for(const g of order){
   const items=(window.CS?.navItems||[]).filter(x=>x.group===g);
   if(!items.length)continue;
   const wrap=document.createElement("div");wrap.className="crow-nav-group";
   const trigger=document.createElement("button");trigger.type="button";trigger.className="crow-nav-trigger";trigger.innerHTML='<span>'+groups[g]+'</span><span class="chevron">▾</span>';
   const panel=document.createElement("div");panel.className="crow-nav-panel";
   const title=document.createElement("div");title.className="crow-nav-panel-title";title.textContent=groups[g];panel.appendChild(title);
   items.forEach(item=>{const a=document.createElement("a");a.href=item.href;a.textContent=item.label;if(current===item.href)a.classList.add("active");panel.appendChild(a)});
   trigger.onclick=()=>{document.querySelectorAll(".crow-nav-panel.is-open").forEach(p=>{if(p!==panel)p.classList.remove("is-open")});panel.classList.toggle("is-open");trigger.classList.toggle("is-open",panel.classList.contains("is-open"))};
   wrap.append(trigger,panel);groupsBox.appendChild(wrap);
  }
  shell.appendChild(groupsBox);nav.appendChild(shell);
  if(window.CS?.injectGlobalNavStyles)window.CS.injectGlobalNavStyles();
  document.addEventListener("click",e=>{if(!nav.contains(e.target))nav.querySelectorAll(".crow-nav-panel.is-open").forEach(p=>p.classList.remove("is-open"))},{passive:true});
 }catch(e){console.warn("CrowSpace global navigation:",e.message)}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();