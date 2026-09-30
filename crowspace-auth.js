/* CrowSpace Universal Supabase Authentication
 * V80 — bounded startup, shared client, deterministic lifecycle.
 */
(function () {
  'use strict';

  const URL = 'https://cevylpnoexugwgygvtgu.supabase.co';
  const KEY = 'sb_publishable_AdfM5y6RqvF3tbvEVzDZSg_JuGTQLD-';
  const SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  const TIMEOUT = 12000;

  window.CROW_CONFIG = Object.assign({}, window.CROW_CONFIG || {}, {
    supabaseUrl: URL,
    supabaseKey: KEY
  });

  window.CrowSpaceAuth = {
    ready: null,
    client: null,
    supabase: null,
    user: null,
    session: null,
    isLoggedIn: false,
    refreshUser: null,
    ensureProfile: null,
    signOut: null
  };

  function withTimeout(promise, ms, message) {
    let timer;
    const guard = new Promise(function (_, reject) {
      timer = setTimeout(function () { reject(new Error(message)); }, ms);
    });
    return Promise.race([promise, guard]).finally(function () {
      clearTimeout(timer);
    });
  }

  function loadSDK() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      return Promise.resolve(window.supabase);
    }

    return new Promise(function (resolve, reject) {
      let script = document.querySelector('script[data-crowspace-supabase-sdk]');

      if (script) {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
          resolve(window.supabase);
          return;
        }

        let done = false;
        function finish(fn, value) {
          if (done) return;
          done = true;
          fn(value);
        }

        script.addEventListener('load', function () {
          if (window.supabase && typeof window.supabase.createClient === 'function') {
            finish(resolve, window.supabase);
          } else {
            finish(reject, new Error('Supabase SDK loaded without a client API.'));
          }
        }, { once: true });

        script.addEventListener('error', function () {
          finish(reject, new Error('Supabase SDK failed to load.'));
        }, { once: true });

        setTimeout(function () {
          finish(reject, new Error('Supabase SDK load timed out.'));
        }, TIMEOUT);
        return;
      }

      script = document.createElement('script');
      script.src = SDK_URL;
      script.async = true;
      script.dataset.crowspaceSupabaseSdk = 'true';

      script.onload = function () {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
          resolve(window.supabase);
        } else {
          reject(new Error('Supabase SDK loaded without a client API.'));
        }
      };

      script.onerror = function () {
        reject(new Error('Supabase SDK failed to load.'));
      };

      document.head.appendChild(script);

      setTimeout(function () {
        reject(new Error('Supabase SDK load timed out.'));
      }, TIMEOUT);
    });
  }

  function createClient(sdk) {
    const existing = window.CrowRulesAuth && window.CrowRulesAuth.client;
    if (existing && typeof existing.from === 'function' && existing.auth) return existing;

    return sdk.createClient(URL, KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: 'crowrules-universal-session-v1',
        storage: window.localStorage
      },
      global: {
        headers: { 'x-application-name': 'crowspace' }
      }
    });
  }

  async function bootstrap() {
    const sdk = await withTimeout(
      loadSDK(),
      TIMEOUT,
      'Supabase SDK initialization timed out.'
    );

    const db = createClient(sdk);

    window.CrowSpaceAuth.client = db;
    window.CrowSpaceAuth.supabase = db;
    window.CrowSpaceSupabase = db;
    window.supabaseClient = db;
    window.db = db;

    if (window.CrowRulesAuth) {
      window.CrowRulesAuth.client = db;
      window.CrowRulesAuth.ready = Promise.resolve(db);
    }

    const sessionResult = await withTimeout(
      db.auth.getSession(),
      TIMEOUT,
      'Supabase session lookup timed out.'
    );

    if (sessionResult.error) throw sessionResult.error;

    let user = null;

    try {
      const authResult = await withTimeout(
        db.auth.getUser(),
        TIMEOUT,
        'Supabase user lookup timed out.'
      );

      if (authResult.error && authResult.error.message !== 'Auth session missing!') {
        throw authResult.error;
      }

      user = authResult.data && authResult.data.user || null;
    } catch (error) {
      if (!String(error && error.message || '').toLowerCase().includes('session missing')) {
        throw error;
      }
    }

    window.CrowSpaceAuth.session =
      sessionResult.data && sessionResult.data.session || null;

    window.CrowSpaceAuth.user =
      user ||
      (window.CrowSpaceAuth.session && window.CrowSpaceAuth.session.user) ||
      null;

    window.CrowSpaceAuth.isLoggedIn = !!window.CrowSpaceAuth.user;

    window.CrowSpaceAuth.refreshUser = async function () {
      const result = await withTimeout(
        db.auth.getUser(),
        TIMEOUT,
        'User refresh timed out.'
      );

      if (result.error && result.error.message !== 'Auth session missing!') {
        throw result.error;
      }

      window.CrowSpaceAuth.user = result.data && result.data.user || null;
      window.CrowSpaceAuth.isLoggedIn = !!window.CrowSpaceAuth.user;
      return window.CrowSpaceAuth.user;
    };

    window.CrowSpaceAuth.ensureProfile = async function (u) {
      if (!u) return null;

      const existing = await withTimeout(
        db.from('crowspace_profiles')
          .select('user_id,username,display_name')
          .eq('user_id', u.id)
          .maybeSingle(),
        TIMEOUT,
        'Profile lookup timed out.'
      );

      if (existing.error) throw existing.error;
      if (existing.data) return existing.data;

      const meta = u.user_metadata || {};
      const displayName = String(
        meta.display_name ||
        meta.full_name ||
        meta.name ||
        (u.email ? u.email.split('@')[0] : '') ||
        'Crow Member'
      ).trim().slice(0, 80);

      // creator_category is NOT NULL in crowspace_profiles.
      // Always provide a safe category during universal profile bootstrap.
      const creatorCategory = String(
        meta.creator_category ||
        meta.creatorCategory ||
        'Creator'
      ).trim().slice(0, 80) || 'Creator';

      const base =
        displayName.toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 20) || 'crow';

      const suffix = u.id.replace(/-/g, '').slice(0, 8);
      const candidates = [
        base,
        base + '_' + suffix,
        'crow_' + suffix
      ];

      for (const username of candidates) {
        const result = await withTimeout(
          db.from('crowspace_profiles')
            .upsert(
              {
                user_id: u.id,
                username: username,
                display_name: displayName,
                creator_category: creatorCategory
              },
              { onConflict: 'user_id' }
            )
            .select('user_id,username,display_name')
            .single(),
          TIMEOUT,
          'Profile creation timed out.'
        );

        if (!result.error) return result.data;

        const msg = String(result.error.message || '').toLowerCase();
        const conflict =
          result.error.code === '23505' ||
          msg.includes('duplicate') ||
          msg.includes('unique');

        if (!conflict) {
          console.error('[CrowSpace Auth] Profile bootstrap failed:', result.error);
          return null;
        }
      }

      console.error('[CrowSpace Auth] Could not allocate a unique username for profile', u.id);
      return null;
    };

    window.CrowSpaceAuth.signOut = function () {
      return db.auth.signOut();
    };

    db.auth.onAuthStateChange(function (event, session) {
      window.CrowSpaceAuth.session = session || null;
      window.CrowSpaceAuth.user = session && session.user || null;
      window.CrowSpaceAuth.isLoggedIn = !!window.CrowSpaceAuth.user;

      window.dispatchEvent(new CustomEvent('crowspace-auth', {
        detail: {
          event: event,
          user: window.CrowSpaceAuth.user,
          session: session || null
        }
      }));
    });

    window.dispatchEvent(
      new CustomEvent('crowspace:supabase-ready', { detail: db })
    );

    window.dispatchEvent(
      new CustomEvent('crowspace-auth-ready', {
        detail: {
          user: window.CrowSpaceAuth.user,
          client: db
        }
      })
    );

    return db;
  }

  window.CrowSpaceAuth.ready = bootstrap().catch(function (error) {
    console.error('[CrowSpace Auth] Supabase initialization failed:', error);

    window.dispatchEvent(
      new CustomEvent('crowspace:supabase-error', { detail: error })
    );

    window.dispatchEvent(
      new CustomEvent('crowspace-auth-error', { detail: error })
    );

    throw error;
  });
})();