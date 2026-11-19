# CrowSpace — CrowRules Universe

**One company. One universe.** A free social network connecting every CrowRules Entertainment branch.

## Rebuild status
The GitHub repository was empty at the start of this rebuild. This commit establishes the static multi-page HTML/CSS/JavaScript frontend. The existing Supabase project remains the backend of record. No SQL, migrations, policies, storage buckets, Realtime settings, or data were changed.

## Product decisions
- One account has access to every branch.
- Following, group membership and notifications remain member-controlled.
- Personalized feed with Following and Branches views planned.
- Direct messages and group chats.
- Free access for everyone.
- Full network experience is the target launch scope.

## Backend inventory and feature mapping
See [docs/backend-inventory.md](docs/backend-inventory.md) for the 57-table inventory, columns, policy counts and screen mapping.

| Feature | Existing backend tables | Frontend destination |
|---|---|---|
| Identity | `crowspace_account_links`, `crowspace_profiles` | Auth/profile context |
| Profiles & portfolios | `crowspace_profiles`, `crowspace_profile_skills`, `crowspace_profile_showcase` | `profile.html` |
| Personalized feed | `crowspace_posts`, `crowspace_post_media`, `crowspace_post_comments`, `crowspace_post_reactions`, `crowspace_follows` | `feed.html` |
| Profile walls | `crowspace_wall_posts` | Profile timeline |
| Discovery | profiles, follows, skills, showcase, collaboration availability | `discover.html` |
| Direct messages | direct conversations/members/messages/attachments/blocks/reports | `messages.html` |
| Group chats | group conversations/members/messages/attachments | `messages.html` |
| Communities | communities, community members/posts/comments/invitations | `groups.html` |
| Events | events, RSVPs, invitations | `events.html` |
| Notifications | `crowspace_notifications` | Shared notification center (next integration) |
| Photos | albums, album photos, photo comments/reactions/shares/tags | Gallery (next integration) |
| Live rooms | live rooms, participants, messages, reactions, reminders | Live experiences (next integration) |
| Collaboration | availability, invitations | Discover / collaboration (next integration) |
| Opportunities | opportunities, applications, reports | Opportunities (next integration) |
| Projects | projects, project members/updates/milestones | Creator workspaces (next integration) |
| Templates | project templates, reviews, featured templates | Creator workspaces (next integration) |
| Publications | publications, publication assets | Member publications (next integration) |
| Recognition | achievements, member achievements, milestones | Profile badges (next integration) |

## Frontend structure
`index.html`, `feed.html`, `discover.html`, `branches.html`, `profile.html`, `messages.html`, `groups.html`, `events.html`, `settings.html`; shared CSS under `assets/css/`; ES modules under `assets/js/`; verified inventory and architecture under `docs/`.

## Configuration
`assets/js/config.js` is intentionally blank. Add only the Supabase project URL and browser-safe publishable key (or legacy anon key). Never place service_role or secret keys in browser code. The app stays in preview mode until configured.

## Security
RLS remains authoritative. Private messages, private communities and private media must not be fetched or subscribed to until authorization is established. The frontend does not create a new identity model or duplicate existing branch profiles. No database changes are included in this commit.


## Latest integration stage
- Direct and group message pages use the existing conversation RPC, participant membership and RLS-protected message tables.
- Private Realtime subscriptions are deliberately disabled by default in `CROWRULES_CONFIG.privateRealtimeVerified`. Do not switch this to true until the Supabase Realtime dashboard has `Allow public access` disabled and private topic authorization has been tested.
- Branch follows and member interests are represented by an additive migration at `supabase/migrations/20261119000100_crowspace_feed_preferences.sql`. This migration has been committed to the repository but has **not** been applied to the live Supabase project.
- The branch bridge SDK is ready for additive adoption. Existing branch repositories have not been modified by this PR; each branch still needs a separately reviewed integration.
