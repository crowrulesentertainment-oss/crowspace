(function(){
"use strict";
const esc=window.CrowSpaceSocial?.esc||((s)=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])));
const providers=["google","discord","twitch"];
let db,user,profile,member,identities=[];
const $=id=>document.getElementById(id);
async function init(){
 db=await window.CrowSpaceAuth.ready;
 const {data,error}=await db.auth.getUser();if(error||!data.user){location.href="login.html?next=account.html";return}user=data.user;
 const [pr,me,ids]=await Promise.all([
  db.from("crowspace_profiles").select("*").eq("user_id",user.id).maybeSingle(),
  db.from("members").select("membership_type,status,role,points,watch_minutes,display_name,username,email,bio,avatar_url,created_at").eq("user_id",user.id).maybeSingle(),
  db.auth.getUserIdentities()
 ]);
 profile=pr.data||{};member=me.data||{};identities=ids.data?.identities||[];
 render();
}
function render(){ $("displayName").value=member.display_name||profile.display_name||""; $("username").value=profile.username||member.username||""; $("bio").value=profile.bio||member.bio||"";
 $("accountName").textContent=member.display_name||profile.display_name||profile.username||user.email?.split("@")[0]||"Crow Member";
 $("accountHandle").textContent=profile.username?"@"+profile.username:(member.username?"@"+member.username:"@member");
 $("accountEmail").textContent=user.email||member.email||"";
 $("membershipType").textContent=member.membership_type||"Free";
 $("membershipStatus").textContent=member.status||"Active";
 $("points").textContent=Number(member.points||0).toLocaleString();
 $("watchMinutes").textContent=Number(member.watch_minutes||0).toLocaleString();
 $("memberSince").textContent=member.created_at?new Date(member.created_at).toLocaleDateString():new Date(user.created_at).toLocaleDateString();
 $("avatar").innerHTML=profile.avatar_url?'<img src="'+esc(profile.avatar_url)+'" alt="">':esc(($("accountName").textContent||"CM").slice(0,2).toUpperCase());
 $("identityGrid").innerHTML=providers.map(p=>{const i=identities.find(x=>x.provider===p);return '<div class="identity-card '+(i?"connected":"")+'"><div class="identity-icon">'+(p==="google"?"G":p==="discord"?"◈":"T")+'</div><div><b>'+p[0].toUpperCase()+p.slice(1)+'</b><small>'+ (i?"Connected":"Not connected")+'</small></div><button class="identity-action" data-provider="'+p+'">'+(i?"Manage":"Connect")+'</button></div>'}).join("");
 document.querySelectorAll(".identity-action").forEach(b=>b.onclick=()=>identityAction(b.dataset.provider));
 $("saveProfile").onclick=saveProfile;
 $("changePassword").onclick=changePassword;
 $("signOut").onclick=async()=>{await db.auth.signOut({scope:"global"});location.href="login.html"};
 loadSocial();
}
async function identityAction(provider){
 const current=identities.find(x=>x.provider===provider);
 if(current){
  if(identities.length<2){alert("Keep at least two sign-in methods connected before removing one.");return}
  if(!confirm("Unlink your "+provider+" account from CrowRules? You will no longer be able to use it to sign in."))return;
  const {error}=await db.auth.unlinkIdentity(current);if(error)alert(error.message);else{const r=await db.auth.getUserIdentities();identities=r.data?.identities||[];render()}
 }else{
  const {error}=await db.auth.linkIdentity({provider,options:{redirectTo:new URL("account.html",location.href).href}});
  if(error)alert(error.message);
 }
}
async function saveProfile(){
 const displayName=$("displayName").value.trim(),username=$("username").value.trim().replace(/^@/,""),bio=$("bio").value.trim();
 const {error}=await db.from("crowspace_profiles").update({display_name:displayName,username,bio}).eq("user_id",user.id);
 if(error){$("profileStatus").textContent=error.message;return}
 await db.from("members").update({display_name:displayName,username,bio}).eq("user_id",user.id);
 $("profileStatus").textContent="Profile saved.";
 setTimeout(()=>$("profileStatus").textContent="",2500);
}
async function changePassword(){
 const password=prompt("Enter a new password (minimum 8 characters):");if(!password)return;if(password.length<8){alert("Use at least 8 characters.");return}
 const {error}=await db.auth.updateUser({password});if(error)alert(error.message);else alert("Password updated.");
}
async function loadSocial(){
 const [followers,following]=await Promise.all([
  db.from("crowspace_follows").select("*",{count:"exact",head:true}).eq("followed_user_id",user.id),
  db.from("crowspace_follows").select("*",{count:"exact",head:true}).eq("follower_id",user.id)
 ]);
 $("followers").textContent=(followers.count||0).toLocaleString();
 $("following").textContent=(following.count||0).toLocaleString();
 const {data:ledger}=await db.from("crowrules_crowpoints_ledger").select("points,reason,source,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(10);
 $("pointsHistory").innerHTML=(ledger||[]).length?(ledger||[]).map(x=>'<div class="points-row"><b>'+(x.points>=0?"+":"")+x.points+'</b><span>'+esc(x.reason)+'</span><small>'+new Date(x.created_at).toLocaleDateString()+'</small></div>').join(""):'<div class="empty">No CrowPoints activity yet.</div>';
 const n=await db.from("crowspace_notifications").select("id",{count:"exact",head:true}).eq("user_id",user.id).is("read_at",null);$("unread").textContent=n.count||0;
}
window.CrowSpaceAccount={init};
init().catch(e=>{console.error(e);location.href="login.html?next=account.html"});
})();