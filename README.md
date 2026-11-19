# CrowSpace — CrowRules Universe

**One company. One universe.** A free social network connecting every CrowRules Entertainment branch.

## Rebuild status
The static multi-page HTML/CSS/JavaScript frontend is being rebuilt in small, reviewable stages. The existing Supabase project remains the backend of record. The frontend now uses the project URL and its dedicated browser-safe `crowspace` publishable key. No service-role or secret key is present.

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
| Identity | `crowspace_account_links`, `crowspace_profiles`, `members` | Auth/profile context |
| Profiles & portfolios | `crowspace_profiles`, `crowspace_profile_skills`, `crowspace_profile_showcase` | `profile.html` |
| Personalized feed | `crowspace_posts`, `crowspace_post_media`, `crowspace_post_comments`, `crowspace_post_reactions`, `crowspace_follows` | `feed.html` |
| Profile walls | `crowspace_wall_posts` | Profile timeline |
| Discovery | profiles, follows, skills, showcase, collaboration availability | `discover.html` |
| Direct messages | direct conversations/members/messages/attachments/blocks/reports | `messages.html` |
| Group chats | group conversations/members/messages/attachments | `messages.html` |
| Communities | communities, community members/posts/comments/invitations | `groups.html` |
| Events | events, RSVPs, invitations | `events.html` |
| Notifications | `crowspace_notifications` | `notifications.html` |
| Photos | albums, album photos, photo comments/reactions/shares/tags | `albums.html` |
| Live rooms | live rooms, participants, messages, reactions, reminders | Live experiences |
| Collaboration | availability, invitations | Discover / collaboration |
| Opportunities | opportunities, applications, reports | `opportunities.html` |
| Projects | projects, project members/updates/milestones | `projects.html` |
| Templates | project templates, reviews, featured templates | Creator workspaces |
| Publications | publications, publication assets | Member publications |
| Recognition | achievements, member achievements, milestones | Profile badges |

## Frontend structure
Multi-page HTML at repository root; shared CSS under `assets/css/`; ES modules under `assets/js/`; inventory and architecture under `docs/`.

## Configuration and authentication
`assets/js/config.js` contains only the Supabase project URL and a publishable key intended for browser clients. Never put a service_role or secret key in frontend code. Supabase Auth uses the browser PKCE flow and currently returns to `feed.html`; the production redirect URL must be allow-listed in Supabase Auth.

The Auth and account-link audit found 11 CrowSpace profiles and 10 account links. Ten profiles have matching existing member rows and links; one existing profile has no matching `members` row. No records were changed to force a link. That orphan must be reconciled deliberately before any account-link repair.

## Security
RLS remains authoritative. Profile discovery reads only profiles marked public and is available to authenticated members under the current profile SELECT policy. Writes, private messaging, private communities, private media and admin features remain gated until the exact policies, triggers, Realtime channel authorization and Storage access rules are verified.

## Validation
Run `npm run check` to validate local HTML references and JavaScript syntax. Browser OAuth, live data access and responsive interaction still require deployment and end-to-end testing.
