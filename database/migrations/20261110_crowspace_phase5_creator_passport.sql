-- CrowSpace Phase 5: Creator Passport, achievements, milestones and showcase
-- Applied to project cevylpnoexugwgygvtgu on 2026-11-10.
create schema if not exists private;

create table if not exists public.crowspace_achievements (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '' check (char_length(description) <= 500),
  icon text not null default '✦' check (char_length(icon) <= 12),
  category text not null default 'community' check (category in ('community','creator','milestone','recognition')),
  criteria text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
create table if not exists public.crowspace_member_achievements (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  achievement_id uuid not null references public.crowspace_achievements(id) on delete cascade,
  awarded_by uuid references auth.users(id) on delete set null,
  award_note text not null default '' check (char_length(award_note) <= 500),
  awarded_at timestamptz not null default now(),
  unique(member_id, achievement_id)
);
create table if not exists public.crowspace_member_milestones (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  milestone_key text not null check (milestone_key ~ '^[a-z0-9_-]{2,80}$'),
  title text not null check (char_length(title) between 2 and 100),
  description text not null default '' check (char_length(description) <= 500),
  metadata jsonb not null default '{}'::jsonb,
  achieved_at timestamptz not null default now(),
  unique(member_id, milestone_key)
);
create table if not exists public.crowspace_profile_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_name text not null check (char_length(skill_name) between 2 and 60),
  category text not null default 'creative' check (category in ('creative','professional','community','technical','other')),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  unique(user_id, skill_name)
);
create table if not exists public.crowspace_profile_showcase (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  project_url text not null default '' check (project_url = '' or project_url ~* '^https?://'),
  media_url text not null default '' check (media_url = '' or media_url ~* '^https?://'),
  category text not null default 'project' check (category in ('project','portfolio','video','podcast','writing','artwork','community','other')),
  is_featured boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crowspace_member_achievements_member_idx on public.crowspace_member_achievements(member_id, awarded_at desc);
create index if not exists crowspace_member_milestones_member_idx on public.crowspace_member_milestones(member_id, achieved_at desc);
create index if not exists crowspace_profile_skills_user_idx on public.crowspace_profile_skills(user_id, sort_order);
create index if not exists crowspace_profile_showcase_user_idx on public.crowspace_profile_showcase(user_id, sort_order, created_at desc);

alter table public.crowspace_achievements enable row level security;
alter table public.crowspace_member_achievements enable row level security;
alter table public.crowspace_member_milestones enable row level security;
alter table public.crowspace_profile_skills enable row level security;
alter table public.crowspace_profile_showcase enable row level security;
revoke all on public.crowspace_achievements, public.crowspace_member_achievements, public.crowspace_member_milestones, public.crowspace_profile_skills, public.crowspace_profile_showcase from anon;
grant select on public.crowspace_achievements to authenticated;
grant select on public.crowspace_member_achievements, public.crowspace_member_milestones to authenticated;
grant select, insert, update, delete on public.crowspace_profile_skills, public.crowspace_profile_showcase to authenticated;
grant insert, update, delete on public.crowspace_achievements to authenticated;
grant insert, delete on public.crowspace_member_achievements to authenticated;

create policy "Active achievement catalog is readable" on public.crowspace_achievements for select to authenticated
using (is_active or coalesce((auth.jwt()->'app_metadata'->>'crowspace_admin') = 'true', false));
create policy "CrowSpace admins manage achievement catalog" on public.crowspace_achievements for all to authenticated
using (coalesce((auth.jwt()->'app_metadata'->>'crowspace_admin') = 'true', false))
with check (coalesce((auth.jwt()->'app_metadata'->>'crowspace_admin') = 'true', false));
create policy "Visible member achievements" on public.crowspace_member_achievements for select to authenticated
using (member_id = (select auth.uid()) or exists(select 1 from public.crowspace_profiles p where p.user_id=member_id and p.profile_visibility='public') or coalesce((auth.jwt()->'app_metadata'->>'crowspace_admin')='true',false));
create policy "CrowSpace admins award achievements" on public.crowspace_member_achievements for insert to authenticated
with check (coalesce((auth.jwt()->'app_metadata'->>'crowspace_admin')='true',false));
create policy "CrowSpace admins revoke achievements" on public.crowspace_member_achievements for delete to authenticated
using (coalesce((auth.jwt()->'app_metadata'->>'crowspace_admin')='true',false));
create policy "Visible member milestones" on public.crowspace_member_milestones for select to authenticated
using (member_id=(select auth.uid()) or exists(select 1 from public.crowspace_profiles p where p.user_id=member_id and p.profile_visibility='public') or coalesce((auth.jwt()->'app_metadata'->>'crowspace_admin')='true',false));
create policy "Visible profile skills" on public.crowspace_profile_skills for select to authenticated
using (user_id=(select auth.uid()) or exists(select 1 from public.crowspace_profiles p where p.user_id=user_id and p.profile_visibility='public'));
create policy "Members manage own skills" on public.crowspace_profile_skills for insert to authenticated with check(user_id=(select auth.uid()));
create policy "Members update own skills" on public.crowspace_profile_skills for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "Members delete own skills" on public.crowspace_profile_skills for delete to authenticated using(user_id=(select auth.uid()));
create policy "Visible profile showcase" on public.crowspace_profile_showcase for select to authenticated
using(user_id=(select auth.uid()) or exists(select 1 from public.crowspace_profiles p where p.user_id=user_id and p.profile_visibility='public'));
create policy "Members create own showcase items" on public.crowspace_profile_showcase for insert to authenticated with check(user_id=(select auth.uid()));
create policy "Members update own showcase items" on public.crowspace_profile_showcase for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "Members delete own showcase items" on public.crowspace_profile_showcase for delete to authenticated using(user_id=(select auth.uid()));

insert into public.crowspace_achievements(slug,name,description,icon,category,criteria,sort_order) values
('first-post','First Voice','Published your first CrowSpace post.','✍️','milestone','Automatically awarded when your first post is published.',10),
('community-builder','Community Builder','Joined your first CrowSpace community.','🏘️','community','Automatically awarded when you become an active community member.',20),
('showed-up','Showed Up','RSVP’d Going to your first CrowSpace event.','🎟️','community','Automatically awarded for your first Going RSVP.',30),
('creator-passport','Creator Passport','Completed your creator identity with at least one skill or showcase project.','🎬','creator','Awarded by CrowSpace administrators after review.',40),
('community-champion','Community Champion','Recognized for meaningful support of the CrowSpace community.','🌟','recognition','Awarded by CrowSpace administrators.',50)
on conflict(slug) do nothing;

create or replace function private.crowspace_record_milestone(p_member_id uuid,p_key text,p_title text,p_description text,p_metadata jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_milestone_id uuid;
begin
 if p_member_id is null or not exists(select 1 from auth.users where id=p_member_id) then return; end if;
 insert into public.crowspace_member_milestones(member_id,milestone_key,title,description,metadata)
 values(p_member_id,p_key,p_title,p_description,coalesce(p_metadata,'{}'::jsonb))
 on conflict(member_id,milestone_key) do nothing returning id into v_milestone_id;
 if v_milestone_id is not null then
  insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message)
  values(p_member_id,null,'milestone','milestone',v_milestone_id,'You reached a new CrowSpace milestone: '||p_title||'.');
  insert into public.crowspace_member_achievements(member_id,achievement_id,award_note)
  select p_member_id,a.id,'Automatically earned: '||p_title from public.crowspace_achievements a where a.slug=p_key and a.is_active
  on conflict(member_id,achievement_id) do nothing;
 end if;
end; $$;

create or replace function private.crowspace_milestone_on_profile() returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
begin perform private.crowspace_record_milestone(new.user_id,'joined-crowspace','Joined CrowSpace','Created a CrowSpace member identity.'); return new; end; $$;
create or replace function private.crowspace_milestone_on_post() returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
begin
 if not exists(select 1 from public.crowspace_posts p where p.author_id=new.author_id and p.id<>new.id) then
  perform private.crowspace_record_milestone(new.author_id,'first-post','First Post','Published a first post in the CrowSpace community.');
 end if; return new;
end; $$;
create or replace function private.crowspace_milestone_on_community_join() returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
begin
 if new.status='active' and not exists(select 1 from public.crowspace_community_members m where m.user_id=new.user_id and m.status='active' and m.community_id<>new.community_id) then
  perform private.crowspace_record_milestone(new.user_id,'community-builder','First Community','Became an active member of a CrowSpace community.');
 end if; return new;
end; $$;
create or replace function private.crowspace_milestone_on_event_rsvp() returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
begin
 if new.response='going' and (tg_op='INSERT' or old.response is distinct from new.response) then
  if not exists(select 1 from public.crowspace_event_rsvps r where r.user_id=new.user_id and r.response='going' and r.event_id<>new.event_id) then
   perform private.crowspace_record_milestone(new.user_id,'showed-up','First Event RSVP','Marked Going to a CrowSpace event.');
  end if;
 end if; return new;
end; $$;
drop trigger if exists crowspace_phase5_profile_milestone on public.crowspace_profiles;
create trigger crowspace_phase5_profile_milestone after insert on public.crowspace_profiles for each row execute function private.crowspace_milestone_on_profile();
drop trigger if exists crowspace_phase5_post_milestone on public.crowspace_posts;
create trigger crowspace_phase5_post_milestone after insert on public.crowspace_posts for each row execute function private.crowspace_milestone_on_post();
drop trigger if exists crowspace_phase5_community_milestone on public.crowspace_community_members;
create trigger crowspace_phase5_community_milestone after insert or update of status on public.crowspace_community_members for each row execute function private.crowspace_milestone_on_community_join();
drop trigger if exists crowspace_phase5_event_milestone on public.crowspace_event_rsvps;
create trigger crowspace_phase5_event_milestone after insert or update of response on public.crowspace_event_rsvps for each row execute function private.crowspace_milestone_on_event_rsvp();

create or replace function private.crowspace_notify_achievement_award() returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_name text;
begin
 select name into v_name from public.crowspace_achievements where id=new.achievement_id;
 insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message)
 values(new.member_id,new.awarded_by,'achievement','achievement',new.id,'You earned a CrowSpace achievement: '||coalesce(v_name,'New achievement')||'.');
 return new;
end; $$;
drop trigger if exists crowspace_phase5_achievement_notification on public.crowspace_member_achievements;
create trigger crowspace_phase5_achievement_notification after insert on public.crowspace_member_achievements for each row execute function private.crowspace_notify_achievement_award();
revoke all on function private.crowspace_record_milestone(uuid,text,text,text,jsonb) from public,anon,authenticated;
revoke all on function private.crowspace_milestone_on_profile() from public,anon,authenticated;
revoke all on function private.crowspace_milestone_on_post() from public,anon,authenticated;
revoke all on function private.crowspace_milestone_on_community_join() from public,anon,authenticated;
revoke all on function private.crowspace_milestone_on_event_rsvp() from public,anon,authenticated;
revoke all on function private.crowspace_notify_achievement_award() from public,anon,authenticated;
