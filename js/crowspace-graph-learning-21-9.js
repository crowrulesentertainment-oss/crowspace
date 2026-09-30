/* CrowSpace 21.9 — Graph Learning & Cold-Start Intelligence */
window.CrowSpaceGraphLearning21_9=(()=>{
 const version="21.9", clamp=(n,min,max)=>Math.max(min,Math.min(max,n)), key=(t,id)=>String(t)+":"+String(id);
 async function context(db,user){
  const [base,paths,affinity,trends,edges,profiles]=await Promise.all([
   window.CrowSpacePersistentGraph21_8?.context(db,user) || Promise.resolve({followed:[],events:[],feedback:[],paths:[],affinity:[]}),
   db.from("crowspace_recommendation_paths").select("source_type,source_id,target_type,target_id,relation,weight,evidence_count,last_seen_at").eq("user_id",user.id).limit(1000),
   db.from("crowspace_recommendation_affinity").select("source_type,source_id,target_type,target_id,follower_discovery_count,interaction_count,last_seen_at").limit(1000),
   db.from("crowspace_recommendation_trends").select("source_type,source_id,target_type,target_id,discovery_count,interaction_count,trend_score,last_seen_at").order("trend_score",{ascending:false}).limit(500),
   db.from("crowspace_content_graph_edges").select("source_type,source_id,relation,target_type,target_id").limit(1500),
   db.from("crowspace_profiles").select("user_id,creator_category").limit(1000)
  ]);
  return {...base,paths:paths.data||[],affinity:affinity.data||[],trends:trends.data||[],edges:edges.data||[],profiles:profiles.data||[]};
 }
 function rank(ctx){
  const map=new Map(), add=(t,id,s,r)=>{if(!id)return;const k=key(t,id),old=map.get(k);if(old){old.score+=s;old.reasons=[...new Set([...old.reasons,r])].slice(0,3)}else map.set(k,{type:t,id:String(id),score:s,reasons:[r]})};
  const blocked=new Set((ctx.feedback||[]).filter(x=>["hidden","not_interested"].includes(x.feedback_type)).map(x=>key(x.target_type,x.target_id)));
  (ctx.paths||[]).forEach(p=>{if(!blocked.has(key(p.target_type,p.target_id)))add(p.target_type,p.target_id,clamp(Number(p.weight||1)+Number(p.evidence_count||1)*2,0,24),"matched your discovery history")});
  (ctx.affinity||[]).forEach(a=>{if(!blocked.has(key(a.target_type,a.target_id)))add(a.target_type,a.target_id,clamp(Number(a.follower_discovery_count||0)*1.5+Number(a.interaction_count||0)*4,0,24),"strong creator-network affinity")});
  (ctx.trends||[]).forEach(t=>{if(!blocked.has(key(t.target_type,t.target_id)))add(t.target_type,t.target_id,clamp(Number(t.trend_score||0),0,16),"trending across connected CrowSpace networks")});
  (ctx.edges||[]).filter(e=>["caw","event","group","circle","post","project","media_album","creator"].includes(e.target_type)).forEach(e=>{if(!blocked.has(key(e.target_type,e.target_id)))add(e.target_type,e.target_id,2,"connected to the CrowRules universe")});
  const followed=new Set(ctx.followed||[]);
  ctx.profiles.forEach(p=>{const cat=p.creator_category;if(!cat||followed.has(String(p.user_id)))return;const matched=ctx.profiles.filter(q=>q.creator_category===cat&&followed.has(String(q.user_id))).length;if(matched&&!blocked.has(key("creator",p.user_id)))add("creator",p.user_id,Math.min(12,matched*4),"similar creator category to someone you follow")});
  return [...map.values()].sort((a,b)=>b.score-a.score);
 }
 async function recommend(db,user,limit=100){return rank(await context(db,user)).slice(0,limit)}
 return {version,context,recommend,rank};
})();