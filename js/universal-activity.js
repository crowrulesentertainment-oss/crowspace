/* CrowRules Universal Activity 3.0 — unified live feed with source fallbacks */
window.CrowUniversalActivity={async mount(targetId,opts={}){
 const el=document.getElementById(targetId);if(!el||!window.crowSupabase)return null;
 const limit=Math.min(Number(opts.limit||12),50),filter=opts.division||null;
 const cfg={crowspace:['◎','CrowSpace','index.html'],dreamscapes:['✦','Dreamscapes','index.html'],creators:['◉','Creators','creator-hub.html'],productions:['▶','Productions','production.html'],tv:['▣','CrowRules TV','https://crowrulesentertainment-oss.github.io/crowrulestv/'],podcasting:['♫','Podcasting','https://crowrulesentertainment-oss.github.io/podcasting/'],sports:['◆','Sports','https://crowrulesentertainment-oss.github.io/sports/'],memorials:['✚','Memorials','https://crowrulesentertainment-oss.github.io/memorials/'],spectrum:['★','Spectrum','https://crowrulesentertainment-oss.github.io/spectrum/'],yearbooks:['▤','Yearbooks','https://crowrulesentertainment-oss.github.io/yearbooks/']};
 const esc=(window.CS&&CS.escape)||((s)=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
 const route=x=>{const m=x.metadata||{};return m.canonical_url||m.url||m.entity_url||m.href||cfg[x.division_key]?.[2]||'#'};
 const label=x=>{const m=x.metadata||{};return m.entity_title||m.title||x.message||x.event_type||'Activity'};
 const normalize=(rows,division,defaults={})=>(rows||[]).map(x=>({...defaults,...x,division_key:division,id:String(x.id),metadata:x.metadata||{}}));
 const load=async()=>{
   const queries=[];
   if(!filter||filter==='crowspace'){
     queries.push(crowSupabase.from('cr_platform_activity_feed').select('id,event_type,entity_type,entity_id,message,division_key,created_at,metadata').order('created_at',{ascending:false}).limit(limit));
     queries.push(crowSupabase.from('crowspace_caws').select('id,title,caption,user_id,created_at').order('created_at',{ascending:false}).limit(limit));
     queries.push(crowSupabase.from('crowspace_posts').select('id,body,user_id,created_at').order('created_at',{ascending:false}).limit(limit));
   }
   if(!filter||filter==='dreamscapes')queries.push(crowSupabase.from('ds_activity').select('id,activity_type,entity_type,entity_id,message,actor_id,created_at,metadata').order('created_at',{ascending:false}).limit(limit));
   const rs=await Promise.all(queries);
   const bad=rs.find(x=>x.error);
   if(bad&&(!rs[0]||rs[0].error)&&!rs.some(x=>x.data?.length))return {rows:[],error:bad.error};
   let rows=[];
   rs.forEach((r,i)=>{
     if(r.error)return;
     const table=i===0&&(!filter||filter==='crowspace')?'feed':(i===1&&(!filter||filter==='crowspace')?'caws':(i===2&&(!filter||filter==='crowspace')?'posts':'ds'));
     if(table==='feed')rows.push(...normalize(r.data,r.data?.[0]?.division_key||'crowspace'));
     if(table==='caws')rows.push(...(r.data||[]).map(x=>({id:x.id,event_type:'caw_created',entity_type:'caw',entity_id:x.id,message:x.title||x.caption||'New Caw',division_key:'crowspace',created_at:x.created_at,metadata:{title:x.title,canonical_url:'caw-feed.html'}})));
     if(table==='posts')rows.push(...(r.data||[]).map(x=>({id:x.id,event_type:'post_created',entity_type:'post',entity_id:x.id,message:x.body||'New CrowSpace post',division_key:'crowspace',created_at:x.created_at,metadata:{canonical_url:'index.html'}})));
     if(table==='ds')rows.push(...(r.data||[]).map(x=>({id:x.id,event_type:x.activity_type||'activity',entity_type:x.entity_type,entity_id:x.entity_id,message:x.message||'Dreamscapes activity',division_key:'dreamscapes',created_at:x.created_at,metadata:x.metadata||{}})));
   });
   const seen=new Set();rows=rows.filter(x=>!seen.has(x.id)&&seen.add(x.id)).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,limit);
   return {rows};
 };
 const render=rows=>{el.innerHTML=(rows||[]).map(x=>{const d=cfg[x.division_key]||['•','CrowRules','#'];return '<article class="cu-activity" data-division="'+esc(x.division_key||'')+'"><div class="cu-activity-top"><span class="cu-activity-icon">'+d[0]+'</span><span class="cu-activity-division">'+esc(d[1])+'</span><time datetime="'+esc(x.created_at)+'">'+new Date(x.created_at).toLocaleString()+'</time></div><a class="cu-activity-message" href="'+esc(route(x))+'">'+esc(label(x))+'</a><div class="cu-activity-type">'+esc(x.event_type||'activity')+'</div></article>'}).join('')||'<div class="empty">No universal activity yet.</div>'};
 const result=await load();if(result.error){el.innerHTML='<div class="empty">Universal Activity unavailable.</div>';return null}render(result.rows);
 const channel=crowSupabase.channel('crow-universal-activity-'+Math.random().toString(36).slice(2));
 ['cr_platform_events','crowspace_caws','crowspace_posts','ds_activity'].forEach(table=>channel.on('postgres_changes',{event:'INSERT',schema:'public',table},async()=>{const fresh=await load();if(!fresh.error)render(fresh.rows)}));
 channel.subscribe();
 if(opts.statusId){const st=document.getElementById(opts.statusId);if(st)st.textContent='● Live activity connected'}
 return channel;
}};