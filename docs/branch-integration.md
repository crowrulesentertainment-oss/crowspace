# CrowRules branch integration

CrowSpace is the shared social layer; each branch keeps its existing application, data model, pages and administration.

## Existing branch repositories discovered
| Branch | Existing repository | CrowSpace key | Integration posture |
|---|---|---|---|
| Podcasting | `podcasting` | `podcasting` | Additive bridge; preserve podcast member profiles and Podcasting auth |
| Tacoma Nights | `tacomanights` plus existing main-site section | `tacoma-nights` | Additive bridge; preserve show contributors and production workflow |
| Back Deck Live | `backdecklive` plus existing main-site section | `back-deck-live` | Additive bridge; preserve live-show operations |
| Memorials | `memorials` | `memorials` | Additive bridge; preserve memorial-specific privacy and moderation |
| Tacoma Community Hub | `tacoma` | `tacoma-hub` | Additive bridge; preserve verification/moderation and free-resource directory |
| Sports | `sports` | `sports` | Additive bridge; preserve sport-specific data and admin |
| Yearbooks | `yearbooks` | `yearbooks` | Additive bridge; preserve school/private-yearbook permissions |
| Dreamscapes | `dreamscapes` | `dreamscapes` | Additive bridge; preserve project/IP/rights controls |
| Records | `records` | `records` | Existing repository found; preserve artist/release data |
| Spectrum Awards | `spectrum` | `spectrum-awards` | Existing repository found; preserve awards workflows |
| CrowRules+ | No dedicated repository found in org inventory | `crowrules-plus` | Planned; route to main roadmap |
| CrowRules Studios | No dedicated repository found in org inventory | `studios` | Planned; route to main roadmap |

The branch registry records current repository names, stable branch keys, launch status and destination. Planned divisions do not point to assumed repositories.

## Shared bridge module
`assets/js/branch-bridge.js` exports `connectCrowRulesBranch({ branchKey })`. Existing branch pages can import it from the CrowSpace GitHub Pages URL:

```js
import { connectCrowRulesBranch } from "https://crowrulesentertainment-oss.github.io/crowspace/assets/js/branch-bridge.js";

const universe = await connectCrowRulesBranch({ branchKey: "podcasting" });
const { user } = await universe.getAuth();
if (user) {
  const { data: profile } = await universe.getProfile();
}
```

The bridge supports reading the current Auth context, loading the canonical CrowSpace profile, invoking existing sign-in/sign-out, sharing a branch-tagged post and opening CrowSpace. It does not create branch-specific accounts, duplicate member profiles, or modify the branch's database.

## Session boundaries
GitHub Pages repositories under the same `*.github.io` host share a browser origin, so the existing Supabase Auth local-storage session can be shared when all apps use the same project ref and default storage key. Custom domains or other origins do not share local storage. Do not copy refresh tokens into URLs or local storage manually. For different origins, use a deliberate OAuth redirect back through Supabase Auth or keep the branch's own sign-in and let members separately open CrowSpace.

## Safe rollout
1. Add the bridge to one branch as a non-blocking enhancement.
2. Confirm it reads the existing signed-in user without affecting the branch's own Auth.
3. Confirm profile mapping to `crowspace_profiles` and existing branch member profile.
4. Test one branch-tagged share with a test account.
5. Add the CrowSpace entry point and optional sharing controls to the remaining branches.
6. Keep private content, branch-specific permissions and admin actions in the original branch application.

Do not bulk-edit all branch repositories. Each integration should be a small reviewable change after its own schema, auth and RLS behavior is checked.
