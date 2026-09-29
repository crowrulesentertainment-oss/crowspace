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
 window.CrowSpaceAuth.signOut=()=>db.auth.signOut();
 db.auth.onAuthStateChange((_event,session)=>{window.CrowSpaceAuth.user=session?.user||null;window.dispatchEvent(new CustomEvent("crowspace-auth",{detail:{user:window.CrowSpaceAuth.user}}));});
 window.dispatchEvent(new CustomEvent("crowspace-auth-ready",{detail:{user:window.CrowSpaceAuth.user}}));
}).catch(e=>{console.error("[CrowSpace Auth]",e);window.dispatchEvent(new CustomEvent("crowspace-auth-error",{detail:e}))});
})();