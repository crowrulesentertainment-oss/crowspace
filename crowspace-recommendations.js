/* CrowSpace V28 — Universal Recommendation Engine */
(function(){
'use strict';
const db=()=>window.CrowSpaceUniversal?.db, me=()=>window.CrowSpaceUniversal?.user;
const esc=s=>String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
async function read(table,select,limit=300){const d=db();if(!d)return[];try{const r=await d.from(table).select(select).limit(limit);return r.data||[]}catch(e){return[]}}
const age=d=>1/(1+Math.max(0,(Date.now()-new Date(d||Date.now()).getTime())/3600000)/120);
const hideKey=(t,id)=>String(t)+':'+id;
async function build(){
 const host=document.getElementById('cs-v28-recommendations');if(!host||host.dataset.ready==='loading')return;
 host.dataset.ready='loading';
 const uid=me()?.id;
 if(!uid){host.innerHTML='<section class="cs-recommendations"><div class="cs-graph-head"><div><span class="cs-eyebrow">CROWSPACE // V28</span><h2>For You</h2><p>Sign in to unlock personalized recommendations.</p></div><a href="login.html">Sign In →</a></div></section>';host.dataset.ready='1';return}
 const [profiles,posts,caws,follows,friends,groups,groupMembers,circles,circleMembers,events,podcasts,interactions,feedEvents,feedback]=await Promise.all([
  read('crowspace_profiles','user_id,username,display_name,created_at',300),
  read('crowspace_posts','id,user_id,title,body,created_at,like_count,comment_count',300),
  read('crowspace_caws','id,user_id,title,caption,created_at,views',300),
  read('crowspace_follows','follower_id,followed_user_id,created_at',800),
  read('crowspace_friendships','requester_id,addressee_id,status,created_at',800),
  read('crowspace_groups','id,name,description,created_by,created_at',150),
  read('crowspace_group_members','group_id,user_id,created_at',500),
  read('crowspace_circles','id,name,description,created_by,created_at',150),
  read('crowspace_circle_members','circle_id,user_id,created_at',500),
  read('crowspace_events','id,title,description,starts_at,created_at',150),
  read('podcasts','id,title,description,created_at,listener_count,total_plays,status',150),
  read('crowspace_social_interactions','target_type,target_id,user_id,interaction_type,created_at',600),
  read('crowspace_feed_events','user_id,event_type,target_id,target_type,weight,created_at',600),
  read('crowspace_recommendation_feedback','user_id,target_id,target_type,feedback_type,created_at',500)
 ]);
 const following=new Set(follows.filter(x=>x.follower_id===uid).map(x=>x.followed_user_id));
 const friendsSet=new Set(friends.filter(x=>x.status==='accepted').flatMap(x=>x.requester_id===uid?[x.addressee_id]:x.addressee_id===uid?[x.requester_id]:[]));
 const followers=new Set(follows.filter(x=>x.followed_user_id===uid).map(x=>x.follower_id));
 const hidden=new Set(feedback.filter(x=>x.user_id===uid&&['hide','not_interested'].includes(String(x.feedback_type||'').toLowerCase())).map(x=>hideKey(x.target_type,x.target_id)));
 const interest=new Map();
 feedEvents.filter(x=>x.user_id===uid).forEach(x=>{const k=String(x.target_type||'').toLowerCase();interest.set(k,(interest.get(k)||0)+Number(x.weight||1))});
 interactions.filter(x=>x.user_id===uid).forEach(x=>{const k=String(x.target_type||'').toLowerCase();interest.set(k,(interest.get(k)||0)+2});
 const interacted=new Set(interactions.filter(x=>x.user_id===uid).map(x=>hideKey(x.target_type,x.target_id)));
 const pmap=new Map(profiles.map(x=>[x.user_id,x]));
 const engagement=new Map();interactions.forEach(x=>{const k=hideKey(x.target_type,x.target_id);engagement.set(k,(engagement.get(k)||0)+({like:2,comment:3,share:4,view:.4,save:2}[String(x.interaction_type||'').toLowerCase()]||1))});
 const creatorAffinity=new Map();
 [...following,...friendsSet,...followers].forEach(x=>creatorAffinity.set(x,8));
 feedEvents.filter(x=>x.target_id).forEach(x=>creatorAffinity.set(x.target_id,(creatorAffinity.get(x.target_id)||0)+Number(x.weight||1)));
 const person=profiles.filter(x=>x.user_id!==uid&&!hidden.has(hideKey('member',x.user_id))).map(x=>({type:'member',id:x.user_id,title:x.display_name||x.username||'CrowSpace Member',meta:(following.has(x.user_id)?'Following · ':'')+(friendsSet.has(x.user_id)?'Friend · ':'')+(followers.has(x.user_id)?'Follows you · ':'')+'Member',score:(following.has(x.user_id)?2:0)+(friendsSet.has(x.user_id)?4:0)+(followers.has(x.user_id)?2:0)+(creatorAffinity.get(x.user_id)||0)+age(x.created_at)})).sort((a,b)=>b.score-a.score);
 const post=posts.filter(x=>!hidden.has(hideKey('post',x.id))&&!interacted.has(hideKey('post',x.id))).map(x=>({type:'post',id:x.id,title:x.title||x.body?.slice(0,70)||'CrowSpace Post',meta:'Post · '+(x.like_count||0)+' likes · '+(x.comment_count||0)+' comments',score:age(x.created_at)*4+Number(x.like_count||0)*1.4+Number(x.comment_count||0)*2+(following.has(x.user_id)?5:0)+(friendsSet.has(x.user_id)?4:0)+(engagement.get(hideKey('post',x.id))||0)})).sort((a,b)=>b.score-a.score);
 const caw=caws.filter(x=>!hidden.has(hideKey('caw',x.id))&&!interacted.has(hideKey('caw',x.id))).map(x=>({type:'caw',id:x.id,title:x.title||x.caption||'Caw',meta:'Caw · '+(x.views||0)+' views',score:age(x.created_at)*4+Number(x.views||0)*.04+(following.has(x.user_id)?5:0)+(friendsSet.has(x.user_id)?3:0)+(engagement.get(hideKey('caw',x.id))||0)})).sort((a,b)=>b.score-a.score);
 const group=groups.filter(x=>!hidden.has(hideKey('group',x.id))).map(x=>({type:'group',id:x.id,title:x.name||'Group',meta:'Group · '+groupMembers.filter(m=>m.group_id===x.id).length+' members',score:age(x.created_at)+groupMembers.filter(m=>m.group_id===x.id).length*1.5+groupMembers.filter(m=>friendsSet.has(m.user_id)&&m.group_id===x.id).length*5})).sort((a,b)=>b.score-a.score);
 const circle=circles.filter(x=>!hidden.has(hideKey('circle',x.id))).map(x=>({type:'circle',id:x.id,title:x.name||'Circle',meta:'Circle · '+circleMembers.filter(m=>m.circle_id===x.id).length+' members',score:age(x.created_at)+circleMembers.filter(m=>m.circle_id===x.id&&friendsSet.has(m.user_id)).length*5})).sort((a,b)=>b.score-a.score);
 const event=events.filter(x=>!x.starts_at||new Date(x.starts_at)>=new Date()).map(x=>({type:'event',id:x.id,title:x.title||'CrowSpace Event',meta:x.starts_at?new Date(x.starts_at).toLocaleString():'Upcoming event',score:(x.starts_at?1/(1+Math.max(0,(new Date(x.starts_at)-Date.now())/86400000)):1)+age(x.created_at)})).sort((a,b)=>b.score-a.score);
 const podcast=podcasts.filter(x=>!hidden.has(hideKey('podcast',x.id))).map(x=>({type:'podcast',id:x.id,title:x.title||'Podcast',meta:'Podcast · '+(x.total_plays||x.listener_count||0)+' plays',score:age(x.created_at)*3+Number(x.total_plays||0)*.03+Number(x.listener_count||0)*.2})).sort((a,b)=>b.score-a.score);
 const url={member:'profile.html?user=',post:'feed.html#post-',caw:'caws.html#caw-',group:'groups.html#group-',circle:'circles.html#circle-',event:'events.html#event-',podcast:'news.html#podcast-'};
 const icon={member:'◉',post:'▣',caw:'▶',group:'▦',circle:'◌',event:'◆',podcast:'♫'};
 const card=a=>'<a class="cs-reco-item" href="'+url[a.type]+encodeURIComponent(a.id)+'"><span class="cs-reco-icon">'+icon[a.type]+'</span><span><b>'+esc(a.title)+'</b><small>'+esc(a.meta)+'</small></span></a>';
 const section=(name,arr)=>'<section class="cs-reco-section"><h3>'+name+'</h3>'+arr.slice(0,5).map(card).join('')+'<div class="cs-reco-empty">'+(arr.length?'':'Nothing new to recommend yet.')+'</div></section>';
 host.innerHTML='<section class="cs-recommendations"><div class="cs-graph-head"><div><span class="cs-eyebrow">CROWSPACE // V28</span><h2>For You</h2><p>Recommendations learn from your relationships, activity, engagement and feedback across the CrowSpace universe.</p></div><a href="settings.html">Tune Recommendations →</a></div><div class="cs-reco-grid">'+section('People For You',person)+section('Posts For You',post)+section('Caws For You',caw)+section('Creators For You',person.filter(x=>creatorAffinity.has(x.id)))+section('Groups For You',group)+section('Circles For You',circle)+section('Events For You',event)+section('Podcasts For You',podcast)+'</div></section>';
 host.dataset.ready='1';
}
window.CrowSpaceRecommendations={refresh:()=>{const h=document.getElementById('cs-v28-recommendations');if(h)h.dataset.ready='';return build()}};
document.addEventListener('crowspace-universal-ready',()=>setTimeout(build,450));
document.addEventListener('crowspace-social-update',()=>setTimeout(()=>window.CrowSpaceRecommendations.refresh(),500));
})();