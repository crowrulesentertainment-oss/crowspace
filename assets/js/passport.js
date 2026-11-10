import { supabase } from "./supabase.js";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const note = (el, text, kind="") => { el.textContent=text; el.className="passport-note "+kind; };
const date = (v) => new Date(v).toLocaleDateString([], {year:"numeric",month:"short",day:"numeric"});
const safeUrl = (v) => /^https?:\/\//i.test(v || "") ? v : "";

async function renderPublicPassport({profile,container}) {
  container.innerHTML = `
    <section class="passport-hero">
      <div class="passport-cover">${safeUrl(profile.cover_url)?`<img class="passport-public-cover-image" src="${esc(profile.cover_url)}" alt="">`:""}</div>
      <div class="passport-heading">
        ${safeUrl(profile.avatar_url)?`<img class="passport-avatar" src="${esc(profile.avatar_url)}" alt="">`:`<div class="passport-avatar">${esc((profile.display_name||"C").slice(0,1).toUpperCase())}</div>`}
        <div class="passport-identity"><div class="eyebrow">PUBLIC CREATOR PASSPORT</div><h2>${esc(profile.display_name)}</h2>
          <p>@${esc(profile.username)} · ${esc(profile.crow_id||"CrowID")}</p>
          <div class="passport-meta">${profile.location ? "⌖ "+esc(profile.location)+"　" : ""}${profile.creator_category ? "✦ "+esc(profile.creator_category) : "CrowSpace member"}</div>
        </div>
        <a class="btn red-btn" href="messenger.html?member=${encodeURIComponent(profile.username)}">Message member</a>
      </div>
      <p class="passport-bio">${esc(profile.portfolio_tagline || profile.bio || "A member of the CrowSpace community.")}</p>
      ${profile.portfolio_bio ? `<p class="passport-bio passport-about-work">${esc(profile.portfolio_bio)}</p>` : ""}
    </section>
    <section class="passport-section"><div class="passport-section-head"><div><div class="eyebrow">CREATIVE IDENTITY</div><h2>Skills & interests</h2><p>What this member brings to the community.</p></div></div><div id="public-skill-list" class="passport-chips"></div></section>
    <section class="passport-section"><div class="passport-section-head"><div><div class="eyebrow">SELECTED WORK</div><h2>Project showcase</h2><p>Projects, creative work and community contributions.</p></div></div><div id="public-showcase-list" class="passport-projects"></div></section>
    <section class="passport-section"><div class="passport-section-head"><div><div class="eyebrow">EARNED RECOGNITION</div><h2>Achievements</h2></div><span class="passport-count" id="public-badge-count">0</span></div><div id="public-badge-list" class="passport-badges"></div></section>
    <section class="passport-section"><div class="passport-section-head"><div><div class="eyebrow">COLLABORATION PORTFOLIO</div><h2>Completed projects</h2><p>Shared work and collaborations completed in CrowSpace.</p></div></div><div id="public-collab-projects" class="passport-projects"></div></section><section class="passport-section"><div class="passport-section-head"><div><div class="eyebrow">THE JOURNEY</div><h2>Milestones</h2></div></div><div id="public-milestone-list" class="passport-timeline"></div></section>`;
  const [skills,projects,badges,milestones,collabProjects]=await Promise.all([
    supabase.from("crowspace_profile_skills").select("id,skill_name,category").eq("user_id",profile.user_id).order("sort_order"),
    supabase.from("crowspace_profile_showcase").select("id,title,description,project_url,media_url,category,is_featured").eq("user_id",profile.user_id).order("is_featured",{ascending:false}).order("sort_order"),
    supabase.from("crowspace_member_achievements").select("id,awarded_at,achievement:crowspace_achievements(name,description,icon,category)").eq("member_id",profile.user_id).order("awarded_at",{ascending:false}),
    supabase.from("crowspace_member_milestones").select("id,title,description,achieved_at").eq("member_id",profile.user_id).order("achieved_at",{ascending:false}),
    supabase.from("crowspace_projects").select("id,title,description,category,completed_at").eq("owner_id",profile.user_id).eq("visibility","public").eq("status","completed").order("completed_at",{ascending:false})
  ]);
  for(const result of [skills,projects,badges,milestones]) if(result.error) throw result.error;
  container.querySelector("#public-skill-list").innerHTML=skills.data?.length?skills.data.map(x=>`<span class="passport-chip">${esc(x.skill_name)} <small>${esc(x.category)}</small></span>`).join(""):'<p class="passport-empty">No skills or interests have been added yet.</p>';
  container.querySelector("#public-showcase-list").innerHTML=projects.data?.length?projects.data.map(p=>`<article class="passport-project"><div class="passport-project-icon">◈</div><div><small>${esc(p.category)}${p.is_featured?" · FEATURED":""}</small><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>${safeUrl(p.project_url)?`<a href="${esc(p.project_url)}" target="_blank" rel="noopener noreferrer">View project ↗</a>`:""}${safeUrl(p.media_url)?` <a href="${esc(p.media_url)}" target="_blank" rel="noopener noreferrer">View media ↗</a>`:""}</div></article>`).join(""):'<p class="passport-empty">No showcase projects have been shared yet.</p>';
  container.querySelector("#public-badge-count").textContent=String(badges.data?.length||0);
  container.querySelector("#public-badge-list").innerHTML=badges.data?.length?badges.data.map(b=>{const a=b.achievement||{};return `<article class="passport-badge"><span>${esc(a.icon||"✦")}</span><div><h3>${esc(a.name||"Achievement")}</h3><p>${esc(a.description||"")}</p><small>Earned ${date(b.awarded_at)}</small></div></article>`;}).join(""):'<p class="passport-empty">No achievements to display yet.</p>';
  container.querySelector("#public-collab-projects").innerHTML=collabProjects.data?.length?collabProjects.data.map(p=>`<article class="passport-project"><div class="passport-project-icon">✦</div><div><small>${esc(p.category||"COLLABORATION")} · COMPLETED</small><h3>${esc(p.title)}</h3><p>${esc(p.description||"A completed CrowSpace project.")}</p>${p.completed_at?`<small>Completed ${date(p.completed_at)}</small>`:""}</div></article>`).join(""):'<p class="passport-empty">Completed public collaborations will appear here.</p>';
  container.querySelector("#public-milestone-list").innerHTML=milestones.data?.length?milestones.data.map(m=>`<article class="passport-milestone"><span class="passport-milestone-dot"></span><div><h3>${esc(m.title)}</h3><p>${esc(m.description)}</p><small>${date(m.achieved_at)}</small></div></article>`).join(""):'<p class="passport-empty">Milestones will appear here as this member participates.</p>';
}


export async function initPassport({user, profile, container, viewOnly=false}) {
  if(viewOnly){await renderPublicPassport({profile,container});return;}
  const isAdmin = user.app_metadata?.crowspace_admin === true || user.app_metadata?.crowspace_admin === "true";
  container.innerHTML = `
    <section class="passport-hero">
      <div class="passport-cover"></div>
      <div class="passport-heading"><div class="passport-avatar">${esc((profile.display_name||"C").slice(0,1).toUpperCase())}</div>
        <div class="passport-identity"><div class="eyebrow">CROWSPACE CREATOR PASSPORT</div><h2>${esc(profile.display_name)}</h2>
          <p>@${esc(profile.username)} · ${esc(profile.crow_id||"CrowID")}</p>
          <div class="passport-meta">${profile.location ? "⌖ "+esc(profile.location)+"　" : ""}${profile.creator_category ? "✦ "+esc(profile.creator_category) : "A member of the CrowSpace community"}</div>
        </div>
        <a class="btn" href="settings.html">Edit profile</a>
      </div>
      <p class="passport-bio">${esc(profile.portfolio_tagline || profile.bio || "Your story, skills and creative journey belong here.")}</p>
    </section>
    <section class="passport-section"><div class="passport-section-head"><div><div class="eyebrow">YOUR CREATIVE IDENTITY</div><h2>Creator Passport</h2><p>Show people what you do, what you care about and what you are building.</p></div></div>
      <form id="passport-details" class="passport-form">
        <label>Creator role / category<input name="creator_category" maxlength="80" value="${esc(profile.creator_category||"")}" placeholder="e.g. Filmmaker, writer, community builder"></label>
        <label>Portfolio tagline<input name="portfolio_tagline" maxlength="160" value="${esc(profile.portfolio_tagline||"")}" placeholder="A short line that describes your creative direction"></label>
        <label>About your work<textarea name="portfolio_bio" rows="3" maxlength="1200" placeholder="Tell the community what you create or hope to create.">${esc(profile.portfolio_bio||"")}</textarea></label>\n        <label>Profile visibility<select name="profile_visibility"><option value="public" ${profile.profile_visibility==="public"?"selected":""}>Public — discoverable by CrowSpace members</option><option value="private" ${profile.profile_visibility==="private"?"selected":""}>Private — only you can view your Creator Passport details</option></select></label>
        <button class="btn red-btn" type="submit">Save Creator Passport</button><span id="passport-details-note" class="passport-note" role="status"></span>
      </form>
    </section>
    <section class="passport-section"><div class="passport-section-head"><div><div class="eyebrow">YOUR CAPABILITIES</div><h2>Skills & interests</h2><p>Add creative, professional, technical or community interests.</p></div></div>
      <form id="skill-form" class="passport-inline-form"><input name="skill_name" required maxlength="60" minlength="2" placeholder="Add a skill or interest"><select name="category"><option value="creative">Creative</option><option value="professional">Professional</option><option value="community">Community</option><option value="technical">Technical</option><option value="other">Other</option></select><button class="btn red-btn">Add</button></form>
      <div id="skill-list" class="passport-chips"></div><div id="skill-note" class="passport-note" role="status"></div>
    </section>
    <section class="passport-section"><div class="passport-section-head"><div><div class="eyebrow">SELECTED WORK</div><h2>Project showcase</h2><p>Highlight projects, creative work, podcasts, writing and community initiatives.</p></div></div>
      <form id="showcase-form" class="passport-form">
        <div class="passport-form-grid"><label>Project title<input name="title" required maxlength="100" placeholder="Project or portfolio title"></label><label>Category<select name="category"><option value="project">Project</option><option value="portfolio">Portfolio</option><option value="video">Video</option><option value="podcast">Podcast</option><option value="writing">Writing</option><option value="artwork">Artwork</option><option value="community">Community</option><option value="other">Other</option></select></label></div>
        <label>Description<textarea name="description" maxlength="1000" rows="2" placeholder="What is it about?"></textarea></label>
        <label>Project link<input name="project_url" type="url" placeholder="https://"></label>
        <button class="btn red-btn">Add to showcase</button><span id="showcase-note" class="passport-note" role="status"></span>
      </form><div id="showcase-list" class="passport-projects"></div>
    </section>
    <section class="passport-section"><div class="passport-section-head"><div><div class="eyebrow">EARNED RECOGNITION</div><h2>Achievements</h2><p>Recognition for meaningful participation and creative contribution.</p></div><span class="passport-count" id="badge-count">0</span></div><div id="badge-list" class="passport-badges"></div></section>
    <section class="passport-section"><div class="passport-section-head"><div><div class="eyebrow">YOUR JOURNEY</div><h2>Milestones</h2><p>Important moments in your CrowSpace story.</p></div></div><div id="milestone-list" class="passport-timeline"></div></section>
    ${isAdmin ? `
    <section class="passport-section passport-admin"><div class="passport-section-head"><div><div class="eyebrow">ADMINISTRATION</div><h2>Achievement desk</h2><p>Create achievement definitions and recognize members. Admin access is controlled by Supabase app metadata.</p></div><span class="passport-admin-tag">ADMIN</span></div>
      <form id="achievement-form" class="passport-form passport-admin-form">
        <div class="passport-form-grid"><label>Achievement name<input name="name" required maxlength="80"></label><label>Slug<input name="slug" required pattern="[a-z0-9-]{2,60}" maxlength="60" placeholder="community-helper"></label></div>
        <label>Description<input name="description" maxlength="500" required></label>
        <div class="passport-form-grid"><label>Icon / emoji<input name="icon" maxlength="12" value="✦"></label><label>Category<select name="category"><option value="community">Community</option><option value="creator">Creator</option><option value="milestone">Milestone</option><option value="recognition">Recognition</option></select></label></div>
        <label>Award criteria<input name="criteria" maxlength="500"></label><button class="btn red-btn">Create achievement</button><span id="achievement-note" class="passport-note" role="status"></span>
      </form>
      <form id="award-form" class="passport-form passport-admin-form">
        <h3>Award a member</h3><div class="passport-form-grid"><label>Member<select name="member_id" id="award-member" required><option value="">Choose a member…</option></select></label><label>Achievement<select name="achievement_id" id="award-achievement" required><option value="">Choose an achievement…</option></select></label></div>
        <label>Recognition note<input name="award_note" maxlength="500" placeholder="Why are you recognizing this member?"></label><button class="btn red-btn">Award achievement</button><span id="award-note" class="passport-note" role="status"></span>
      </form><div id="admin-achievements" class="passport-admin-list"></div>
    </section>` : ""}
  `;

  const [skillsRes, showcaseRes, badgesRes, milestonesRes, achievementsRes] = await Promise.all([
    supabase.from("crowspace_profile_skills").select("*").eq("user_id",user.id).order("sort_order").order("created_at"),
    supabase.from("crowspace_profile_showcase").select("*").eq("user_id",user.id).order("is_featured",{ascending:false}).order("created_at",{ascending:false}),
    supabase.from("crowspace_member_achievements").select("id,awarded_at,award_note,achievement:crowspace_achievements(id,name,description,icon,category)").eq("member_id",user.id).order("awarded_at",{ascending:false}),
    supabase.from("crowspace_member_milestones").select("*").eq("member_id",user.id).order("achieved_at",{ascending:false}),
    supabase.from("crowspace_achievements").select("id,slug,name,description,icon,category,criteria,is_active").eq("is_active",true).order("sort_order")
  ]);
  for (const r of [skillsRes,showcaseRes,badgesRes,milestonesRes,achievementsRes]) if(r.error) throw r.error;
  let skills=skillsRes.data||[], projects=showcaseRes.data||[], badges=badgesRes.data||[], milestones=milestonesRes.data||[], achievements=achievementsRes.data||[];

  const renderSkills=()=>{const el=container.querySelector("#skill-list");el.innerHTML=skills.length?skills.map(s=>`<span class="passport-chip">${esc(s.skill_name)} <small>${esc(s.category)}</small><button type="button" data-skill-remove="${s.id}" aria-label="Remove ${esc(s.skill_name)}">×</button></span>`).join(""):'<p class="passport-empty">Your skills and interests will appear here.</p>';};
  const renderProjects=()=>{const el=container.querySelector("#showcase-list");el.innerHTML=projects.length?projects.map(p=>`<article class="passport-project"><div class="passport-project-icon">◈</div><div><small>${esc(p.category)}</small><h3>${esc(p.title)}</h3><p>${esc(p.description)}</p>${safeUrl(p.project_url)?`<a href="${esc(p.project_url)}" target="_blank" rel="noopener noreferrer">View project ↗</a>`:""}</div><button type="button" data-project-remove="${p.id}" aria-label="Remove ${esc(p.title)}">Remove</button></article>`).join(""):'<p class="passport-empty">No showcase projects yet. Add something you are proud of or working toward.</p>';};
  const renderBadges=()=>{container.querySelector("#badge-count").textContent=String(badges.length);container.querySelector("#badge-list").innerHTML=badges.length?badges.map(b=>{const a=b.achievement||{};return `<article class="passport-badge"><span>${esc(a.icon||"✦")}</span><div><h3>${esc(a.name||"Achievement")}</h3><p>${esc(a.description||"")}</p><small>Earned ${date(b.awarded_at)}</small></div></article>`;}).join(""):'<p class="passport-empty">Your achievements will appear here as you participate and contribute.</p>';};
  const renderMilestones=()=>{container.querySelector("#milestone-list").innerHTML=milestones.length?milestones.map(m=>`<article class="passport-milestone"><span class="passport-milestone-dot"></span><div><h3>${esc(m.title)}</h3><p>${esc(m.description)}</p><small>${date(m.achieved_at)}</small></div></article>`).join(""):'<p class="passport-empty">Your CrowSpace journey is just beginning.</p>';};
  renderSkills();renderProjects();renderBadges();renderMilestones();

  container.querySelector("#passport-details").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),v={creator_category:String(f.get("creator_category")).trim(),portfolio_tagline:String(f.get("portfolio_tagline")).trim(),portfolio_bio:String(f.get("portfolio_bio")).trim(),profile_visibility:f.get("profile_visibility")==="private"?"private":"public",updated_at:new Date().toISOString()};const{error}=await supabase.from("crowspace_profiles").update(v).eq("user_id",user.id);note(container.querySelector("#passport-details-note"),error?.message||"Creator Passport saved.",error?"error":"success");};
  container.querySelector("#skill-form").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const{data,error}=await supabase.from("crowspace_profile_skills").insert({user_id:user.id,skill_name:String(f.get("skill_name")).trim(),category:f.get("category")}).select("*").single();if(error)return note(container.querySelector("#skill-note"),error.message,"error");skills.push(data);e.currentTarget.reset();renderSkills();note(container.querySelector("#skill-note"),"Skill added.","success");};
  container.querySelector("#skill-list").onclick=async e=>{const b=e.target.closest("[data-skill-remove]");if(!b)return;const{error}=await supabase.from("crowspace_profile_skills").delete().eq("id",b.dataset.skillRemove).eq("user_id",user.id);if(error)return note(container.querySelector("#skill-note"),error.message,"error");skills=skills.filter(s=>s.id!==b.dataset.skillRemove);renderSkills();};
  container.querySelector("#showcase-form").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),v={user_id:user.id,title:String(f.get("title")).trim(),description:String(f.get("description")).trim(),category:f.get("category"),project_url:String(f.get("project_url")).trim()};if(v.project_url&&!safeUrl(v.project_url))return note(container.querySelector("#showcase-note"),"Use a full http:// or https:// link.","error");const{data,error}=await supabase.from("crowspace_profile_showcase").insert(v).select("*").single();if(error)return note(container.querySelector("#showcase-note"),error.message,"error");projects.unshift(data);e.currentTarget.reset();renderProjects();note(container.querySelector("#showcase-note"),"Project added to your showcase.","success");};
  container.querySelector("#showcase-list").onclick=async e=>{const b=e.target.closest("[data-project-remove]");if(!b)return;const{error}=await supabase.from("crowspace_profile_showcase").delete().eq("id",b.dataset.projectRemove).eq("user_id",user.id);if(error)return note(container.querySelector("#showcase-note"),error.message,"error");projects=projects.filter(p=>p.id!==b.dataset.projectRemove);renderProjects();};

  if(isAdmin){
    const [membersRes,allAchievementsRes]=await Promise.all([
      supabase.from("crowspace_profiles").select("user_id,username,display_name").order("display_name").limit(500),
      supabase.from("crowspace_achievements").select("*").order("sort_order")
    ]);
    if(membersRes.error)throw membersRes.error;if(allAchievementsRes.error)throw allAchievementsRes.error;
    const members=membersRes.data||[],allAchievements=allAchievementsRes.data||[];
    const memberSelect=container.querySelector("#award-member"),achievementSelect=container.querySelector("#award-achievement");
    memberSelect.innerHTML='<option value="">Choose a member…</option>'+members.map(m=>`<option value="${m.user_id}">${esc(m.display_name)} (@${esc(m.username)})</option>`).join("");
    achievementSelect.innerHTML='<option value="">Choose an achievement…</option>'+allAchievements.filter(a=>a.is_active).map(a=>`<option value="${a.id}">${esc(a.icon)} ${esc(a.name)}</option>`).join("");
    const renderAdmin=()=>{container.querySelector("#admin-achievements").innerHTML=allAchievements.map(a=>`<div class="passport-admin-row"><span>${esc(a.icon)} ${esc(a.name)} <small>${esc(a.slug)} · ${a.is_active?"Active":"Inactive"}</small></span><button type="button" data-toggle-achievement="${a.id}" data-active="${a.is_active}">${a.is_active?"Deactivate":"Activate"}</button></div>`).join("");};
    renderAdmin();
    container.querySelector("#achievement-form").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),v={name:String(f.get("name")).trim(),slug:String(f.get("slug")).trim(),description:String(f.get("description")).trim(),icon:String(f.get("icon")).trim()||"✦",category:f.get("category"),criteria:String(f.get("criteria")).trim()};const{data,error}=await supabase.from("crowspace_achievements").insert(v).select("*").single();if(error)return note(container.querySelector("#achievement-note"),error.message,"error");allAchievements.push(data);achievementSelect.add(new Option(data.icon+" "+data.name,data.id));e.currentTarget.reset();renderAdmin();note(container.querySelector("#achievement-note"),"Achievement created.","success");};
    container.querySelector("#award-form").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),v={member_id:f.get("member_id"),achievement_id:f.get("achievement_id"),awarded_by:user.id,award_note:String(f.get("award_note")).trim()};const{error}=await supabase.from("crowspace_member_achievements").insert(v);if(error)return note(container.querySelector("#award-note"),error.message,"error");note(container.querySelector("#award-note"),"Achievement awarded. The member will receive a notification.","success");e.currentTarget.reset();};
    container.querySelector("#admin-achievements").onclick=async e=>{const b=e.target.closest("[data-toggle-achievement]");if(!b)return;const a=allAchievements.find(x=>x.id===b.dataset.toggleAchievement);const{data,error}=await supabase.from("crowspace_achievements").update({is_active:!a.is_active}).eq("id",a.id).select("*").single();if(error)return note(container.querySelector("#achievement-note"),error.message,"error");Object.assign(a,data);renderAdmin();achievementSelect.innerHTML='<option value="">Choose an achievement…</option>'+allAchievements.filter(x=>x.is_active).map(x=>`<option value="${x.id}">${esc(x.icon)} ${esc(x.name)}</option>`).join("");};
  }
}
