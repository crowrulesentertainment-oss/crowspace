# CrowSpace backend inventory

Inspection target: Supabase project `cevylpnoexugwgygvtgu`, schema `public`, prefix `crowspace_`.

Snapshot: 57 tables found; all 57 have RLS enabled. Policy counts are the number of `pg_policies` rows at inspection time. Estimated rows are approximate `pg_stat_user_tables.n_live_tup` values, not exact counts.

| Table | Columns | Policies | Est. rows | Feature |
|---|---|---:|---:|---|
| `crowspace_account_links` | auth_user_id, member_id, linked_at | 1 | 10 | Auth/member identity bridge |
| `crowspace_achievements` | id, slug, name, description, icon, category, criteria, is_active, sort_order, created_at | 2 | 5 | Achievement catalog |
| `crowspace_album_photos` | id, album_id, user_id, media_url, caption, display_order, created_at | 7 | 0 | Album media |
| `crowspace_albums` | id, user_id, creator_id, title, description, cover_url, album_type, visibility, is_published, created_at, updated_at | 7 | 0 | Photo albums |
| `crowspace_collab_availability` | user_id, status, collaboration_types, preferred_modes, notes, updated_at | 4 | 0 | Creator availability |
| `crowspace_collab_invitations` | id, sender_id, recipient_id, message, collaboration_type, status, created_at, responded_at | 3 | 0 | Collaboration invites |
| `crowspace_communities` | id, owner_id, name, slug, description, category, privacy, join_policy, created_at, updated_at | 6 | 0 | Community directory |
| `crowspace_community_comments` | id, post_id, author_id, body, created_at | 3 | 0 | Community comments |
| `crowspace_community_invitations` | community_id, invitee_id, inviter_id, status, created_at, responded_at | 5 | 0 | Community invites |
| `crowspace_community_members` | community_id, user_id, role, status, joined_at | 8 | 0 | Community membership/roles |
| `crowspace_community_posts` | id, community_id, author_id, body, created_at, updated_at, is_announcement, pinned_at | 4 | 0 | Community feed |
| `crowspace_direct_attachments` | id, message_id, conversation_id, uploaded_by, object_path, file_name, mime_type, size_bytes, created_at | 2 | 0 | DM attachments |
| `crowspace_direct_blocks` | blocker_id, blocked_user_id, created_at | 3 | 0 | DM block controls |
| `crowspace_direct_conversations` | id, participant_low, participant_high, initiated_by, created_at, updated_at, last_message_at | 1 | 0 | DM threads |
| `crowspace_direct_members` | conversation_id, user_id, last_read_at, archived_at, muted_until, pinned_at, joined_at | 2 | 0 | Per-member DM state |
| `crowspace_direct_messages` | id, conversation_id, sender_id, body, message_type, created_at, edited_at, deleted_at | 4 | 0 | DM messages |
| `crowspace_direct_reports` | id, conversation_id, message_id, reporter_id, reported_user_id, reason, details, status, created_at | 1 | 0 | Message safety reports |
| `crowspace_event_invitations` | event_id, invitee_id, inviter_id, status, created_at, responded_at | 4 | 0 | Event invitations |
| `crowspace_event_rsvps` | event_id, user_id, response, updated_at | 4 | 0 | Event RSVPs |
| `crowspace_events` | id, creator_id, community_id, title, description, starts_at, ends_at, timezone, location_name, location_details, event_type, visibility, created_at, updated_at | 5 | 0 | Event calendar |
| `crowspace_featured_project_templates` | template_id, featured_by, created_at | 3 | 0 | Featured templates |
| `crowspace_follows` | follower_id, following_id, created_at | 3 | 0 | Follow graph |
| `crowspace_group_conversations` | id, title, created_by, created_at, updated_at | 3 | 0 | Group chat threads |
| `crowspace_group_members` | group_id, user_id, role, joined_at, last_read_at, archived_at, muted_until, pinned_at | 4 | 0 | Group chat membership/state |
| `crowspace_group_message_attachments` | id, message_id, group_id, uploaded_by, object_path, file_name, mime_type, size_bytes, created_at | 2 | 0 | Group attachments |
| `crowspace_group_messages` | id, group_id, sender_id, body, created_at, edited_at | 4 | 0 | Group messages |
| `crowspace_live_room_messages` | id, room_id, sender_id, body, created_at, edited_at | 4 | 0 | Live room chat |
| `crowspace_live_room_participants` | id, room_id, user_id, role, joined_at, left_at | 4 | 0 | Live room roster |
| `crowspace_live_room_reactions` | id, room_id, message_id, user_id, reaction, created_at | 3 | 0 | Live reactions |
| `crowspace_live_room_reminders` | id, room_id, user_id, created_at | 3 | 0 | Live reminders |
| `crowspace_live_rooms` | id, created_by, title, description, room_type, visibility, circle_id, event_id, group_id, scheduled_at, stream_url, status, started_at, ended_at, created_at, updated_at | 4 | 0 | Live rooms |
| `crowspace_member_achievements` | id, member_id, achievement_id, awarded_by, award_note, awarded_at | 3 | 0 | Member awards |
| `crowspace_member_milestones` | id, member_id, milestone_key, title, description, metadata, achieved_at | 1 | 3 | Member milestones |
| `crowspace_notifications` | id, recipient_id, actor_id, notification_type, entity_type, entity_id, message, read_at, created_at | 2 | 3 | Notifications |
| `crowspace_opportunities` | id, created_by, title, description, category, skills, opportunity_type, location, work_mode, status, application_deadline, created_at, updated_at | 4 | 0 | Opportunity board |
| `crowspace_opportunity_applications` | id, opportunity_id, applicant_id, message, status, created_at, updated_at | 3 | 0 | Applications |
| `crowspace_opportunity_reports` | id, opportunity_id, reporter_id, reason, status, reviewed_by, reviewed_at, created_at | 3 | 0 | Opportunity moderation |
| `crowspace_photo_comments` | id, photo_id, user_id, parent_id, body, created_at | 3 | 0 | Photo comments |
| `crowspace_photo_reactions` | id, photo_id, user_id, reaction, created_at | 4 | 0 | Photo reactions |
| `crowspace_photo_shares` | id, photo_id, shared_by, shared_with_user_id, message, created_at | 3 | 0 | Photo sharing |
| `crowspace_photo_tags` | id, photo_id, tagged_user_id, tagged_by, created_at | 3 | 0 | Photo tags |
| `crowspace_post_comments` | id, post_id, author_id, parent_id, body, created_at, edited_at | 4 | 0 | Feed comments |
| `crowspace_post_media` | id, post_id, uploaded_by, object_path, mime_type, alt_text, created_at | 3 | 0 | Feed media |
| `crowspace_post_reactions` | post_id, user_id, reaction, created_at | 4 | 0 | Feed reactions |
| `crowspace_posts` | id, author_id, body, visibility, post_kind, branch_key, created_at, updated_at | 5 | 0 | Branch-aware feed |
| `crowspace_profile_showcase` | id, user_id, title, description, project_url, media_url, category, is_featured, sort_order, created_at, updated_at | 4 | 0 | Portfolio showcase |
| `crowspace_profile_skills` | id, user_id, skill_name, category, sort_order, created_at | 4 | 0 | Profile skills |
| `crowspace_profiles` | user_id, username, display_name, bio, avatar_url, social_links, creator_category, featured_caw_id, profile_theme, profile_sections, portfolio_tagline, portfolio_bio, portfolio_work_title, portfolio_collections_title, portfolio_sections_visible, portfolio_hero_media_mode, portfolio_hero_autoplay, portfolio_hero_loop, portfolio_hero_mobile_fallback, portfolio_hero_media_source, portfolio_hero_media_url, portfolio_hero_media_path, created_at, updated_at, crow_id, cover_url, location, profile_visibility, onboarding_complete | 4 | 11 | Canonical member profile |
| `crowspace_project_members` | id, project_id, owner_id, user_id, role, status, created_at, updated_at | 4 | 0 | Project collaborators |
| `crowspace_project_milestones` | id, project_id, title, description, status, due_date, assigned_to, created_by, completed_by, completed_at, sort_order, created_at, updated_at | 4 | 0 | Project milestones |
| `crowspace_project_template_reviews` | id, template_id, reviewer_id, rating, review_text, created_at, updated_at | 4 | 0 | Template reviews |
| `crowspace_project_templates` | id, owner_id, title, description, category, visibility, template_data, created_at, updated_at | 4 | 0 | Project templates |
| `crowspace_project_updates` | id, project_id, author_id, body, created_at | 3 | 0 | Project updates |
| `crowspace_projects` | id, owner_id, title, slug, description, category, division, status, visibility, created_at, updated_at, completed_at, started_at, opportunity_id, due_date | 5 | 0 | Project workspaces |
| `crowspace_publication_assets` | id, publication_id, user_id, file_path, media_type, caption, sort_order, created_at | 3 | 0 | Publication media |
| `crowspace_publications` | id, user_id, title, slug, publication_type, excerpt, body, cover_path, external_url, visibility, status, published_at, created_at, updated_at | 4 | 0 | Articles/publications |
| `crowspace_wall_posts` | id, wall_owner_id, author_id, body, visibility, created_at, updated_at, post_kind, branch_key | 4 | 0 | Profile wall timeline |

## Important interpretation notes
- `crowspace_profiles` is the social profile source; `crowspace_account_links` bridges Auth UUID to the existing member record. Do not duplicate identity or create a second profile table.
- `crowspace_posts` and `crowspace_wall_posts` include `branch_key`, so branch context already exists in the social model.
- DM member rows include last-read, archive, mute and pin state. Direct-message schema also includes block and report records.
- Communities have privacy and join-policy fields; the UI must not assume every community is public.
- Zero estimated rows may reflect approximate stats, not a definitive absence of data.
- Table policy counts are not a security review. Inspect full policy predicates, triggers, RPCs, storage rules, grants and Realtime authorization before activating each workflow.

## Next backend verification gates
1. Review exact policies for profile, feed, DM and group-chat reads/writes.
2. Verify Auth redirects and account-link creation for existing members.
3. Verify private Realtime channel authorization and message membership before subscribing.
4. Verify private attachment buckets and signed URL paths.
5. Test anonymous, owner, unrelated member, community member and moderator/admin contexts.
6. Only propose additive schema work after proving a required feature has no existing table/RPC/trigger contract.

## Feed, messaging and media verification snapshot (2026-11-18)

### Feed
- crowspace_posts, crowspace_post_comments, crowspace_post_reactions and crowspace_follows all have RLS enabled and authenticated Data API privileges.
- Posts are limited to public, friends, followers and private visibility. Authors can create/update/delete only their own posts. The SELECT policy scopes public posts, friends through the existing friendships table, followers through crowspace_follows, and each member's own posts.
- Reactions use the composite primary key (post_id, user_id) and allow only like, love, laugh, wow and support. Own-row INSERT/UPDATE/DELETE policies exist.
- Comments are limited to 2,000 characters; post bodies to 5,000 characters. Comment and reaction visibility is joined to a visible parent post by RLS.
- Follows are self-owned on INSERT/DELETE; authenticated SELECT is currently broad (USING true). Do not expose follower lists to anonymous users.

### Direct and group messaging
- DM creation is intended to use the existing RPC crowspace_start_direct_conversation(p_other_user). The underlying function checks authentication, prevents self-messaging, requires a CrowSpace profile for the other member, checks block records, normalizes the participant pair and creates the two membership rows.
- Direct message INSERT checks sender identity and private.crowspace_direct_can_send; SELECT requires membership. Per-member read/archive/mute/pin state is stored in crowspace_direct_members.
- Group messages require crowspace_group_members membership; group membership changes are protected by owner/admin/member policies and a trigger.
- The private bucket crowspace-messenger exists. Its upload/read/delete policies use member/path checks, but some legacy OR policies still reference podcast_direct_conversations. Use the dedicated CrowSpace path and membership policies only after end-to-end Storage tests.

### Realtime blocker — do not enable chat subscriptions yet
- RLS is enabled on realtime.messages. CrowSpace-specific policies exist.
- private.crowspace_realtime_can_access accepts topics matching crowspace-dm:<uuid> or crowspace-group:<uuid>, then checks membership using the existing CrowSpace membership functions.
- A separate group broadcast policy uses the older colon topic form crowspace:group:<uuid> and checks crowspace_group_members.
- The direct-message broadcast policies using crowspace:dm:<uuid> reference podcast_direct_conversations rather than crowspace_direct_conversations. This is a legacy cross-branch mismatch; do not use that topic format for CrowSpace DMs.
- The Dashboard Realtime setting that disables public channel access was not accessible through the database inspection tools and remains unverified. Supabase's current guidance requires disabling Allow public access when private channels must be enforced. Keep private subscriptions disabled until that setting is confirmed and the hyphenated CrowSpace topics are exercised with two real member accounts.
- Do not modify realtime schema objects. Supabase now locks that schema; RLS policies on realtime.messages remain the supported control surface.

### Media access
- crowspace-posts, crowspace-messenger, crowspace-albums and crowspace-creator-media are private buckets. The CrowSpace media rules are scoped by bucket, path and user/member access.
- Public media URLs must not be generated for private bucket objects. Use signed URLs after checking the matching table-level policy and Storage object policy.

## Community, events, notifications, albums and projects snapshot (2026-11-18)

- Communities: authenticated SELECT exposes public communities, the member's own active memberships and owned communities. Public/open communities permit direct active membership INSERT; public/request communities permit pending membership INSERT; invite-only communities require an accepted invitation. Community posts are limited to active members; announcements require owner/admin/moderator role.
- Events: SELECT is scoped to public events, community events for active members, creators and invited members. RSVP rows are member-owned; allowed responses are going, interested and not_going. The frontend now lists accessible events and updates only the signed-in member's RSVP.
- Notifications: current policies permit recipients to SELECT and UPDATE their own notification rows. There is no client INSERT policy; the UI only lists and marks read.
- Albums: owners can manage their albums; public published albums are visible to visitors; friends albums require accepted friendship; shared photos are visible to recipients. The crowspace-albums Storage bucket is private. The frontend requests short-lived signed URLs only for media paths the signed-in member is allowed to read.
- Projects: project SELECT is available for public projects, owners and invited/accepted members. Project membership invites are owner-scoped. Project updates are deliberately not wired: current SELECT and INSERT policy predicates contain a self-comparison `m.project_id = m.project_id` instead of correlating the membership row to the update's project. This may grant a project member access to unrelated project updates. Review and correct that policy before exposing updates or milestones in the UI.
- No database policy, table, trigger, Storage object, or Realtime setting was changed during this integration stage.
