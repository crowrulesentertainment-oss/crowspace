(function(){
function init(){
  if(document.getElementById('rw49'))return;
  var s=document.createElement('section');
  s.id='rw49';
  s.innerHTML='<div><small>21.50.49</small><h2>RESEND DELIVERY WORKER</h2><p>The production worker claims queued delivery attempts, sends through Resend with an idempotency key, records the provider message ID, and transitions attempts to sent or deferred/failed.</p><div>Worker: queued → sending → sent / deferred / failed</div><div style="margin-top:8px;opacity:.78">Retries use the 21.50.48 attempt ledger and bounded exponential backoff. Resend credentials remain server-side Edge Function secrets.</div><div style="margin-top:8px;opacity:.7">Worker endpoint: crowspace-resend-delivery-worker-21-50-49 · ACTIVE</div></div>';
  document.body.appendChild(s);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();