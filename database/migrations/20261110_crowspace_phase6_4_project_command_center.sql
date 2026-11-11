-- Phase 6.4: add optional project due dates for the Collaboration Command Center.
alter table public.crowspace_projects
  add column if not exists due_date date;

create index if not exists crowspace_projects_owner_due_date_idx
  on public.crowspace_projects (owner_id, due_date)
  where due_date is not null;

create index if not exists crowspace_projects_due_date_idx
  on public.crowspace_projects (due_date)
  where due_date is not null;
