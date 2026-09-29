/* CrowSpace — Alert Workflow Confidence-Aware Suggestion Routing v165
   Browser-only. Separates reassignment suggestions by descriptive evidence eligibility.
*/
(function(){
const SRC='crowspace-alert-workflow-suggestion-confidence-v164',KEY='crowspace-alert-workflow-confidence-routing-v165',J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return J(KEY,{routes:{ELIGIBLE:[],REVIEW:[],LIMITED:[]},updatedAt:null})}
function sync(){
 const src=J(SRC,{}),st=state(),routes={ELIGIBLE:[],REVIEW:[],LIMITED:[]};
 Object.values(src.suggestions||{}).forEach(x=>{
  const route=x.eligible?(x.band==='HIGH'?'ELIGIBLE':'REVIEW'):'LIMITED';
  routes[route].push({...x,route});
 });
 Object.keys(routes).forEach(k=>routes[k].sort((a,b)=>b.score-a.score));
 st.routes=routes;st.updatedAt=Date.now();S(KEY,st);return st
}
function queue(route){return state().routes[route]||[]}
function summary(){const r=state().routes;return {eligible:r.ELIGIBLE.length,review:r.REVIEW.length,limited:r.LIMITED.length,total:Object.values(r).reduce((n,a)=>n+a.length,0)}}
window.CrowSpaceAlertWorkflowConfidenceRoutingV165={state,sync,queue,summary};
setTimeout(sync,306000);setInterval(sync,30000);
})();