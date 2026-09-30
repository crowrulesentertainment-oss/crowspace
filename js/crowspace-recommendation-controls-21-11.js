/* CrowSpace 21.11 — Recommendation Controls & Personalization Center */
window.CrowSpaceRecommendationControls21_11=(()=>{
 const version="21.11", KEY="crowspace-recommendation-controls";
 const defaults={intensity:"balanced",categories:{creators:true,caws:true,events:true,groups:true,circles:true,posts:true,projects:true,media:true,properties:true},preferCreators:[],topics:[],historyEnabled:true};
 const load=()=>{try{return {...defaults,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return {...defaults}}};
 const save=s=>{localStorage.setItem(KEY,JSON.stringify(s));window.dispatchEvent(new CustomEvent("crowspace:recommendation-controls",{detail:s}));return s};
 const reset=()=>save({...defaults});
 function intensityMultiplier(s){return s==="low"?.65:s==="high"?1.35:1}
 function allow(s,type){return s.categories?.[type]!==false}
 function center(container){
  if(!container)return;
  let s=load();
  container.innerHTML='<section class="cr21-11-center"><div class="cr21-11-kicker">CROWRULES // 21.11</div><h2>RECOMMENDATION CENTER</h2><p class="cr21-11-intro">You control how CrowSpace personalizes discovery. Changes apply to recommendations on this device.</p><label>DISCOVERY INTENSITY<select id="cr2111-intensity"><option value="low">Focused</option><option value="balanced">Balanced</option><option value="high">Expanded</option></select></label><div class="cr21-11-title">CONTENT YOU WANT TO DISCOVER</div><div class="cr21-11-cats">'+Object.keys(s.categories).map(k=>'<label><input type="checkbox" data-cat="'+k+'"> '+k.replace(/_/g," ")+'</label>').join("")+'</div><div class="cr21-11-actions"><button id="cr2111-save">Save preferences</button><button id="cr2111-reset">Reset personalization</button></div><div class="cr21-11-history"><strong>PERSONALIZATION HISTORY</strong><p>Recommendation activity is used to tailor your experience. Your controls can limit categories or reset local preference signals.</p><button id="cr2111-clear">Clear local personalization</button></div></section>';
  const intensity=container.querySelector("#cr2111-intensity");intensity.value=s.intensity;
  container.querySelectorAll("[data-cat]").forEach(x=>x.checked=s.categories[x.dataset.cat]!==false);
  container.querySelector("#cr2111-save").onclick=()=>{s.intensity=intensity.value;container.querySelectorAll("[data-cat]").forEach(x=>s.categories[x.dataset.cat]=x.checked);save(s);alert("Recommendation preferences saved.");};
  container.querySelector("#cr2111-reset").onclick=()=>{if(confirm("Reset your recommendation preferences?")){s=reset();center(container)}};
  container.querySelector("#cr2111-clear").onclick=()=>{localStorage.removeItem(KEY);window.dispatchEvent(new CustomEvent("crowspace:recommendation-reset"));s={...defaults};center(container)};
 }
 function install(){
  if(document.getElementById("cr21-11-style"))return;
  const st=document.createElement("style");st.id="cr21-11-style";st.textContent='.cr21-11-center{max-width:920px;margin:32px auto;padding:28px;border:1px solid rgba(255,255,255,.12);border-radius:24px;background:rgba(8,8,16,.82)}.cr21-11-kicker{font-size:.7rem;letter-spacing:.2em;opacity:.55}.cr21-11-center h2{margin:8px 0;font-size:1.8rem}.cr21-11-intro{opacity:.65;line-height:1.6}.cr21-11-center label{display:block;margin:18px 0}.cr21-11-center select{margin-left:12px;padding:8px 12px;border-radius:10px}.cr21-11-title{margin-top:28px;font-size:.7rem;letter-spacing:.16em;opacity:.6}.cr21-11-cats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-top:12px}.cr21-11-cats label{margin:0;padding:11px;border:1px solid rgba(255,255,255,.1);border-radius:12px;text-transform:capitalize}.cr21-11-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:24px}.cr21-11-actions button,.cr21-11-history button{padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.07);color:inherit;cursor:pointer}.cr21-11-history{margin-top:28px;padding:18px;border-radius:16px;background:rgba(255,255,255,.045)}.cr21-11-history p{opacity:.62;line-height:1.5}';document.head.appendChild(st);
 }
 return {version,load,save,reset,intensityMultiplier,allow,center,install};
})();