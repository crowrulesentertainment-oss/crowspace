/* CrowSpace — Alert Command Center Search + Drill-Down v152
   Browser-only. Provides local alert search and complete per-alert drill-down.
*/
(function(){
const A='crowspace-controlled-effect-regime-trajectory-alerts-v141',H='crowspace-controlled-effect-regime-alert-history-v142',R='crowspace-controlled-effect-regime-alert-resolution-v143',T='crowspace-controlled-effect-regime-alert-timeline-v144',KEY='crowspace-alert-command-center-drilldown-v152',J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}};
function state(){return J(KEY,{query:'',selected:null})}
function search(query){
 const q=String(query||'').toLowerCase().trim(),a=Object.values(J(A,{})),r=J(R,{}),h=J(H,{}).events||[],t=J(T,{});
 return a.filter(x=>{const rr=Object.values(r).find(v=>v.reason===x.reason),events=h.filter(e=>e.reason===x.reason),timeline=events.flatMap(e=>t[e.eventId]?.timeline||[]);return !q||[x.reason,x.status,(x.alerts||[]).join(' '),rr?.resolution||'',timeline.map(e=>e.status).join(' ')].join(' ').toLowerCase().includes(q)}).map(x=>({alert:x,resolution:Object.values(r).find(v=>v.reason===x.reason)||null,history:h.filter(e=>e.reason===x.reason),timelines:h.filter(e=>e.reason===x.reason).map(e=>({event:e,timeline:t[e.eventId]?.timeline||[]}))}))
}
function select(reason){const s=state();s.selected=reason;localStorage.setItem(KEY,JSON.stringify(s));return s}
window.CrowSpaceAlertCommandCenterDrilldownV152={state,search,select};
})();