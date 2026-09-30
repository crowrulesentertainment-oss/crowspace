/* CrowSpace Universal Supabase Client
 * V75 — one client for the entire CrowSpace frontend
 * Safe for GitHub Pages: uses the Supabase publishable key (anon-level key).
 */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://cevylpnoexugwgygvtgu.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-';

  window.CROW_CONFIG = Object.assign({}, window.CROW_CONFIG || {}, {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_PUBLISHABLE_KEY
  });

  function loadSDK() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      return Promise.resolve(window.supabase);
    }
    return new Promise(function (resolve, reject) {
      const existing = document.querySelector('script[data-crowspace-supabase-sdk]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(window.supabase); });
        existing.addEventListener('error', reject);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.dataset.crowspaceSupabaseSdk = 'true';
      script.onload = function () {
        if (window.supabase) resolve(window.supabase);
        else reject(new Error('Supabase SDK loaded but was not exposed.'));
      };
      script.onerror = function () { reject(new Error('Unable to load Supabase SDK.')); };
      document.head.appendChild(script);
    });
  }

  window.CrowSpaceSupabaseReady = loadSDK().then(function (sdk) {
    const client = sdk.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: {
        headers: { 'x-application-name': 'crowspace' }
      }
    });

    window.CrowSpaceSupabase = client;
    window.db = client;
    window.supabaseClient = client;

    window.dispatchEvent(new CustomEvent('crowspace:supabase-ready', { detail: client }));
    return client;
  }).catch(function (error) {
    console.error('[CrowSpace] Supabase initialization failed:', error);
    window.dispatchEvent(new CustomEvent('crowspace:supabase-error', { detail: error }));
    throw error;
  });
})();
