import {renderNavigation} from "./navigation.js";
import {getUniverseContext,loadMyCrowSpaceProfile} from "./universe-bridge.js";
import {signInWithProvider,signOut} from "./auth.js";
import {isSupabaseConfigured} from "./config-loader.js";
import {renderBranchCards} from "./branches.js";
import {initProfilePage,initDiscovery} from "./profiles.js";
const page=document.body.dataset.page||"feed";
const active=({home:"feed.html",feed:"feed.html",discover:"discover.html",branches:"branches.html",profile:"profile.html",messages:"messages.html",groups:"groups.html",events:"events.html",settings:"settings.html"})[page]||"feed.html";
renderNavigation(active);
const status=document.querySelector("[data-connection-status]");
if(status)status.textContent=isSupabaseConfigured()?"Connecting to CrowRules Universe":"Preview mode · Supabase setup required";
document.querySelectorAll("[data-auth-provider]").forEach(button=>button.addEventListener("click",async()=>{try{await signInWithProvider(button.dataset.authProvider)}catch(error){notify(error.message)}}));
document.querySelectorAll("[data-signout]").forEach(button=>button.addEventListener("click",async()=>{try{await signOut();location.reload()}catch(error){notify(error.message)}}));
try{const context=await getUniverseContext();const label=document.querySelector("[data-account-label]");if(label)label.textContent=context.user?"Signed in":"Welcome";if(context.user){const{data,error}=await loadMyCrowSpaceProfile(context.user.id);if(error)console.warn("Profile read unavailable",error);if(data&&label)label.textContent=data.display_name||data.username||"Your account"}if(status)status.textContent=context.user?"Connected · signed in":"Connected · sign in to join";if(page==="profile")await initProfilePage();if(page==="discover")await initDiscovery()}catch(error){console.warn("CrowSpace initialization issue",error);if(status)status.textContent="Connection needs attention"}renderBranchCards(document.querySelector("[data-branch-grid]"));
function notify(message){const toast=document.querySelector("[data-toast]");if(toast){toast.textContent=message;toast.hidden=false;setTimeout(()=>toast.hidden=true,4000)}}
