-- CrowSpace Phase 5.1: public Creator Passport discovery and privacy enforcement
-- Existing profiles, friendships and Creator Passport tables are reused.
drop policy if exists "CrowSpace profiles are publicly readable" on public.crowspace_profiles;
drop policy if exists "Members can view public or connected profiles" on public.crowspace_profiles;
create policy "Members can view public or connected profiles"
on public.crowspace_profiles for select to authenticated
using (
  user_id = (select auth.uid())
  or profile_visibility = 'public'
  or exists (
    select 1 from public.friendships f
    where
      (f.requester_id = (select auth.uid()) and f.addressee_id = crowspace_profiles.user_id)
      or (f.addressee_id = (select auth.uid()) and f.requester_id = crowspace_profiles.user_id)
  )
  or coalesce((auth.jwt()->'app_metadata'->>'crowspace_admin') = 'true', false)
);

drop policy if exists "Visible profile skills" on public.crowspace_profile_skills;
create policy "Visible profile skills" on public.crowspace_profile_skills
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.crowspace_profiles p
    where p.user_id = crowspace_profile_skills.user_id
      and p.profile_visibility = 'public'
  )
  or coalesce((auth.jwt()->'app_metadata'->>'crowspace_admin') = 'true', false)
);

drop policy if exists "Visible profile showcase" on public.crowspace_profile_showcase;
create policy "Visible profile showcase" on public.crowspace_profile_showcase
for select to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1 from public.crowspace_profiles p
    where p.user_id = crowspace_profile_showcase.user_id
      and p.profile_visibility = 'public'
  )
  or coalesce((auth.jwt()->'app_metadata'->>'crowspace_admin') = 'true', false)
);

revoke all on public.crowspace_profiles from anon;
grant select on public.crowspace_profiles to authenticated;
