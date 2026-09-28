/* CrowSpace Universal Activity — one live stream across the ecosystem */
window.CrowUniversalActivity={
  async mount(targetId,opts={}){
    const el=document.getElementById(targetId); if(!el||!window.crowSupabase)return;
    const limit=Math.min(Number(opts.limit||10),50);
    const esc=(window.CS&&CS.escape)||((s)=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
    const render=(rows)=>{el.innerHTML=(rows||[]).map(x=>'<article class="cu-activity"><strong>'+esc(x.event_type||'Activity')+'</strong><div>'+esc(x.message||'')+'</div><small>'+esc(x.division_key||'CrowRules')+' · '+new Date(x.created_at).toLocaleString()+'</small></article>').join('')||'<div class="empty">No universal activity yet.</div>';};
    const {data,error}=await crowSupabase.from('cr_platform_activity_feed').select('id,event_type,entity_type,entity_id,message,division_key,created_at').order('created_at',{ascending:false}).limit(limit);
    if(error){el.innerHTML='<div class="empty">Universal Activity unavailable.</div>';return;}
    let rows=data||[]; render(rows);
    const channel=crowSupabase.channel('crowspace-universal-activity').on('postgres_changes',{event:'INSERT',schema:'public',table:'cr_platform_events'},payload=>{
      if(!payload.new?.id)return;
      rows=[payload.new,...rows.filter(x=>x.id!==payload.new.id)].slice(0,limit); render(rows);
      el.dispatchEvent(new CustomEvent('crow:activity',{detail:payload.new}));
    }).subscribe();
    if(opts.statusId){const st=document.getElementById(opts.statusId);if(st)st.textContent='● Live activity connected';}
    return channel;
  }
};