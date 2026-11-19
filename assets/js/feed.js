import {getUniverseContext} from "./universe-bridge.js";
import {getBranch,BRANCHES} from "./branch-registry.js";
const node=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
const state={context:null,view:"for-you",branch:"all"};
export async function initFeed(){
 const root=document.querySelector("[data-feed-list]");if(!root)return;
 state.context=await getUniverseContext();
 if(!state.context.user){empty(root,"Sign in to see your feed","Your personalized CrowSpace feed is available to signed-in members.","Sign in","login.html");return}
 document.querySelectorAll("[data-feed-view]").forEach(button=>button.addEventListener("click",()=>{state.view=button.dataset.feedView;document.querySelectorAll("[data-feed-view]").forEach(b=>b.classList.toggle("is-active",b===button));loadFeed()}));
 const branch=document.querySelector("[data-feed-branch]");if(branch){BRANCHES.forEach(b=>{const option=node("option","",b.name);option.value=b.key;branch.append(option)});branch.addEventListener("change",()=>{state.branch=branch.value;loadFeed()})}
 const refresh=document.querySelector("[data-feed-refresh]");if(refresh)refresh.addEventListener("click",loadFeed);
 await loadFeed();
}
function empty(root,title,body,cta,href){root.replaceChildren();const box=node("div","empty-state");box.append(node("div","empty-icon","✦"),node("h3","",title),node("p","",body));if(cta){const a=node("a","button button-primary",cta);a.href=href;box.append(a)}root.append(box)}
async function loadFeed(){
 const root=document.querySelector("[data-feed-list]");const s=state.context.supabase;root.replaceChildren(node("div","muted","Loading posts…"));
 const uid=state.context.user.id;
 const [followsResult,branchesResult,interestsResult]=await Promise.all([
  s.from("crowspace_follows").select("following_id").eq("follower_id",uid),
  s.from("crowspace_branch_follows").select("branch_key").eq("user_id",uid),
  s.from("crowspace_member_interests").select("interest_key").eq("user_id",uid)
 ]);
 const followedMembers=new Set((followsResult.data||[]).map(x=>x.following_id));
 const followedBranches=new Set((branchesResult.data||[]).map(x=>x.branch_key));
 const interests=(interestsResult.data||[]).map(x=>String(x.interest_key||"").toLowerCase()).filter(Boolean);
 let q=s.from("crowspace_posts").select("id,author_id,body,visibility,post_kind,branch_key,created_at,updated_at").order("created_at",{ascending:false}).limit(40);
 if(state.view==="following"){
  if(followsResult.error){empty(root,"Following feed unavailable",followsResult.error.message);return}
  q=q.in("author_id",[uid,...followedMembers]);
 }
 if(state.view==="branches"&&state.branch!=="all")q=q.eq("branch_key",state.branch);
 const{data:posts,error}=await q;
 if(error){empty(root,"Feed could not load",error.message);return}
 if(!posts?.length){empty(root,state.view==="following"?"Your Following feed is quiet":"No posts yet","Posts shared across the CrowRules universe will appear here. Follow members, choose branches and add interests to shape your feed.","Create a post","create-post.html");return}
 if(state.view==="for-you"){
  posts.sort((a,b)=>postScore(b,followedMembers,followedBranches,interests)-postScore(a,followedMembers,followedBranches,interests)||new Date(b.created_at)-new Date(a.created_at));
 }
 const ids=[...new Set(posts.map(p=>p.author_id))];const postIds=posts.map(p=>p.id);
 const [profilesResult,reactionsResult,commentsResult]=await Promise.all([
  s.from("crowspace_profiles").select("user_id,username,display_name,avatar_url").in("user_id",ids),
  s.from("crowspace_post_reactions").select("post_id,user_id,reaction").in("post_id",postIds),
  s.from("crowspace_post_comments").select("id,post_id,author_id,parent_id,body,created_at").in("post_id",postIds).order("created_at",{ascending:true}).limit(160)
 ]);
 if(profilesResult.error||reactionsResult.error||commentsResult.error){empty(root,"Feed details could not load",(profilesResult.error||reactionsResult.error||commentsResult.error).message);return}
 const profiles=new Map((profilesResult.data||[]).map(p=>[p.user_id,p]));
 const reactions=reactionsResult.data||[];const comments=commentsResult.data||[];
 const commentAuthors=[...new Set(comments.map(c=>c.author_id))];
 const commentProfiles=commentAuthors.length?await s.from("crowspace_profiles").select("user_id,username,display_name").in("user_id",commentAuthors):{data:[],error:null};
 const commentNames=new Map((commentProfiles.data||[]).map(p=>[p.user_id,p.display_name||p.username||"CrowSpace member"]));
 root.replaceChildren();
 posts.forEach(post=>root.append(renderPost(post,profiles.get(post.author_id),reactions.filter(r=>r.post_id===post.id),comments.filter(c=>c.post_id===post.id),commentNames)));
}
function postScore(post,followedMembers,followedBranches,interests){
 let score=followedMembers.has(post.author_id)?5:0;
 if(post.branch_key&&followedBranches.has(post.branch_key))score+=4;
 const text=String(post.body||"").toLowerCase();
 interests.forEach(interest=>{if(interest.length>1&&text.includes(interest))score+=2});
 const ageHours=Math.max(0,(Date.now()-new Date(post.created_at).getTime())/3600000);
 return score+Math.max(0,2-ageHours/48);
}
function renderPost(post,profile,reactions,comments,commentNames){
 const card=node("article","post-card");const header=node("div","post-header");const name=node("a","post-author",(profile?.display_name||profile?.username||"CrowSpace member"));name.href="profile.html?user="+encodeURIComponent(profile?.username||"");const handle=node("span","member-handle",profile?.username?"@"+profile.username:"Member");const meta=node("div","post-meta");meta.append(name,handle,node("span","post-date",new Date(post.created_at).toLocaleString()));header.append(meta);
 if(profile?.avatar_url){try{const u=new URL(profile.avatar_url);if(u.protocol==="https:"){const img=node("img","post-avatar");img.src=u.href;img.alt="";header.prepend(img)}}catch{}}
 card.append(header);
 if(post.branch_key){const branch=getBranch(post.branch_key);if(branch)card.append(node("span","post-branch",branch.name))}
 card.append(node("p","post-body",post.body));
 const summary=node("div","post-summary");summary.textContent=reactions.length+" reactions · "+comments.length+" comments";card.append(summary);
 const actions=node("div","post-actions");["like","love","laugh","wow","support"].forEach(kind=>{const button=node("button","reaction-button",({like:"👍",love:"❤️",laugh:"😂",wow:"😮",support:"🙌"})[kind]);button.type="button";button.title=kind;button.classList.toggle("is-active",reactions.some(r=>r.user_id===state.context.user.id&&r.reaction===kind));button.addEventListener("click",()=>toggleReaction(post.id,kind,button));actions.append(button)});card.append(actions);
 const commentList=node("div","post-comments");comments.slice(-3).forEach(c=>{const item=node("p","post-comment");const strong=node("strong","",commentNames.get(c.author_id)||"Member");item.append(strong,document.createTextNode(" "+c.body));commentList.append(item)});card.append(commentList);
 const form=node("form","comment-form");const input=node("input","comment-input");input.placeholder="Write a comment…";input.maxLength=2000;input.required=true;input.setAttribute("aria-label","Write a comment");const submit=node("button","button","Comment");submit.type="submit";form.append(input,submit);form.addEventListener("submit",async event=>{event.preventDefault();const body=input.value.trim();if(!body)return;submit.disabled=true;const{error}=await state.context.supabase.from("crowspace_post_comments").insert({post_id:post.id,author_id:state.context.user.id,body});if(error){submit.disabled=false;alert("Comment could not be posted: "+error.message);return}await loadFeed()});card.append(form);return card;
}
async function toggleReaction(postId,kind,button){button.disabled=true;const s=state.context.supabase;const existing=await s.from("crowspace_post_reactions").select("reaction").eq("post_id",postId).eq("user_id",state.context.user.id).maybeSingle();if(existing.error){alert(existing.error.message);button.disabled=false;return}let result;if(existing.data?.reaction===kind)result=await s.from("crowspace_post_reactions").delete().eq("post_id",postId).eq("user_id",state.context.user.id);else result=await s.from("crowspace_post_reactions").upsert({post_id:postId,user_id:state.context.user.id,reaction:kind},{onConflict:"post_id,user_id"});if(result.error)alert("Reaction could not be saved: "+result.error.message);button.disabled=false;await loadFeed()}
