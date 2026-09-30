/* CrowSpace 21.9 — Graph Learning & Cold-Start Intelligence */
window.CrowSpaceGraphLearning21_9=(()=>{
 const version="21.9";
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const key=(t,id)=>String(t)+":"+String(id);
 async function context(db,user){
  const [base,paths,affinity,edges,profiles]=await Promise.all([
   window.CrowSpacePersistentGraph21_8.context(db,user),
   db.from("crowspace_recommendation_paths").select("source_type,source_id,target_type,target_id,relation,weight,evidence_count,last_seen_at").eq("user_id",user.id).limit(1000),
   db.from("crowspace_recommendation_affinity").select("source_type,source_id,target_type,target_id,follower_discovery_count,interaction_count,last_seen_at").limit(1000),
   db.from("crowspace_content_graph_edges").select("source_type,source_id,relation,target_type,target_id").limit(1500),
   db.from("crowspace_profiles").select("user_id,creator_category").limit(1000)
  ]);
  return {...base,paths:paths.data||[],affinity:affinity.data||[],edges:edges.data||[],profiles:profiles.data||[]};
 }
 function coldStart(ctx){
  const score=new Map(), reasons=new Map(), add=(t,id,s,r)=>{
   const k=key(t,id); score.set(k,(score.get(k)||0)+s); if(!reasons.has(k))reasons.set(k,new Set());reasons.get(k).add(r);
  };
  (ctx.affinity||[]).forEach(a=>{
   const s=clamp(Math.log1p(Number(a.follower_discovery_count||0))*4+Number(a.interaction_count||0)*2,0,18);
   if(s)add(a.target_type,a.target_id,s,"discovered across CrowSpace creator networks");
  });
  (ctx.edges||[]).filter(e=>e.target_type!=="property").forEach(e=>{
   if(["caw","event","group","circle","post","project","media_album","creator"].includes(e.target_type))
    add(e.target_type,e.target_id,2,"connected to the CrowRules universe");
  });
  return [...score.entries()].map(([k,score])=>{const [type,id]=k.split(":");return{type,id,score,reasons:[...reasons.get(k)]}});
 }
 function learned(ctx){
  const score=new Map(), reasons=new Map(), add=(t,id,s,r)=>{
   const k=key(t,id);score.set(k,(score.get(k)||0)+s);if(!reasons.has(k))reasons.set(k,new Set());reasons.get(k).add(r);
  };
  (ctx.paths||[]).forEach(p=>add(p.target_type,p.target_id,clamp(Number(p.weight||1)+Number(p.evidence_count||1)*2,0,24),"matched your persistent discovery history"));
  (ctx.affinity||[]).forEach(a=>add(a.target_type,a.target_id,clamp(Number(a.follower_discovery_count||0)*1.5+Number(a.interaction_count||0)*4,0,24),"strong creator-network affinity"));
  return [...score.entries()].map(([k,score])=>{const [type,id]=k.split(":");return{type,id,score,reasons:[...reasons.get(k)]}});
 }
 async function recommend(db,user,limit=100){
  const ctx=await context(db,user);
  const blocked=new Set((ctx.feedback||[]).filter(x=>["hidden","not_interested"].includes(x.feedback_type)).map(x=>key(x.target_type,x.target_id)));
  const candidates=[...learned(ctx),...coldStart(ctx)],map=new Map();
  candidates.forEach(x=>{if(blocked.has(key(x.type,x.id)))return;const k=key(x.type,x.id),old=map.get(k);map.set(k,old?{...old,score:old.score+x.score,reasons:[...new Set([...old.reasons,...x.reasons])].slice(0,3)}:x)});
  const followed=new Set(ctx.followed||[]);
  ctx.profiles.forEach(p=>{if(followed.has(String(p.user_id)))return;const cat=p.creator_category;if(!cat)return;const matched=ctx.profiles.filter(q=>q.creator_category===cat&&followed.has(String(q.user_id))).length;if(matched)addCreator(map,p.user_id,Math.min(12,matched*4),"similar creator category to someone you follow")});
  return [...map.values()].sort((a,b)=>b.score-a.score).slice(0,limit);
 }
 function addCreator(map,id,score,reason){
  const k=key("creator",id),old=map.get(k);if(old) {old.score+=score;old.reasons=[...new Set([...old.reasons,reason])].slice(0,3)} else map.set(k,{type:"creator",id:String(id),score,reasons:[reason]});
 }
 return {version,context,recommend,coldStart,learned};
})();