import {getUniverseContext,loadMyCrowSpaceProfile,loadMyAccountLink,loadProfileByUsername,searchPublicProfiles} from "./universe-bridge.js";
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
function safeImage(value){try{const u=new URL(value);return u.protocol==="https:"?u.href:null}catch{return null}}
function avatar(profile){const wrap=el("div","profile-avatar");const src=safeImage(profile.avatar_url);if(src){const img=el("img");img.src=src;img.alt="";img.loading="lazy";wrap.append(img)}else wrap.textContent=(profile.display_name||profile.username||"C").slice(0,1).toUpperCase();return wrap}
function card(profile){const a=el("a","member-card");a.href="profile.html?user="+encodeURIComponent(profile.username);const copy=el("div","member-card-copy");copy.append(el("strong","",profile.display_name||profile.username||"CrowSpace member"),el("span","member-handle","@"+(profile.username||"member")));if(profile.bio)copy.append(el("p","muted small",profile.bio));if(profile.creator_category)copy.append(el("span","eyebrow",profile.creator_category));a.append(avatar(profile),copy);return a}
function message(root,title,body,linkText,href){root.replaceChildren();const box=el("div","empty-state");box.append(el("div","empty-icon","◉"),el("h3","",title),el("p","",body));if(linkText){const a=el("a","button button-primary",linkText);a.href=href;box.append(a)}root.append(box)}
export async function initProfilePage(){
 const root=document.querySelector("[data-profile-content]");if(!root)return;
 const context=await getUniverseContext();
 if(!context.user){message(root,"Sign in to view your profile","Your profile is connected to your CrowSpace account. Sign in to load your member information.","Sign in","login.html");return}
 const username=new URLSearchParams(location.search).get("user");
 const result=username?await loadProfileByUsername(username):await loadMyCrowSpaceProfile(context.user.id);
 if(result.error){message(root,"Profile could not be loaded",result.error.message);return}
 const profile=result.data;
 if(!profile){message(root,"No public profile found","This profile may not exist or may not be visible to your account.","Back to your feed","feed.html");return}
 root.replaceChildren();
 const hero=el("section","profile-hero");hero.append(avatar(profile));const details=el("div","profile-details");details.append(el("span","eyebrow","CrowRules Universe"),el("h2","",profile.display_name||profile.username),el("p","member-handle","@"+profile.username));if(profile.crow_id)details.append(el("span","profile-crowid","Crow ID · "+profile.crow_id));if(profile.location)details.append(el("p","muted",profile.location));hero.append(details);root.append(hero);
 if(profile.portfolio_tagline)root.append(el("h3","profile-tagline",profile.portfolio_tagline));
 const bio=profile.portfolio_bio||profile.bio;if(bio){const panel=el("article","panel");panel.append(el("h3","","About"),el("p","",bio));root.append(panel)}
 const own=profile.user_id===context.user.id;
 if(own){const actions=el("div","hero-actions");const edit=el("a","button button-primary","Edit profile");edit.href="edit-profile.html";actions.append(edit);root.append(actions);const link=await loadMyAccountLink();const panel=el("article","panel");panel.append(el("span","eyebrow","CrowRules membership link"),el("h3","",link.data?"Connected":"Not linked yet"),el("p","muted small",link.data?"Your CrowSpace identity is linked to your existing CrowRules member record.":"Your social profile is available, but a matching CrowRules member link has not been confirmed. Contact an administrator before attempting a manual link."));root.append(panel)}
 else {const follow=el("button","button button-primary","Follow");follow.type="button";root.append(follow);const s=context.supabase;const current=await s.from("crowspace_follows").select("follower_id").eq("follower_id",context.user.id).eq("following_id",profile.user_id).maybeSingle();if(current.error){follow.disabled=true;follow.textContent="Follow unavailable"}else{let following=Boolean(current.data);follow.textContent=following?"Following · Unfollow":"Follow";follow.addEventListener("click",async()=>{follow.disabled=true;const result=following?await s.from("crowspace_follows").delete().eq("follower_id",context.user.id).eq("following_id",profile.user_id):await s.from("crowspace_follows").insert({follower_id:context.user.id,following_id:profile.user_id});if(result.error){follow.textContent="Could not update";follow.disabled=false;return}following=!following;follow.textContent=following?"Following · Unfollow":"Follow";follow.disabled=false})}}
}
export async function initDiscovery(){
 const root=document.querySelector("[data-member-results]");if(!root)return;const context=await getUniverseContext();
 if(!context.user){message(root,"Sign in to discover members","Member discovery is available to signed-in CrowSpace members.","Sign in","login.html");return}
 const input=document.querySelector("[data-member-search]");const status=document.querySelector("[data-discovery-status]");
 const load=async term=>{if(status)status.textContent="Searching…";const{data,error}=await searchPublicProfiles(term);if(error){message(root,"Search unavailable",error.message);if(status)status.textContent="Could not load members";return}root.replaceChildren();if(!data?.length){message(root,"No members found",term?"Try a different name.":"Public member profiles will appear here as they join.");if(status)status.textContent="No results";return}data.forEach(p=>root.append(card(p)));if(status)status.textContent=data.length+" member profiles"};
 await load("");if(input){let last="";input.addEventListener("input",()=>{const term=input.value.trim();if(term===last)return;last=term;load(term)})}
}
