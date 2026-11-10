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

## Phase 4 messaging and real-time communication
- Rebuilt the existing Messenger entry point into a unified inbox for private one-to-one conversations and existing group chats.
- Direct messages use dedicated conversation/member/message tables with a unique participant pair, member-only reads, authenticated message writes, and database-created notifications.
- Existing `crowspace_group_conversations`, `crowspace_group_members`, and `crowspace_group_messages` are reused; the legacy group-chat data model is not replaced.
- Group creation, member invitations by username, roster viewing, owner-controlled admin promotion/demotion, and admin member removal are supported.
- Real-time message updates, private-channel typing indicators, and online presence use membership-authorized Realtime channels.
- Read positions and live read receipts, unread counts, pinning, muting, archiving, conversation-list search, and in-thread search are included (the inbox currently loads the latest 100 messages per thread).
- Image, video, document, and audio attachments use the existing private `crowspace-messenger` Storage bucket; voice notes use browser microphone recording where supported.
- Direct-message blocking and message/conversation reporting are supported. Direct and group-message notifications respect mute settings and route back to the correct conversation.
- Six new direct-message tables have RLS enabled, anonymous table access is revoked, and member-only policies guard reads and writes. The browser continues to use only the publishable Supabase key.
- Migration source: `database/migrations/20261110_crowspace_phase4_messaging.sql`.
- Remaining verification: authenticated two-account end-to-end testing, microphone/media testing across browsers, and live GitHub Pages verification. These have not been represented as completed.

## Phase 5 Creator Passport, achievements and member recognition
- The member profile now acts as a Creator Passport with creator category, portfolio tagline and biography, skills/interests, and a selected-project showcase.
- Members can add and remove their own skills and showcase projects. Showcase links are restricted to HTTP/HTTPS URLs.
- Achievement catalog, member awards and milestone history use dedicated additive tables with RLS enabled; anonymous access is revoked.
- Public-profile visibility controls whether other authenticated members can view skills, showcase items, earned achievements and milestones; private profiles remain visible to their owner and authorized administrators.
- CrowSpace automatically records first-account, first-post, first-community and first-event RSVP milestones. Matching first-post, community-builder and showed-up achievements are automatically awarded when the corresponding milestones are earned.
- Milestones and achievement awards create member notifications using database triggers.
- Administrator achievement tools support catalog creation, activation/deactivation, and member awards. Administrator access requires the trusted Supabase Auth app_metadata claim `crowspace_admin=true`; it is not based on user-editable profile metadata.
- No service-role key is used in the browser. Existing profiles, posts, communities, events, notifications and messaging tables are reused without replacement.
- Authenticated multi-account browser testing and GitHub Pages runtime verification remain outstanding.

### Phase 5 administrator setup
To enable the achievement desk for a trusted administrator, open Supabase Dashboard → Authentication → Users → select the intended administrator → edit **app_metadata** and add `{"crowspace_admin": true}`. Save the change and have that user sign out and back in so the refreshed JWT includes the trusted claim. Do not put this flag in user-editable `user_metadata`; the database policies intentionally authorize only from `app_metadata`.

## Phase 5.1 Public Creator Passport profiles
- Explore now serves as a searchable public Creator Passport directory with creator-category filtering, profile cards, and direct profile links.
- Public profile routes use `profile.html?username=<username>` and render a read-only portfolio view with skills, showcase projects, earned achievements and milestones.
- Members can choose Public or Private visibility from the Creator Passport editor. Public profiles are discoverable by signed-in CrowSpace members; private Creator Passport content is not listed or rendered to other members.
- Public profile viewers can message the member from their Passport.
- Corrected the skills and showcase SELECT policies to correlate against the outer row's owner ID. The earlier policy expression could unintentionally match every public profile.
- Profile SELECT is restricted to the owner, public profiles, and trusted administrators. Private profile records and their portfolio data are not visible to other members. Anonymous access to the profiles table is revoked; authenticated access remains governed by RLS.
- Existing friendships, profile, skills, showcase, achievement and milestone tables are reused; no new tables or service-role browser credentials were introduced.
- Browser-based multi-account privacy verification remains outstanding.


## Phase 6 Creator Collaboration & Opportunity Network
- Collaboration discovery searches public Creator Passports and member skills; creators can send and manage collaboration invitations.
- Opportunity Board supports volunteer roles, creative project openings, collaboration requests and resource exchange, with remote/local/hybrid filters, applications and reports.
- Project Workspaces reuse the existing CrowSpace project and membership tables; owners can invite contributors and teams can post progress updates.
- Creator availability lets members signal whether they are open to collaboration, seeking a team, available for volunteer work, or unavailable.
- Completed projects can be marked for public portfolio display using the existing public project visibility model.
- Administrator moderation queue reviews opportunity reports. Admin authorization uses trusted Supabase `app_metadata.crowspace_admin=true`.
- Additive migration: `database/migrations/20261110_crowspace_phase6_collaboration_network.sql`. New collaboration, opportunity, application, update and report tables have RLS enabled and explicit authenticated grants; anonymous access is revoked. Existing project tables and their established policies are reused.
- Browser multi-account testing, opportunity application moderation, live Pages verification and full project invitation acceptance testing remain outstanding.


## Phase 6.2 — Collaboration experience and workflow upgrade
- Opportunity owners have an in-page application review panel with applicant introductions and reviewing/accepted/declined actions.
- Members can track their own opportunity applications and withdraw applications that are still submitted or under review.
- The invitation center separates incoming and sent invitations, shows pending counts, and supports accepting, declining, and cancelling pending invitations.
- Project workspaces display a clearer team roster; owners can remove project members and invitees can decline outstanding project invitations.
- Existing Phase 6.1 database transition guards and row-level security remain in place; no new tables or broad policy changes were required.
- Browser-based multi-account end-to-end testing remains a separate verification step.
