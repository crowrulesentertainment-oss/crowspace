document.addEventListener("DOMContentLoaded",async()=>{
 const sb=window.CROW_CONFIG?.supabaseUrl?supabase.createClient(CROW_CONFIG.supabaseUrl,CROW_CONFIG.supabaseKey):null;
 const list=document.getElementById("conversationList"),messages=document.getElementById("messages"),title=document.getElementById("chatTitle"),status=document.getElementById("messageStatus"),input=document.getElementById("messageInput"),mediaInput=document.getElementById("messageMedia");
 if(!sb||!list)return;
 const {data:{user}}=await sb.auth.getUser(); if(!user){list.innerHTML='<div class="empty">Sign in to use Messenger.</div>';return}
 let active=null, channel=null, presenceChannel=null, typingChannel=null, typingTimer=null, unread=0, replyTo=null, shareId=new URLSearchParams(location.search).get("share");
 const esc=v=>String(v??"").replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
 async function uploadMessengerMedia(file){if(!file)return null;if(file.size>50*1024*1024){status.textContent="Media must be 50 MB or smaller.";return null}const ok=["image/jpeg","image/png","image/webp","image/gif","video/mp4","video/webm","video/quicktime"].includes(file.type);if(!ok){status.textContent="Unsupported media type.";return null}const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");const path=user.id+"/messages/"+Date.now()+"-"+safe;const {error}=await sb.storage.from("crowspace-media").upload(path,file,{contentType:file.type,upsert:false});if(error){status.textContent=error.message;return null}return sb.storage.from("crowspace-media").getPublicUrl(path).data.publicUrl}
 async function profiles(ids){if(!ids.length)return{};const {data}=await sb.from("crowspace_profiles").select("user_id,username,display_name,avatar_url").in("user_id",ids);return Object.fromEntries((data||[]).map(p=>[p.user_id,p]))}
 async function loadList(){
  const {data:members}=await sb.from("crowspace_conversation_members").select("conversation_id").eq("user_id",user.id);
  const ids=(members||[]).map(x=>x.conversation_id); if(!ids.length){list.innerHTML='<div class="empty">No conversations yet.<br><small>Start one below.</small></div>';return}
  const {data:cs}=await sb.from("crowspace_conversations").select("id,title,is_group,created_at").in("id",ids).order("created_at",{ascending:false});
  const html=[]; for(const c of cs||[]){const {data:ms}=await sb.from("crowspace_conversation_members").select("user_id").eq("conversation_id",c.id);const ps=await profiles((ms||[]).map(x=>x.user_id).filter(x=>x!==user.id));const p=Object.values(ps)[0];html.push('<button class="conversation '+(active===c.id?'active':'')+'" data-conversation="'+c.id+'"><div class="avatar">'+esc((p?.display_name||c.title||"CR").slice(0,2).toUpperCase())+'</div><div><b>'+esc(c.title||p?.display_name||"Conversation")+'</b><small>'+esc(p?.username?"@"+p.username:c.is_group?"Group chat":"Direct message")+'</small></div></button>')}
  list.innerHTML=html.join("")||'<div class="empty">No conversations yet.</div>';
 }
 async function setPresence(){await sb.from("crowspace_presence").upsert({user_id:user.id,last_seen_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:"user_id"}).catch(()=>{})}
 function setTyping(on){if(!typingChannel)return;if(on)typingChannel.track({user_id:user.id,typing:true}).catch(()=>{});else typingChannel.untrack().catch(()=>{})}
 function notifyIncoming(m){unread++;document.title="("+unread+") Messenger";if("Notification" in window&&Notification.permission==="granted"&&document.visibilityState==="hidden")new Notification("New CrowSpace message",{body:m.body?.slice(0,120)||"New message"})}
 async function subscribeRealtime(){
  if(channel)await sb.removeChannel(channel);
  channel=sb.channel("crowspace-messenger-"+user.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"crowspace_messages"},p=>{if(p.new?.conversation_id===active&&p.new?.sender_id!==user.id)openConversation(active);if(p.new?.sender_id!==user.id)notifyIncoming(p.new)}).subscribe();
  typingChannel=sb.channel("crowspace-typing",{config:{presence:{key:user.id}}}).on("presence",{event:"sync"},()=>{const state=typingChannel.presenceState();const typing=Object.values(state).flat().some(v=>v.user_id!==user.id&&v.typing);document.getElementById("typingIndicator").textContent=typing?"Someone is typing…":"CrowSpace Messenger"}).subscribe();
  presenceChannel=sb.channel("crowspace-presence").on("postgres_changes",{event:"*",schema:"public",table:"crowspace_presence"},()=>loadPresence()).subscribe();
 }
 async function loadPresence(){
  const cutoff=new Date(Date.now()-2*60*1000).toISOString();
  const {data}=await sb.from("crowspace_presence").select("user_id,last_seen_at").gte("last_seen_at",cutoff);
  const online=new Set((data||[]).map(x=>x.user_id));
  document.querySelectorAll("[data-presence-user]").forEach(el=>{const on=online.has(el.dataset.presenceUser);el.classList.toggle("online",on);el.title=on?"Online":"Offline"});
 }
 async function markRead(id){await sb.from("crowspace_conversation_members").update({last_read_at:new Date().toISOString()}).eq("conversation_id",id).eq("user_id",user.id).catch(()=>{})}
 async function openConversation(id){unread=0;document.title="Messenger — CrowSpace";
  active=id;await markRead(id);await loadList();const {data:c}=await sb.from("crowspace_conversations").select("title,is_group").eq("id",id).maybeSingle();title.textContent=c?.title||"Conversation";
  const {data:ms}=await sb.from("crowspace_messages").select("id,sender_id,body,created_at,media_url,media_type,reply_to_id").eq("conversation_id",id).order("created_at",{ascending:true}).limit(100);const ps=await profiles([...new Set((ms||[]).map(x=>x.sender_id))]);
  messages.innerHTML=(ms||[]).map(m=>'<div class="dm '+(m.sender_id===user.id?'mine':'')+'"><b>'+esc(ps[m.sender_id]?.display_name||"Member")+'</b>'+(m.reply_to_id?'<div class="message-reply-ref">↪ Replying to a message</div>':"")+'<p>'+esc(m.body)+'</p><button class="message-reply" data-reply="'+m.id+'" type="button">Reply</button><small class="muted">'+new Date(m.created_at).toLocaleString()+(m.sender_id===user.id?' · Sent':'')+'</small>'+(m.sender_id===user.id?'<button class="message-delete" data-message="'+m.id+'" type="button">Delete</button>':"")+'</div>').join("")||'<div class="empty">No messages yet.</div>';(ms||[]).forEach((m,i)=>{if(!m.media_url)return;const box=messages.children[i];if(!box)return;const el=document.createElement((m.media_type||"").startsWith("video/")?"video":"img");el.className="message-attachment";el.src=m.media_url;if(el.tagName==="VIDEO"){el.controls=true;el.preload="metadata"}else{el.loading="lazy";el.alt="Message attachment"}box.insertBefore(el,box.querySelector("small"));});messages.scrollTop=messages.scrollHeight;
 }
 messages.addEventListener("click",async e=>{const rb=e.target.closest("[data-reply]");if(rb){const q=(await sb.from("crowspace_messages").select("body").eq("id",rb.dataset.reply).maybeSingle()).data;if(q){replyTo=rb.dataset.reply;input.value="Replying: "+q.body.slice(0,140);input.focus();status.textContent="Replying to this message.";}}const b=e.target.closest("[data-message]");if(!b)return;if(!confirm("Delete this message?"))return;const {error}=await sb.from("crowspace_messages").delete().eq("id",b.dataset.message).eq("sender_id",user.id);if(error){status.textContent=error.message;return}await openConversation(active)});
 document.getElementById("conversationSearch")?.addEventListener("input",async e=>{const q=e.target.value.toLowerCase().trim();document.querySelectorAll("#conversationList .conversation").forEach(b=>b.hidden=q&&!b.textContent.toLowerCase().includes(q))});
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
  const body=input.value.trim();if(!body&&!mediaInput?.files?.length||!active)return;
  let mediaUrl=null;if(mediaInput?.files?.[0])mediaUrl=await uploadMessengerMedia(mediaInput.files[0]);if(mediaInput?.files?.length&&!mediaUrl)return;const finalBody=body||(mediaUrl?"📎 Shared media":"");const {error}=await sb.from("crowspace_messages").insert({conversation_id:active,sender_id:user.id,body:finalBody,media_url:mediaUrl,media_type:mediaInput?.files?.[0]?.type||null,reply_to_id:replyTo});if(error){status.textContent=error.message;return}input.value="";if(mediaInput)mediaInput.value="";replyTo=null;status.textContent="";await openConversation(active);
 });
 document.getElementById("attachMedia")?.addEventListener("click",()=>mediaInput?.click());
 mediaInput?.addEventListener("change",()=>{const f=mediaInput.files?.[0];if(f){status.textContent=f.name+" ready to send.";input.focus()}});
 input?.addEventListener("input",()=>{setTyping(true);clearTimeout(typingTimer);typingTimer=setTimeout(()=>setTyping(false),1200)});
 input?.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();document.getElementById("sendMessage").click()}});
 if("Notification" in window&&Notification.permission==="default")Notification.requestPermission().catch(()=>{});
 await loadList(); await subscribeRealtime(); await setPresence(); await loadPresence();
 setInterval(()=>{setPresence();loadPresence()},30000);
 if(shareId){const {data:p}=await sb.from("crowspace_posts").select("body,media_url").eq("id",shareId).maybeSingle();if(p){document.getElementById("sharedCaw").hidden=false;document.getElementById("sharedCawBody").textContent=p.body;input.value="Shared Caw: "+new URL("caw.html?id="+shareId,location.href).href;}}
 const first=list.querySelector("[data-conversation]");if(first)await openConversation(first.dataset.conversation);
});