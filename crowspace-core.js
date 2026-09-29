(function () {
  "use strict";
  const qs = (selector, root) => (root || document).querySelector(selector);
  const qsa = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  window.CrowSpace = window.CrowSpace || {};
  window.CrowSpace.version = "Universal Core 2.0";

  if (!document.querySelector('script[src="crowspace-auth.js"]')) {
    const authScript=document.createElement("script");
    authScript.src="crowspace-auth.js";
    document.head.appendChild(authScript);
  }

  function mountAuthUI(user) {
    let box=document.getElementById("crowspaceAuthStatus");
    if(!box){box=document.createElement("div");box.id="crowspaceAuthStatus";box.style.cssText="position:fixed;right:18px;bottom:18px;z-index:9998;display:flex;gap:8px;align-items:center;padding:8px 10px;border:1px solid rgba(93,231,255,.25);border-radius:12px;background:rgba(5,8,14,.92);backdrop-filter:blur(12px);font:11px Montserrat,Arial,sans-serif;color:#dfe8f4";document.body.appendChild(box)}
    if(user){box.innerHTML='<span style="opacity:.8">CROW MEMBER</span><a href="account.html" style="color:#7fe8ff;text-decoration:none">PROFILE</a><button id="crowspaceSignOut" style="background:none;border:1px solid #3b3b49;color:#ddd;border-radius:8px;padding:5px 8px;cursor:pointer">SIGN OUT</button>';const b=document.getElementById("crowspaceSignOut");if(b)b.onclick=async()=>{await window.CrowSpaceAuth.signOut();location.reload()}}
    else box.innerHTML='<a href="login.html" style="color:#7fe8ff;text-decoration:none">SIGN IN</a><a href="signup.html" style="color:#fff;text-decoration:none">JOIN CROWSPACE</a>';
  }
  window.addEventListener("crowspace-auth-ready",e=>mountAuthUI(e.detail.user));
  window.addEventListener("crowspace-auth",e=>mountAuthUI(e.detail.user));

  qsa(".search input").forEach(function (input) {
    input.addEventListener("keydown", function (event) {
      if (event.key !== "Enter") return;
      const value = input.value.trim();
      if (!value) return;
      window.location.href = "explore.html?q=" + encodeURIComponent(value);
    });
  });

  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");
  if (query && window.location.pathname.endsWith("/explore.html")) {
    qsa(".search input").forEach(function (input) { input.value = query; });
    const heading = qs(".hero h1");
    const description = qs(".hero p");
    if (heading) heading.innerHTML = "Search<br><em>results.</em>";
    if (description) description.textContent = "Showing CrowSpace discovery for " + query.replace(/[<>]/g, "") + ".";
  }

  qsa(".top-actions button").forEach(function (button) {
    const label = button.textContent || "";
    if (label.indexOf("🔔") >= 0) button.addEventListener("click", function () { window.location.href = "notifications.html"; });
    if (label.indexOf("✉") >= 0) button.addEventListener("click", function () { window.location.href = "messages.html"; });
  });

  const current = window.location.pathname.split("/").pop() || "index.html";
  qsa(".sidebar .nav").forEach(function (link) {
    if (link.getAttribute("href") === current) link.classList.add("active");
  });

  window.addEventListener("error", function (event) {
    console.error("[CrowSpace]", event.error || event.message);
    document.documentElement.setAttribute("data-last-error", String(event.message || "runtime error"));
  });

  window.addEventListener("unhandledrejection", function (event) {
    console.error("[CrowSpace]", event.reason);
    document.documentElement.setAttribute("data-last-error", String(event.reason || "promise rejection"));
  });
}());
