/* CrowSpace 21.0 — Graph-Powered Discovery */
window.CrowSpaceGraph21={
 version:"21.0",
 async related(db,type,id,limit=24){
  const r=await db.from("crowspace_content_graph_edges").select("relation,target_type,target_id").eq("source_type",type).eq("source_id",String(id)).limit(limit);
  return r.error?[]:(r.data||[]);
 },
 async incoming(db,type,id,limit=24){
  const r=await db.from("crowspace_content_graph_edges").select("relation,source_type,source_id").eq("target_type",type).eq("target_id",String(id)).limit(limit);
  return r.error?[]:(r.data||[]);
 },
 async moreLikeThis(db,type,id,limit=12){
  const direct=await this.related(db,type,id,40);
  const targets=direct.map(e=>e.target_id);
  if(!targets.length)return [];
  const r=await db.from("crowspace_content_graph_edges").select("source_type,source_id,relation,target_type,target_id").in("target_id",targets).neq("source_id",String(id)).limit(100);
  if(r.error)return [];
  const score={}; (r.data||[]).forEach(e=>{const k=e.source_type+":"+e.source_id;score[k]=(score[k]||0)+1});
  return Object.entries(score).map(([key,s])=>{const [source_type,source_id]=key.split(":");return {source_type,source_id,score:s}}).sort((a,b)=>b.score-a.score).slice(0,limit);
 },
 async creatorsRelatedByCategory(db,userId,limit=12){
  const p=await db.from("crowspace_profiles").select("creator_category").eq("user_id",userId).maybeSingle();
  if(p.error||!p.data?.creator_category)return [];
  const r=await db.from("crowspace_profiles").select("user_id,username,display_name,avatar_url,creator_category").eq("creator_category",p.data.creator_category).neq("user_id",userId).limit(limit);
  return r.error?[]:(r.data||[]);
 },
 async trail(db,type,id,limit=40){
  const edges=await this.related(db,type,id,limit);
  const seen=new Set(),out=[];
  for(const e of edges){const k=e.target_type+":"+e.target_id;if(!seen.has(k)){seen.add(k);out.push(e)}}
  return out;
 },
 async track(db,user,type,id,action="open"){
  if(!db||!user||!id)return null;
  return db.from("crowspace_recommendation_events").insert({user_id:user.id,item_type:type,item_id:String(id),action});
 }
};