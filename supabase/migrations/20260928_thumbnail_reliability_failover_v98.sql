-- v98 complete: reliability-aware thumbnail failover
create or replace function public.crowspace_thumbnail_source_failover(p_media_id uuid,p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c public.crowspace_thumbnail_source_candidates;
begin
 select * into c from public.crowspace_thumbnail_source_candidates
 where media_id=p_media_id and user_id=p_user_id and enabled=true
   and (disabled_until is null or disabled_until<=now())
 order by reliability_score desc,health_score desc,consecutive_failures asc,priority asc,updated_at desc limit 1;
 if c.id is null then return jsonb_build_object('selected',false,'reason','no_eligible_source'); end if;
 update public.crowspace_thumbnail_source_candidates set is_primary=false,updated_at=now() where media_id=p_media_id;
 update public.crowspace_thumbnail_source_candidates set is_primary=true,updated_at=now() where id=c.id;
 update public.crowspace_hero_media set public_url=c.source_url,thumbnail_primary_source_id=c.id where id=p_media_id and user_id=p_user_id;
 return jsonb_build_object('selected',true,'source_id',c.id,'source_url',c.source_url,'reliability_score',c.reliability_score,'health_score',c.health_score,'consecutive_failures',c.consecutive_failures,'priority',c.priority);
end $$;
revoke all on function public.crowspace_thumbnail_source_failover(uuid,uuid) from public,anon,authenticated;
grant execute on function public.crowspace_thumbnail_source_failover(uuid,uuid) to service_role;