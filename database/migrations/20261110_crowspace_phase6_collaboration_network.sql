-- CrowSpace Phase 6: Creator Collaboration & Opportunity Network
-- Additive migration. Reuses the existing crowspace_projects and crowspace_project_members tables.
alter table public.crowspace_projects add column if not exists completed_at date;
alter table public.crowspace_projects add column if not exists started_at date;
alter table public.crowspace_projects add column if not exists opportunity_id uuid;

create table if not exists public.crowspace_collab_availability (
 user_id uuid primary key references auth.users(id) on delete cascade,
 status text not null default 'open' check(status in ('open','team','volunteer','unavailable')),
 collaboration_types text[] not null default '{}', preferred_modes text[] not null default '{}',
 notes text not null default '', updated_at timestamptz not null default now()
);
create table if not exists public.crowspace_collab_invitations (
 id uuid primary key default gen_random_uuid(), sender_id uuid not null references auth.users(id) on delete cascade,
 recipient_id uuid not null references auth.users(id) on delete cascade, message text not null default '',
 collaboration_type text not null default 'general',
 status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled')),
 created_at timestamptz not null default now(), responded_at timestamptz,
 check(sender_id <> recipient_id)
);
create index if not exists crowspace_collab_invites_recipient_idx on public.crowspace_collab_invitations(recipient_id,status,created_at desc);
create table if not exists public.crowspace_opportunities (
 id uuid primary key default gen_random_uuid(), created_by uuid not null references auth.users(id) on delete cascade,
 title text not null check(char_length(title) between 4 and 120),
 description text not null check(char_length(description) between 20 and 5000),
 category text not null default 'creative', skills text[] not null default '{}',
 opportunity_type text not null default 'volunteer' check(opportunity_type in ('volunteer','creative_project','role','collaboration','resource')),
 location text not null default '', work_mode text not null default 'remote' check(work_mode in ('remote','local','hybrid')),
 status text not null default 'open' check(status in ('open','closed','filled','removed')),
 application_deadline timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists crowspace_opportunities_browse_idx on public.crowspace_opportunities(status,created_at desc);
create table if not exists public.crowspace_opportunity_applications (
 id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.crowspace_opportunities(id) on delete cascade,
 applicant_id uuid not null references auth.users(id) on delete cascade, message text not null default '',
 status text not null default 'submitted' check(status in ('submitted','reviewing','accepted','declined','withdrawn')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(opportunity_id,applicant_id)
);
create table if not exists public.crowspace_project_updates (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.crowspace_projects(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(body) between 1 and 3000), created_at timestamptz not null default now()
);
create index if not exists crowspace_project_updates_idx on public.crowspace_project_updates(project_id,created_at desc);
create table if not exists public.crowspace_opportunity_reports (
 id uuid primary key default gen_random_uuid(), opportunity_id uuid not null references public.crowspace_opportunities(id) on delete cascade,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check(char_length(reason) between 5 and 1000),
 status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
 reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz,
 created_at timestamptz not null default now(), unique(opportunity_id,reporter_id)
);
create index if not exists crowspace_opportunity_reports_status_idx on public.crowspace_opportunity_reports(status,created_at desc);

do $$
declare t text;
begin
 foreach t in array array['crowspace_collab_availability','crowspace_collab_invitations','crowspace_opportunities','crowspace_opportunity_applications','crowspace_project_updates','crowspace_opportunity_reports'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon',t);
  execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 end loop;
end $$;

drop policy if exists "collab availability visible to members" on public.crowspace_collab_availability;
create policy "collab availability visible to members" on public.crowspace_collab_availability for select to authenticated using(status <> 'unavailable' or user_id=(select auth.uid()));
drop policy if exists "collab availability owner insert" on public.crowspace_collab_availability;
create policy "collab availability owner insert" on public.crowspace_collab_availability for insert to authenticated with check(user_id=(select auth.uid()));
drop policy if exists "collab availability owner update" on public.crowspace_collab_availability;
create policy "collab availability owner update" on public.crowspace_collab_availability for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists "collab availability owner delete" on public.crowspace_collab_availability;
create policy "collab availability owner delete" on public.crowspace_collab_availability for delete to authenticated using(user_id=(select auth.uid()));

drop policy if exists "collab invitations participants read" on public.crowspace_collab_invitations;
create policy "collab invitations participants read" on public.crowspace_collab_invitations for select to authenticated using(sender_id=(select auth.uid()) or recipient_id=(select auth.uid()));
drop policy if exists "collab invitations sender create" on public.crowspace_collab_invitations;
create policy "collab invitations sender create" on public.crowspace_collab_invitations for insert to authenticated with check(sender_id=(select auth.uid()) and recipient_id<>(select auth.uid()));
drop policy if exists "collab invitations participant update" on public.crowspace_collab_invitations;
create policy "collab invitations participant update" on public.crowspace_collab_invitations for update to authenticated using(sender_id=(select auth.uid()) or recipient_id=(select auth.uid())) with check(sender_id=(select auth.uid()) or recipient_id=(select auth.uid()));

drop policy if exists "opportunities member read" on public.crowspace_opportunities;
create policy "opportunities member read" on public.crowspace_opportunities for select to authenticated using(status<>'removed' or created_by=(select auth.uid()) or coalesce((select auth.jwt())->'app_metadata'->>'crowspace_admin','false')='true');
drop policy if exists "opportunities owner create" on public.crowspace_opportunities;
create policy "opportunities owner create" on public.crowspace_opportunities for insert to authenticated with check(created_by=(select auth.uid()));
drop policy if exists "opportunities owner admin update" on public.crowspace_opportunities;
create policy "opportunities owner admin update" on public.crowspace_opportunities for update to authenticated using(created_by=(select auth.uid()) or coalesce((select auth.jwt())->'app_metadata'->>'crowspace_admin','false')='true') with check(created_by=(select auth.uid()) or coalesce((select auth.jwt())->'app_metadata'->>'crowspace_admin','false')='true');
drop policy if exists "opportunities owner admin delete" on public.crowspace_opportunities;
create policy "opportunities owner admin delete" on public.crowspace_opportunities for delete to authenticated using(created_by=(select auth.uid()) or coalesce((select auth.jwt())->'app_metadata'->>'crowspace_admin','false')='true');

drop policy if exists "applications applicant owner admin read" on public.crowspace_opportunity_applications;
create policy "applications applicant owner admin read" on public.crowspace_opportunity_applications for select to authenticated using(applicant_id=(select auth.uid()) or exists(select 1 from public.crowspace_opportunities o where o.id=opportunity_id and o.created_by=(select auth.uid())) or coalesce((select auth.jwt())->'app_metadata'->>'crowspace_admin','false')='true');
drop policy if exists "applications applicant create" on public.crowspace_opportunity_applications;
create policy "applications applicant create" on public.crowspace_opportunity_applications for insert to authenticated with check(applicant_id=(select auth.uid()) and exists(select 1 from public.crowspace_opportunities o where o.id=opportunity_id and o.status='open' and o.created_by<>(select auth.uid())));
drop policy if exists "applications applicant or owner update" on public.crowspace_opportunity_applications;
create policy "applications applicant or owner update" on public.crowspace_opportunity_applications for update to authenticated using(applicant_id=(select auth.uid()) or exists(select 1 from public.crowspace_opportunities o where o.id=opportunity_id and o.created_by=(select auth.uid())) or coalesce((select auth.jwt())->'app_metadata'->>'crowspace_admin','false')='true') with check(applicant_id=(select auth.uid()) or exists(select 1 from public.crowspace_opportunities o where o.id=opportunity_id and o.created_by=(select auth.uid())) or coalesce((select auth.jwt())->'app_metadata'->>'crowspace_admin','false')='true');

drop policy if exists "project updates participants read" on public.crowspace_project_updates;
create policy "project updates participants read" on public.crowspace_project_updates for select to authenticated using(exists(select 1 from public.crowspace_projects p where p.id=project_id and (p.owner_id=(select auth.uid()) or p.visibility='public')) or exists(select 1 from public.crowspace_project_members m where m.project_id=project_id and m.user_id=(select auth.uid()) and m.status='accepted'));
drop policy if exists "project participants post updates" on public.crowspace_project_updates;
create policy "project participants post updates" on public.crowspace_project_updates for insert to authenticated with check(author_id=(select auth.uid()) and (exists(select 1 from public.crowspace_projects p where p.id=project_id and p.owner_id=(select auth.uid())) or exists(select 1 from public.crowspace_project_members m where m.project_id=project_id and m.user_id=(select auth.uid()) and m.status='accepted')));
drop policy if exists "update author delete" on public.crowspace_project_updates;
create policy "update author delete" on public.crowspace_project_updates for delete to authenticated using(author_id=(select auth.uid()));

drop policy if exists "opportunity reports reporter admin read" on public.crowspace_opportunity_reports;
create policy "opportunity reports reporter admin read" on public.crowspace_opportunity_reports for select to authenticated using(reporter_id=(select auth.uid()) or coalesce((select auth.jwt())->'app_metadata'->>'crowspace_admin','false')='true');
drop policy if exists "opportunity reports create" on public.crowspace_opportunity_reports;
create policy "opportunity reports create" on public.crowspace_opportunity_reports for insert to authenticated with check(reporter_id=(select auth.uid()));
drop policy if exists "opportunity reports admin update" on public.crowspace_opportunity_reports;
create policy "opportunity reports admin update" on public.crowspace_opportunity_reports for update to authenticated using(coalesce((select auth.jwt())->'app_metadata'->>'crowspace_admin','false')='true') with check(coalesce((select auth.jwt())->'app_metadata'->>'crowspace_admin','false')='true');
