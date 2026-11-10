-- CrowSpace Phase 3.1: Community administration and calendar support
-- Additive security changes. Existing CrowSpace and CrowRules tables remain intact.

create policy "Invited members can view their invited community"
on public.crowspace_communities for select to authenticated
using (exists (
  select 1 from public.crowspace_community_invitations i
  where i.community_id = crowspace_communities.id
    and i.invitee_id = (select auth.uid()) and i.status = 'invited'
));

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.crowspace_member_role(p_community_id uuid, p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.crowspace_community_members m
  where m.community_id = p_community_id
    and m.user_id = p_user_id
    and m.status = 'active'
    and p_user_id = (select auth.uid())
  limit 1;
$$;
revoke all on function private.crowspace_member_role(uuid,uuid) from public, anon;
grant execute on function private.crowspace_member_role(uuid,uuid) to authenticated;

create policy "Community managers can view membership roster"
on public.crowspace_community_members for select to authenticated
using (private.crowspace_member_role(community_id,(select auth.uid())) in ('owner','admin','moderator'));

create policy "Admins manage regular community members"
on public.crowspace_community_members for update to authenticated
using (role = 'member' and private.crowspace_member_role(community_id,(select auth.uid())) = 'admin')
with check (role in ('member','moderator') and private.crowspace_member_role(community_id,(select auth.uid())) = 'admin');

create policy "Moderators can restrict regular members"
on public.crowspace_community_members for update to authenticated
using (role = 'member' and private.crowspace_member_role(community_id,(select auth.uid())) = 'moderator')
with check (role = 'member' and private.crowspace_member_role(community_id,(select auth.uid())) = 'moderator');

create policy "Community admins and moderators remove members"
on public.crowspace_community_members for delete to authenticated
using (role = 'member' and private.crowspace_member_role(community_id,(select auth.uid())) in ('admin','moderator'));

create policy "Community admins and moderators invite members"
on public.crowspace_community_invitations for insert to authenticated
with check (
  inviter_id = (select auth.uid())
  and private.crowspace_member_role(community_id,(select auth.uid())) in ('owner','admin','moderator')
);

create index if not exists crowspace_community_members_roster_idx
on public.crowspace_community_members(community_id,status,role);
