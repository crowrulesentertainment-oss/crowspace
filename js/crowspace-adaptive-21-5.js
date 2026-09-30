/* CrowSpace 21.5 — Visual Cross-Surface Adaptive Re-Ranking */
window.CrowSpaceAdaptive21_5=(()=>{
 const state={version:0,boosts:new Map(),suppressed:new Set(),lastAction:null};
 const listeners=new Set();
 const emit(reason,detail={})=>{state.version++;const d={reason,version:state.version,...detail};listeners.forEach(f=>{try{f(d)}catch(e){}});document.dispatchEvent(new CustomEvent("crowspace:adaptive-ui-update",{detail:d}));return d};
 const key=(t,id)=>String(t)+":"+String(id);
 function apply(action,type,id){
   const k=key(type,id);
   if(["hide","not_interested"].includes(action)) state.suppressed.add(k);
   if(action==="follow") state.boosts.set(k,(state.boosts.get(k)||0)+25);
   if(action==="like") state.boosts.set(k,(state.boosts.get(k)||0)+12);
   if(action==="save") state.boosts.set(k,(state.boosts.get(k)||0)+15);
   if(action==="more_like_this") state.boosts.set(k,(state.boosts.get(k)||0)+20);
   state.lastAction={action,type,id};
   emit(action,{action,type,id});
 }
 function decorate(items=[]){
   return items.filter(x=>!state.suppressed.has(key(x.type,x.id))).map(x=>({...x,score:Number(x.score||0)+(state.boosts.get(key(x.type,x.id))||0)})).sort((a,b)=>b.score-a.score);
 }
 function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}
 document.addEventListener("crowspace:recommendation-update",e=>{const d=e.detail||{};if(d.action&&d.type&&d.id)apply(d.action,d.type,d.id)});
 return {version:"21.5",state,apply,decorate,subscribe,emit};
})();