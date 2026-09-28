/* CrowSpace shared navigation — UI-only until Supabase is connected. */
document.addEventListener("DOMContentLoaded",()=>{
  const header=document.querySelector(".topbar");
  if(!header) return;
  const path=location.pathname.split("/").pop()||"index.html";
  const links=[
    ["index.html","Home"],["profile.html","Profile"],["caw-feed.html","Caws"],["rankings.html","Rankings"],
    ["groups.html","Groups"],["circles.html","Circles"],["events.html","Events"],["messenger.html","Messenger"],
    ["notifications.html","Notifications"],["search.html","Search"]
  ];
  const universe=[
    ["https://crowrulesentertainment-oss.github.io/dreamscapes/","Dreamscapes"],
    ["https://crowrulesentertainment-oss.github.io/podcasting/","Podcasting"],
    ["https://crowrulesentertainment-oss.github.io/memorials/","Memorials"],
    ["https://crowrulesentertainment-oss.github.io/sports/","Sports"],
    ["creator-studio.html","Creator Studio"],["watch-parties.html","Watch Parties"],["marketplace.html","Marketplace"]
  ];
  header.innerHTML=
    '<a class="brand" href="index.html"><span class="crow">𓅃</span><span>CROWSPACE</span></a>'+
    '<nav>'+links.map(([u,n])=>'<a href="'+u+'" class="'+(path===u?'active':'')+'">'+n+'</a>').join("")+
    '<details><summary>Universe</summary><div class="menu">'+universe.map(([u,n])=>'<a href="'+u+'">'+n+'</a>').join("")+<details><summary>More</summary><div class="menu"><a href="dashboard.html">Dashboard</a><a href="stories.html">Stories</a><a href="bookmarks.html">Bookmarks</a><a href="playlists.html">Playlists</a><a href="stats.html">Stats</a><a href="settings.html">Settings</a><a href="followers.html">Followers</a><a href="following.html">Following</a><a href="creator.html">Creators</a></div></details>'</div></details></nav>'+
    '<div class="nav-actions"><a class="icon-link" href="notifications.html" aria-label="Notifications">◉<span class="nav-badge" id="navBadge">0</span></a><button class="ghost" id="themeBtn">Theme</button><a class="pill" href="login.html">Sign In</a></div>';
  document.getElementById("themeBtn")?.addEventListener("click",()=>{
    const current=localStorage.getItem("crowspace-theme")||"cinematic";
    const themes=["cinematic","midnight","tacoma","dreamscapes","retro","halloween"];
    const next=themes[(themes.indexOf(current)+1)%themes.length];
    localStorage.setItem("crowspace-theme",next);
    document.documentElement.dataset.theme=next;
  });
  document.documentElement.dataset.theme=localStorage.getItem("crowspace-theme")||"cinematic";
  const unread=Number(localStorage.getItem("crowspace-unread")||0);
  const badge=document.getElementById("navBadge"); if(badge) badge.textContent=unread>9?"9+":unread;
});