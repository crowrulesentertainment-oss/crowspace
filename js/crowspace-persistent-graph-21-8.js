/* CrowSpace 21.8 — Persistent Graph Intelligence */
window.CrowSpacePersistentGraph21_8={
 version:"21.8",
 async context(db,user){
  if(!db||!user)return {followed:[],events:[],feedback:[],paths:[],affinity:[]};
  const [f,e,r,p]=await Promise.all([
   db.from("crowspace_followers").select("following_id").eq("follower_id",user.id).limit(200),
   db.from("crowspace_recommendation_events").select("item_type,item_id,action,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(300),
   db.from("crowspace_recommendation_feedback").select("target_type,target_id,feedback_type,created_at,metadata").eq("user_id",user.id).order("created_at",{ascending:false}).limit(300),
   db.from("crowspace_recommendation_paths").select("source_type,source_id,target_type,target_id,relation,weight,evidence_count,last_seen_at,metadata").eq("user_id",user.id).order("last_seen_at",{ascending:false}).limit(500)
  ]);
  const followed=(f.data||[]).map(x=>String(x.following_id));
  let affinity=[];
  if(followed.length){
   const a=await db.from("crowspace_recommendation_affinity").select("source_type,source_id,target_type,target_id,follower_discovery_count,interaction_count,last_seen_at").eq("source_type","creator").in("source_id",followed).limit(500);
   affinity=a.data||[];
  }
  return {followed,events:e.data||[],feedback:r.data||[],paths:p.data||[],affinity};
 },
 async persist(db,user,sourceType,sourceId,nodes,relation="connected"){
  if(!db||!user||!sourceId||!Array.isArray(nodes)||!nodes.length)return;
  const rows=nodes.filter(x=>x&&x.id&&x.type&&x.type!=="property").map(x=>({
   user_id:user.id,source_type:String(sourceType),source_id:String(sourceId),target_type:String(x.type),target_id:String(x.id),
   relation:String(x.relation||relation),weight:Number(x.score||1),evidence_count:1,last_seen_at:new Date().toISOString(),
   metadata:{depth:x.depth||1}
  }));
  if(rows.length) await db.from("crowspace_recommendation_paths").upsert(rows,{onConflict:"user_id,source_type,source_id,target_type,target_id,relation"});
 },
 async syncFollowed(db,user,creatorIds,expander){
  if(!expander)return [];
  const all=[];
  for(const id of creatorIds||[]){
   const nodes=await expander(db,user,"creator",id,120);
   await this.persist(db,user,"creator",id,nodes,"creator_connection");
   all.push(...nodes);
  }
  return all;
 },
 async recommend(db,user,limit=100){
  const c=await this.context(db,user);
  const blocked=new Set((c.feedback||[]).filter(x=>["hidden","not_interested"].includes(x.feedback_type)).map(x=>x.target_type+":"+x.target_id));
  const scores=new Map(),reasons=new Map();
  const add=(type,id,score,reason)=>{const k=type+":"+id;if(!id||blocked.has(k))return;scores.set(k,(scores.get(k)||0)+Number(score||0));if(!reasons.has(k))reasons.set(k,new Set());reasons.get(k).add(reason)};
  c.paths.forEach(p=>add(p.target_type,p.target_id,Math.min(18,Number(p.weight||1)+Number(p.evidence_count||1)),"saved from your discovery history"));
  c.affinity.forEach(a=>add(a.target_type,a.target_id,Math.min(15,Number(a.follower_discovery_count||0)*1.5+Number(a.interaction_count||0)*3),"discovered by people following the same creator"));
  c.events.forEach(e=>{if(["open","complete","save","follow"].includes(e.action))add(e.item_type,e.item_id,e.action==="save"?7:4,"based on your repeated activity")});
  return [...scores.entries()].map(([k,score])=>{const [type,id]=k.split(":");return{type,id,score,reasons:[...reasons.get(k)].slice(0,3)}}).sort((a,b)=>b.score-a.score).slice(0,limit);
 },
 suppressed(candidates=[],feedback=[]){
  const s=new Set((feedback||[]).filter(x=>["hidden","not_interested"].includes(x.feedback_type)).map(x=>x.target_type+":"+x.target_id));
  return candidates.filter(x=>!s.has(x.type+":"+x.id));
 }
};