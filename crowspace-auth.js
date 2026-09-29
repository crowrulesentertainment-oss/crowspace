(function(){
"use strict";
const URL="https://cevylpnoexugwgygvtgu.supabase.co";
const KEY="sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-";
function load(){return new Promise((resolve,reject)=>{if(window.supabase){resolve(window.supabase.createClient(URL,KEY,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}}));return}const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";s.onload=()=>resolve(window.supabase.createClient(URL,KEY,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true}}));s.onerror=()=>reject(new Error("Supabase library failed to load"));document.head.appendChild(s)})}
window.CrowSpaceAuth={ready:load()};
window.CrowSpaceAuth.ready.then(async db=>{
 window.CrowSpaceAuth.client=db;
 const {data:{user}}=await db.auth.getUser();
 window.CrowSpaceAuth.user=user||null;
 window.CrowSpaceAuth.refreshUser=async()=>{const r=await db.auth.getUser();window.CrowSpaceAuth.user=r.data.user||null;return window.CrowSpaceAuth.user};
 window.CrowSpaceAuth.ensureProfile=async(u)=>{
  if(!u)return null;
  const existing=await db.from("crowspace_profiles").select("user_id").eq("user_id",u.id).maybeSingle();
  if(existing.data)return existing.data;
  const meta=u.user_metadata||{},raw=meta.display_name||meta.full_name||u.email?.split("@")[0]||"Crow Member";
  const username=(raw.toLowerCase().replace(/[^a-z0-9_]/g,"").slice(0,30)||("crow"+u.id.slice(0,8)));
  const r=await db.from("crowspace_profiles").upsert({user_id:u.id,username,display_name:raw},{onConflict:"user_id"});
  return r.data?.[0]||null;
 };
 window.CrowSpaceAuth.signOut=()=>db.auth.signOut();
 db.auth.onAuthStateChange((_event,session)=>{window.CrowSpaceAuth.user=session?.user||null;window.dispatchEvent(new CustomEvent("crowspace-auth",{detail:{user:window.CrowSpaceAuth.user}}));});
 window.dispatchEvent(new CustomEvent("crowspace-auth-ready",{detail:{user:window.CrowSpaceAuth.user}}));
}).catch(e=>{console.error("[CrowSpace Auth]",e);window.dispatchEvent(new CustomEvent("crowspace-auth-error",{detail:e}))});
})();