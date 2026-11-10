-- CrowSpace Phase 6.3: collaboration notifications and realtime delivery
-- Reuses crowspace_notifications; no new notification table is introduced.

create or replace function public.crowspace_phase6_notify_collaboration()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_owner uuid;
  v_title text;
begin
  if tg_table_name = 'crowspace_collab_invitations' then
    if tg_op = 'INSERT' then
      insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message)
      values(new.recipient_id,new.sender_id,'collaboration_invitation','collaboration_invitation',new.id,'invited you to collaborate');
    elsif tg_op = 'UPDATE' and old.status is distinct from new.status
      and new.status in ('accepted','declined') then
      insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message)
      values(new.sender_id,new.recipient_id,'collaboration_invitation_response','collaboration_invitation',new.id,
        case when new.status='accepted' then 'accepted your collaboration invitation' else 'declined your collaboration invitation' end);
    end if;
    return new;
  elsif tg_table_name = 'crowspace_opportunity_applications' then
    select created_by into v_owner from public.crowspace_opportunities where id=new.opportunity_id;
    if tg_op = 'INSERT' then
      if v_owner is not null and v_owner <> new.applicant_id then
        insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message)
        values(v_owner,new.applicant_id,'opportunity_application','opportunity_application',new.id,'expressed interest in your opportunity');
      end if;
    elsif tg_op = 'UPDATE' and old.status is distinct from new.status
      and new.status in ('reviewing','accepted','declined') then
      insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message)
      values(new.applicant_id,v_actor,'opportunity_application_status','opportunity_application',new.id,
        case new.status when 'reviewing' then 'moved your application into review' when 'accepted' then 'accepted your opportunity application' else 'declined your opportunity application' end);
    end if;
    return new;
  elsif tg_table_name = 'crowspace_project_members' then
    select title into v_title from public.crowspace_projects where id=new.project_id;
    if tg_op = 'INSERT' and new.status='invited' and new.user_id <> new.owner_id then
      insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message)
      values(new.user_id,new.owner_id,'project_invitation','project',new.project_id,'invited you to join project "'||coalesce(v_title,'a project')||'"');
    elsif tg_op = 'UPDATE' and old.status is distinct from new.status
      and new.status in ('accepted','declined') and new.user_id <> new.owner_id then
      insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message)
      values(new.owner_id,new.user_id,'project_invitation_response','project',new.project_id,
        case when new.status='accepted' then 'accepted your project invitation' else 'declined your project invitation' end);
    end if;
    return new;
  elsif tg_table_name = 'crowspace_project_updates' then
    select owner_id,title into v_owner,v_title from public.crowspace_projects where id=new.project_id;
    insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message)
    select distinct recipients.recipient_id,new.author_id,'project_update','project_update',new.project_id,
      'posted a new update in project "'||coalesce(v_title,'your project')||'"'
    from (
      select v_owner as recipient_id
      union
      select m.user_id from public.crowspace_project_members m
      where m.project_id=new.project_id and m.status='accepted'
    ) recipients
    where recipients.recipient_id is not null and recipients.recipient_id <> new.author_id;
    return new;
  end if;
  return new;
end;
$$;

revoke all on function public.crowspace_phase6_notify_collaboration() from public, anon, authenticated;

drop trigger if exists crowspace_phase63_collab_invitation_notify on public.crowspace_collab_invitations;
create trigger crowspace_phase63_collab_invitation_notify after insert or update of status
on public.crowspace_collab_invitations for each row execute function public.crowspace_phase6_notify_collaboration();

drop trigger if exists crowspace_phase63_opportunity_application_notify on public.crowspace_opportunity_applications;
create trigger crowspace_phase63_opportunity_application_notify after insert or update of status
on public.crowspace_opportunity_applications for each row execute function public.crowspace_phase6_notify_collaboration();

drop trigger if exists crowspace_phase63_project_member_notify on public.crowspace_project_members;
create trigger crowspace_phase63_project_member_notify after insert or update of status
on public.crowspace_project_members for each row execute function public.crowspace_phase6_notify_collaboration();

drop trigger if exists crowspace_phase63_project_update_notify on public.crowspace_project_updates;
create trigger crowspace_phase63_project_update_notify after insert
on public.crowspace_project_updates for each row execute function public.crowspace_phase6_notify_collaboration();

-- Add the existing private-to-recipient notification table to Realtime when the publication exists.
do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
     and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
                    and schemaname='public' and tablename='crowspace_notifications') then
    alter publication supabase_realtime add table public.crowspace_notifications;
  end if;
end $$;
