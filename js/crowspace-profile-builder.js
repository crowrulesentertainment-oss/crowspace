/* CROWSPACE PROFILE BUILDER — no extra database table required */
(function(){
  const SECTIONS=[
    ['about','ABOUT ME','Your introduction, bio, mood and profile details.'],
    ['friends','TOP FRIENDS','Your classic MySpace-style Top 8 friends.'],
    ['posts','LATEST POSTS','Your public CrowSpace posts.'],
    ['pictures','PICTURES','Your public photo gallery.'],
    ['videos','VIDEOS','Your public video gallery.'],
    ['groups','GROUPS','Groups you belong to.'],
    ['favorites','FAVORITES / SIGNAL','Your profile signal and favorite-member area.'],
    ['music','MUSIC / NOW PLAYING','Music and now-playing information.'],
    ['guestbook','GUESTBOOK','Messages visitors leave on your profile.'],
    ['badges','BADGES','Achievements earned in CrowSpace.']
  ];
  const DEFAULT=SECTIONS.map(x=>x[0]);
  const labelMap=new Map(SECTIONS.map(x=>[x[0],x[1]]));
  const descMap=new Map(SECTIONS.map(x=>[x[0],x[2]]));
  const kickerMap={
    'ABOUT ME':'about','TOP FRIENDS':'friends','LATEST POSTS':'posts','PICTURES':'pictures',
    'VIDEOS':'videos','GROUPS':'groups','FAVORITES / SIGNAL':'favorites',
    'MUSIC / NOW PLAYING':'music','GUESTBOOK':'guestbook','BADGES':'badges'
  };
  const normalize=(layout)=>{
    const order=Array.isArray(layout?.order)?layout.order:[];
    const hidden=new Set(Array.isArray(layout?.hidden)?layout.hidden:[]);
    const clean=[...new Set(order.filter(x=>DEFAULT.includes(x)))];
    DEFAULT.forEach(x=>{if(!clean.includes(x))clean.push(x)});
    return {order:clean,hidden:[...hidden].filter(x=>DEFAULT.includes(x))};
  };
  const waitFor=async(fn,tries=50)=>{
    for(let i=0;i<tries;i++){if(fn())return true;await new Promise(r=>setTimeout(r,100));}
    return false;
  };
  function sectionNodes(){
    const nodes=[...document.querySelectorAll('.profile-page .profile-section')];
    const out={};
    nodes.forEach(n=>{
      const k=n.querySelector('.section-kicker')?.textContent?.trim().toUpperCase();
      const id=kickerMap[k];if(id)out[id]=n;
    });
    return out;
  }
  function applyLayout(layout){
    const normalized=normalize(layout);
    const nodes=sectionNodes();
    const main=document.querySelector('.profile-main');
    if(!main)return normalized;
    normalized.order.forEach(id=>{
      const node=nodes[id];
      if(node)main.appendChild(node);
    });
    normalized.hidden.forEach(id=>{if(nodes[id])nodes[id].classList.add('builder-hidden')});
    DEFAULT.filter(id=>!normalized.hidden.includes(id)).forEach(id=>{if(nodes[id])nodes[id].classList.remove('builder-hidden')});
    return normalized;
  }
  async function loadLayout(){
    const r=await cs.client.from('crowspace_profiles').select('profile_layout').eq('user_id',cs.user.id).maybeSingle();
    return normalize(r.data?.profile_layout||cs.profile?.profile_layout||null);
  }
  async function saveLayout(layout,status){
    const payload={profile_layout:normalize(layout),updated_at:new Date().toISOString()};
    const r=await cs.client.from('crowspace_profiles').update(payload).eq('user_id',cs.user.id);
    status.textContent=r.error?'SAVE ERROR: '+r.error.message:'LAYOUT SAVED · PUBLIC PROFILE UPDATED';
    status.style.color=r.error?'var(--danger)':'var(--green)';
    if(!r.error){cs.profile={...(cs.profile||{}),profile_layout:payload.profile_layout};applyLayout(payload.profile_layout);}
  }
  function buildEditor(editor,layout){
    const old=editor.querySelector('.profile-builder');if(old)old.remove();
    const box=document.createElement('div');box.className='profile-builder';
    box.innerHTML='<div class="profile-builder-head"><div><div class="profile-builder-title">VISUAL PROFILE BUILDER</div><div class="profile-builder-sub">Drag sections into the order you want. Toggle visibility to hide a section without deleting it.</div></div><div class="profile-builder-actions"><button type="button" class="btn" data-builder-reset>RESET LAYOUT</button><button type="button" class="btn primary" data-builder-save>SAVE LAYOUT</button></div></div><div class="profile-builder-list" data-builder-list></div><div class="profile-builder-preview"><b>LIVE ORDER:</b> <span data-builder-preview></span></div><div class="profile-builder-status" data-builder-status></div>';
    editor.appendChild(box);
    const list=box.querySelector('[data-builder-list]');
    const status=box.querySelector('[data-builder-status]');
    let state=normalize(layout);
    const render=()=>{
      list.innerHTML=state.order.map(id=>{
        const hidden=state.hidden.includes(id);
        return '<div class="profile-builder-row" draggable="true" data-builder-id="'+id+'"><div class="profile-builder-handle">☷</div><div><div class="profile-builder-name">'+labelMap.get(id)+'</div><div class="profile-builder-desc">'+descMap.get(id)+'</div></div><label class="profile-builder-toggle"><input type="checkbox" data-builder-visible '+(!hidden?'checked':'')+'> SHOW</label></div>';
      }).join('');
      box.querySelector('[data-builder-preview]').textContent=state.order.filter(x=>!state.hidden.includes(x)).map(x=>labelMap.get(x)).join(' → ');
      let dragId=null;
      list.querySelectorAll('.profile-builder-row').forEach(row=>{
        row.addEventListener('dragstart',e=>{dragId=row.dataset.builderId;row.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragId)});
        row.addEventListener('dragend',()=>{dragId=null;row.classList.remove('dragging');list.querySelectorAll('.drop-target').forEach(x=>x.classList.remove('drop-target'))});
        row.addEventListener('dragover',e=>{e.preventDefault();if(dragId&&dragId!==row.dataset.builderId)row.classList.add('drop-target')});
        row.addEventListener('dragleave',()=>row.classList.remove('drop-target'));
        row.addEventListener('drop',e=>{
          e.preventDefault();row.classList.remove('drop-target');
          const target=row.dataset.builderId;if(!dragId||dragId===target)return;
          const next=state.order.filter(x=>x!==dragId);const at=next.indexOf(target);next.splice(at,0,dragId);state={...state,order:next};render();applyLayout(state);
        });
        row.addEventListener('pointerdown',()=>row.setAttribute('draggable','true'));
        row.querySelector('[data-builder-visible]').addEventListener('change',e=>{
          const h=new Set(state.hidden);if(e.target.checked)h.delete(row.dataset.builderId);else h.add(row.dataset.builderId);
          state={...state,hidden:[...h]};applyLayout(state);render();
        });
      });
    };
    box.querySelector('[data-builder-reset]').addEventListener('click',()=>{state={order:[...DEFAULT],hidden:[]};applyLayout(state);render();status.textContent='DEFAULT LAYOUT RESTORED · CLICK SAVE LAYOUT TO KEEP IT';status.style.color='var(--cyan)'});
    box.querySelector('[data-builder-save]').addEventListener('click',()=>saveLayout(state,status));
    render();applyLayout(state);
  }
  async function init(){
    if(!window.cs?.user||!window.cs?.client)return;
    const params=new URLSearchParams(location.search);
    if(params.get('u')||params.get('username')||params.get('id'))return;
    const ready=await waitFor(()=>document.querySelector('#edit-profile'));
    if(!ready)return;
    const layout=await loadLayout();
    applyLayout(layout);
    const editor=document.querySelector('#edit-profile');
    if(editor)buildEditor(editor,layout);
  }
  document.addEventListener('DOMContentLoaded',()=>setTimeout(init,120));
})();