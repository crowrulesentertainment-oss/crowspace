(function(){
  "use strict";
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  function toast(message){let t=$("#crowspaceToast");if(!t){t=document.createElement("div");t.id="crowspaceToast";t.style.cssText="position:fixed;left:50%;bottom:22px;transform:translateX(-50%) translateY(10px);z-index:9999;max-width:min(92vw,620px);padding:10px 14px;border:1px solid rgba(93,231,255,.35);border-radius:10px;background:rgba(5,8,14,.94);color:#dfe8f4;font:11px Montserrat,Arial,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.35);opacity:0;transition:.2s;pointer-events:none";document.body.appendChild(t)}t.textContent=message;t.style.opacity="1";t.style.transform="translateX(-50%) translateY(0)";clearTimeout(t._timer);t._timer=setTimeout(()=>{t.style.opacity="0";t.style.transform="translateX(-50%) translateY(10px)"},2600)}
  window.CrowSpace={toast,version:"Universal Core 1.0"};
  document.documentElement.dataset.crowspaceReady="true";
  $$(".search input").forEach(input=>{input.addEventListener("keydown",e=>{if(e.key!=="Enter")return;const q=input.value.trim();if(!q)return;location.href="explore.html?q="+encodeURIComponent(q)}});
  const params=new URLSearchParams(location.search),q=params.get("q");
  if(q){const inputs=$$(".search input");inputs.forEach(i=>i.value=q);const heading=$(".hero h1");if(heading&&location.pathname.endsWith("/explore.html"))heading.innerHTML="Search<br><em>results.</em>";const p=$(".hero p");if(p&&location.pathname.endsWith("/explore.html"))p.textContent='Showing CrowSpace discovery for “'+q.replace(/[<>]/g,"")+'”.'}
  $$(".top-actions button").forEach(b=>{if(b.textContent.includes("🔔"))b.addEventListener("click",()=>location.href="notifications.html");if(b.textContent.includes("✉"))b.addEventListener("click",()=>location.href="messages.html")});
  $$(".sidebar .nav").forEach(a=>{if(a.getAttribute("href")===location.pathname.split("/").pop())a.classList.add("active")});
  window.addEventListener("error",e=>{console.error("[CrowSpace]",e.error||e.message);document.documentElement.dataset.lastError=String(e.message||"runtime error")});
  window.addEventListener("unhandledrejection",e=>{console.error("[CrowSpace]",e.reason);document.documentElement.dataset.lastError=String(e.reason||"promise rejection")});
})();
