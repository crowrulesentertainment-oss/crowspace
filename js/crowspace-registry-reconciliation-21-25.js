/* CrowSpace 21.25 — Universal Registry Reconciliation */
window.CrowSpaceRegistryReconciliation21_25=(()=>{const version="21.25";
async function run(db){if(!db)throw Error("CrowSpaceDB unavailable");const r=await db.rpc("crowspace_registry_reconcile");if(r.error)throw r.error;if(window.CrowSpaceEntityRegistry21_19)window.CrowSpaceEntityRegistry21_19.invalidate();return r.data}
async function log(db,limit=100){const r=await db.from("crowspace_entity_registry_reconciliation_log").select("*").order("created_at",{ascending:false}).limit(limit);if(r.error)throw r.error;return r.data||[]}
return{version,run,log}})();