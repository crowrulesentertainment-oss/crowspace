-- CrowSpace group invite usage tracking
-- Apply in Supabase SQL Editor before enabling usage limits in production.

alter table public.crowspace_group_invites
  add column if not exists max_uses integer,
  add column if not exists use_count integer not null default 0;

create table if not exists public.crowspace_group_invite_uses (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references public.crowspace_group_invites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  used_at timestamptz not null default now(),
  unique(invite_id, user_id)
);

create index if not exists crowspace_group_invite_uses_invite_idx
  on public.crowspace_group_invite_uses(invite_id, used_at desc);

alter table public.crowspace_group_invite_uses enable row level security;

create policy "invite users can record their own use"
on public.crowspace_group_invite_uses
for insert to authenticated
with check (auth.uid() = user_id);

create policy "invite creators can view usage"
on public.crowspace_group_invite_uses
for select to authenticated
using (
  exists (
    select 1 from public.crowspace_group_invites i
    where i.id = invite_id and i.created_by = auth.uid()
  )
  or user_id = auth.uid()
);

create or replace function public.crowspace_record_invite_use(p_invite_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  i public.crowspace_group_invites%rowtype;
  inserted_count integer;
begin
  select * into i from public.crowspace_group_invites where id = p_invite_id for update;
  if not found or i.revoked_at is not null or (i.expires_at is not null and i.expires_at <= now()) then
    return false;
  end if;
  if i.max_uses is not null and i.use_count >= i.max_uses then
    return false;
  end if;
  insert into public.crowspace_group_invite_uses(invite_id,user_id)
  values(p_invite_id,auth.uid())
  on conflict (invite_id,user_id) do nothing;
  get diagnostics inserted_count = row_count;
  if inserted_count = 1 then
    update public.crowspace_group_invites set use_count = coalesce(use_count,0) + 1 where id = p_invite_id;
  end if;
  return true;
end;
$$;

grant execute on function public.crowspace_record_invite_use(uuid) to authenticated;
