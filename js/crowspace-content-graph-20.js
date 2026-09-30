/* CrowSpace 20.0 — Universal Content Graph */
window.CrowSpaceGraph20={
 version:"20.0",
 async related(db,type,id,limit=20){
  const r=await db.from("crowspace_content_graph_edges").select("relation,target_type,target_id").eq("source_type",type).eq("source_id",String(id)).limit(limit);
  return r.data||[];
 },
 async incoming(db,type,id,limit=20){
  const r=await db.from("crowspace_content_graph_edges").select("relation,source_type,source_id").eq("target_type",type).eq("target_id",String(id)).limit(limit);
  return r.data||[];
 },
 async connect(db,user,sourceType,sourceId,relation,targetType,targetId){
  if(!user||!sourceId||!targetId)return {error:new Error("Missing graph identity")};
  return db.from("crowspace_content_graph_edges").insert({source_type:sourceType,source_id:String(sourceId),relation,target_type:targetType,target_id:String(targetId),created_by:user.id});
 },
 async moreLikeThis(db,type,id){
  const edges=await this.related(db,type,id,30);
  const ids=edges.map(e=>e.target_id);
  return {edges,ids};
 },
 async track(db,user,itemType,itemId,action="open"){
  if(window.CrowSpaceSearch&&user)return db.from("crowspace_recommendation_events").insert({user_id:user.id,item_type:itemType,item_id:String(itemId),action});
 }
};