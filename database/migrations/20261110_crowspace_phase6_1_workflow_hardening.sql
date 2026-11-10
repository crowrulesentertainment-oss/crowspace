-- Phase 6.1 workflow hardening: protect participant identity and permitted status transitions.
create or replace function public.crowspace_phase6_guard_workflow_updates()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  is_admin boolean := coalesce((select auth.jwt())->'app_metadata'->>'crowspace_admin','false')='true';
  listing_owner uuid;
begin
  if tg_table_name = 'crowspace_collab_invitations' then
    if new.id <> old.id or new.sender_id <> old.sender_id or new.recipient_id <> old.recipient_id
       or new.created_at <> old.created_at then raise exception 'Invitation participants and identity cannot be changed'; end if;
    if actor = old.recipient_id then
      if old.status <> 'pending' or new.status not in ('accepted','declined')
         or new.message <> old.message or new.collaboration_type <> old.collaboration_type then raise exception 'Recipients may only accept or decline pending invitations'; end if;
    elsif actor = old.sender_id then
      if old.status <> 'pending' or new.status <> 'cancelled'
         or new.message <> old.message or new.collaboration_type <> old.collaboration_type then raise exception 'Senders may only cancel pending invitations'; end if;
    else raise exception 'Only invitation participants may update an invitation'; end if;
    new.responded_at := now(); return new;
  elsif tg_table_name = 'crowspace_opportunity_applications' then
    if new.id <> old.id or new.opportunity_id <> old.opportunity_id
       or new.applicant_id <> old.applicant_id or new.created_at <> old.created_at then raise exception 'Application identity cannot be changed'; end if;
    select created_by into listing_owner from public.crowspace_opportunities where id=old.opportunity_id;
    if actor = old.applicant_id then
      if old.status not in ('submitted','reviewing') or new.status <> 'withdrawn' or new.message <> old.message then raise exception 'Applicants may only withdraw their active application'; end if;
    elsif actor = listing_owner or is_admin then
      if new.status not in ('reviewing','accepted','declined') then raise exception 'Opportunity owners may review, accept, or decline applications'; end if;
    else raise exception 'Only the applicant, opportunity owner, or administrator may update an application'; end if;
    new.updated_at := now(); return new;
  end if;
  return new;
end;
$$;
drop trigger if exists crowspace_guard_collab_invitation_updates on public.crowspace_collab_invitations;
create trigger crowspace_guard_collab_invitation_updates before update on public.crowspace_collab_invitations for each row execute function public.crowspace_phase6_guard_workflow_updates();
drop trigger if exists crowspace_guard_opportunity_application_updates on public.crowspace_opportunity_applications;
create trigger crowspace_guard_opportunity_application_updates before update on public.crowspace_opportunity_applications for each row execute function public.crowspace_phase6_guard_workflow_updates();
revoke all on function public.crowspace_phase6_guard_workflow_updates() from public, anon, authenticated;
