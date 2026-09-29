/* CrowSpace — Alert Command Center Filters v151
   Browser-only. Provides client-side filtering for the consolidated alert command center.
*/
(function(){
const A='crowspace-controlled-effect-regime-trajectory-alerts-v141',R='crowspace-controlled-effect-regime-alert-resolution-v143',KEY='crowspace-alert-command-center-filters-v151',J=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(e){return d}};
function state(){return J(KEY,{status:'ALL',severity:'ALL',reason:'ALL',lifecycle:'ALL'})}
function options(){
 const a=Object.values(J(A,{})),r=J(R,{}),reasons=[...new Set(a.map(x=>x.reason).filter(Boolean))];
 return {statuses:['ALL','CRITICAL','WARNING','WATCH','CLEAR'],severities:['ALL','CRITICAL','WARNING','WATCH'],lifecycles:['ALL','RESOLVED','PERSISTING','REOPENED'],reasons:['ALL',...reasons],alerts:a,resolutions:r}
}
function filter(f){
 const o=options(),r=o.resolutions||{};
 return o.alerts.filter(x=>{
  const rr=Object.values(r).find(v=>v.reason===x.reason);
  return (f.status==='ALL'||x.status===f.status)&&(f.severity==='ALL'||x.status===f.severity)&&(f.reason==='ALL'||x.reason===f.reason)&&(f.lifecycle==='ALL'||rr?.resolution===f.lifecycle);
 });
}
function set(next){const s={...state(),...next};localStorage.setItem(KEY,JSON.stringify(s));return s}
window.CrowSpaceAlertCommandCenterFiltersV151={state,options,filter,set};
})();