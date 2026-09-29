-- v95 adaptive source health
create or replace function public.crowspace_thumbnail_update_source_health(p_media_id uuid,p_user_id uuid,p_source_url text,p_success boolean,p_status integer default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.crowspace_thumbnail_source_candidates;
begin
 insert into public.crowspace_thumbnail_source_candidates(user_id,media_id,source_url) values(p_user_id,p_media_id,p_source_url)
 on conflict(media_id,source_url) do update set updated_at=now();
 if p_success then
  update public.crowspace_thumbnail_source_candidates set success_count=success_count+1,consecutive_failures=0,last_success_at=now(),last_status=p_status,health_score=least(100,health_score*0.85+15),enabled=true,updated_at=now() where media_id=p_media_id and user_id=p_user_id and source_url=p_source_url returning * into r;
 else
  update public.crowspace_thumbnail_source_candidates set failure_count=failure_count+1,consecutive_failures=consecutive_failures+1,last_failure_at=now(),last_status=p_status,health_score=greatest(0,health_score*0.7-10),enabled=(consecutive_failures+1<3),updated_at=now() where media_id=p_media_id and user_id=p_user_id and source_url=p_source_url returning * into r;
 end if;
 if p_success and r.health_score>=70 then update public.crowspace_thumbnail_source_candidates set is_primary=(id=r.id),updated_at=now() where media_id=p_media_id; update public.crowspace_hero_media set public_url=r.source_url,thumbnail_primary_source_id=r.id where id=p_media_id and user_id=p_user_id; end if;
 return jsonb_build_object('source_id',r.id,'health_score',r.health_score,'enabled',r.enabled,'success_count',r.success_count,'failure_count',r.failure_count,'consecutive_failures',r.consecutive_failures);
end $$;
revoke all on function public.crowspace_thumbnail_update_source_health(uuid,uuid,text,boolean,integer) from public,anon,authenticated;
grant execute on function public.crowspace_thumbnail_update_source_health(uuid,uuid,text,boolean,integer) to service_role;