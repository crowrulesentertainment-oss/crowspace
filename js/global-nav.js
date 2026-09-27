(()=>{
  const links=[
    ['Home','index.html'],['My Nest','profile.html'],['People','people.html'],['Friends','friends.html'],
    ['Caws','caws.html'],['Photos','albums.html'],['Groups','groups.html'],['Events','events.html'],
    ['Dreamscapes','dreamscapes.html'],['Memorials','memorials.html'],['Podcasting','podcasting.html'],
    ['Command Center','command-center.html'],['Notifications','notifications.html'],['Membership','membership.html'],
    ['Create Caw','create-caw.html'],['Create Album','create-album.html'],['Create Group','create-group.html'],
    ['Create Event','create-event.html'],['Customize Nest','customize.html']
  ];
  const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  function install(){
    const header=document.querySelector('.site-header'); if(!header)return;
    const nav=header.querySelector('nav'); if(!nav)return;
    const current=location.pathname.split('/').pop()||'index.html';
    nav.innerHTML='<div class="crow-visible-nav">'+links.map(([label,href])=>`<a href="${href}" class="${href===current?'active':''}" ${href===current?'aria-current="page"':''}>${esc(label)}</a>`).join('')+'</div>';
    if(document.getElementById('crow-visible-nav-style'))return;
    const style=document.createElement('style');style.id='crow-visible-nav-style';style.textContent=`
      .site-header{position:relative;z-index:1000;flex-wrap:wrap!important}
      .site-header>nav{display:block!important;flex:1 0 100%!important;width:100%!important;order:10!important;overflow-x:auto!important;overflow-y:hidden!important;padding:6px 0 9px!important;scrollbar-width:thin}
      .crow-visible-nav{display:flex;align-items:center;gap:5px;width:max-content;min-width:100%;padding:0 2px}
      .crow-visible-nav a{display:inline-flex!important;align-items:center;justify-content:center;white-space:nowrap;text-decoration:none;padding:9px 11px;border-radius:9px;font-size:12px;font-weight:800;color:var(--text,#222);background:transparent;transition:.15s ease}
      .crow-visible-nav a:hover,.crow-visible-nav a.active{background:var(--blue2,#eef5ff);color:var(--blue,#1877f2)}
      @media(max-width:900px){.crow-visible-nav a{font-size:11px;padding:8px 9px}}
      @media(max-width:520px){.crow-visible-nav a{font-size:10px;padding:8px}}
    `;document.head.appendChild(style);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();