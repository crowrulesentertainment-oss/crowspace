-- Phase 6.5: project milestones and collaboration analytics.
create table if not exists public.crowspace_project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.crowspace_projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 160),
  description text not null default '',
  status text not null default 'not_started' check (status in ('not_started','in_progress','blocked','completed')),
  due_date date,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid not null default auth.uid() references auth.users(id),
  completed_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crowspace_project_milestones_project_sort_idx on public.crowspace_project_milestones(project_id,sort_order,created_at);
create index if not exists crowspace_project_milestones_due_date_idx on public.crowspace_project_milestones(project_id,due_date) where due_date is not null;
create index if not exists crowspace_project_milestones_assigned_to_idx on public.crowspace_project_milestones(assigned_to) where assigned_to is not null;
alter table public.crowspace_project_milestones enable row level security;
revoke all on table public.crowspace_project_milestones from anon;
grant select,insert,update,delete on table public.crowspace_project_milestones to authenticated;
create policy "Project participants read milestones" on public.crowspace_project_milestones for select to authenticated using (
 exists(select 1 from public.crowspace_projects p where p.id=project_id and (p.owner_id=(select auth.uid()) or exists(select 1 from public.crowspace_project_members m where m.project_id=p.id and m.user_id=(select auth.uid()) and m.status='accepted')))
);
create policy "Project participants create milestones" on public.crowspace_project_milestones for insert to authenticated with check (
 created_by=(select auth.uid()) and exists(select 1 from public.crowspace_projects p where p.id=project_id and (p.owner_id=(select auth.uid()) or exists(select 1 from public.crowspace_project_members m where m.project_id=p.id and m.user_id=(select auth.uid()) and m.status='accepted')) and (assigned_to is null or assigned_to=p.owner_id or exists(select 1 from public.crowspace_project_members am where am.project_id=p.id and am.user_id=assigned_to and am.status='accepted')))
);
create policy "Project participants update milestones" on public.crowspace_project_milestones for update to authenticated using (
 exists(select 1 from public.crowspace_projects p where p.id=project_id and (p.owner_id=(select auth.uid()) or exists(select 1 from public.crowspace_project_members m where m.project_id=p.id and m.user_id=(select auth.uid()) and m.status='accepted')))
) with check (
 exists(select 1 from public.crowspace_projects p where p.id=project_id and (p.owner_id=(select auth.uid()) or exists(select 1 from public.crowspace_project_members m where m.project_id=p.id and m.user_id=(select auth.uid()) and m.status='accepted')) and (assigned_to is null or assigned_to=p.owner_id or exists(select 1 from public.crowspace_project_members am where am.project_id=p.id and am.user_id=assigned_to and am.status='accepted')))
);
create policy "Project owners or milestone creators delete milestones" on public.crowspace_project_milestones for delete to authenticated using (
 created_by=(select auth.uid()) or exists(select 1 from public.crowspace_projects p where p.id=project_id and p.owner_id=(select auth.uid()))
);
