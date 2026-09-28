/* CrowSpace Social Timeline Engine
   Following / For You / Latest · infinite scroll · reactions · saves · reposts · comments · media · realtime
*/
(function(){
  const $=id=>document.getElementById(id);
  const db=()=>window.crowSupabase||window.CS?.client||null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const time=v=>{const d=new Date(v),n=Date.now()-d.getTime();if(!Number.isFinite(d.getTime()))return'';if(n<6e4)return'just now';if(n<36e5)return Math.floor(n/6e4)+'m';if(n<864e5)return Math.floor(n/36e5)+'h';if(n<6048e5)return Math.floor(n/864e5)+'d';return d.toLocaleDateString();};
  let mode='for-you', cursor=null, loading=false, done=false, me=null, channel=null;

  async function getUser(){try{const r=await db().auth.getUser();return r.data?.user||null}catch{return null}}
  async function profiles(ids){const u=[...new Set(ids.filter(Boolean))];if(!u.length)return{};const r=await db().from('membership_profiles').select('id,display_name,username,avatar_url').in('id',u);return Object.fromEntries((r.data||[]).map(x=>[x.id,x]));}
  async function follows(){if(!me)return[];const r=await db().from('crowspace_follows').select('followed_user_id').eq('follower_id',me.id);return (r.data||[]).map(x=>x.followed_user_id)}
  async function loadPage(){
    if(loading||done)return;
    loading=true;
    const box=$('feed'); if(!box){loading=false;return}
    if(!cursor) box.innerHTML='<div class="social-loading">SYNCING THE TIMELINE…</div>';
    const c=db(); if(!c){box.innerHTML='<div class="social-error">CrowSpace database client unavailable.</div>';loading=false;return}
    try{
      const followed=await follows();
      let q1=c.from('crowspace_posts').select('id,user_id,title,body,media_url,created_at,like_count,comment_count').order('created_at',{ascending:false}).limit(25);
      let q2=c.from('crowspace_caws').select('id,user_id,title,caption,video_url,thumbnail_url,created_at,views').order('created_at',{ascending:false}).limit(25);
      if(cursor){q1=q1.lt('created_at',cursor);q2=q2.lt('created_at',cursor)}
      if(mode==='following'&&me){
        if(!followed.length){done=true;render([]);loading=false;return}
        q1=q1.in('user_id',followed);q2=q2.in('user_id',followed);
      }
      const [posts,caws]=await Promise.all([q1,q2]);
      if(posts.error)throw posts.error;if(caws.error)throw caws.error;
      const raw=[...(posts.data||[]).map(x=>({...x,kind:'post',body:x.body||'',media_url:x.media_url||''})),...(caws.data||[]).map(x=>({...x,kind:'caw',body:x.caption||'',media_url:x.video_url||''}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
      if(!raw.length){done=true;if(!cursor)render([]);loading=false;return}
      const page=raw.slice(0,20), next=page[page.length-1]?.created_at;
      cursor=next||cursor;
      if(raw.length<20)done=true;
      const pm=await profiles(page.map(x=>x.user_id));
      const ids=page.map(x=>x.id);
      const [ints,comments]=await Promise.all([
        ids.length?c.from('crowspace_social_interactions').select('target_type,target_id,user_id,interaction_type').in('target_id',ids):{data:[]},
        ids.length?c.from('crowspace_comments').select('post_id,caw_id').or('post_id.in.('+ids.join(',')+'),caw_id.in.('+ids.join(',')+')'):{data:[]}
      ]);
      const im={};(ints.data||[]).forEach(x=>{const k=x.target_type+':'+x.target_id;(im[k]??={likes:0,saves:0,reposts:0,mine:{}});if(x.interaction_type==='like')im[k].likes++;if(x.interaction_type==='save')im[k].saves++;if(x.interaction_type==='repost')im[k].reposts++;if(me&&x.user_id===me.id)im[k].mine[x.interaction_type]=true});
      const cm={};(comments.data||[]).forEach(x=>{const k=x.post_id?'post:'+x.post_id:'caw:'+x.caw_id;cm[k]=(cm[k]||0)+1});
      const items=page.map(x=>({...x,profile:pm[x.user_id]||{},stats:im[x.kind+':'+x.id]||{likes:0,saves:0,reposts:0,mine:{}},comments:cm[x.kind+':'+x.id]||0}));
      render(items);
    }catch(e){console.error('CrowSpace social timeline:',e);if(!cursor)box.innerHTML='<div class="social-error"><strong>Timeline sync failed.</strong><br>'+esc(e.message||'Unable to load timeline.')+'<br><button class="social-retry" onclick="window.CrowSocialFeed.reset()">Retry</button></div>'}
    finally{loading=false}
  }
  function render(items){
    const box=$('feed');if(!box)return;
    if(!cursor)box.innerHTML='';
    if(!items.length&&!cursor){box.innerHTML='<div class="social-empty"><strong>Your timeline is waiting.</strong><br>Follow people or share your first Caw to start the signal.</div>';return}
    const html=items.map(x=>{
      const p=x.profile||{},name=p.display_name||p.username||'CrowSpace Member',avatar=p.avatar_url||'',label=x.kind==='caw'?'CAW':'POST';
      const media=x.media_url?(x.kind==='caw'?'<video class="social-media" controls playsinline preload="metadata" poster="'+esc(x.thumbnail_url||'')+'" src="'+esc(x.media_url)+'"></video>':'<img class="social-media social-image" src="'+esc(x.media_url)+'" alt="">'):'';
      const target=x.kind+':'+x.id,s=x.stats||{likes:0,saves:0,reposts:0,mine:{}};
      return '<article class="social-card" data-target="'+esc(target)+'"><header class="social-head"><a class="social-avatar" href="profile.html?id='+encodeURIComponent(x.user_id)+'">'+(avatar?'<img src="'+esc(avatar)+'" alt="">':esc(name[0]||'C'))+'</a><div><strong>'+esc(name)+'</strong><small>@'+esc(p.username||'member')+' · '+esc(time(x.created_at))+'</small></div><span class="social-kind">'+label+'</span></header>'+(x.title?'<h3>'+esc(x.title)+'</h3>':'')+(x.body?'<p>'+esc(x.body)+'</p>':'')+media+'<div class="social-actions"><button data-act="like" class="'+(s.mine?.like?'active':'')+'">♡ <b>'+s.likes+'</b></button><button data-act="comment">💬 <b>'+x.comments+'</b></button><button data-act="repost">↻ <b>'+s.reposts+'</b></button><button data-act="save" class="'+(s.mine?.save?'active':'')+'">⌑ <b>'+s.saves+'</b></button><a href="'+(x.kind==='caw'?'caw-feed.html?caw='+encodeURIComponent(x.id):'profile.html?id='+encodeURIComponent(x.user_id))+'">OPEN →</a></div></article>';
    }).join('');
    box.insertAdjacentHTML(cursor?'beforeend':'afterbegin',html);
    box.querySelectorAll('.social-card').forEach(card=>{
      if(card.dataset.bound)return;card.dataset.bound='1';
      card.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>act(card,b.dataset.act));
    });
    let s=$('socialSentinel');if(!s){s=document.createElement('div');s.id='socialSentinel';s.className='social-sentinel';box.parentNode.appendChild(s);new IntersectionObserver(e=>{if(e[0].isIntersecting)loadPage()},{rootMargin:'600px'}).observe(s)}
  }
  async function act(card,type){
    const [kind,id]=(card.dataset.target||'').split(':');if(!id)return;
    if(!me){location.href='login.html';return}
    const c=db();if(type==='comment'){
      const body=prompt('Write a comment');if(!body?.trim())return;
      const payload={user_id:me.id,body:body.trim()};payload[kind==='caw'?'caw_id':'post_id']=id;
      const r=await c.from('crowspace_comments').insert(payload);if(r.error)alert(r.error.message);else{const b=card.querySelector('[data-act="comment"] b');if(b)b.textContent=String(Number(b.textContent||0)+1)}return;
    }
    const q=c.from('crowspace_social_interactions').select('id').eq('target_type',kind).eq('target_id',id).eq('user_id',me.id).eq('interaction_type',type).maybeSingle();
    const existing=await q;
    if(existing.data){const r=await c.from('crowspace_social_interactions').delete().eq('id',existing.data.id);if(r.error)alert(r.error.message)}
    else{const r=await c.from('crowspace_social_interactions').insert({target_type:kind,target_id:id,user_id:me.id,interaction_type:type});if(r.error)alert(r.error.message)}
    reset();
  }
  function reset(){cursor=null;done=false;const box=$('feed');if(box)box.innerHTML='<div class="social-loading">REFRESHING THE SIGNAL…</div>';loadPage()}
  function setMode(next){mode=next;cursor=null;done=false;document.querySelectorAll('[data-social-mode]').forEach(b=>b.classList.toggle('active',b.dataset.socialMode===mode));loadPage()}
  function realtime(){
    const c=db();if(!c)return;
    if(window.__crowSocialChannel){try{c.removeChannel(window.__crowSocialChannel)}catch{}}
    channel=c.channel('crowspace-social-timeline');
    ['crowspace_posts','crowspace_caws','crowspace_social_interactions','crowspace_comments'].forEach(table=>channel.on('postgres_changes',{event:'*',schema:'public',table},()=>reset()));
    channel.subscribe(status=>{if(status==='SUBSCRIBED')window.__crowSocialChannel=channel});
  }
  function mount(){
    const panel=document.querySelector('.community-feed-panel');if(!panel)return;
    if(!document.getElementById('socialModes')){
      const h=panel.querySelector('.community-feed-head');if(h)h.insertAdjacentHTML('afterbegin','<div id="socialModes" class="social-modes"><button data-social-mode="for-you" class="active">FOR YOU</button><button data-social-mode="following">FOLLOWING</button><button data-social-mode="latest">LATEST</button></div>');
    }
    document.querySelectorAll('[data-social-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.socialMode));
    getUser().then(u=>{me=u;loadPage();realtime()});
  }
  window.CrowSocialFeed={reset,load:loadPage,setMode};
  document.addEventListener('DOMContentLoaded',mount);
})();