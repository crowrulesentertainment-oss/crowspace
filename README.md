# CrowSpace

CrowSpace is the social layer of CrowRules Entertainment: **Your space. Your crew. Your story.**

## Live architecture

- Universal Supabase Auth
- Universal CrowRules membership from `members` / `membership_plans`
- CrowSpace membership mapping in `crowspace_memberships`
- Division access in `crowspace_division_access`
- Social feed using `crowspace_posts`
- Events using `crowspace_events`
- Media/reels using existing CrowSpace tables
- Spectrum Awards using the existing Spectrum Awards tables
- Verified Creator / Verified Public Figure profile fields
- Responsive GitHub Pages frontend

## Division gating

Universal CrowRules membership gives access to CrowSpace itself. Division-specific tools are **not** automatically unlocked.

Dreamscapes, Podcasting, Sports, Memorials and CrowRules TV are individually controlled by `crowspace_division_access`.

This preserves the rule:

**One Account · One Universe — but division tools require division membership.**

## Verification

Verification is separate from membership. A Verified Public Figure or Verified Creator badge does not automatically grant access to any CrowRules division.

Verification requests are stored in `crowspace_verification_requests` for an authorized review workflow.

## Spectrum Awards

CrowSpace provides the social discovery layer for Spectrum Awards:

Creator → Project → Category → Nomination → Finalist → Winner → Digital Trophy → Archive

The database already contains Spectrum Awards tables; CrowSpace is designed to connect those records to creator profiles and community discovery.

## Deployment

The repository is designed for GitHub Pages. Supabase uses the public publishable key in the browser; no service-role key is included.

For production, configure Supabase Auth redirect URLs for the CrowSpace GitHub Pages URL and enable the desired OAuth providers in Supabase.

