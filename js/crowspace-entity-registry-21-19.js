/* CrowSpace 21.19 — Universal Entity Registry & Metadata Cache */
window.CrowSpaceEntityRegistry21_19=(()=>{
 const version="21.19",TTL=10*60*1000,mem=new Map();
 const key=(t,id)=>String(t)+":"+String(id);
 const fresh=x=>x&&Date.now()-new Date(x.refreshed_at||0).getTime()<TTL;
 async function get(db,type,id){if(!db||!id)return null;const k=key(type,id),m=mem.get(k);if(fresh(m))return m;const r=await db.from("crowspace_entity_registry").select("*").eq("entity_type",String(type)).eq("entity_id",String(id)).maybeSingle();if(r.data){mem.set(k,r.data);return r.data}return null}
 async function getMany(db,items){const out=new Map(),missing=[];for(const x of items||[]){const k=key(x.type,x.id),m=mem.get(k);if(fresh(m))out.set(k,m);else missing.push(x)}if(missing.length){const groups={};missing.forEach(x=>(groups[x.type]??=[]).push(String(x.id)));for(const type of Object.keys(groups)){const r=await db.from("crowspace_entity_registry").select("*").eq("entity_type",type).in("entity_id",groups[type]);(r.data||[]).forEach(x=>{mem.set(key(x.entity_type,x.entity_id),x);out.set(key(x.entity_type,x.entity_id),x)})}}return out}
 async function upsert(db,row){if(!db||!row?.entity_type||row.entity_id==null)return null;const clean={...row,entity_id:String(row.entity_id),refreshed_at:new Date().toISOString()};const r=await db.from("crowspace_entity_registry").upsert(clean,{onConflict:"entity_type,entity_id"});if(!r.error)mem.set(key(clean.entity_type,clean.entity_id),clean);return r}
 async function hydrate(db,items){const registry=await getMany(db,items);return(items||[]).map(x=>{const e=registry.get(key(x.type,x.id));return e?{...x,creator_id:x.creator_id||e.creator_id,topic:x.topic||e.topic,category:x.category||e.category,title:x.title||e.title,display_name:x.display_name||e.display_name,thumbnail_url:x.thumbnail_url||e.thumbnail_url,destination_url:x.destination_url||e.destination_url,entity_metadata:e.metadata||{}}:x})}
 function invalidate(type,id){if(type&&id)mem.delete(key(type,id));else mem.clear()}
 return{version,TTL,get,getMany,upsert,hydrate,invalidate};
})();