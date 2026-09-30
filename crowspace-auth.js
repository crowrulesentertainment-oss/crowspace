/* CrowSpace Universal Supabase Authentication
 * V75 — shared client, stable auth lifecycle, profile bootstrap and diagnostics.
 */
(function () {
  'use strict';

  const URL = 'https://cevylpnoexugwgygvtgu.supabase.co';
  const KEY = 'sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-';

  window.CROW_CONFIG = Object.assign({}, window.CROW_CONFIG || {}, {
    supabaseUrl: URL,
    supabaseKey: KEY
  });

  function loadSDK() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      return Promise.resolve(window.supabase);
    }
    return new Promise(function (resolve, reject) {
      let script = document.querySelector('script[data-crowspace-supabase-sdk]');
      if (script) {
        script.addEventListener('load', function () { resolve(window.supabase); }, { once: true });
        script.addEventListener('error', reject, { once: true });
        return;
      }
      script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.dataset.crowspaceSupabaseSdk = 'true';
      script.onload = function () {
        if (window.supabase) resolve(window.supabase);
        else reject(new Error('Supabase SDK loaded without a client API.'));
      };
      script.onerror = function () { reject(new Error('Supabase SDK failed to load.')); };
      document.head.appendChild(script);
    });
  }

  function createClient(sdk) {
    return sdk.createClient(URL, KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      global: { headers: { 'x-application-name': 'crowspace' } }
    });
  }

  async function bootstrap() {
    const sdk = await loadSDK();
    const db = createClient(sdk);

    window.CrowSpaceAuth.client = db;
    window.CrowSpaceAuth.supabase = db;
    window.CrowSpaceSupabase = db;
    window.supabaseClient = db;
    window.db = db;

    const authResult = await db.auth.getUser();
    if (authResult.error && authResult.error.message !== 'Auth session missing!') throw authResult.error;
    window.CrowSpaceAuth.user = authResult.data?.user || null;

    window.CrowSpaceAuth.refreshUser = async function () {
      const result = await db.auth.getUser();
      if (result.error && result.error.message !== 'Auth session missing!') throw result.error;
      window.CrowSpaceAuth.user = result.data?.user || null;
      return window.CrowSpaceAuth.user;
    };

    window.CrowSpaceAuth.ensureProfile = async function (u) {
      if (!u) return null;
      const existing = await db.from('crowspace_profiles').select('user_id,username,display_name').eq('user_id', u.id).maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) return existing.data;

      const meta = u.user_metadata || {};
      const displayName = String(meta.display_name || meta.full_name || meta.name || u.email?.split('@')[0] || 'Crow Member').trim().slice(0, 80);
      const usernameBase = displayName.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 24);
      const username = usernameBase || ('crow' + u.id.replace(/-/g, '').slice(0, 10));

      const result = await db.from('crowspace_profiles').upsert(
        { user_id: u.id, username: username, display_name: displayName },
        { onConflict: 'user_id' }
      ).select('user_id,username,display_name').single();

      if (result.error) {
        console.error('[CrowSpace Auth] Profile bootstrap failed:', result.error);
        return null;
      }
      return result.data;
    };

    window.CrowSpaceAuth.signOut = function () { return db.auth.signOut(); };

    db.auth.onAuthStateChange(function (event, session) {
      window.CrowSpaceAuth.user = session?.user || null;
      window.dispatchEvent(new CustomEvent('crowspace-auth', {
        detail: { event: event, user: window.CrowSpaceAuth.user, session: session || null }
      }));
    });

    window.dispatchEvent(new CustomEvent('crowspace:supabase-ready', { detail: db }));
    window.dispatchEvent(new CustomEvent('crowspace-auth-ready', {
      detail: { user: window.CrowSpaceAuth.user, client: db }
    }));
    return db;
  }

  window.CrowSpaceAuth = { ready: null, client: null, supabase: null, user: null, refreshUser: null, ensureProfile: null, signOut: null };
  window.CrowSpaceAuth.ready = bootstrap().catch(function (error) {
    console.error('[CrowSpace Auth] Supabase initialization failed:', error);
    window.dispatchEvent(new CustomEvent('crowspace:supabase-error', { detail: error }));
    window.dispatchEvent(new CustomEvent('crowspace-auth-error', { detail: error }));
    throw error;
  });
})();
