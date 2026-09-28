document.addEventListener("DOMContentLoaded",async()=>{
 const sb=window.CROW_CONFIG?.supabaseUrl?supabase.createClient(CROW_CONFIG.supabaseUrl,CROW_CONFIG.supabaseKey):null;
 const list=document.getElementById("conversationList"),messages=document.getElementById("messages"),title=document.getElementById("chatTitle"),status=document.getElementById("messageStatus"),input=document.getElementById("messageInput");
 if(!sb||!list)return;
 const {data:{user}}=await sb.auth.getUser(); if(!user){list.innerHTML='<div class="empty">Sign in to use Messenger.</div>';return}
 let active=null, shareId=new URLSearchParams(location.search).get("share");
 const esc=v=>String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
 async function profiles(ids){if(!ids.length)return{};const {data}=await sb.from("crowspace_profiles").select("user_id,username,display_name,avatar_url").in("user_id",ids);return Object.fromEntries((data||[]).map(p=>[p.user_id,p]))}
 async function loadList(){
  const {data:members}=await sb.from("crowspace_conversation_members").select("conversation_id").eq("user_id",user.id);
  const ids=(members||[]).map(x=>x.conversation_id); if(!ids.length){list.innerHTML='<div class="empty">No conversations yet.<br><small>Start one below.</small></div>';return}
  const {data:cs}=await sb.from("crowspace_conversations").select("id,title,is_group,created_at").in("id",ids).order("created_at",{ascending:false});
  const html=[]; for(const c of cs||[]){const {data:ms}=await sb.from("crowspace_conversation_members").select("user_id").eq("conversation_id",c.id);const ps=await profiles((ms||[]).map(x=>x.user_id).filter(x=>x!==user.id));const p=Object.values(ps)[0];html.push('<button class="conversation '+(active===c.id?'active':'')+'" data-conversation="'+c.id+'"><div class="avatar">'+esc((p?.display_name||c.title||"CR").slice(0,2).toUpperCase())+'</div><div><b>'+esc(c.title||p?.display_name||"Conversation")+'</b><small>'+esc(p?.username?"@"+p.username:c.is_group?"Group chat":"Direct message")+'</small></div></button>')}
  list.innerHTML=html.join("")||'<div class="empty">No conversations yet.</div>';
 }
 async function openConversation(id){
  active=id;await loadList();const {data:c}=await sb.from("crowspace_conversations").select("title,is_group").eq("id",id).maybeSingle();title.textContent=c?.title||"Conversation";
  const {data:ms}=await sb.from("crowspace_messages").select("id,sender_id,body,created_at").eq("conversation_id",id).order("created_at",{ascending:true}).limit(100);const ps=await profiles([...new Set((ms||[]).map(x=>x.sender_id))]);
  messages.innerHTML=(ms||[]).map(m=>'<div class="dm '+(m.sender_id===user.id?'mine':'')+'"><b>'+esc(ps[m.sender_id]?.display_name||"Member")+'</b><p>'+esc(m.body)+'</p><small class="muted">'+new Date(m.created_at).toLocaleString()+'</small></div>').join("")||'<div class="empty">No messages yet.</div>';messages.scrollTop=messages.scrollHeight;
 }
 list.addEventListener("click",e=>{const b=e.target.closest("[data-conversation]");if(b)openConversation(b.dataset.conversation)});
 document.getElementById("newConversation")?.addEventListener("click",async()=>{
  const username=prompt("Enter the CrowSpace username to message:"); if(!username)return;
  const {data:p}=await sb.from("crowspace_profiles").select("user_id,display_name,username").eq("username",username.replace(/^@/,"")).maybeSingle();
  if(!p||p.user_id===user.id){status.textContent="Member not found.";return}
  const {data:c,error}=await sb.from("crowspace_conversations").insert({created_by:user.id,title:p.display_name||p.username,is_group:false}).select("id").single();if(error){status.textContent=error.message;return}
  const {error:me}=await sb.from("crowspace_conversation_members").insert([{conversation_id:c.id,user_id:user.id},{conversation_id:c.id,user_id:p.user_id}]);if(me){status.textContent=me.message;return}
  await openConversation(c.id);
 });
 document.getElementById("sendMessage")?.addEventListener("click",async()=>{
  const body=input.value.trim();if(!body||!active)return;
  const {error}=await sb.from("crowspace_messages").insert({conversation_id:active,sender_id:user.id,body});if(error){status.textContent=error.message;return}input.value="";status.textContent="";await openConversation(active);
 });
 input?.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();document.getElementById("sendMessage").click()}});
 await loadList();
 if(shareId){const {data:p}=await sb.from("crowspace_posts").select("body,media_url").eq("id",shareId).maybeSingle();if(p){document.getElementById("sharedCaw").hidden=false;document.getElementById("sharedCawBody").textContent=p.body;input.value="Shared Caw: "+new URL("caw.html?id="+shareId,location.href).href;}}
 const first=list.querySelector("[data-conversation]");if(first)await openConversation(first.dataset.conversation);
});