alter table public.podcast_member_posts
  add column if not exists branch_key text not null default 'community';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.podcast_member_posts'::regclass
      and conname = 'podcast_member_posts_branch_key_check'
  ) then
    alter table public.podcast_member_posts
      add constraint podcast_member_posts_branch_key_check
      check (branch_key = any (array[
        'community','podcasting','tacoma-nights','back-deck-live',
        'bonded-in-mystery','tacoma-community-hub','memorials','dreamscapes',
        'studios','crowrules-plus','records','spectrum-awards','tacoma-community'
      ]));
  end if;
end $$;

create index if not exists podcast_member_posts_branch_created_idx
  on public.podcast_member_posts (branch_key, created_at desc);
