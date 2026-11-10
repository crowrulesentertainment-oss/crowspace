alter table public.podcast_member_profiles
  add column if not exists branch_affiliations text[] not null default array[]::text[],
  add column if not exists creator_portfolio jsonb not null default '[]'::jsonb;

alter table public.podcast_community_circles
  add column if not exists branch_key text not null default 'community';

alter table public.podcast_community_circle_events
  add column if not exists branch_key text not null default 'community';

do $$
begin
  if not exists(select 1 from pg_constraint where conrelid='public.podcast_community_circles'::regclass and conname='podcast_community_circles_branch_key_check') then
    alter table public.podcast_community_circles add constraint podcast_community_circles_branch_key_check
    check(branch_key = any(array['community','podcasting','tacoma-nights','back-deck-live','bonded-in-mystery','tacoma-community-hub','memorials','dreamscapes','studios','crowrules-plus','records','spectrum-awards','tacoma-community']));
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.podcast_community_circle_events'::regclass and conname='podcast_community_circle_events_branch_key_check') then
    alter table public.podcast_community_circle_events add constraint podcast_community_circle_events_branch_key_check
    check(branch_key = any(array['community','podcasting','tacoma-nights','back-deck-live','bonded-in-mystery','tacoma-community-hub','memorials','dreamscapes','studios','crowrules-plus','records','spectrum-awards','tacoma-community']));
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.podcast_member_profiles'::regclass and conname='podcast_member_profiles_creator_portfolio_array_check') then
    alter table public.podcast_member_profiles add constraint podcast_member_profiles_creator_portfolio_array_check
    check(jsonb_typeof(creator_portfolio)='array');
  end if;
end $$;

create index if not exists podcast_community_circles_branch_created_idx on public.podcast_community_circles(branch_key,created_at desc);
create index if not exists podcast_community_circle_events_branch_start_idx on public.podcast_community_circle_events(branch_key,starts_at);
