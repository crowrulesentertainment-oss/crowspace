/* CrowSpace 21.18 — Universal Recommendation Entity Resolution */
window.CrowSpaceEntityResolution21_18=(()=>{
 const version="21.18";
 const typeMap={creator:"creator",project:"project",portfolio:"project",post:"post",caw:"caw",event:"event",group:"group",circle:"circle",media:"media_album",media_album:"media_album",property:"property"};
 const cache=new Map();
 async function resolve(db,item){
  if(!db||!item)return item;
  const key=String(item.type)+":"+String(item.id);
  if(cache.has(key))return {...item,...cache.get(key)};
  let meta={};
  const t=typeMap[item.type]||item.type,id=String(item.id);
  if(t==="creator"){meta={creator_id:id,creator_ids:[id]}}
  else if(t==="post"){const r=await db.from("crowspace_posts").select("user_id").eq("id",id).maybeSingle();if(r.data)meta={creator_id:r.data.user_id,creator_ids:[r.data.user_id]}}
  else if(t==="project"){const r=await db.from("crowspace_creator_projects").select("creator_id").eq("id",id).maybeSingle();if(r.data)meta={creator_id:r.data.creator_id,creator_ids:[r.data.creator_id]}}
  else if(t==="event"){const r=await db.from("crowspace_events").select("creator_id,created_by").eq("id",id).maybeSingle();if(r.data){const c=r.data.creator_id||r.data.created_by;if(c)meta={creator_id:c,creator_ids:[c]}}}
  else if(t==="media_album"){const r=await db.from("crowspace_albums").select("user_id,creator_id").eq("id",id).maybeSingle();if(r.data){const c=r.data.creator_id||r.data.user_id;if(c)meta={creator_id:c,creator_ids:[c]}}}
  else if(t==="caw"){const r=await db.from("crowspace_caws").select("user_id,creator_id").eq("id",id).maybeSingle();if(r.data){const c=r.data.creator_id||r.data.user_id;if(c)meta={creator_id:c,creator_ids:[c]}}}
  cache.set(key,meta);return {...item,...meta};
 }
 async function enrich(db,items){return Promise.all((items||[]).map(x=>resolve(db,x)))}
 function topic(item){return item?.topic||item?.category||item?.creator_category||null}
 async function enrichForPreferences(db,items){const out=await enrich(db,items);return out.map(x=>({...x,topic:topic(x)}))}
 return{version,resolve,enrich,enrichForPreferences,clear:()=>cache.clear()};
})();