/* CrowSpace 19.0 — Universal Creator & Content Discovery */
window.CrowSpaceDiscovery19={
 version:"19.0",
 async load(db,user,opts={}){
  const q=String(opts.query||"").trim(), category=opts.category||"all", sort=opts.sort||"relevant", limit=Math.min(Number(opts.limit)||24,50), like="%"+q.replace(/[%_]/g,"\\$&")+"%";
  const out=[];
  const add=async(type,table,select,or,score=0)=>{let req=db.from(table).select(select).limit(limit);if(q&&or)req=req.or(or);if(sort==="newest")req=req.order("created_at",{ascending:false});const r=await req;if(!r.error)(r.data||[]).forEach(x=>out.push({...x,_type:type,_score:score+(x.created_at?Math.max(0,1-(Date.now()-new Date(x.created_at).getTime())/604800000):0)}));};
  const jobs=[];
  if(category==="all"||category==="people"||category==="creators")jobs.push(add("creator","crowspace_profiles","id,user_id,username,display_name,bio,avatar_url,creator_category,portfolio_tagline,portfolio_bio,created_at",q?"username.ilike."+like+",display_name.ilike."+like+",bio.ilike."+like+",creator_category.ilike."+like:null,5));
  if(category==="all"||category==="posts")jobs.push(add("post","crowspace_posts","id,user_id,title,body,media_url,like_count,comment_count,created_at",q?"title.ilike."+like+",body.ilike."+like:null,2));
  if(category==="all"||category==="caws")jobs.push(add("caw","crowspace_caws","id,user_id,title,caption,thumbnail_url,views,created_at",q?"title.ilike."+like+",caption.ilike."+like:null,2));
  if(category==="all"||category==="events")jobs.push(add("event","crowspace_events","id,created_by,title,description,event_type,starts_at,image_url,link_url,is_online,created_at",q?"title.ilike."+like+",description.ilike."+like+",event_type.ilike."+like:null,2));
  await Promise.all(jobs);
  if(sort==="relevant")out.sort((a,b)=>b._score-a._score); else if(sort==="popular")out.sort((a,b)=>(Number(b.views||0)+Number(b.like_count||0)*3+Number(b.comment_count||0)*2)-(Number(a.views||0)+Number(a.like_count||0)*3+Number(a.comment_count||0)*2));
  return out.slice(0,limit);
 },
 async follow(db,user,target){if(!user||!target||user.id===target)return {error:new Error("Invalid follow target")};return db.from("crowspace_followers").insert({follower_id:user.id,following_id:target});},
 async unfollow(db,user,target){return db.from("crowspace_followers").delete().eq("follower_id",user.id).eq("following_id",target);},
 async following(db,user,ids){if(!user||!ids?.length)return new Set();const r=await db.from("crowspace_followers").select("following_id").eq("follower_id",user.id).in("following_id",ids);return new Set((r.data||[]).map(x=>x.following_id));}
};