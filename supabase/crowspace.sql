-- CrowSpace integration migration for the existing CrowRules universal membership system.
-- Project: cevylpnoexugwgygvtgu
-- Uses existing members, membership_plans, membership_entitlements and crowspace_* tables.

create table if not exists public.crowspace_division_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  site_key text not null,
  status text not null default 'active' check(status in ('active','pending','suspended')),
  source text not null default 'membership' check(source in ('membership','admin','creator','sponsor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(user_id,site_key)
);
alter table public.crowspace_division_access enable row level security;

drop policy if exists "crowspace_division_access_self_select" on public.crowspace_division_access;
create policy "crowspace_division_access_self_select" on public.crowspace_division_access
for select to authenticated using (user_id=auth.uid());

create or replace function public.crowspace_get_access()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  uid uuid := auth.uid();
  plan_id uuid;
  result jsonb;
begin
  if uid is null then
    return jsonb_build_object('crowspace',false,'divisions','[]'::jsonb);
  end if;

  select cm.membership_plan_id into plan_id
  from public.crowspace_memberships cm
  where cm.user_id=uid and cm.status='active'
  order by cm.updated_at desc nulls last
  limit 1;

  -- Universal CrowRules membership establishes CrowSpace identity access.
  -- Division-specific tools are granted only by an explicit division-access row.
  select jsonb_build_object(
    'crowspace', true,
    'plan_key', mp.plan_key,
    'plan_name', mp.name,
    'level', mp.level,
    'divisions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'site_key',da.site_key,
        'status',da.status,
        'source',da.source
      ) order by da.site_key)
      from public.crowspace_division_access da
      where da.user_id=uid and da.status='active'
    ),'[]'::jsonb)
  ) into result
  from public.membership_plans mp
  where mp.id=plan_id;

  if result is null then
    -- Hardened fallback for universal members whose CrowSpace mapping has not yet
    -- been materialized: use members.membership_type to identify the plan.
    select jsonb_build_object(
      'crowspace',true,
      'plan_key',mp.plan_key,
      'plan_name',mp.name,
      'level',mp.level,
      'divisions',coalesce((
        select jsonb_agg(jsonb_build_object('site_key',da.site_key,'status',da.status,'source',da.source) order by da.site_key)
        from public.crowspace_division_access da
        where da.user_id=uid and da.status='active'
      ),'[]'::jsonb)
    ) into result
    from public.members m
    join public.membership_plans mp on lower(mp.plan_key)=lower(m.membership_type)
    where m.user_id=uid and m.status='Active'
    limit 1;
  end if;

  return coalesce(result,jsonb_build_object('crowspace',false,'divisions','[]'::jsonb));
end $$;

grant execute on function public.crowspace_get_access() to authenticated;

-- Keep a CrowSpace membership row synchronized when a universal member has a
-- recognized membership type but no materialized CrowSpace mapping yet.
create or replace function public.crowspace_sync_universal_membership()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare p uuid;
begin
  if new.user_id is null then return new; end if;
  select id into p from public.membership_plans where lower(plan_key)=lower(coalesce(new.membership_type,'crow')) and is_active=true limit 1;
  if p is not null then
    insert into public.crowspace_memberships(user_id,member_id,membership_plan_id,status)
    values(new.user_id,new.id,p,'active')
    on conflict (user_id) do update set member_id=excluded.member_id,membership_plan_id=excluded.membership_plan_id,status='active',updated_at=now();
  end if;
  return new;
end $$;

drop trigger if exists trg_crowspace_sync_universal_membership on public.members;
create trigger trg_crowspace_sync_universal_membership
after insert or update of membership_type,status,user_id on public.members
for each row execute function public.crowspace_sync_universal_membership();

-- Public profile verification fields are intentionally stored separately from
-- Universal membership. Verification never grants division membership.
alter table public.crowspace_profiles
  add column if not exists verification_type text not null default 'none',
  add column if not exists verification_status text not null default 'none',
  add column if not exists verified_at timestamptz,
  add column if not exists verified_display_label text,
  add column if not exists public_figure_category text;

-- Explicit verification requests for creators/public figures.
create table if not exists public.crowspace_verification_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_type text not null check(requested_type in ('creator','public_figure','organization')),
  legal_or_official_name text,
  official_url text,
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check(status in ('pending','approved','denied','needs_info')),
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.crowspace_verification_requests enable row level security;
drop policy if exists "verification_requests_self" on public.crowspace_verification_requests;
create policy "verification_requests_self" on public.crowspace_verification_requests
for insert to authenticated with check(user_id=auth.uid());
drop policy if exists "verification_requests_read_self" on public.crowspace_verification_requests;
create policy "verification_requests_read_self" on public.crowspace_verification_requests
for select to authenticated using(user_id=auth.uid());

-- Spectrum integration uses the existing Spectrum Awards tables. CrowSpace only
-- provides the social discovery layer and permanent creator/project recognition.
