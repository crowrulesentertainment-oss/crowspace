/* CrowSpace 21.12 — Preference-Aware Recommendation Runtime */
window.CrowSpacePreferenceRuntime21_12=(()=>{
 const version="21.12", KEY="crowspace-recommendation-controls", typeMap={creator:"creators",caw:"caws",event:"events",group:"groups",circle:"circles",post:"posts",project:"projects",portfolio:"projects",media:"media",media_album:"media",property:"properties"};
 const defaults={intensity:"balanced",categories:{creators:true,caws:true,events:true,groups:true,circles:true,posts:true,projects:true,media:true,properties:true},preferCreators:[],topics:[],historyEnabled:true};
 const read=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return {...defaults}}};
 const multiplier=s=>s==="low"?.65:s==="high"?1.35:1;
 const allowed=(s,t)=>s.categories?.[typeMap[t]||t]!==false;
 const suppressed=(s,x)=>Array.isArray(s.suppressed)?s.suppressed.includes(String(x.id)):false;
 function apply(items,s=read()){const m=multiplier(s);return (items||[]).filter(x=>allowed(s,x.type)&&!suppressed(s,x)).map(x=>({...x,score:Number(x.score||0)*m,preferenceIntensity:s.intensity,preferenceFiltered:true})).sort((a,b)=>b.score-a.score)}
 function controls(){return read()}
 function set(next){const merged={...read(),...next,categories:{...read().categories,...(next.categories||{})}};localStorage.setItem(KEY,JSON.stringify(merged));document.dispatchEvent(new CustomEvent("crowspace:recommendation-controls",{detail:merged}));return merged}
 function reset(){localStorage.removeItem(KEY);document.dispatchEvent(new CustomEvent("crowspace:recommendation-reset"));return read()}
 async function recommend(db,user,limit=60){if(!window.CrowSpaceRecommendations21_2)return [];const base=await window.CrowSpaceRecommendations21_2.recommend(db,user,Math.max(limit,100));return apply(base).slice(0,limit)}
 function wire(){document.addEventListener("crowspace:recommendation-update",()=>{});document.addEventListener("crowspace:recommendation-controls",()=>window.dispatchEvent(new CustomEvent("crowspace:recommendation-rerank",{detail:{version,controls:read()}})));document.addEventListener("crowspace:recommendation-reset",()=>window.dispatchEvent(new CustomEvent("crowspace:recommendation-rerank",{detail:{version,controls:read(),reset:true}})))}
 return {version,defaults,controls,set,reset,apply,recommend,allowed,wire};
})();