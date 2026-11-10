# CrowSpace 3.0

**Your People. Your Stories. Your Space.** A standalone multi-page social network powered by CrowRules Entertainment.

## Phase 1 foundation
- Responsive cinematic design system and multi-page navigation
- Supabase Auth email/password sign-up, sign-in and sign-out
- CrowID assigned by Postgres and attached to existing CrowSpace profiles
- Profile basics: display name, username, bio and location
- Existing CrowSpace data, account links and RLS policies are preserved

## Pages
Public landing, authentication, member home, profile, explore, groups, events, Messenger and settings.

## Supabase setup
Uses the existing CrowRules Supabase project and its CrowSpace publishable key. A publishable key is safe for browser use only when RLS is correctly configured. Never commit a service-role or secret key.

The additive SQL migration extends the existing `public.crowspace_profiles` table. It does not drop, replace or recreate tables.

In Supabase Dashboard → Authentication → URL Configuration, allow the deployed site URL: `https://crowrulesentertainment-oss.github.io/crowspace/`. Enable Email provider and set email confirmation redirect URLs to the same site.

Serve locally over HTTP (for example, a static development server); ES modules do not run reliably from file://.

## Scope
Phase 1 provides the public shell, account authentication and CrowID/profile foundation. Posting, group administration, event management and realtime Messenger are later phases and are not represented as live features yet.
