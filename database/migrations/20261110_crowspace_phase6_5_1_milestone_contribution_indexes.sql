-- Phase 6.5.1: support milestone contribution attribution lookups.
create index if not exists crowspace_project_milestones_created_by_idx
  on public.crowspace_project_milestones(created_by);
create index if not exists crowspace_project_milestones_completed_by_idx
  on public.crowspace_project_milestones(completed_by)
  where completed_by is not null;
