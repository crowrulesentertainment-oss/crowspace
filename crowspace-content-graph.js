/* CrowSpace V25 — Universal Content Graph */
(function(){
'use strict';
const db=()=>window.CrowSpaceUniversal?.db, me=()=>window.CrowSpaceUniversal?.user;
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
async function read(table,select,limit=250){const d=db();if(!d)return[];try{const r=await d.from(table).select(select).limit(limit);return r.data||[]}catch(e){return[]}}
const count=(rows,key)=>{const m=new Map();rows.forEach(r=>{if(r[key])m.set(r[key],(m.get(r[key])||0)+1)});return m};
const age=d=>1/(1+Math.max(0,(Date.now()-new Date(d||Date.now()).getTime())/3600000)/96);
function link(type,x){
 const id=x.id||x.user_id, title=x.display_name||x.username||x.title||x.name||'CrowSpace';
 const urls={member:'profile.html?user=',post:'feed.html#post-',caw:'caws.html#caw-',group:'groups.html#group-',circle:'circles.html#circle-',event:'events.html#event-',podcast:'news.html#podcast-'};
 return '<a class="cs-graph-item" href="'+(urls[type]?(urls[type]+encodeURIComponent(id)):'#')+'"><span class="cs-graph-icon">'+({member:'◉',post:'▣',caw:'▶',group:'▦',circle:'◌',event:'◆',podcast:'♫'}[type]||'•')+'</span><span><b>'+esc(title)+'</b><small>'+esc(type.toUpperCase())+'</small></span></a>';
}
async function build(){
 const host=document.getElementById('cs-v25-graph');if(!host||host.dataset.ready)return;
 host.dataset.ready='loading';
 const [profiles,posts,caws,follows,friends,groups,groupMembers,circles,circleMembers,events,podcasts,feedEvents,feedback]=await Promise.all([
  read('crowspace_profiles','user_id,username,display_name,created_at,avatar_url',300),
  read('crowspace_posts','id,user_id,title,body,created_at,like_count,comment_count',300),
  read('crowspace_caws','id,user_id,title,caption,created_at,views',300),
  read('crowspace_follows','follower_id,followed_user_id,created_at',800),
  read('crowspace_friendships','requester_id,addressee_id,status,created_at',800),
  read('crowspace_groups','id,name,slug,description,created_by,created_at',150),
  read('crowspace_group_members','group_id,user_id,created_at',500),
  read('crowspace_circles','id,name,slug,description,created_by,created_at',150),
  read('crowspace_circle_members','circle_id,user_id,created_at',500),
  read('crowspace_events','id,title,description,starts_at,created_at',150),
  read('podcasts','id,title,description,created_at,listener_count,total_plays,status',150),
  me()?read('crowspace_feed_events','user_id,event_type,target_id,target_type,weight,created_at',500):Promise.resolve([]),
  me()?read('crowspace_recommendation_feedback','user_id,target_id,target_type,feedback_type,created_at',300):Promise.resolve([])
 ]);
 const uid=me()?.id;
 const following=new Set(follows.filter(x=>x.follower_id===uid).map(x=>x.followed_user_id));
 const followers=new Set(follows.filter(x=>x.followed_user_id===uid).map(x=>x.follower_id));
 const friendsSet=new Set(friends.filter(x=>x.status==='accepted').flatMap(x=>x.requester_id===uid?[x.addressee_id]:x.addressee_id===uid?[x.requester_id]:[]));
 const profileBy=new Map(profiles.map(x=>[x.user_id,x]));
 const postBy=new Map(posts.map(x=>[x.id,x])),cawBy=new Map(caws.map(x=>[x.id,x]));
 const graph=new Map();
 const edge=(a,b,w)=>{if(!a||!b||a===b)return;graph.set(a,(graph.get(a)||0)+w)};
 follows.forEach(x=>{edge(x.follower_id,x.followed_user_id,4);edge(x.followed_user_id,x.follower_id,1)});
 friends.filter(x=>x.status==='accepted').forEach(x=>{edge(x.requester_id,x.addressee_id,6);edge(x.addressee_id,x.requester_id,6)});
 feedEvents.forEach(x=>{if(x.user_id===uid&&x.target_id)edge(uid,x.target_id,Number(x.weight||1)*2)});
 const hidden=new Set(feedback.filter(x=>['hide','not_interested'].includes(String(x.feedback_type||'').toLowerCase())).map(x=>String(x.target_type)+':'+x.target_id));
 const creatorScore=new Map();posts.forEach(x=>creatorScore.set(x.user_id,(creatorScore.get(x.user_id)||0)+1+Number(x.like_count||0)*.1));caws.forEach(x=>creatorScore.set(x.user_id,(creatorScore.get(x.user_id)||0)+2+Number(x.views||0)*.02));
 const memberScore=profiles.filter(x=>x.user_id!==uid).map(x=>({x,s:(following.has(x.user_id)?8:0)+(friendsSet.has(x.user_id)?10:0)+(followers.has(x.user_id)?4:0)+(graph.get(x.user_id)||0)+age(x.created_at)*2+(creatorScore.get(x.user_id)||0)*.2})).sort((a,b)=>b.s-a.s);
 const trendingCaws=caws.map(x=>({x,s:age(x.created_at)*3+Number(x.views||0)*.03})).filter(x=>!hidden.has('caw:'+x.x.id)).sort((a,b)=>b.s-a.s);
 const trendingPosts=posts.map(x=>({x,s:age(x.created_at)*3+Number(x.like_count||0)*1.3+Number(x.comment_count||0)*1.7+(graph.get(x.user_id)||0)})).filter(x=>!hidden.has('post:'+x.x.id)).sort((a,b)=>b.s-a.s);
 const nearGroups=groups.map(x=>({x,s:(groupMembers.filter(m=>friendsSet.has(m.user_id)).length?2:0)+groupMembers.filter(m=>m.group_id===x.id).length*1.4+age(x.created_at)})).sort((a,b)=>b.s-a.s);
 const nearCircles=circles.map(x=>({x,s:circleMembers.filter(m=>friendsSet.has(m.user_id)&&m.circle_id===x.id).length*5+circleMembers.filter(m=>m.circle_id===x.id).length*1.2+age(x.created_at)})).sort((a,b)=>b.s-a.s);
 const upcoming=events.filter(x=>!x.starts_at||new Date(x.starts_at)>=new Date()).sort((a,b)=>new Date(a.starts_at||a.created_at)-new Date(b.starts_at||b.created_at));
 const newPodcasts=podcasts.slice().sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
 const creators=[...creatorScore.entries()].map(([id,s])=>({x:profileBy.get(id)||{user_id:id,display_name:'Creator'},s})).sort((a,b)=>b.s-a.s);
 const render=(arr,type,n=5)=>arr.slice(0,n).map(o=>link(type,o.x||o)).join('')||'<div class="cs-graph-empty">Nothing connected yet.</div>';
 const recentNetworkPosts=posts.filter(p=>following.has(p.user_id)||friendsSet.has(p.user_id)||followers.has(p.user_id)).map(x=>({x,s:age(x.created_at)*3+Number(x.like_count||0)*1.2+Number(x.comment_count||0)*1.6})).sort((a,b)=>b.s-a.s);
 const activeCreators=creators.filter(o=>o.x?.user_id&&o.x.user_id!==uid).slice(0,5);
 host.innerHTML='<div class="cs-graph-head"><div><span class="cs-eyebrow">CROWSPACE // V25</span><h2>Universal Content Graph</h2><p>One graph connecting people, relationships, content, communities, events and audio through shared activity signals.</p></div><a href="rankings.html">Open Rankings →</a></div><div class="cs-graph-grid">'+
 '<section><h3>Because You Follow…</h3>'+render(memberScore.map(o=>o),'member')+'</section>'+
 '<section><h3>People You May Know</h3>'+render(memberScore.slice().sort((a,b)=>((b.x?.user_id&&graph.get(b.x.user_id)||0)-(a.x?.user_id&&graph.get(a.x.user_id)||0))),'member')+'</section>'+
 '<section><h3>Trending Near Your Network</h3>'+render(recentNetworkPosts.length?recentNetworkPosts:trendingPosts,'post')+'</section>'+
 '<section><h3>Creator Discovery</h3>'+render(activeCreators,'member')+'</section>'+
 '<section><h3>Trending Caws</h3>'+render(trendingCaws,'caw')+'</section>'+
 '<section><h3>Groups Connected to You</h3>'+render(nearGroups,'group')+'</section>'+
 '<section><h3>Circles Connected to You</h3>'+render(nearCircles,'circle')+'</section>'+
 '<section><h3>Upcoming Events</h3>'+render(upcoming.map(x=>({x})), 'event')+'</section>'+
 '<section><h3>New Podcasts</h3>'+render(newPodcasts.map(x=>({x})), 'podcast')+'</section></div>';
 host.dataset.ready='1';
}
window.CrowSpaceContentGraph={refresh:()=>{const h=document.getElementById('cs-v25-graph');if(h)h.dataset.ready='';return build()}};
document.addEventListener('crowspace-universal-ready',()=>setTimeout(build,350));
document.addEventListener('crowspace-social-update',()=>setTimeout(()=>{const h=document.getElementById('cs-v25-graph');if(h)h.dataset.ready='';build()},450));
})();