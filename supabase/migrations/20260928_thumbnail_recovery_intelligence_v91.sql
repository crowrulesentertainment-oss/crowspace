-- CrowSpace v91 — Thumbnail Recovery Intelligence
alter table public.crowspace_hero_media
  add column if not exists thumbnail_failure_count integer not null default 0,
  add column if not exists thumbnail_last_failure_at timestamptz,
  add column if not exists thumbnail_quarantined boolean not null default false,
  add column if not exists thumbnail_quarantined_at timestamptz,
  add column if not exists thumbnail_quarantine_reason text not null default '';

create table if not exists public.crowspace_thumbnail_recovery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  media_id uuid not null references public.crowspace_hero_media(id) on delete cascade,
  job_id uuid references public.crowspace_thumbnail_jobs(id) on delete set null,
  action text not null check (action in ('failure','queued','success','quarantined','unquarantined','manual_retry')),
  reason text not null default '',
  attempts integer not null default 0,
  failure_count_24h integer not null default 0,
  error_message text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_thumbnail_recovery_media_created on public.crowspace_thumbnail_recovery(media_id,created_at desc);
create index if not exists idx_thumbnail_recovery_user_created on public.crowspace_thumbnail_recovery(user_id,created_at desc);
alter table public.crowspace_thumbnail_recovery enable row level security;
drop policy if exists "thumbnail recovery owner select" on public.crowspace_thumbnail_recovery;
create policy "thumbnail recovery owner select" on public.crowspace_thumbnail_recovery for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.crowspace_thumbnail_recovery from anon;
grant select on public.crowspace_thumbnail_recovery to authenticated;

create or replace function public.crowspace_thumbnail_record_failure(p_job_id uuid,p_media_id uuid,p_user_id uuid,p_error text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare failures integer; quarantined boolean; threshold constant integer:=5;
begin
 if p_user_id is null or p_media_id is null then raise exception 'Missing thumbnail recovery identifiers'; end if;
 select count(*) into failures from public.crowspace_thumbnail_recovery r where r.user_id=p_user_id and r.media_id=p_media_id and r.action='failure' and r.created_at>=now()-interval '24 hours';
 failures:=failures+1; quarantined:=failures>=threshold;
 update public.crowspace_hero_media set thumbnail_failure_count=failures,thumbnail_last_failure_at=now(),thumbnail_quarantined=quarantined,thumbnail_quarantined_at=case when quarantined then coalesce(thumbnail_quarantined_at,now()) else thumbnail_quarantined_at end,thumbnail_quarantine_reason=case when quarantined then left(coalesce(p_error,'Repeated thumbnail generation failures'),500) else thumbnail_quarantine_reason end where id=p_media_id and user_id=p_user_id;
 insert into public.crowspace_thumbnail_recovery(user_id,media_id,job_id,action,reason,attempts,failure_count_24h,error_message)
 select p_user_id,p_media_id,p_job_id,case when quarantined then 'quarantined' else 'failure' end,case when quarantined then 'Failure threshold reached' else 'Thumbnail generation failed' end,coalesce(j.attempts,0),failures,left(coalesce(p_error,''),2000) from public.crowspace_thumbnail_jobs j where j.id=p_job_id;
 return jsonb_build_object('media_id',p_media_id,'failure_count_24h',failures,'threshold',threshold,'quarantined',quarantined);
end $$;
revoke all on function public.crowspace_thumbnail_record_failure(uuid,uuid,uuid,text) from public,anon,authenticated;

create or replace function public.crowspace_thumbnail_recovery_intelligence()
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 select jsonb_build_object('quarantined_media',coalesce((select count(*) from public.crowspace_hero_media m where m.user_id=uid and m.thumbnail_quarantined),0),'repeated_failure_media',coalesce((select count(*) from public.crowspace_hero_media m where m.user_id=uid and m.thumbnail_failure_count>=3),0),'recovery_attempts_24h',coalesce((select count(*) from public.crowspace_thumbnail_recovery r where r.user_id=uid and r.created_at>=now()-interval '24 hours'),0),'failures_24h',coalesce((select count(*) from public.crowspace_thumbnail_recovery r where r.user_id=uid and r.action in ('failure','quarantined') and r.created_at>=now()-interval '24 hours'),0),'threshold',5,'window_hours',24) into result;
 return result;
end $$;
revoke all on function public.crowspace_thumbnail_recovery_intelligence() from public,anon;
grant execute on function public.crowspace_thumbnail_recovery_intelligence() to authenticated;

create or replace function public.crowspace_thumbnail_recovery_history(p_media_id uuid,p_limit integer default 25)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
 if uid is null then raise exception 'Not authenticated'; end if; p_limit:=least(greatest(coalesce(p_limit,25),1),100);
 select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) into result from (select r.id,r.media_id,r.job_id,r.action,r.reason,r.attempts,r.failure_count_24h,r.error_message,r.created_at from public.crowspace_thumbnail_recovery r where r.user_id=uid and r.media_id=p_media_id order by r.created_at desc limit p_limit) x;
 return result;
end $$;
revoke all on function public.crowspace_thumbnail_recovery_history(uuid,integer) from public,anon;
grant execute on function public.crowspace_thumbnail_recovery_history(uuid,integer) to authenticated;

create or replace function public.crowspace_thumbnail_unquarantine(p_media_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid();
begin
 if uid is null then raise exception 'Not authenticated'; end if;
 update public.crowspace_hero_media set thumbnail_quarantined=false,thumbnail_quarantined_at=null,thumbnail_quarantine_reason='',thumbnail_failure_count=0,thumbnail_last_failure_at=null where id=p_media_id and user_id=uid;
 insert into public.crowspace_thumbnail_recovery(user_id,media_id,action,reason) values(uid,p_media_id,'unquarantined','Manual creator recovery');
 return jsonb_build_object('ok',true,'media_id',p_media_id);
end $$;
revoke all on function public.crowspace_thumbnail_unquarantine(uuid) from public,anon;
grant execute on function public.crowspace_thumbnail_unquarantine(uuid) to authenticated;

create or replace function public.crowspace_thumbnail_auto_heal(p_limit integer default 25)
returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid(); inserted_count integer:=0; healed_failed integer:=0; healed_stale integer:=0;
begin
 if uid is null then raise exception 'Not authenticated'; end if; p_limit:=least(greatest(coalesce(p_limit,25),1),100);
 with candidates as (select distinct on (j.media_id) j.media_id from public.crowspace_thumbnail_jobs j join public.crowspace_hero_media m on m.id=j.media_id and m.user_id=j.user_id where j.user_id=uid and j.status='failed' and not m.thumbnail_quarantined and (select count(*) from public.crowspace_thumbnail_recovery r where r.user_id=uid and r.media_id=j.media_id and r.action in ('failure','quarantined') and r.created_at>=now()-interval '24 hours')<5 order by j.media_id,j.updated_at desc limit p_limit), ins as (insert into public.crowspace_thumbnail_jobs(user_id,media_id,status,attempts,progress,error_message,requested_at,updated_at) select uid,c.media_id,'queued',0,0,'',now(),now() from candidates c where not exists(select 1 from public.crowspace_thumbnail_jobs q where q.user_id=uid and q.media_id=c.media_id and q.status in('queued','processing')) returning media_id) select count(*) into healed_failed from ins;
 with candidates as (select m.id from public.crowspace_hero_media m where m.user_id=uid and m.media_type<>'video' and not m.thumbnail_quarantined and (m.thumbnail_generated_at is null or m.thumbnail_source_hash='' or m.thumbnail_crop_hash='') and not exists(select 1 from public.crowspace_thumbnail_jobs q where q.user_id=uid and q.media_id=m.id and q.status in('queued','processing')) and not exists(select 1 from public.crowspace_thumbnail_recovery r where r.user_id=uid and r.media_id=m.id and r.action in('failure','quarantined') and r.created_at>=now()-interval '30 minutes') limit p_limit), ins as (insert into public.crowspace_thumbnail_jobs(user_id,media_id,status,attempts,progress,error_message,requested_at,updated_at) select uid,c.id,'queued',0,0,'',now(),now() from candidates c returning media_id) select count(*) into healed_stale from ins;
 inserted_count:=healed_failed+healed_stale;
 return jsonb_build_object('queued',inserted_count,'failed_requeued',healed_failed,'missing_generation_queued',healed_stale,'quarantined_skipped',true,'failure_threshold_24h',5);
end $$;
revoke all on function public.crowspace_thumbnail_auto_heal(integer) from public,anon;
grant execute on function public.crowspace_thumbnail_auto_heal(integer) to authenticated;

create or replace function public.crowspace_thumbnail_self_heal_system(p_limit integer default 25)
returns jsonb language plpgsql security definer set search_path=public as $$
declare queued_failed integer:=0; queued_missing integer:=0; total integer:=0;
begin
 p_limit:=least(greatest(coalesce(p_limit,25),1),100);
 with candidates as (select distinct on (j.user_id,j.media_id) j.user_id,j.media_id from public.crowspace_thumbnail_jobs j join public.crowspace_hero_media m on m.id=j.media_id and m.user_id=j.user_id where j.status='failed' and not m.thumbnail_quarantined and j.updated_at<now()-interval '30 minutes' and j.updated_at>=now()-interval '24 hours' and m.media_type<>'video' and (select count(*) from public.crowspace_thumbnail_recovery r where r.user_id=j.user_id and r.media_id=j.media_id and r.action in('failure','quarantined') and r.created_at>=now()-interval '24 hours')<5 order by j.user_id,j.media_id,j.updated_at desc limit p_limit), ins as (insert into public.crowspace_thumbnail_jobs(user_id,media_id,status,attempts,progress,error_message,requested_at,updated_at) select c.user_id,c.media_id,'queued',0,0,'',now(),now() from candidates c where not exists(select 1 from public.crowspace_thumbnail_jobs q where q.user_id=c.user_id and q.media_id=c.media_id and q.status in('queued','processing')) returning media_id) select count(*) into queued_failed from ins;
 with candidates as (select m.user_id,m.id media_id from public.crowspace_hero_media m where m.media_type<>'video' and not m.thumbnail_quarantined and (m.thumbnail_generated_at is null or m.thumbnail_source_hash='' or m.thumbnail_crop_hash='') and not exists(select 1 from public.crowspace_thumbnail_jobs q where q.user_id=m.user_id and q.media_id=m.id and q.status in('queued','processing')) and not exists(select 1 from public.crowspace_thumbnail_recovery r where r.user_id=m.user_id and r.media_id=m.id and r.action in('failure','quarantined') and r.created_at>=now()-interval '30 minutes') limit p_limit), ins as (insert into public.crowspace_thumbnail_jobs(user_id,media_id,status,attempts,progress,error_message,requested_at,updated_at) select c.user_id,c.media_id,'queued',0,0,'',now(),now() from candidates c returning media_id) select count(*) into queued_missing from ins;
 total:=queued_failed+queued_missing;
 return jsonb_build_object('queued',total,'failed_requeued',queued_failed,'missing_generation_queued',queued_missing,'quarantined_skipped',true,'failure_threshold_24h',5);
end $$;