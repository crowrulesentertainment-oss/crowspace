/* CrowSpace 21.3 — Recommendation Feedback Loop */
window.CrowSpaceFeedback21_3={
 version:"21.3",
 async record(db,user,type,id,action,metadata={}){
  if(!db||!user||!id)return {error:new Error("Missing recommendation identity")};
  const allowed=["like","save","follow","more_like_this","not_interested","hide"];
  if(!allowed.includes(action))return {error:new Error("Unsupported feedback action")};
  const map={not_interested:"not_interested",hide:"hide",save:"save",follow:"follow",like:"like",more_like_this:"more_like_this"};
  const event=await db.from("crowspace_recommendation_events").insert({user_id:user.id,item_type:type,item_id:String(id),action:map[action]});
  const feedback=await db.from("crowspace_recommendation_feedback").insert({user_id:user.id,target_type:type,target_id:String(id),feedback_type:map[action],metadata});
  return {event,feedback};
 },
 async state(db,user,type,id){
  if(!db||!user||!id)return [];
  const [e,f]=await Promise.all([
   db.from("crowspace_recommendation_events").select("action,created_at").eq("user_id",user.id).eq("item_type",type).eq("item_id",String(id)).order("created_at",{ascending:false}).limit(20),
   db.from("crowspace_recommendation_feedback").select("feedback_type,created_at").eq("user_id",user.id).eq("target_type",type).eq("target_id",String(id)).order("created_at",{ascending:false}).limit(20)
  ]);
  return {events:e.data||[],feedback:f.data||[]};
 },
 async like(db,user,type,id){return this.record(db,user,type,id,"like")},
 async save(db,user,type,id){return this.record(db,user,type,id,"save")},
 async follow(db,user,type,id){return this.record(db,user,type,id,"follow")},
 async moreLikeThis(db,user,type,id){return this.record(db,user,type,id,"more_like_this")},
 async notInterested(db,user,type,id){return this.record(db,user,type,id,"not_interested")},
 async hide(db,user,type,id){return this.record(db,user,type,id,"hide")}
};