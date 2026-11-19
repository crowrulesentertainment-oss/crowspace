# CrowSpace frontend architecture

Static multi-page HTML with shared CSS and native ES modules. GitHub Pages is the target host. Each page has a data-page key; shared app code initializes navigation, auth context and branch cards.

## Identity
- Supabase Auth remains the identity provider.
- crowspace_profiles.user_id is the canonical social profile key.
- crowspace_account_links bridges Auth UUID to the existing CrowRules member record.
- Do not create duplicate identities or parallel social profiles. Existing branch-specific member profiles remain branch-owned data and are linked through existing backend logic.

## Branches
Stable branch keys are listed in assets/js/branch-registry.js and align with the existing branch-aware posts model. Universal account access is not automatic following, private-group membership or forced notification delivery.

## Security
- Only publishable/anon credentials may appear in browser code.
- RLS is authoritative; frontend visibility is not authorization.
- Do not fetch private content or subscribe to private Realtime channels before authorization is established.
- Private attachments must use the existing private bucket and signed access flow.
- No SQL, RLS, grants, storage or Realtime changes are included in this frontend foundation.

## Integration sequence
1. Review profile/feed policies and auth/account-link triggers.
2. Verify auth redirect URLs and session behavior.
3. Wire profile reads and update forms.
4. Wire feed pagination, branch filters, follows, comments and reactions.
5. Wire private messaging only after reviewing participant policies and Realtime channel authorization.
6. Wire communities, events, photos, projects and branch-specific bridges.
7. Test anonymous, owner, unrelated member, community member and moderator/admin contexts before launch.

## Verified integration boundaries
- Auth uses the existing Supabase project and browser-safe publishable key. OAuth redirect URLs still need a live browser test against the GitHub Pages URL.
- Profile reads and owner updates use crowspace_profiles; the existing podcast sync trigger is preserved.
- Discovery is authenticated-only because the current profile SELECT policy targets authenticated members.
- Feed posts, follows, comments and reactions are wired against the existing RLS policies. No new database objects are needed for these first interactions.
- Private messaging UI may use the existing DM RPC and participant-scoped table policies, but private Realtime subscriptions remain blocked until the dashboard's Allow public access setting is confirmed off. For CrowSpace DM Realtime use the topic shape crowspace-dm:<conversation-uuid>; do not use the legacy crowspace:dm:<uuid> policy that checks podcast_direct_conversations.

## Additional feature boundaries
- Community joining follows the existing join_policy values (open, request, invite_only); the UI never adds a user to a private/invite-only community.
- Event RSVPs are scoped to the signed-in user and allowed response values.
- Notification client operations are limited to SELECT and mark-read UPDATE on the recipient's own rows.
- Album media uses the existing private crowspace-albums bucket and signed URLs after Storage authorization; never expose raw object paths as public URLs.
- Project directory reads are available, but project updates are blocked pending review of the existing self-comparison RLS predicates.
