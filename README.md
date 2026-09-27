# CrowSpace

CrowSpace is the social layer of CrowRules Entertainment.

## Included
- Nests: member profiles
- Caws: short-form video
- Picture/media uploads through Supabase Storage
- Live streams + real-time-ready chat tables
- Groups and memberships
- Dreamscapes integration using the existing `ds_projects` / `ds_submissions` data
- Memorials integration using the existing `memorials` data
- CrowSpace account layer tied to the same Supabase Auth identity as Universal CrowRules Membership

## Supabase
Project: `cevylpnoexugwgygvtgu`

The frontend uses the Supabase publishable key only. Never put a service-role/secret key in GitHub Pages.

## Live video
The database stores stream metadata and playback URLs. Actual ingest/transcoding/egress should be supplied by a video provider or a future CrowRules streaming service; Supabase Realtime is used for community state/chat, not as a video transport.

## Site
https://crowrulesentertainment-oss.github.io/crowspace/
