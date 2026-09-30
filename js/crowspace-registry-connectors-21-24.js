/* CrowSpace 21.24 — Universal Registry Source Connectors */
window.CrowSpaceRegistryConnectors21_24=(()=>{const version="21.24";
async function repair(db){if(!db)throw Error("CrowSpaceDB unavailable");const r=await db.rpc("crowspace_registry_connector_repair");if(r.error)throw r.error;if(window.CrowSpaceEntityRegistry21_19)window.CrowSpaceEntityRegistry21_19.invalidate();return r.data}
async function snapshot(db){if(!db)throw Error("CrowSpaceDB unavailable");const r=await db.rpc("crowspace_registry_source_snapshot");if(r.error)throw r.error;return r.data||[]}
async function audit(db,limit=100){if(!db)throw Error("CrowSpaceDB unavailable");const r=await db.from("crowspace_entity_registry_repair_log").select("*").order("created_at",{ascending:false}).limit(limit);if(r.error)throw r.error;return r.data||[]}
return{version,repair,snapshot,audit}})();