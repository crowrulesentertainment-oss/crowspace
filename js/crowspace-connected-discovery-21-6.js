/* CrowSpace 21.6 — Connected Universe Discovery */
window.CrowSpaceConnectedDiscovery21_6={
 version:"21.6",
 async expand(db,user,seedType,seedId,limit=60){
  if(!db||!user||!seedId)return [];
  const {data:edges,error}=await db.from("crowspace_content_graph_edges").select("source_type,source_id,relation,target_type,target_id").limit(1000);
  if(error)return [];
  const all=edges||[], seen=new Set([String(seedType)+":"+String(seedId)]), out=[], queue=[{type:String(seedType),id:String(seedId),depth:0}];
  while(queue.length&&out.length<limit){
   const n=queue.shift();
   for(const e of all.filter(x=>x.source_type===n.type&&String(x.source_id)===n.id)){
    const k=e.target_type+":"+e.target_id;
    if(seen.has(k))continue;
    seen.add(k);
    const score=Math.max(2,14-(n.depth*3));
    out.push({type:e.target_type,id:String(e.target_id),score,relation:e.relation,depth:n.depth+1,reasons:[n.depth===0?"connected to what you follow or selected":"connected through your discovery path"]});
    if(n.depth<2)queue.push({type:e.target_type,id:String(e.target_id),depth:n.depth+1});
   }
  }
  return out;
 },
 async forFollowedCreator(db,user,creatorIds,limit=100){
  const merged=[];
  for(const id of creatorIds||[]) merged.push(...await this.expand(db,user,"creator",id,limit));
  const map=new Map();
  merged.forEach(x=>{const k=x.type+":"+x.id;const old=map.get(k);map.set(k,old?{...old,score:old.score+x.score,reasons:[...new Set([...old.reasons,...x.reasons])].slice(0,3)}:x)});
  return [...map.values()].sort((a,b)=>b.score-a.score).slice(0,limit);
 }
};