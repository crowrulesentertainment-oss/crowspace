-- CrowSpace feed preference primitives.
-- Additive only: no existing tables, rows, policies, triggers or Realtime settings are modified.
-- Apply only after review; the frontend gracefully falls back until these tables exist.

create table if not exists public.crowspace_branch_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  branch_key text not null check (char_length(btrim(branch_key)) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (user_id, branch_key)
);

create table if not exists public.crowspace_member_interests (
  user_id uuid not null references auth.users(id) on delete cascade,
  interest_key text not null check (char_length(btrim(interest_key)) between 1 and 80),
  category text check (category is null or char_length(category) <= 60),
  created_at timestamptz not null default now(),
  primary key (user_id, interest_key)
);

alter table public.crowspace_branch_follows enable row level security;
alter table public.crowspace_member_interests enable row level security;

grant select, insert, delete on public.crowspace_branch_follows to authenticated;
grant select, insert, delete on public.crowspace_member_interests to authenticated;

drop policy if exists "Members read their own branch follows" on public.crowspace_branch_follows;
create policy "Members read their own branch follows"
on public.crowspace_branch_follows for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Members follow branches as themselves" on public.crowspace_branch_follows;
create policy "Members follow branches as themselves"
on public.crowspace_branch_follows for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Members unfollow branches as themselves" on public.crowspace_branch_follows;
create policy "Members unfollow branches as themselves"
on public.crowspace_branch_follows for delete to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Members read their own interests" on public.crowspace_member_interests;
create policy "Members read their own interests"
on public.crowspace_member_interests for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Members add their own interests" on public.crowspace_member_interests;
create policy "Members add their own interests"
on public.crowspace_member_interests for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Members remove their own interests" on public.crowspace_member_interests;
create policy "Members remove their own interests"
on public.crowspace_member_interests for delete to authenticated
using (user_id = (select auth.uid()));

create index if not exists crowspace_branch_follows_branch_idx
  on public.crowspace_branch_follows (branch_key, user_id);
create index if not exists crowspace_member_interests_interest_idx
  on public.crowspace_member_interests (interest_key, user_id);
