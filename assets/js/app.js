import { supabase } from "./supabase.js";
import { initSocial } from "./social.js";
import { initPhase3 } from "./phase3.js";
import { initMessenger } from "./messenger.js";
import { initPassport } from "./passport.js";

const page = document.body.dataset.page;
const root = document.querySelector("#app");
const nav = [
  ["home","⌂","Home"],["explore","⌕","Explore"],["groups","▦","Groups"],
  ["events","◷","Events"],["messenger","✉","Messenger"],["friends","♧","Connections"],
  ["notifications","♢","Notifications"],["profile","◉","Profile"]
];
const href = key => key === "home" ? "home.html" : key + ".html";
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));
const copy = {
  home:["Your space, your community.","The latest from your CrowSpace."],
  explore:["Find your people.","Discover communities, creators and conversations."],
  groups:["Communities bring us together.","Find a group or start something new."],
  events:["Make moments happen.","Discover what's coming up and get together."],
  messenger:["Conversations that connect.","Your private space for messages."],
  profile:["Your Creator Passport.","Your identity, skills, projects and milestones."],
  settings:["Your account. Your choices.","Manage your CrowSpace identity."],
  friends:["Your connections.","People make the community."],
  notifications:["Your activity.","The latest interactions across your CrowSpace."]
};
function empty(title,desc,icon){
  return `<section class="empty"><b>${icon}</b><div class="eyebrow">CROWSPACE</div><h2>${title}</h2><p>${desc}</p></section>`;
}

async function boot(){
  const {data:{session}} = await supabase.auth.getSession();
  if(!session){location.href="auth.html";return;}
  const user=session.user;
  let {data:profile,error}=await supabase.from("crowspace_profiles").select("*").eq("user_id",user.id).maybeSingle();
  if(error)throw error;
  if(!profile){
    const display=(user.user_metadata?.display_name||user.email?.split("@")[0]||"CrowSpace Member").trim().slice(0,80);
    const base=display.toLowerCase().replace(/[^a-z0-9_]+/g,"_").replace(/^_+|_+$/g,"").slice(0,17)||"member";
    const created=await supabase.from("crowspace_profiles").insert({
      user_id:user.id,username:base+"_"+user.id.replace(/-/g,"").slice(0,5),display_name:display
    }).select("*").single();
    if(created.error)throw created.error;
    profile=created.data;
  }
  const initial=(profile.display_name||"C").charAt(0).toUpperCase();
  root.innerHTML=`
    <header class="top">
      <a class="brand" href="index.html"><b>C</b><span>CROW<span class="red">SPACE</span><small>YOUR PEOPLE. YOUR STORIES. YOUR SPACE.</small></span></a>
      <div class="search">⌕　Search CrowSpace</div>
      <div class="top-actions"><a href="messenger.html">✉</a><a href="notifications.html">♢</a><button id="logout">↪</button><a class="avatar" href="profile.html">${esc(initial)}</a></div>
    </header>
    <div class="layout">
      <aside class="sidebar">
        <div class="member"><span class="avatar">${esc(initial)}</span><div><b>${esc(profile.display_name)}</b><small>@${esc(profile.username)}</small></div></div>
        <label>YOUR SPACE</label>
        ${nav.map(([key,icon,name])=>`<a class="navlink ${page===key?"active":""}" href="${href(key)}"><i>${icon}</i>${name}</a>`).join("")}
        <label>CROWRULES UNIVERSE</label>
        <div class="branch">◈　CrowRules Entertainment</div><div class="branch">◉　Podcasting</div><div class="branch">▣　Tacoma Nights</div><div class="branch">⌁　Back Deck Live</div><div class="branch">⌂　Tacoma Community Hub</div>
        <a class="navlink settings-link" href="settings.html">⚙　Settings</a>
        <div class="sidebar-foot">POWERED BY<br><b>CROWRULES ENTERTAINMENT</b></div>
      </aside>
      <main class="main">
        <div class="heading"><div><div class="eyebrow">CROWSPACE 3.0</div><h1>${copy[page]?.[0]||"Your CrowSpace."}</h1><p>${copy[page]?.[1]||"Your people. Your stories. Your space."}</p></div><span class="crowid">${esc(profile.crow_id||"CROWID")}</span></div>
        <div id="content"></div>
      </main>
      <aside class="rail">
        <section><small>YOUR CROWRULES UNIVERSE</small><h3>One identity.<br><span class="red">Many connections.</span></h3><p>Your CrowID is your identity across the CrowRules universe.</p><a href="profile.html">View your Creator Passport →</a></section>
        <section><small>WHAT'S TAKING SHAPE</small><h3>Your community</h3><p>01　Community discovery</p><p>02　Shared experiences</p><p>03　Creative collaboration</p></section>
      </aside>
    </div>
    <nav class="mobile-nav">${nav.map(([key,icon,name])=>`<a class="${page===key?"active":""}" href="${href(key)}"><i>${icon}</i><small>${name}</small></a>`).join("")}</nav>`;
  document.querySelector("#logout").onclick=async()=>{await supabase.auth.signOut();location.href="index.html";};
  const container=document.querySelector("#content");

  if(["home","explore","friends","notifications"].includes(page)){
    await initSocial({user,profile,page,container});
  }else if(["groups","events"].includes(page)){
    await initPhase3({user,profile,page,container});
  }else if(page==="messenger"){
    await initMessenger({user,profile,container});
  }else if(page==="profile"){
    await initPassport({user,profile,container});
  }else if(page==="settings"){
    container.innerHTML=`
      <section class="settings">
        <div class="eyebrow">CROWID PROFILE</div><h2>Personal information</h2>
        <p>Your CrowID is assigned by the platform and cannot be edited.</p>
        <div class="crowid-large">${esc(profile.crow_id)}</div>
        <form id="profile-form">
          <label>Display name<input name="display_name" maxlength="80" required value="${esc(profile.display_name)}"></label>
          <label>Username<input name="username" pattern="[a-z0-9_]{3,24}" required value="${esc(profile.username)}"><small>3–24 lowercase letters, numbers or underscores.</small></label>
          <label>About you<textarea name="bio" maxlength="500" rows="4">${esc(profile.bio||"")}</textarea></label>
          <label>Location<input name="location" maxlength="120" value="${esc(profile.location||"")}"></label>
          <button class="btn red-btn">Save profile →</button><div id="save-message" role="status"></div>
        </form>
      </section>`;
    document.querySelector("#profile-form").addEventListener("submit",async event=>{
      event.preventDefault();
      const form=new FormData(event.currentTarget);
      const message=document.querySelector("#save-message");
      const values={
        display_name:String(form.get("display_name")).trim(),
        username:String(form.get("username")).trim().toLowerCase(),
        bio:String(form.get("bio")).trim(),
        location:String(form.get("location")).trim(),
        updated_at:new Date().toISOString()
      };
      const {error:saveError}=await supabase.from("crowspace_profiles").update(values).eq("user_id",user.id);
      message.textContent=saveError?saveError.message:"Profile saved.";
      message.className=saveError?"error":"success";
      if(!saveError)setTimeout(()=>location.reload(),700);
    });
  }else{
    const map={
      achievements:["Recognition is earned.","Your achievements will appear on your Creator Passport.","✦"]
    };
    container.innerHTML=map[page]?empty(...map[page]):empty("Your space is taking shape.","This CrowSpace area is being prepared.","◈");
  }
}

boot().catch(error=>{
  root.innerHTML=`<div class="fatal"><h1>We couldn't load CrowSpace.</h1><p>${esc(error.message)}</p><a href="auth.html">Return to sign in</a></div>`;
});
