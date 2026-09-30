/* CrowSpace 21.5 — Shared UI Synchronization Layer */
window.CrowSpaceRecommendationUI21_5=(()=>{
  const mounts=new Map(),last={};
  function register(name,renderer){
    if(!name||typeof renderer!=="function") return ()=>{};
    mounts.set(name,renderer);
    return ()=>mounts.delete(name);
  }
  async function sync(detail={}){
    last.detail=detail;
    const jobs=[...mounts.entries()].map(async([name,fn])=>{
      try{return await fn(detail)}catch(e){console.warn("CrowSpace 21.5 UI:",name,e);return null}
    });
    return Promise.all(jobs);
  }
  document.addEventListener("crowspace:recommendation-update",e=>sync(e.detail||{}));
  document.addEventListener("crowspace:recommendation-ui-sync",e=>sync(e.detail||{}));
  window.addEventListener("crowspace:recommendation-rerank",e=>sync(e.detail||{}));
  return {version:"21.5",register,sync,last};
})();