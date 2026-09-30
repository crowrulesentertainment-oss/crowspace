/* CrowSpace 21.2 — Graph Recommendations */
window.CrowSpaceRecommendations21_2={
 version:"21.2",
 async context(db,user){
  if(!db||!user)return {followed:[],events:[],feedback:[]};
  const [f,e,r]=await Promise.all([
   db.from("crowspace_followers").select("following_id").eq("follower_id",user.id).limit(200),
   db.from("crowspace_recommendation_events").select("item_type,item_id,action,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(200),
   db.from("crowspace_recommendation_feedback").select("target_type,target_id,feedback_type,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(200)
  ]);
  return {followed:(f.data||[]).map(x=>String(x.following_id)),events:e.data||[],feedback:r.data||[]};
 },
 async graph(db,userId,limit=300){
  const r=await db.from("crowspace_content_graph_edges").select("source_type,source_id,relation,target_type,target_id").limit(limit);
  return r.error?[]:(r.data||[]);
 },
 async recommend(db,user,limit=8){
  const c=await this.context(db,user),edges=await this.graph(db,user.id);
  const followed=new Set(c.followed),blocked=new Set(c.feedback.filter(x=>["hide","not_interested"].includes(x.feedback_type)).map(x=>x.target_type+":"+x.target_id));
  const sourceBoost={creator:10,project:7,post:6,caw:6,event:6,circle:5,group:5,media:5,portfolio:7};
  const scores=new Map(), reasons=new Map();
  const add=(type,id,score,reason)=>{const k=type+":"+id;if(blocked.has(k))return;scores.set(k,(scores.get(k)||0)+score);if(!reasons.has(k))reasons.set(k,new Set());reasons.get(k).add(reason)};
  followed.forEach(fid=>edges.filter(e=>e.source_type==="creator"&&e.source_id===fid).forEach(e=>add(e.target_type,e.target_id,sourceBoost[e.target_type]||4,"because you follow a connected creator")));
  edges.filter(e=>e.source_type==="creator"&&e.target_type==="creator"&&e.relation==="similar_creator").forEach(e=>{if(followed.has(e.source_id))add("creator",e.target_id,8,"similar to a creator you follow")});
  c.events.slice(0,50).forEach(e=>{if(["open","save","complete","follow"].includes(e.action)){edges.filter(x=>x.source_type===e.item_type&&x.source_id===String(e.item_id)).forEach(x=>add(x.target_type,x.target_id,4,"connected to something you interacted with"))}});
  c.events.slice(0,50).forEach(e=>{if(e.action==="save")add(e.item_type,String(e.item_id),3,"based on your saved activity")});
  return [...scores.entries()].map(([k,score])=>{const [type,id]=k.split(":");return{type,id,score,reasons:[...reasons.get(k)].slice(0,3)}}).sort((a,b)=>b.score-a.score).slice(0,limit);
 },
 async surfaces(db,user){
  const all=await this.recommend(db,user,60), groups={for_you:all,creators:all.filter(x=>x.type==="creator").slice(0,8),projects:all.filter(x=>["project","portfolio"].includes(x.type)).slice(0,8),communities:all.filter(x=>["group","circle"].includes(x.type)).slice(0,8),caws:all.filter(x=>x.type==="caw").slice(0,8),events:all.filter(x=>x.type==="event").slice(0,8),media:all.filter(x=>x.type==="media").slice(0,8)}; return groups;
 }
};