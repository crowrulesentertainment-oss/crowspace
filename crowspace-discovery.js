/* CrowSpace V24 — Universal Social Discovery & Ranking Engine */
(function(){
'use strict';
const db=()=>window.CrowSpaceUniversal?.db;
const me=()=>window.CrowSpaceUniversal?.user;
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
async function read(table,select,limit=250){
 const d=db(); if(!d)return[];
 try{const r=await d.from(table).select(select).limit(limit);return r.data||[]}catch(e){return[]}
}
const countMap=(rows,key)=>{const m=new Map();rows.forEach(x=>{const v=x[key];if(v)m.set(v,(m.get(v)||0)+1)});return m};
function ageBoost(date){const h=Math.max(0,(Date.now()-new Date(date||Date.now()).getTime())/3600000);return 1/(1+h/72)}
function scoreUser(p,ctx){
 const id=p.user_id, social=ctx.following.has(id)?4:ctx.friends.has(id)?5:ctx.followers.has(id)?2:0;
 const activity=(ctx.posts.get(id)||0)*.7+(ctx.caws.get(id)||0)*1.1+(ctx.likes.get(id)||0)*.25+(ctx.followersCount.get(id)||0)*.35;
 const recent=ageBoost(p.created_at)*1.5; const mutual=ctx.mutual.get(id)||0;
 return social+activity*.15+recent+mutual*1.25;
}
function scoreEntity(x,ctx,type){
 let s=ageBoost(x.created_at)*2;
 if(type==='caw')s+=(Number(x.views)||0)*.015+(ctx.cawLikes.get(x.id)||0)*1.4+(ctx.cawComments.get(x.id)||0)*1.1;
 if(type==='post')s+=(Number(x.like_count)||0)*1.1+(Number(x.comment_count)||0)*1.3;
 if(type==='group')s+=(ctx.groupMembers.get(x.id)||0)*1.5;
 if(type==='circle')s+=(ctx.circleMembers.get(x.id)||0)*1.5;
 if(type==='podcast')s+=(Number(x.listener_count)||0)*.08+(Number(x.total_plays)||0)*.01;
 return s;
}
function item(type,x,ctx){
 const names={member:'Member',caw:'Caw',post:'Post',group:'Group',circle:'Circle',event:'Event',podcast:'Podcast'};
 let title=x.display_name||x.username||x.title||x.name||'CrowSpace';
 let sub=names[type];
 let href='#';
 if(type==='member'){href='profile.html?user='+encodeURIComponent(x.user_id);sub='Member · '+(ctx.following.has(x.user_id)?'Following':ctx.friends.has(x.user_id)?'Friend':'Discover')}
 if(type==='caw')sub='Caw · '+Number(x.views||0).toLocaleString()+' views';
 if(type==='post')sub='Community post · '+Number(x.like_count||0)+' likes';
 if(type==='group')sub='Group · '+(ctx.groupMembers.get(x.id)||0)+' members'; 
 if(type==='circle')sub='Circle · '+(ctx.circleMembers.get(x.id)||0)+' members';
 if(type==='event')sub='Event · '+new Date(x.starts_at||x.created_at).toLocaleDateString();
 if(type==='podcast')sub='Podcast · '+Number(x.total_plays||x.listener_count||0).toLocaleString()+' plays/listeners';
 return '<a class="cs-discovery-item" href="'+esc(href)+'"><span class="cs-discovery-icon">'+({'member':'◉','caw':'▶','post':'▣','group':'▦','circle':'◌','event':'◆','podcast':'♫'}[type]||'•')+'</span><span><b>'+esc(title)+'</b><small>'+esc(sub)+'</small></span></a>';
}
async function build(){
 const d=db();if(!d||document.getElementById('cs-v24-discovery'))return;
 const [profiles,posts,caws,follows,friends,cawLikes,cawComments,groups,groupMembers,circles,circleMembers,events,podcasts,feedEvents]=await Promise.all([
  read('crowspace_profiles','user_id,username,display_name,created_at,avatar_url',300),
  read('crowspace_posts','id,user_id,title,body,created_at,like_count,comment_count',300),
  read('crowspace_caws','id,user_id,title,caption,created_at,views',300),
  read('crowspace_follows','follower_id,followed_user_id',800),
  read('crowspace_friendships','requester_id,addressee_id,status',800),
  read('crowspace_caw_likes','caw_id,user_id',800),
  read('crowspace_caw_comments','caw_id,user_id',800),
  read('crowspace_groups','id,name,slug,description,created_by,created_at',150),
  read('crowspace_group_members','group_id,user_id',500),
  read('crowspace_circles','id,name,slug,description,created_by,created_at',150),
  read('crowspace_circle_members','circle_id,user_id',500),
  read('crowspace_events','id,title,description,starts_at,created_at',150),
  read('podcasts','id,title,description,created_at,listener_count,total_plays,status',150),
  me()?read('crowspace_feed_events','event_type,target_id,target_type,weight,created_at,metadata',500):Promise.resolve([])
 ]);
 const following=new Set(),followers=new Set(),friendsSet=new Set(),friendGraph=new Map(),mutual=new Map();
 const uid=me()?.id;
 follows.forEach(f=>{if(f.follower_id===uid)following.add(f.followed_user_id);if(f.followed_user_id===uid)followers.add(f.follower_id)});
 friends.filter(f=>f.status==='accepted').forEach(f=>{if(f.requester_id===uid)friendsSet.add(f.addressee_id);if(f.addressee_id===uid)friendsSet.add(f.requester_id);});
 friends.filter(f=>f.status==='accepted').forEach(f=>{(friendGraph.get(f.requester_id)||friendGraph.set(f.requester_id,new Set()).get(f.requester_id)).add(f.addressee_id);(friendGraph.get(f.addressee_id)||friendGraph.set(f.addressee_id,new Set()).get(f.addressee_id)).add(f.requester_id)});
 const myFriends=friendGraph.get(uid)||new Set();
 profiles.forEach(p=>{if(p.user_id===uid)return;const fs=friendGraph.get(p.user_id)||new Set();let n=0;myFriends.forEach(id=>{if(fs.has(id))n++});if(n)mutual.set(p.user_id,n)});
 const ctx={following,followers,friends:friendsSet,mutual,posts:countMap(posts,'user_id'),caws:countMap(caws,'user_id'),likes:countMap(cawLikes,'user_id'),followersCount:countMap(follows,'followed_user_id'),cawLikes:countMap(cawLikes,'caw_id'),cawComments:countMap(cawComments,'caw_id'),groupMembers:countMap(groupMembers,'group_id'),circleMembers:countMap(circleMembers,'circle_id'),feedEvents};
 const sort=(arr,type)=>arr.map(x=>[x, type==='member'?scoreUser(x,ctx):scoreEntity(x,ctx,type)]).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>item(type,x[0],ctx)).join('')||'<div class="cs-discovery-empty">Nothing to discover yet.</div>';
 const host=document.createElement('section');host.id='cs-v24-discovery';host.className='cs-discovery-engine';
 host.innerHTML='<div class="cs-discovery-head"><div><span class="cs-eyebrow">CROWSPACE // V24</span><h2>Universal Discovery</h2><p>One discovery layer connecting your social graph, activity, rankings and CrowRules content.</p></div><a href="rankings.html">View Rankings →</a></div><div class="cs-discovery-grid">'+
  '<div><h3>People For You</h3><div>'+sort(profiles,'member')+'</div></div>'+
  '<div><h3>Trending Caws</h3><div>'+sort(caws,'caw')+'</div></div>'+
  '<div><h3>Active Groups</h3><div>'+sort(groups,'group')+'</div></div>'+
  '<div><h3>Active Circles</h3><div>'+sort(circles,'circle')+'</div></div>'+
  '<div><h3>Community Posts</h3><div>'+sort(posts,'post')+'</div></div>'+
  '<div><h3>Upcoming Events</h3><div>'+sort(events,'event')+'</div></div>'+
  '<div><h3>New Podcasts</h3><div>'+sort(podcasts,'podcast')+'</div></div></div>';
 const main=document.querySelector('main')||document.body;main.prepend(host);
}
window.CrowSpaceDiscovery={refresh:build};
document.addEventListener('crowspace-universal-ready',()=>setTimeout(build,300));
document.addEventListener('crowspace-social-update',()=>setTimeout(build,350));
})();