-- Additive CrowSpace 3.0 identity extension. Existing profile records and policies are preserved.
alter table public.crowspace_profiles add column if not exists crow_id text, add column if not exists cover_url text, add column if not exists location text not null default '', add column if not exists profile_visibility text not null default 'public', add column if not exists onboarding_complete boolean not null default false;
update public.crowspace_profiles set crow_id='CR-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)) where crow_id is null or btrim(crow_id)='';
alter table public.crowspace_profiles alter column crow_id set default ('CR-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))), alter column crow_id set not null;
create unique index if not exists crowspace_profiles_crow_id_uidx on public.crowspace_profiles(crow_id);
alter table public.crowspace_profiles drop constraint if exists crowspace_profiles_visibility_check;
alter table public.crowspace_profiles add constraint crowspace_profiles_visibility_check check(profile_visibility in ('public','members','private'));
