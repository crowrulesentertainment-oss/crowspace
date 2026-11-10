import { supabase } from "./supabase.js";

const $ = (s, r=document) => r.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const stamp = v => v ? new Date(v).toLocaleString([], {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}) : "";
const initials = v => esc((v || "C").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase());
let current=null, channel=null, recorder=null, recordChunks=[], onlineUsers=new Set(), typingTimer=null, typingStop=null;
let allConversations=[], currentUser=null, currentProfile=null;

function avatar(p, cls=""){return p?.avatar_url ? '<img class="msg-avatar '+cls+'" src="'+esc(p.avatar_url)+'" alt="">' : '<span class="msg-avatar '+cls+'">'+initials(p?.display_name)+'</span>';}
function note(text, kind=""){const el=$("#msg-status");if(el){el.textContent=text;el.className="msg-status "+kind;}}
function cleanName(p){return p?.display_name || p?.username || "CrowSpace member";}
function conversationTitle(c){return c.kind==="group" ? c.title : cleanName(c.other);}
function unread(c){return c.last_message && c.last_message.sender_id!==currentUser.id && (!c.last_read_at || new Date(c.last_message.created_at)>new Date(c.last_read_at));}

async function loadConversations(){
 const {data:dmMembers,error:dmErr}=await supabase.from("crowspace_direct_members").select("conversation_id,last_read_at,archived_at,muted_until,pinned_at").eq("user_id",currentUser.id).is("archived_at",null);
 if(dmErr)throw dmErr;
 const dmIds=(dmMembers||[]).map(x=>x.conversation_id);
 let dms=[];
 if(dmIds.length){
  const {data:convs,error}=await supabase.from("crowspace_direct_conversations").select("id,participant_low,participant_high,last_message_at,created_at").in("id",dmIds).order("last_message_at",{ascending:false,nullsFirst:false});
  if(error)throw error;
  const otherIds=[...new Set((convs||[]).map(c=>c.participant_low===currentUser.id?c.participant_high:c.participant_low))];
  const {data:profiles}=otherIds.length?await supabase.from("crowspace_profiles").select("user_id,username,display_name,avatar_url").in("user_id",otherIds):{data:[]};
  const pm=Object.fromEntries((profiles||[]).map(p=>[p.user_id,p]));
  dms=await Promise.all((convs||[]).map(async c=>{
   const m=dmMembers.find(x=>x.conversation_id===c.id);
   const {data:last}=await supabase.from("crowspace_direct_messages").select("id,body,sender_id,created_at,message_type").eq("conversation_id",c.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
   return {...c,kind:"direct",other:pm[c.participant_low===currentUser.id?c.participant_high:c.participant_low],last_message:last,last_read_at:m?.last_read_at,muted_until:m?.muted_until,pinned_at:m?.pinned_at};
  }));
 }
 const {data:gm,error:gmErr}=await supabase.from("crowspace_group_members").select("group_id,last_read_at,role").eq("user_id",currentUser.id);
 if(gmErr)throw gmErr;
 let groups=[];
 if(gm?.length){
  const ids=gm.map(x=>x.group_id);
  const {data:gc,error}=await supabase.from("crowspace_group_conversations").select("id,title,created_by,updated_at").in("id",ids).order("updated_at",{ascending:false});
  if(error)throw error;
  groups=await Promise.all((gc||[]).map(async c=>{
   const m=gm.find(x=>x.group_id===c.id);
   const {data:last}=await supabase.from("crowspace_group_messages").select("id,body,sender_id,created_at").eq("group_id",c.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
   return {...c,kind:"group",last_message:last,last_read_at:m?.last_read_at,role:m?.role};
  }));
 }
 allConversations=[...dms,...groups].sort((a,b)=>{
  if(a.pinned_at&&!b.pinned_at)return -1;if(b.pinned_at&&!a.pinned_at)return 1;
  return new Date(b.last_message?.created_at||b.updated_at||b.created_at)-new Date(a.last_message?.created_at||a.updated_at||a.created_at);
 });
 renderList();
}

function renderList(){
 const term=($("#conversation-search")?.value||"").trim().toLowerCase();
 const items=allConversations.filter(c=>(conversationTitle(c)+" "+(c.other?.username||"")).toLowerCase().includes(term));
 $("#conversation-list").innerHTML=items.length?items.map(c=>'<button class="msg-thread '+(current?.id===c.id&&current?.kind===c.kind?'selected':'')+'" data-id="'+c.id+'" data-kind="'+c.kind+'">'+avatar(c.other||{display_name:c.title})+'<span class="msg-thread-copy"><b>'+esc(conversationTitle(c))+(c.kind==="group"?' <i>GROUP</i>':'')+'</b><small>'+esc(c.last_message?.body|| (c.kind==="group"?"Group conversation":"Start a conversation"))+'</small></span><span class="msg-thread-meta">'+(unread(c)?'<i class="msg-unread"></i>':'')+'<small>'+stamp(c.last_message?.created_at||c.updated_at)+'</small></span></button>').join(""):'<div class="msg-empty">No conversations yet. Start a new message or create a group.</div>';
 $("#conversation-list").querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>openConversation(b.dataset.kind,b.dataset.id));
 $("#msg-total-unread").textContent=allConversations.filter(unread).length;
}

async function openConversation(kind,id){
 if(channel){await supabase.removeChannel(channel);channel=null;}
 current=allConversations.find(c=>c.id===id&&c.kind===kind)||{id,kind};
 renderList(); $("#message-pane").innerHTML='<div class="msg-loading">Opening conversation…</div>';
 let members=[], other=null;
 if(kind==="direct"){
  const {data,error}=await supabase.from("crowspace_direct_members").select("user_id,last_read_at").eq("conversation_id",id);
  if(error)throw error;members=data||[];
  const otherId=members.find(m=>m.user_id!==currentUser.id)?.user_id;
  const {data:p}=await supabase.from("crowspace_profiles").select("user_id,username,display_name,avatar_url").eq("user_id",otherId).maybeSingle();other=p;
 }else{
  const {data,error}=await supabase.from("crowspace_group_members").select("user_id,role,last_read_at").eq("group_id",id);
  if(error)throw error;members=data||[];
  const ids=members.map(m=>m.user_id);
  const {data:ps}=ids.length?await supabase.from("crowspace_profiles").select("user_id,username,display_name,avatar_url").in("user_id",ids):{data:[]};
  members=members.map(m=>({...m,profile:(ps||[]).find(p=>p.user_id===m.user_id)}));
 }
 current={...current,kind,other,members};
 const table=kind==="direct"?"crowspace_direct_messages":"crowspace_group_messages", fk=kind==="direct"?"conversation_id":"group_id";
 const {data:messages,error}=await supabase.from(table).select("*").eq(fk,id).order("created_at",{ascending:true}).limit(100);
 if(error)throw error;
 await renderPane(messages||[]);
 await markRead();
 await subscribeConversation();
 renderList();
}

async function renderPane(messages){
 const title=current.kind==="direct"?cleanName(current.other):current.title;
 const otherId=current.kind==="direct"?current.members.find(m=>m.user_id!==currentUser.id)?.user_id:null;
 const blocked=otherId?await supabase.from("crowspace_direct_blocks").select("blocked_user_id").eq("blocker_id",currentUser.id).eq("blocked_user_id",otherId).maybeSingle():{data:null};
 const isBlocked=!!blocked.data;
 $("#message-pane").innerHTML='<header class="msg-chat-head">'+avatar(current.other||{display_name:current.title})+'<div><b>'+esc(title)+'</b><small>'+ (current.kind==="group"?current.members.length+" members · "+esc(current.role||"member"):onlineUsers.has(otherId)?"Online":"Direct conversation")+'</small></div><div class="msg-chat-actions"><button id="msg-search-toggle" title="Search messages">⌕</button>'+(current.kind==="direct"?'<button id="msg-block" title="Block member">'+(isBlocked?"Unblock":"Block")+'</button><button id="msg-report" title="Report conversation">⚑</button>':'<button id="msg-members" title="Manage group members">♧</button>')+'</div></header><div class="msg-searchbar hidden"><input id="thread-search" placeholder="Search this conversation…"></div><div class="msg-presence" id="msg-typing"></div><div class="msg-history" id="msg-history">'+messages.map(m=>messageHTML(m)).join("")+'</div><div class="msg-compose"><div class="msg-attach-row"><label class="msg-file-btn">＋ Attach<input id="msg-file" type="file" accept="image/*,video/mp4,video/webm,audio/*,application/pdf,text/plain" hidden></label><button id="msg-record" type="button">◉ Voice note</button><span id="record-state"></span></div><form id="msg-send-form"><textarea id="msg-input" rows="1" maxlength="5000" placeholder="Write a message…" '+(isBlocked?'disabled':'')+'></textarea><button class="btn red-btn" '+(isBlocked?'disabled':'')+'>Send ↑</button></form><div id="msg-status" class="msg-status"></div></div>';
 const hist=$("#msg-history");hist.scrollTop=hist.scrollHeight;await hydrateAttachments(messages);
 $("#msg-search-toggle").onclick=()=>{$(".msg-searchbar").classList.toggle("hidden");$("#thread-search")?.focus();};
 $("#thread-search")?.addEventListener("input",e=>{const q=e.target.value.toLowerCase();hist.querySelectorAll(".msg-bubble").forEach(el=>el.classList.toggle("hidden",!el.textContent.toLowerCase().includes(q)));});
 $("#msg-send-form").onsubmit=sendMessage;
 $("#msg-input").addEventListener("input",sendTyping);
 $("#msg-file").onchange=uploadAttachment;
 $("#msg-record").onclick=toggleRecording;
 if(current.kind==="direct"){
  $("#msg-block").onclick=()=>toggleBlock(otherId,isBlocked);
  $("#msg-report").onclick=reportConversation;
 }else $("#msg-members").onclick=manageGroup;
 hist.querySelectorAll("[data-report]").forEach(b=>b.onclick=()=>reportMessage(b.dataset.report));
}

function messageHTML(m){
 const mine=m.sender_id===currentUser.id, body=m.deleted_at?"This message was deleted":m.body;
 return '<article class="msg-line '+(mine?'mine':'')+'"><div class="msg-bubble" data-message="'+m.id+'"><p>'+esc(body)+'</p><footer>'+stamp(m.created_at)+(m.edited_at?' · edited':'')+(mine?' · Sent':'')+'</footer>'+(mine?'':'<button class="msg-report-inline" data-report="'+m.id+'" title="Report message">⚑</button>')+'</div></article>';
}

async function hydrateAttachments(messages){
 const ids=messages.map(m=>m.id).filter(Boolean);if(!ids.length)return;
 const table=current.kind==="direct"?"crowspace_direct_attachments":"crowspace_group_message_attachments";
 const {data}=await supabase.from(table).select("message_id,object_path,file_name,mime_type").in("message_id",ids);
 for(const a of data||[]){
  const {data:signed}=await supabase.storage.from("crowspace-messenger").createSignedUrl(a.object_path,3600);
  if(!signed?.signedUrl)continue;
  const bubble=document.querySelector('[data-message="'+a.message_id+'"]');if(!bubble)continue;
  const p=bubble.querySelector("p");if(!p)continue;
  const u=esc(signed.signedUrl),name=esc(a.file_name);
  let html=a.mime_type.startsWith("image/")?'<img src="'+u+'" alt="'+name+'">':a.mime_type.startsWith("audio/")?'<audio controls src="'+u+'"></audio>':a.mime_type.startsWith("video/")?'<video controls src="'+u+'"></video>':'<a href="'+u+'" target="_blank" rel="noopener">↧ '+name+'</a>';
  p.innerHTML=html;
 }
}

async function markRead(){
 const now=new Date().toISOString();
 const table=current.kind==="direct"?"crowspace_direct_members":"crowspace_group_members", key=current.kind==="direct"?"conversation_id":"group_id";
 await supabase.from(table).update({last_read_at:now}).eq(key,current.id).eq("user_id",currentUser.id);
 const n=allConversations.find(c=>c.id===current.id&&c.kind===current.kind);if(n)n.last_read_at=now;
}
async function subscribeConversation(){
 const topic=(current.kind==="direct"?"crowspace-dm:":"crowspace-group:")+current.id;
 await supabase.realtime.setAuth();
 channel=supabase.channel(topic,{config:{private:true,presence:{key:currentUser.id}}});
 const table=current.kind==="direct"?"crowspace_direct_messages":"crowspace_group_messages", fk=current.kind==="direct"?"conversation_id":"group_id";
 channel.on("postgres_changes",{event:"INSERT",schema:"public",table,filter:fk+"=eq."+current.id},payload=>{
  if(payload.new.sender_id!==currentUser.id){const hist=$("#msg-history");if(hist){hist.insertAdjacentHTML("beforeend",messageHTML(payload.new));hist.scrollTop=hist.scrollHeight;markRead();}}
  loadConversations().catch(()=>{});
 }).on("postgres_changes",{event:"INSERT",schema:"public",table:current.kind==="direct"?"crowspace_direct_attachments":"crowspace_group_message_attachments",filter:(current.kind==="direct"?"conversation_id":"group_id")+"=eq."+current.id},payload=>{hydrateAttachments([{id:payload.new.message_id}]);}).on("broadcast",{event:"typing"},({payload})=>{
  if(payload.user_id!==currentUser.id){$("#msg-typing").textContent=(payload.name||"Someone")+" is typing…";clearTimeout(typingStop);typingStop=setTimeout(()=>$("#msg-typing").textContent="",2200);}
 }).on("presence",{event:"sync"},()=>{
  const state=channel.presenceState();onlineUsers=new Set(Object.values(state).flat().map(x=>x.user_id));
  const subtitle=$(".msg-chat-head small");if(current.kind==="direct"&&subtitle)subtitle.textContent=onlineUsers.has(current.members.find(m=>m.user_id!==currentUser.id)?.user_id)?"Online":"Direct conversation";
 }).subscribe(async status=>{if(status==="SUBSCRIBED"){await channel.track({user_id:currentUser.id,name:currentProfile.display_name,online_at:new Date().toISOString()});}});
}
async function sendTyping(){
 if(!channel)return;
 channel.send({type:"broadcast",event:"typing",payload:{user_id:currentUser.id,name:currentProfile.display_name}});
}
async function sendMessage(e){
 e.preventDefault();const input=$("#msg-input"),body=input.value.trim();if(!body)return;
 const table=current.kind==="direct"?"crowspace_direct_messages":"crowspace_group_messages";
 const row=current.kind==="direct"?{conversation_id:current.id,sender_id:currentUser.id,body,message_type:"text"}:{group_id:current.id,sender_id:currentUser.id,body};
 const btn=$("#msg-send-form button");btn.disabled=true;
 const {data,error}=await supabase.from(table).insert(row).select("*").single();
 btn.disabled=false;if(error){note(error.message,"error");return;}
 $("#msg-history").insertAdjacentHTML("beforeend",messageHTML(data));$("#msg-history").scrollTop=$("#msg-history").scrollHeight;input.value="";note("");
 await markRead();await loadConversations();
}
async function uploadAttachment(e){
 const file=e.target.files?.[0];if(!file)return;
 if(file.size>12*1024*1024){note("Files must be 12 MB or smaller.","error");e.target.value="";return;}
 const kind=file.type.startsWith("audio/")?"audio":file.type.startsWith("image/")?"image":file.type.startsWith("video/")?"video":"file";
 await sendMedia(file,kind);e.target.value="";
}
async function sendMedia(file,kind){
 note("Uploading securely…");
 const path=(current.kind==="direct"?"dm/":"group/")+current.id+"/"+currentUser.id+"/"+crypto.randomUUID()+"-"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
 const {error:upErr}=await supabase.storage.from("crowspace-messenger").upload(path,file,{contentType:file.type,upsert:false});
 if(upErr){note(upErr.message,"error");return;}
 const table=current.kind==="direct"?"crowspace_direct_messages":"crowspace_group_messages";
 const fk=current.kind==="direct"?"conversation_id":"group_id";
 const {data:m,error}=await supabase.from(table).insert(current.kind==="direct"?{conversation_id:current.id,sender_id:currentUser.id,body:file.name,message_type:kind}:{group_id:current.id,sender_id:currentUser.id,body:"["+kind+"] "+file.name}).select("*").single();
 if(error){await supabase.storage.from("crowspace-messenger").remove([path]);note(error.message,"error");return;}
 const meta=current.kind==="direct"?"crowspace_direct_attachments":"crowspace_group_message_attachments";
 const row=current.kind==="direct"?{message_id:m.id,conversation_id:current.id,uploaded_by:currentUser.id,object_path:path,file_name:file.name,mime_type:file.type,size_bytes:file.size}:{message_id:m.id,group_id:current.id,uploaded_by:currentUser.id,object_path:path,file_name:file.name,mime_type:file.type,size_bytes:file.size};
 const {error:metaErr}=await supabase.from(meta).insert(row);
 if(metaErr){note("Message sent, but attachment details could not be saved: "+metaErr.message,"error");return;}
 const {data:signed}=await supabase.storage.from("crowspace-messenger").createSignedUrl(path,3600);
 $("#msg-history").insertAdjacentHTML("beforeend",mediaHTML(m,file,kind,signed?.signedUrl));$("#msg-history").scrollTop=$("#msg-history").scrollHeight;note("Attachment sent.","success");await loadConversations();
}
function mediaHTML(m,file,kind,url){
 let media=kind==="image"?'<img src="'+esc(url)+'" alt="'+esc(file.name)+'">':kind==="audio"?'<audio controls src="'+esc(url)+'"></audio>':kind==="video"?'<video controls src="'+esc(url)+'"></video>':'<a href="'+esc(url)+'" target="_blank" rel="noopener">↧ '+esc(file.name)+'</a>';
 return '<article class="msg-line mine"><div class="msg-bubble msg-media">'+media+'<footer>'+stamp(m.created_at)+'</footer></div></article>';
}
async function toggleRecording(){
 const btn=$("#msg-record");
 if(recorder?.state==="recording"){recorder.stop();btn.textContent="◉ Voice note";return;}
 if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){note("Voice recording is not supported in this browser.","error");return;}
 try{
  const stream=await navigator.mediaDevices.getUserMedia({audio:true});
  const type=["audio/webm;codecs=opus","audio/ogg;codecs=opus","audio/mp4"].find(t=>MediaRecorder.isTypeSupported(t));
  recorder=new MediaRecorder(stream,type?{mimeType:type}:undefined);recordChunks=[];
  recorder.ondataavailable=e=>{if(e.data.size)recordChunks.push(e.data);};
  recorder.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(recordChunks,{type:recorder.mimeType||"audio/webm"});const ext=blob.type.includes("ogg")?"ogg":blob.type.includes("mp4")?"m4a":"webm";await sendMedia(new File([blob],"voice-note-"+Date.now()+"."+ext,{type:blob.type}),"audio");$("#record-state").textContent="";};
  recorder.start();btn.textContent="■ Stop recording";$("#record-state").textContent="Recording…";
 }catch(err){note("Microphone access was not granted: "+err.message,"error");}
}
async function toggleBlock(otherId,isBlocked){
 if(!confirm(isBlocked?"Unblock this member?":"Block this member? They will no longer be able to message you."))return;
 const q=isBlocked?supabase.from("crowspace_direct_blocks").delete().eq("blocker_id",currentUser.id).eq("blocked_user_id",otherId):supabase.from("crowspace_direct_blocks").insert({blocker_id:currentUser.id,blocked_user_id:otherId});
 const {error}=await q;if(error){note(error.message,"error");return;}await renderPane(await loadMessages());note(isBlocked?"Member unblocked.":"Member blocked.","success");
}
async function loadMessages(){const table=current.kind==="direct"?"crowspace_direct_messages":"crowspace_group_messages",fk=current.kind==="direct"?"conversation_id":"group_id";const{data,error}=await supabase.from(table).select("*").eq(fk,current.id).order("created_at",{ascending:true}).limit(100);if(error)throw error;return data||[];}
async function reportConversation(){
 const reason=prompt("Why are you reporting this conversation? (harassment, spam, threats, inappropriate, other)","other");if(!reason)return;
 const valid=["harassment","spam","threats","inappropriate","other"].includes(reason.toLowerCase())?reason.toLowerCase():"other";
 const other=current.members.find(m=>m.user_id!==currentUser.id)?.user_id;
 const {error}=await supabase.from("crowspace_direct_reports").insert({conversation_id:current.id,reporter_id:currentUser.id,reported_user_id:other,reason:valid});
 note(error?error.message:"Report submitted for review.",error?"error":"success");
}
async function reportMessage(messageId){
 const m=await supabase.from("crowspace_direct_messages").select("sender_id").eq("id",messageId).maybeSingle();if(!m.data||m.data.sender_id===currentUser.id)return;
 const reason=prompt("Reason for reporting this message (harassment, spam, threats, inappropriate, other)","other");if(!reason)return;
 const valid=["harassment","spam","threats","inappropriate","other"].includes(reason.toLowerCase())?reason.toLowerCase():"other";
 const {error}=await supabase.from("crowspace_direct_reports").insert({conversation_id:current.id,message_id:messageId,reporter_id:currentUser.id,reported_user_id:m.data.sender_id,reason:valid});
 note(error?error.message:"Message reported.",error?"error":"success");
}
async function newMessage(){
 const username=prompt("Enter the member's CrowSpace username (without @):");if(!username?.trim())return;
 const {data:p,error}=await supabase.from("crowspace_profiles").select("user_id,username,display_name").ilike("username",username.trim().replace(/^@/,"")).maybeSingle();
 if(error||!p){note(error?.message||"Member not found.","error");return;}
 const {data:id,error:rpcErr}=await supabase.rpc("crowspace_start_direct_conversation",{p_other_user:p.user_id});
 if(rpcErr){note(rpcErr.message,"error");return;}
 await loadConversations();openConversation("direct",id);
}
async function createGroup(){
 const title=prompt("Name your group conversation:");if(!title?.trim())return;
 const {data:g,error}=await supabase.from("crowspace_group_conversations").insert({title:title.trim().slice(0,100),created_by:currentUser.id}).select("*").single();
 if(error){note(error.message,"error");return;}
 const {error:memberErr}=await supabase.from("crowspace_group_members").insert({group_id:g.id,user_id:currentUser.id,role:"owner"});
 if(memberErr){note("Group created but owner membership failed: "+memberErr.message,"error");return;}
 await loadConversations();openConversation("group",g.id);
}
async function manageGroup(){
 if(!current||current.kind!=="group")return;
 const action=prompt("Group members: enter a username to add, 'list' to view members, or 'promote @name', 'demote @name', 'remove @name'.");if(!action)return;
 if(action.toLowerCase()==="list"){alert(current.members.map(m=>(m.profile?.display_name||m.user_id)+" — "+m.role).join("\n"));return;}
 const match=action.match(/^(promote|demote|remove)\s+@?(.+)$/i);
 if(match){
  const verb=match[1].toLowerCase(),name=match[2].trim();
  const {data:p}=await supabase.from("crowspace_profiles").select("user_id").ilike("username",name).maybeSingle();
  if(!p){note("Member not found.","error");return;}
  const {error}=await supabase.rpc("crowspace_group_manage_member",{p_group_id:current.id,p_user_id:p.user_id,p_action:verb==="promote"?"promote_admin":verb==="demote"?"demote_member":"remove"});
  note(error?error.message:"Group membership updated.",error?"error":"success");
 }else{
  const {data:p}=await supabase.from("crowspace_profiles").select("user_id").ilike("username",action.replace(/^@/,"")).maybeSingle();
  if(!p){note("Member not found.","error");return;}
  const {error}=await supabase.from("crowspace_group_members").insert({group_id:current.id,user_id:p.user_id,role:"member"});
  note(error?error.message:"Member added to group.",error?"error":"success");
 }
 await openConversation("group",current.id);
}
export async function initMessenger({user,profile,container}){
 currentUser=user;currentProfile=profile;
 container.innerHTML='<section class="messenger-app"><aside class="msg-sidebar"><div class="msg-sidebar-head"><div><div class="eyebrow">CROWSPACE MESSENGER</div><h2>Messages <span id="msg-total-unread">0</span></h2></div><div class="msg-new-actions"><button id="msg-new" title="New message">＋</button><button id="msg-group-new" title="New group">▦</button></div></div><input id="conversation-search" class="msg-list-search" placeholder="Search conversations…"><div id="conversation-list" class="msg-thread-list"><div class="msg-loading">Loading conversations…</div></div></aside><section id="message-pane" class="msg-pane"><div class="msg-welcome"><div class="msg-welcome-icon">✉</div><div class="eyebrow">YOUR PRIVATE SPACE</div><h2>Conversations that connect.</h2><p>Choose a conversation or start a new one with someone in CrowSpace.</p><button class="btn red-btn" id="msg-start-first">Start a conversation →</button></div></section></section>';
 $("#msg-new").onclick=newMessage;$("#msg-group-new").onclick=createGroup;$("#msg-start-first").onclick=newMessage;
 $("#conversation-search").addEventListener("input",renderList);
 await loadConversations();
 const params=new URLSearchParams(location.search),peer=params.get("member"),conversationId=params.get("conversation");
 if(conversationId){await loadConversations();if(allConversations.some(c=>c.id===conversationId&&c.kind==="direct"))await openConversation("direct",conversationId);}
 if(peer){const {data:p}=await supabase.from("crowspace_profiles").select("user_id").ilike("username",peer.replace(/^@/,"")).maybeSingle();if(p){const {data:id,error}=await supabase.rpc("crowspace_start_direct_conversation",{p_other_user:p.user_id});if(!error){await loadConversations();await openConversation("direct",id);}}}
 const notice=supabase.channel("crowspace-messenger-notifications-"+user.id).on("postgres_changes",{event:"INSERT",schema:"public",table:"crowspace_notifications",filter:"recipient_id=eq."+user.id},()=>loadConversations().catch(()=>{})).subscribe();
 window.addEventListener("pagehide",()=>{supabase.removeChannel(notice);if(channel)supabase.removeChannel(channel);},{once:true});
}
