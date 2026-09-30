/* CrowSpace Governance Validation Control Center — 21.50.24 */
(function(){
  const CONFIG=window.CROW_CONFIG||{};
  const URL=CONFIG.supabaseUrl||"https://cevylpnoexugwgygvtgu.supabase.co";
  const KEY=CONFIG.supabaseKey||CONFIG.supabasePublishableKey;
  const boxId="crowspace-validation-21-50-24";
  async function boot(){
    const host=document.getElementById(boxId);
    if(!host||!window.supabase||!KEY)return;
    const db=window.supabase.createClient(URL,KEY);
    host.innerHTML='<section class="crv24"><div class="crv-head"><div><span class="crv-kicker">21.50.24</span><h2>GOVERNANCE VALIDATION CONTROL CENTER</h2><p>Administrator-only end-to-end prevention health validation.</p></div><button id="crv-run">RUN E2E VALIDATION</button></div><div id="crv-status">READY</div><div id="crv-checks"></div><h3>PREVIOUS VALIDATION RUNS</h3><div id="crv-runs">Loading…</div><p class="crv-note">Synthetic validation creates controlled test evidence. Cleanup is explicit and administrator-only.</p><button id="crv-clean">CLEAN SYNTHETIC RUNS</button></section><style>
.crv24{background:linear-gradient(145deg,rgba(10,12,25,.98),rgba(19,10,35,.94));border:1px solid rgba(122,104,255,.35);border-radius:18px;padding:22px;color:#eef1ff;font-family:Montserrat,system-ui;margin:20px 0}.crv-head{display:flex;justify-content:space-between;gap:20px;align-items:center}.crv-kicker{font:700 11px Orbitron;letter-spacing:2px;color:#8ce8ff}.crv24 h2{font:800 20px Orbitron;margin:7px 0}.crv24 p{color:#aeb7d8}.crv24 button{border:1px solid #6f68ff;background:#17152d;color:#fff;padding:11px 15px;border-radius:10px;font-weight:800;cursor:pointer}.crv24 button:hover{filter:brightness(1.25)}#crv-status{margin:18px 0;padding:12px;border-radius:10px;background:#101326;font:700 12px Orbitron;letter-spacing:1px}.crv-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px}.crv-card{padding:13px;border:1px solid #30365d;border-radius:12px;background:#0c1020}.crv-card b{display:block;margin-bottom:7px}.ok{color:#76f2bb}.bad{color:#ff8495}.crv24 h3{font:700 13px Orbitron;margin-top:24px}.crv-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #272c49;font-size:13px}.crv-note{font-size:12px}.crv24 button:disabled{opacity:.5;cursor:wait}@media(max-width:700px){.crv-head{flex-direction:column;align-items:stretch}}
</style>';
    const status=document.getElementById("crv-status"), checks=document.getElementById("crv-checks"), runs=document.getElementById("crv-runs");
    function renderChecks(c){
      const map=[["case_created","Case created"],["shield_created","Shield created"],["action_created","Action created"],["outcome_created","Outcome created"],["timeline_capture","Timeline captured"],["alert_lifecycle","Alert / lifecycle checks"]];
      checks.innerHTML='<div class="crv-grid">'+map.map(([k,l])=>'<div class="crv-card"><b>'+l+'</b><span class="'+(c&&c[k]?'ok':'bad')+'">'+(c&&c[k]?"PASS":"PENDING")+'</span></div>').join("")+'</div>';
    }
    async function loadRuns(){
      const r=await db.from("crowspace_governance_validation_runs_21_50_23").select("id,run_key,status,case_id,checks,started_at,completed_at").order("started_at",{ascending:false}).limit(10);
      if(r.error){runs.textContent="Administrator authorization required.";return}
      runs.innerHTML=r.data.length?r.data.map(x=>'<div class="crv-row"><span>'+x.status.toUpperCase()+' · '+new Date(x.started_at).toLocaleString()+'</span><span>'+(x.case_id||"—")+'</span></div>').join(""):"No validation runs yet.";
    }
    document.getElementById("crv-run").onclick=async()=>{const b=document.getElementById("crv-run");b.disabled=true;status.textContent="RUNNING…";checks.innerHTML="";const r=await db.rpc("crowspace_governance_e2e_validation_21_50_23");if(r.error){status.textContent="FAILED — "+r.error.message;b.disabled=false;await loadRuns();return}status.textContent=r.data&&r.data.passed?"PASSED — END-TO-END EVIDENCE VERIFIED":"FAILED — REVIEW DIAGNOSTICS";renderChecks(r.data.checks||{});await loadRuns();b.disabled=false};
    document.getElementById("crv-clean").onclick=async()=>{if(!confirm("Delete synthetic validation runs and their controlled cases?"))return;status.textContent="CLEANUP IS ADMIN-ONLY AND REQUIRES A SERVER-SIDE RETENTION FUNCTION.";};
    renderChecks(null);loadRuns();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot);else boot();
})();