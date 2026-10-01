(function(){
function init(){
  if(document.getElementById('rw48'))return;
  var s=document.createElement('section');
  s.id='rw48';
  s.innerHTML='<div><small>21.50.48</small><h2>DELIVERY ATTEMPT LEDGER</h2><p>Each notification delivery now has an immutable attempt history. Retries use bounded exponential backoff and stop after the configured maximum.</p><div>Ledger: queued · deferred · sending · sent · failed</div><div style="margin-top:8px;opacity:.78">Provider message IDs remain attached to individual attempts, while the delivery record keeps the current retry state.</div><div style="margin-top:8px;opacity:.7">Resend credentials and signing secrets remain server-side; GitHub Pages never receives them.</div></div>';
  document.body.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();