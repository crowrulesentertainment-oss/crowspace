(function(){
"use strict";
const ready=()=>window.CrowSpaceAuth?.ready;
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const goLogin=()=>{location.href="login.html?next="+encodeURIComponent(location.pathname.split("/").pop()||"home.html")};
async function dbUser(){const db=await ready();const {data:{user}}=await db.auth.getUser();return {db,user:user||null}}
async function requireUser(){const x=await dbUser();if(!x.user){goLogin();throw new Error("AUTH_REQUIRED")}return x}
async function toggleLike(postId,button){
 const {db,user}=await requireUser();
 const {data:existing,error:findErr}=await db.from("crowspace_reactions").select("post_id,user_id").eq("post_id",postId).eq("user_id",user.id).maybeSingle();
 if(findErr)throw findErr;
 if(existing) await db.from("crowspace_reactions").delete().eq("post_id",postId).eq("user_id",user.id);
 else {const {error}=await db.from("crowspace_reactions").insert({post_id:postId,user_id:user.id,reaction:"like"});if(error)throw error}
 const {count}=await db.from("crowspace_reactions").select("*",{count:"exact",head:true}).eq("post_id",postId);
 button.classList.toggle("on",!existing);button.innerHTML=(existing?"♡ ":"♥ ")+(count||0);
}
async function addComment(postId,body){
 const {db,user}=await requireUser();const text=String(body||"").trim();if(!text)return;
 const {error}=await db.from("crowspace_comments").insert({post_id:postId,user_id:user.id,body:text});if(error)throw error;
}
async function loadComments(targetId,kind="post"){
 const {db}=await dbUser();if(!db)return[];
 const col=kind==="caw"?"caw_id":"post_id";
 const {data,error}=await db.from("crowspace_comments").select("id,user_id,body,created_at").eq(col,targetId).order("created_at",{ascending:true}).limit(100);
 if(error)throw error;const ids=[...new Set((data||[]).map(x=>x.user_id))];let ps=[];
 if(ids.length){const r=await db.from("crowspace_profiles").select("user_id,username,display_name,avatar_url").in("user_id",ids);if(r.error)throw r.error;ps=r.data||[]}
 const map=new Map(ps.map(x=>[x.user_id,x]));return (data||[]).map(x=>({...x,profile:map.get(x.user_id)||{}}));
}
async function toggleCawLike(cawId,button){
 const {db,user}=await requireUser();
 const {data:existing,error}=await db.from("crowspace_social_interactions").select("id").eq("target_type","caw").eq("target_id",cawId).eq("user_id",user.id).eq("interaction_type","like").maybeSingle();
 if(error)throw error;
 if(existing)await db.from("crowspace_social_interactions").delete().eq("id",existing.id);
 else {const r=await db.from("crowspace_social_interactions").insert({target_type:"caw",target_id:cawId,user_id:user.id,interaction_type:"like"});if(r.error)throw r.error}
 const {count}=await db.from("crowspace_social_interactions").select("*",{count:"exact",head:true}).eq("target_type","caw").eq("target_id",cawId).eq("interaction_type","like");
 button.classList.toggle("on",!existing);button.innerHTML=(!existing?"♥ ":"♡ ")+(count||0);
}
async function toggleFollow(targetUserId,button){
 const {db,user}=await requireUser();if(targetUserId===user.id)return;
 const {data:existing,error}=await db.from("crowspace_follows").select("follower_id").eq("follower_id",user.id).eq("followed_user_id",targetUserId).maybeSingle();if(error)throw error;
 if(existing)await db.from("crowspace_follows").delete().eq("follower_id",user.id).eq("followed_user_id",targetUserId);
 else {const r=await db.from("crowspace_follows").insert({follower_id:user.id,followed_user_id:targetUserId});if(r.error)throw r.error}
 if(button)button.textContent=existing?"Follow":"Following";
}
async function loadNotifications(){
 const {db,user}=await requireUser();const {data,error}=await db.from("crowspace_notifications").select("id,actor_id,type,body,post_id,caw_id,read_at,created_at,metadata").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100);if(error)throw error;
 const ids=[...new Set((data||[]).map(x=>x.actor_id).filter(Boolean))];let ps=[];if(ids.length){const r=await db.from("crowspace_profiles").select("user_id,username,display_name,avatar_url").in("user_id",ids);if(r.error)throw r.error;ps=r.data||[]}
 const map=new Map(ps.map(x=>[x.user_id,x]));return (data||[]).map(x=>({...x,profile:map.get(x.actor_id)||{}}));
}
async function markNotificationsRead(){
 const {db,user}=await requireUser();const {error}=await db.from("crowspace_notifications").update({read_at:new Date().toISOString()}).eq("user_id",user.id).is("read_at",null);if(error)throw error;
}
async function loadConversations(){
 const {db,user}=await requireUser();
 const {data:members,error}=await db.from("crowspace_conversation_members").select("conversation_id,last_read_at").eq("user_id",user.id);if(error)throw error;
 const ids=(members||[]).map(x=>x.conversation_id);if(!ids.length)return[];
 const {data:convs,error:ce}=await db.from("crowspace_conversations").select("id,title,is_group,created_at").in("id",ids).order("created_at",{ascending:false});if(ce)throw ce;
 const {data:msgs,error:me}=await db.from("crowspace_messages").select("id,conversation_id,sender_id,body,created_at").in("conversation_id",ids).order("created_at",{ascending:false}).limit(200);if(me)throw me;
 const senderIds=[...new Set((msgs||[]).map(x=>x.sender_id))];let ps=[];if(senderIds.length){const r=await db.from("crowspace_profiles").select("user_id,username,display_name,avatar_url").in("user_id",senderIds);if(r.error)throw r.error;ps=r.data||[]}
 const map=new Map(ps.map(x=>[x.user_id,x]));const latest=new Map();(msgs||[]).forEach(x=>{if(!latest.has(x.conversation_id))latest.set(x.conversation_id,{...x,profile:map.get(x.sender_id)||{}})});
 return (convs||[]).map(c=>({...c,latest:latest.get(c.id)||null}));
}
async function sendMessage(conversationId,body){
 const {db,user}=await requireUser();const text=String(body||"").trim();if(!text)return;
 const {error}=await db.from("crowspace_messages").insert({conversation_id:conversationId,sender_id:user.id,body:text});if(error)throw error;
}
async function createConversation(otherUserId){
 const {db,user}=await requireUser();if(otherUserId===user.id)throw new Error("Cannot message yourself");
 const {data:existing}=await db.from("crowspace_conversation_members").select("conversation_id").eq("user_id",user.id);
 for(const m of existing||[]){const r=await db.from("crowspace_conversation_members").select("user_id").eq("conversation_id",m.conversation_id);if((r.data||[]).some(x=>x.user_id===otherUserId))return m.conversation_id}
 const {data:c,error}=await db.from("crowspace_conversations").insert({created_by:user.id,title:"",is_group:false}).select("id").single();if(error)throw error;
 const {error:me}=await db.from("crowspace_conversation_members").insert([{conversation_id:c.id,user_id:user.id,role:"member"},{conversation_id:c.id,user_id:otherUserId,role:"member"}]);if(me)throw me;return c.id;
}
window.CrowSpaceSocial={ready,dbUser,requireUser,toggleLike,toggleCawLike,addComment,loadComments,toggleFollow,loadNotifications,markNotificationsRead,loadConversations,sendMessage,createConversation,esc};
})();