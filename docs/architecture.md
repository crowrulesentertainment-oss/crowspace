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
