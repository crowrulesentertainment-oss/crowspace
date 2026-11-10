# CrowSpace 3.0

**Your People. Your Stories. Your Space.** A standalone multi-page social network powered by CrowRules Entertainment.

## Phase 1 foundation
- Responsive cinematic design system and multi-page navigation
- Supabase Auth email/password sign-up, sign-in and sign-out
- CrowID assigned by Postgres and attached to existing CrowSpace profiles
- Profile basics: display name, username, bio and location
- Existing CrowSpace data, account links and RLS policies are preserved

## Pages
Public landing, authentication, member home, profile, explore, connections, notifications, groups, events, Messenger and settings.

## Supabase setup
Uses the existing CrowRules Supabase project and its CrowSpace publishable key. A publishable key is safe for browser use only when RLS is correctly configured. Never commit a service-role or secret key.

The additive SQL migration extends the existing `public.crowspace_profiles` table. It does not drop, replace or recreate tables.

In Supabase Dashboard → Authentication → URL Configuration, allow the deployed site URL: `https://crowrulesentertainment-oss.github.io/crowspace/`. Enable Email provider and set email confirmation redirect URLs to the same site.

Serve locally over HTTP (for example, a static development server); ES modules do not run reliably from file://.

## Phase 2 social network
- Personalized feed using a dedicated `crowspace_posts` table; legacy `crowspace_wall_posts` remains intact
- Text and photo publishing with audience controls
- Comments, reactions and member connections
- Member discovery, follow/unfollow and connection requests
- Activity notifications created by database triggers
- Realtime notification and feed refresh
- Uses a dedicated private `crowspace-posts` bucket for photos

The Phase 2 migration is additive and preserves existing CrowSpace tables and policies. New public-schema tables receive explicit least-privilege Data API grants and RLS. The browser uses only the Supabase publishable key.

## Phase 3 communities and events
- Community discovery and creation with public/private visibility and open/request join settings
- Membership roles, owner management, join requests and membership status
- Community discussion posts and comments
- Event creation with community association, event format, local timezone, start/end time and location details
- Event invitations, invitation responses and Going/Interested RSVPs
- Community invitations with inbox, accept/decline and membership activation
- Community owner/admin/moderator roster controls, join-request moderation and member restrictions
- Interactive monthly calendar with month navigation, event-day indicators, selected-day details, RSVP and creator invite controls
- Dedicated additive tables: `crowspace_communities`, `crowspace_community_members`, `crowspace_community_posts`, `crowspace_community_comments`, `crowspace_community_invitations`, `crowspace_events`, `crowspace_event_invitations`, and `crowspace_event_rsvps`
- Row Level Security enabled on all Phase 3 tables; anonymous access revoked and authenticated access explicitly granted
- Existing legacy group-chat tables and CrowRules community/event tables are not repurposed or overwritten

The Phase 3 schema was applied to the existing Supabase project. Community and event pages are connected through `assets/js/phase3.js`; no service-role key is used in the browser.\n\n## Phase 3.1 community administration and calendar\n- Owner/admin/moderator community roster and moderation controls with role boundaries enforced by RLS\n- Member invitations with private-community invitation preview and accept/decline flow\n- Owner-only controls remain protected; moderators can restrict regular members but cannot promote roles\n- Interactive month grid with previous/next/today navigation, event indicators and selected-day event details\n- Additive Supabase policy hardening and private-schema membership-role helper; existing tables and unrelated CrowRules policies remain untouched\n- Browser-side JavaScript continues to use only the publishable key


## Phase 3.2 community experience expansion
- Community announcements are manager-only and trigger member notifications.
- Community managers can pin and unpin discussions; pin and announcement permissions are enforced server-side.
- Community detail pages show active member, discussion and upcoming event counts plus a recent activity timeline.
- Community notifications are generated for announcements, new community events, comments on a member's discussion, and new member joins; notification clicks open the related community or event.
- Event discovery includes upcoming events across accessible CrowSpace communities, keyword search, event-format filtering and date-range filtering.
- Fixed the community discussion read and insert RLS predicates so membership is checked against the discussion's actual community.
- Existing notifications table and community/event tables are reused; no service-role key or new public-facing table was introduced.
- Authenticated two-account end-to-end testing and live GitHub Pages deployment verification remain outstanding.
