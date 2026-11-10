-- Phase 6.3.1: notify project participants when project status changes.
create or replace function public.crowspace_phase6_notify_project_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message)
    select distinct recipients.recipient_id,auth.uid(),'project_status','project',new.id,
      'changed the project status to "'||replace(new.status,'_',' ')||'"'
    from (
      select new.owner_id as recipient_id
      union
      select m.user_id from public.crowspace_project_members m
      where m.project_id=new.id and m.status='accepted'
    ) recipients
    where recipients.recipient_id is not null and recipients.recipient_id <> auth.uid();
  end if;
  return new;
end;
$$;
revoke all on function public.crowspace_phase6_notify_project_status() from public, anon, authenticated;
drop trigger if exists crowspace_phase631_project_status_notify on public.crowspace_projects;
create trigger crowspace_phase631_project_status_notify
after update of status on public.crowspace_projects
for each row execute function public.crowspace_phase6_notify_project_status();
