(function(){
"use strict";
window.CrowSpaceIdentity={
 async ready(){await window.CrowSpaceAuth?.ready;return window.CrowSpaceAuth?.client},
 async user(){await this.ready();return window.CrowSpaceAuth?.user||null},
 async profile(userId){
   const db=await this.ready(); if(!db) throw new Error("CrowSpace authentication is unavailable.");
   const q=db.from("crowspace_profiles").select("*").eq("user_id",userId).maybeSingle();
   const r=await q; if(r.error) throw r.error; return r.data;
 },
 async byUsername(username){
   const db=await this.ready(); const r=await db.from("crowspace_profiles").select("*").ilike("username",username).maybeSingle();
   if(r.error) throw r.error; return r.data;
 },
 async badges(userId){
   const db=await this.ready(); const r=await db.from("crowspace_user_badges").select("awarded_at,crowspace_badges(name,description,icon,points)").eq("user_id",userId).order("awarded_at",{ascending:false});
   if(r.error) throw r.error; return r.data||[];
 },
 async reputation(userId){
   const db=await this.ready(); const r=await db.from("crowspace_reputation").select("*").eq("user_id",userId).maybeSingle();
   if(r.error) throw r.error; return r.data;
 },
 async counts(userId){
   const db=await this.ready();
   const [p,f,followers]=await Promise.all([
     db.from("crowspace_posts").select("id",{count:"exact",head:true}).eq("user_id",userId),
     db.from("crowspace_follows").select("followed_user_id",{count:"exact",head:true}).eq("follower_id",userId),
     db.from("crowspace_follows").select("follower_id",{count:"exact",head:true}).eq("followed_user_id",userId)
   ]);
   return {posts:p.count||0,following:f.count||0,followers:followers.count||0};
 }
};
})();