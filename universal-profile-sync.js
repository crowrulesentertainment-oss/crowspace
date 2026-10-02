/* CrowRules Universal Profile Sync
 * Shared by CrowSpace + CrowRules Podcasting.
 * Browser-safe: uses the already-authenticated Supabase client only.
 */
(function(){
"use strict";
function cleanUrl(v){
  const s=String(v||"").trim(); if(!s)return null;
  try{const u=new URL(/^https?:\/\//i.test(s)?s:"https://"+s);return /^(https?):$/.test(u.protocol)?u.href:null}catch(_){return null}
}
function cleanUsername(v){
  return String(v||"").trim().toLowerCase().replace(/[^a-z0-9_.-]/g,"").slice(0,40);
}
function cleanSocial(v){
  if(!v)return {};
  if(typeof v==="string"){try{v=JSON.parse(v)}catch(_){return {}}}
  if(!v||typeof v!=="object"||Array.isArray(v))return {};
  const out={};
  Object.keys(v).slice(0,40).forEach(function(k){
    const label=String(k||"").trim().slice(0,40),url=cleanUrl(v[k]);
    if(label&&url)out[label]=url;
  });
  return out;
}
async function updateOrInsert(db,table,uid,patch,defaults){
  let r=await db.from(table).update(patch).eq("user_id",uid).select("*").maybeSingle();
  if(r.error)throw r.error;
  if(r.data)return r.data;
  const row=Object.assign({user_id:uid},defaults||{},patch);
  r=await db.from(table).insert(row).select("*").single();
  if(r.error)throw r.error;
  return r.data;
}
async function save(db,uid,input){
  if(!db||!uid)throw new Error("Authenticated CrowRules account is required.");
  const now=new Date().toISOString();
  const username=cleanUsername(input.username);
  const displayName=String(input.display_name||"").trim().slice(0,80)||null;
  const bio=String(input.bio||"").trim().slice(0,1600);
  const tagline=String(input.tagline||"").trim().slice(0,180)||null;
  const avatar=cleanUrl(input.avatar_url);
  const banner=cleanUrl(input.banner_url);
  const social=cleanSocial(input.social_links);
  const portfolio=cleanUrl(input.portfolio_url);
  const csPatch={
    display_name:displayName,
    username:username||null,
    bio:bio||"",
    avatar_url:avatar,
    banner_url:banner,
    portfolio_tagline:tagline||"",
    portfolio_bio:bio||"",
    social_links:social,
    updated_at:now
  };
  const pmPatch={
    display_name:displayName,
    username:username||null,
    bio:bio||"",
    avatar_url:avatar,
    cover_url:banner,
    tagline:tagline,
    social_links:social,
    ...(portfolio?{website_url:portfolio}:{}),
    updated_at:now
  };
  const memberPatch={display_name:displayName,username:username||null,bio:bio||"",avatar_url:avatar,updated_at:now};
  const [cs,pm]=await Promise.all([
    updateOrInsert(db,"crowspace_profiles",uid,csPatch,{
      social_links:{},creator_category:"",profile_theme:"cinematic",
      profile_sections:{},portfolio_tagline:"",portfolio_bio:"",
      portfolio_work_title:"",portfolio_collections_title:"",
      portfolio_sections_visible:{},portfolio_hero_media_mode:"image",
      portfolio_hero_autoplay:false,portfolio_hero_loop:true,
      portfolio_hero_mobile_fallback:"",portfolio_hero_media_source:"",
      portfolio_hero_media_url:"",portfolio_hero_media_path:"",
      privacy_profile:"public",privacy_posts:"public",privacy_media:"public",
      privacy_activity:"public",privacy_connections:"public",privacy_guestbook:"public",
      privacy_messages:"members",allow_guestbook:true,is_verified:false
    }),
    updateOrInsert(db,"podcast_member_profiles",uid,pmPatch,{
      is_public:true,activity_public:true,network_public:true,
      followers_public:true,following_public:true,social_links:{}
    })
  ]);
  let member=null;
  const mr=await db.from("members").update(memberPatch).eq("user_id",uid).select("*").maybeSingle();
  if(!mr.error)member=mr.data;
  return {crowspace:cs,podcasting:pm,members:member};
}
window.CrowRulesUniversalProfile={save:save,cleanUrl:cleanUrl,cleanUsername:cleanUsername,cleanSocial:cleanSocial};
})();