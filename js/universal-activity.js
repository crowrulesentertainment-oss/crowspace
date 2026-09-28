/* CrowSpace Universal Activity — shared live stream */
window.CrowUniversalActivity={async mount(targetId,opts={}){
 const el=document.getElementById(targetId);if(!el||!window.crowSupabase)return null;
 const limit=Math.min(Number(opts.limit||12),50), filter=opts.division||null;
 const esc=(window.CS&&CS.escape)||((s)=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
 const q=()=>{let x=crowSupabase.from('cr_platform_activity_feed').select('id,event_type,entity_type,entity_id,message,division_key,created_at').order('created_at',{ascending:false}).limit(limit);return filter?x.eq('division_key',filter):x};
 const render=rows=>{el.innerHTML=(rows||[]).map(x=>'<article class="cu-activity"><strong>'+esc(x.event_type||'Activity')+'</strong><div>'+esc(x.message||'')+'</div><small>'+esc(x.division_key||'CrowRules')+' · '+new Date(x.created_at).toLocaleString()+'</small></article>').join('')||'<div class="empty">No universal activity yet.</div>'};
 const r=await q();if(r.error){el.innerHTML='<div class="empty">Universal Activity unavailable.</div>';return null}
 let rows=r.data||[];render(rows);
 const channel=crowSupabase.channel('crowspace-universal-activity-'+Math.random().toString(36).slice(2)).on('postgres_changes',{event:'INSERT',schema:'public',table:'cr_platform_events'},p=>{if(filter&&p.new?.division_key!==filter)return;rows=[p.new,...rows.filter(x=>x.id!==p.new.id)].slice(0,limit);render(rows);el.dispatchEvent(new CustomEvent('crow:activity',{detail:p.new}))}).subscribe();
 if(opts.statusId){const st=document.getElementById(opts.statusId);if(st)st.textContent='● Live activity connected'}
 return channel;
}};