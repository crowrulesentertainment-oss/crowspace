-- CrowSpace Phase 3: Communities and Events
-- Additive only. Legacy crowspace_group_members (group chat) and CrowRules Hub tables remain untouched.
create table if not exists public.crowspace_communities (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(char_length(btrim(name)) between 3 and 80), slug text not null unique check(slug ~ '^[a-z0-9-]{3,90}$'),
 description text not null default '' check(char_length(description)<=2000), category text not null default 'General' check(char_length(category)<=60),
 privacy text not null default 'public' check(privacy in ('public','private')), join_policy text not null default 'open' check(join_policy in ('open','request','invite_only')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.crowspace_community_members (
 community_id uuid not null references public.crowspace_communities(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
 role text not null default 'member' check(role in ('owner','admin','moderator','member')), status text not null default 'active' check(status in ('pending','active','banned')),
 joined_at timestamptz not null default now(), primary key(community_id,user_id)
);
create table if not exists public.crowspace_community_posts (
 id uuid primary key default gen_random_uuid(), community_id uuid not null references public.crowspace_communities(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade, body text not null check(char_length(btrim(body)) between 1 and 5000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.crowspace_community_comments (
 id uuid primary key default gen_random_uuid(), post_id uuid not null references public.crowspace_community_posts(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade, body text not null check(char_length(btrim(body)) between 1 and 2000), created_at timestamptz not null default now()
);
create table if not exists public.crowspace_community_invitations (
 community_id uuid not null references public.crowspace_communities(id) on delete cascade, invitee_id uuid not null references auth.users(id) on delete cascade,
 inviter_id uuid not null references auth.users(id) on delete cascade, status text not null default 'invited' check(status in ('invited','accepted','declined')),
 created_at timestamptz not null default now(), responded_at timestamptz, primary key(community_id,invitee_id)
);
create table if not exists public.crowspace_events (
 id uuid primary key default gen_random_uuid(), creator_id uuid not null references auth.users(id) on delete cascade,
 community_id uuid references public.crowspace_communities(id) on delete cascade, title text not null check(char_length(btrim(title)) between 3 and 120),
 description text not null default '' check(char_length(description)<=5000), starts_at timestamptz not null, ends_at timestamptz,
 timezone text not null default 'America/Los_Angeles', location_name text not null default '' check(char_length(location_name)<=180),
 location_details text not null default '' check(char_length(location_details)<=500), event_type text not null default 'in_person' check(event_type in ('in_person','online','hybrid')),
 visibility text not null default 'public' check(visibility in ('public','community','private')), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), constraint crowspace_events_valid_time check(ends_at is null or ends_at>starts_at),
 constraint crowspace_events_community_visibility check(community_id is not null or visibility<>'community')
);
create table if not exists public.crowspace_event_invitations (
 event_id uuid not null references public.crowspace_events(id) on delete cascade, invitee_id uuid not null references auth.users(id) on delete cascade,
 inviter_id uuid not null references auth.users(id) on delete cascade, status text not null default 'invited' check(status in ('invited','accepted','declined')),
 created_at timestamptz not null default now(), responded_at timestamptz, primary key(event_id,invitee_id)
);
create table if not exists public.crowspace_event_rsvps (
 event_id uuid not null references public.crowspace_events(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade,
 response text not null check(response in ('going','interested','not_going')), updated_at timestamptz not null default now(), primary key(event_id,user_id)
);
create index if not exists crowspace_communities_created_idx on public.crowspace_communities(created_at desc);
create index if not exists crowspace_community_members_user_idx on public.crowspace_community_members(user_id,status);
create index if not exists crowspace_community_posts_feed_idx on public.crowspace_community_posts(community_id,created_at desc);
create index if not exists crowspace_community_comments_post_idx on public.crowspace_community_comments(post_id,created_at);
create index if not exists crowspace_community_invites_user_idx on public.crowspace_community_invitations(invitee_id,status);
create index if not exists crowspace_events_start_idx on public.crowspace_events(starts_at);
create index if not exists crowspace_events_community_idx on public.crowspace_events(community_id,starts_at);
create index if not exists crowspace_event_invites_user_idx on public.crowspace_event_invitations(invitee_id,status);
create index if not exists crowspace_event_rsvps_event_idx on public.crowspace_event_rsvps(event_id,response);
alter table public.crowspace_communities enable row level security;
alter table public.crowspace_community_members enable row level security;
alter table public.crowspace_community_posts enable row level security;
alter table public.crowspace_community_comments enable row level security;
alter table public.crowspace_community_invitations enable row level security;
alter table public.crowspace_events enable row level security;
alter table public.crowspace_event_invitations enable row level security;
alter table public.crowspace_event_rsvps enable row level security;
revoke all on public.crowspace_communities,public.crowspace_community_members,public.crowspace_community_posts,public.crowspace_community_comments,public.crowspace_community_invitations,public.crowspace_events,public.crowspace_event_invitations,public.crowspace_event_rsvps from anon;
grant select,insert,update,delete on public.crowspace_communities,public.crowspace_community_members,public.crowspace_community_posts,public.crowspace_community_comments,public.crowspace_community_invitations,public.crowspace_events,public.crowspace_event_invitations,public.crowspace_event_rsvps to authenticated;
-- RLS policies are installed by the matching Supabase migration crowspace_phase3_communities_events and crowspace_phase3_community_invitations.
-- Realtime publication includes all eight tables.
