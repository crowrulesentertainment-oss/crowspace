/* CrowSpace 21.6 — Connected Universe Discovery */
window.CrowSpaceConnectedDiscovery21_6={
 version:"21.6",
 async load(db){
  const q=async(t,cols)=>{const r=await db.from(t).select(cols).limit(500);return r.error?[]:(r.data||[])};
  const [edges,caws,events,posts,projects,albums,groups,circles]=await Promise.all([
   q("crowspace_content_graph_edges","source_type,source_id,relation,target_type,target_id"),
   q("crowspace_caws","id,user_id"),
   q("crowspace_events","id,created_by"),
   q("crowspace_posts","id,user_id"),
   q("crowspace_creator_projects","id,owner_id"),
   q("crowspace_albums","id,user_id"),
   q("crowspace_groups","id,created_by"),
   q("crowspace_circles","id,created_by")
  ]);
  const out=[...edges];
  const add=(s,si,rel,t,ti)=>out.push({source_type:s,source_id:String(si),relation:rel,target_type:t,target_id:String(ti)});
  caws.forEach(x=>add("creator",x.user_id,"created_caw","caw",x.id));
  events.forEach(x=>add("creator",x.created_by,"created_event","event",x.id));
  posts.forEach(x=>add("creator",x.user_id,"created_post","post",x.id));
  projects.forEach(x=>add("creator",x.owner_id,"created_project","project",x.id));
  albums.forEach(x=>add("creator",x.user_id,"owns_album","media_album",x.id));
  groups.forEach(x=>add("creator",x.created_by,"created_group","group",x.id));
  circles.forEach(x=>add("creator",x.created_by,"created_circle","circle",x.id));
  return out;
 },
 async expand(db,user,seedType,seedId,limit=80){
  if(!db||!user||!seedId)return [];
  const all=await this.load(db),seen=new Set([String(seedType)+":"+String(seedId)]),out=[],queue=[{type:String(seedType),id:String(seedId),depth:0}];
  while(queue.length&&out.length<limit){
   const n=queue.shift();
   for(const e of all){
    if(e.source_type!==n.type||String(e.source_id)!==n.id)continue;
    const k=e.target_type+":"+e.target_id;if(seen.has(k))continue;
    seen.add(k);
    const score=Math.max(2,16-(n.depth*4));
    const reason=n.depth===0?"connected to a creator you follow":"connected through your CrowSpace discovery path";
    out.push({type:e.target_type,id:String(e.target_id),score,relation:e.relation,depth:n.depth+1,reasons:[reason]});
    if(n.depth<2)queue.push({type:e.target_type,id:String(e.target_id),depth:n.depth+1});
   }
  }
  return out;
 },
 async forFollowedCreator(db,user,creatorIds,limit=120){
  const merged=[];
  for(const id of creatorIds||[]) merged.push(...await this.expand(db,user,"creator",id,limit));
  const map=new Map();
  merged.forEach(x=>{const k=x.type+":"+x.id,old=map.get(k);map.set(k,old?{...old,score:old.score+x.score,reasons:[...new Set([...old.reasons,...x.reasons])].slice(0,3)}:x)});
  return [...map.values()].sort((a,b)=>b.score-a.score).slice(0,limit);
 }
};