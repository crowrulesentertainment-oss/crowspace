/* CrowSpace — Alert Workflow Escalation Routing v158
   Browser-only. Routes local escalation notifications into deterministic priority queues.
*/
(function(){
const SRC='crowspace-alert-workflow-escalation-notifications-v157',KEY='crowspace-alert-workflow-escalation-routing-v158',J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}},S=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const ORDER={CRITICAL:0,HIGH:1,ELEVATED:2,NORMAL:3};
function state(){return J(KEY,{queues:{CRITICAL:[],HIGH:[],ELEVATED:[],NORMAL:[]},updatedAt:null})}
function sync(){
 const src=J(SRC,{notifications:[]}),st=state(),q={CRITICAL:[],HIGH:[],ELEVATED:[],NORMAL:[]};
 (src.notifications||[]).forEach(n=>{if(q[n.priority])q[n.priority].push({...n,route:n.priority,routeAt:Date.now()})});
 Object.keys(q).forEach(k=>q[k].sort((a,b)=>Number(b.createdAt||0)-Number(a.createdAt||0)));
 st.queues=q;st.updatedAt=Date.now();S(KEY,st);return st
}
function queue(priority){return state().queues[priority]||[]}
function summary(){const s=state().queues;return {critical:s.CRITICAL.length,high:s.HIGH.length,elevated:s.ELEVATED.length,normal:s.NORMAL.length,total:Object.values(s).reduce((n,a)=>n+a.length,0)}}
window.CrowSpaceAlertWorkflowEscalationRoutingV158={state,sync,queue,summary};
setTimeout(sync,285000);setInterval(sync,30000);
})();