-- v110: intelligence-aware exploration
alter table public.crowspace_thumbnail_source_predictions add column if not exists exploration_priority numeric(6,2) not null default 50;
alter table public.crowspace_thumbnail_source_predictions add column if not exists uncertainty_score numeric(6,2) not null default 100;
alter table public.crowspace_thumbnail_source_predictions add column if not exists exploration_reason text not null default 'bootstrap';
create index if not exists idx_thumbnail_intelligent_exploration on public.crowspace_thumbnail_source_predictions(media_id,exploration_priority desc,uncertainty_score desc);

create or replace function public.crowspace_thumbnail_update_exploration_priority(p_media_id uuid,p_user_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare r record; u numeric; pri numeric; rs text; n integer:=0;
begin
 for r in select p.id,p.confidence,p.unified_intelligence_score,p.experiment_sample_count from public.crowspace_thumbnail_source_predictions p where p.media_id=p_media_id and p.user_id=p_user_id loop
   u:=least(100,greatest(0,100-coalesce(r.confidence,0)));
   pri:=least(100,greatest(0,u*0.50+(100-least(100,coalesce(r.experiment_sample_count,0)*5))*0.30+greatest(0,70-coalesce(r.unified_intelligence_score,50))*0.20));
   rs:=case when coalesce(r.experiment_sample_count,0)=0 then 'no_experiments' when u>=60 then 'high_uncertainty' when coalesce(r.unified_intelligence_score,50)>=70 then 'promising_source' else 'underexplored' end;
   update public.crowspace_thumbnail_source_predictions set uncertainty_score=u,exploration_priority=pri,exploration_reason=rs,updated_at=now() where id=r.id; n:=n+1;
 end loop; return jsonb_build_object('updated',n,'media_id',p_media_id);
end $$;
revoke all on function public.crowspace_thumbnail_update_exploration_priority(uuid,uuid) from public,anon,authenticated;
grant execute on function public.crowspace_thumbnail_update_exploration_priority(uuid,uuid) to service_role;

create or replace function public.crowspace_thumbnail_select_v110(p_media_id uuid,p_user_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare r record; mode text; reason text;
begin
 perform public.crowspace_thumbnail_learn_from_experiments(p_media_id,p_user_id);
 perform public.crowspace_thumbnail_update_unified_intelligence(p_media_id,p_user_id);
 perform public.crowspace_thumbnail_update_exploration_priority(p_media_id,p_user_id);
 if random()<0.20 then mode:='exploration'; else mode:='exploitation'; end if;
 if mode='exploration' then
   select p.*,c.source_url into r from public.crowspace_thumbnail_source_predictions p join public.crowspace_thumbnail_source_candidates c on c.id=p.source_id where p.media_id=p_media_id and p.user_id=p_user_id and c.enabled=true and (c.disabled_until is null or c.disabled_until<=now()) order by p.exploration_priority desc,p.uncertainty_score desc,p.unified_intelligence_score desc,p.experiment_sample_count asc,c.priority asc limit 1;
   reason:=coalesce(r.exploration_reason,'underexplored');
 else
   select p.*,c.source_url into r from public.crowspace_thumbnail_source_predictions p join public.crowspace_thumbnail_source_candidates c on c.id=p.source_id where p.media_id=p_media_id and p.user_id=p_user_id and c.enabled=true and (c.disabled_until is null or c.disabled_until<=now()) order by p.unified_intelligence_score desc,p.calibration_score desc,p.confidence desc,c.reliability_score desc,c.health_score desc,c.priority asc limit 1;
   reason:='highest_unified_intelligence';
 end if;
 if r.id is null then return jsonb_build_object('selected',false,'reason','no_eligible_source'); end if;
 update public.crowspace_thumbnail_source_predictions set selection_mode=mode,exploration_count=case when mode='exploration' then exploration_count+1 else exploration_count end,updated_at=now() where id=r.id;
 return jsonb_build_object('selected',true,'mode',mode,'reason',reason,'source_id',r.source_id,'source_url',r.source_url,'prediction_id',r.id,'intelligence_score',r.unified_intelligence_score,'exploration_priority',r.exploration_priority,'uncertainty_score',r.uncertainty_score,'experiment_samples',r.experiment_sample_count);
end $$;
revoke all on function public.crowspace_thumbnail_select_v110(uuid,uuid) from public,anon,authenticated;
grant execute on function public.crowspace_thumbnail_select_v110(uuid,uuid) to service_role;