/* CrowSpace 21.1 — Context-Aware Personalized Discovery */
window.CrowSpaceDiscovery21_1={
 version:"21.1",
 async context(db,user){
  if(!db||!user)return {followed:[],events:[],feedback:[]};
  const [f,e,r]=await Promise.all([
   db.from("crowspace_followers").select("following_id").eq("follower_id",user.id).limit(100),
   db.from("crowspace_recommendation_events").select("item_type,item_id,action,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100),
   db.from("crowspace_recommendation_feedback").select("content_type,content_id,action,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(100)
  ]);
  return {followed:(f.data||[]).map(x=>String(x.following_id)),events:e.data||[],feedback:r.data||[]};
 },
 async rank(db,user,nodes){
  const c=await this.context(db,user),followed=new Set(c.followed),blocked=new Set(c.feedback.filter(x=>["hide","not_interested"].includes(x.action)).map(x=>x.content_type+":"+x.content_id));
  return (nodes||[]).filter(x=>!blocked.has(String(x.type||x._type)+":"+String(x.id))).map(x=>{
   const type=x.type||x._type,id=String(x.id||x.user_id||x.created_by),creator=String(x.user_id||x.created_by||"");
   let score=Number(x.score||x._score||0);
   if(followed.has(creator))score+=10;
   const recent=c.events.filter(e=>String(e.item_type)===String(type)&&String(e.item_id)===id).slice(0,5);
   recent.forEach(e=>{score+=e.action==="open"?2:e.action==="complete"?4:e.action==="save"?5:e.action==="follow"?6:0});
   if(x.created_at){const age=Math.max(0,(Date.now()-new Date(x.created_at).getTime())/86400000);score+=Math.max(0,4-age/7)}
   return {...x,_graphScore:score};
  }).sort((a,b)=>b._graphScore-a._graphScore);
 },
 async pathways(db,user,limit=12){
  const c=await this.context(db,user), ids=c.followed;
  if(!ids.length)return [];
  const r=await db.from("crowspace_content_graph_edges").select("source_type,source_id,relation,target_type,target_id").in("source_id",ids).limit(200);
  if(r.error)return [];
  return (r.data||[]).slice(0,limit);
 },
 async track(db,user,type,id,action="open"){if(!db||!user||!id)return null;return db.from("crowspace_recommendation_events").insert({user_id:user.id,item_type:type,item_id:String(id),action});}
};