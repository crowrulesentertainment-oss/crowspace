-- Phase 6.5.2: keep milestone ownership immutable and completion attribution trustworthy.
create or replace function public.crowspace_guard_project_milestone_changes()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  if tg_op = 'UPDATE' then
    if new.project_id is distinct from old.project_id
       or new.created_by is distinct from old.created_by then
      raise exception 'Milestone project and creator cannot be changed';
    end if;
    if new.completed_by is distinct from old.completed_by
       and new.completed_by is not null
       and new.completed_by <> (select auth.uid()) then
      raise exception 'Milestone completion must be attributed to the current member';
    end if;
  elsif new.completed_by is not null
        and new.completed_by <> (select auth.uid()) then
    raise exception 'Milestone completion must be attributed to the current member';
  end if;
  if new.status = 'completed' then
    if new.completed_by is null then new.completed_by := (select auth.uid()); end if;
    if new.completed_at is null then new.completed_at := now(); end if;
  else
    new.completed_by := null;
    new.completed_at := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.crowspace_guard_project_milestone_changes() from public, anon, authenticated;
drop trigger if exists crowspace_guard_project_milestone_changes on public.crowspace_project_milestones;
create trigger crowspace_guard_project_milestone_changes before insert or update on public.crowspace_project_milestones for each row execute function public.crowspace_guard_project_milestone_changes();
