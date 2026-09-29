(function () {
  "use strict";
  const qs = (selector, root) => (root || document).querySelector(selector);
  const qsa = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  window.CrowSpace = window.CrowSpace || {};
  window.CrowSpace.version = "Universal Core 1.1";

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
