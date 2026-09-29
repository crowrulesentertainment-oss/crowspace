-- v108: experiment-driven learning
alter table public.crowspace_thumbnail_source_predictions add column if not exists experiment_score numeric(6,2) not null default 50;
alter table public.crowspace_thumbnail_source_predictions add column if not exists exploration_success_rate numeric(6,2) not null default 50;
alter table public.crowspace_thumbnail_source_predictions add column if not exists exploitation_success_rate numeric(6,2) not null default 50;
alter table public.crowspace_thumbnail_source_predictions add column if not exists experiment_sample_count integer not null default 0;
create index if not exists idx_thumbnail_prediction_experiment on public.crowspace_thumbnail_source_predictions(media_id,experiment_score desc,experiment_sample_count desc);

create or replace function public.crowspace_thumbnail_learn_from_experiments(p_media_id uuid,p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r record; ex integer; ers numeric; xrs numeric; es numeric;
begin
 for r in select p.id,p.source_id from public.crowspace_thumbnail_source_predictions p where p.media_id=p_media_id and p.user_id=p_user_id loop
   select count(*),
     coalesce(100.0*count(*) filter(where actual_success=true and selection_mode='exploration')/nullif(count(*) filter(where selection_mode='exploration'),0),50),
     coalesce(100.0*count(*) filter(where actual_success=true and selection_mode='exploitation')/nullif(count(*) filter(where selection_mode='exploitation'),0),50)
   into ex,ers,xrs
   from public.crowspace_thumbnail_source_experiments
   where source_id=r.source_id and media_id=p_media_id and completed_at is not null;
   es:=least(100,greatest(0,ers*0.35+xrs*0.35+coalesce((select reliability_score from public.crowspace_thumbnail_source_candidates c where c.id=r.source_id),50)*0.20+coalesce((select health_score from public.crowspace_thumbnail_source_candidates c where c.id=r.source_id),50)*0.10));
   update public.crowspace_thumbnail_source_predictions
   set experiment_score=es,exploration_success_rate=ers,exploitation_success_rate=xrs,experiment_sample_count=ex,updated_at=now()
   where id=r.id;
 end loop;
 return jsonb_build_object('learned',true,'media_id',p_media_id);
end $$;
revoke all on function public.crowspace_thumbnail_learn_from_experiments(uuid,uuid) from public,anon,authenticated;
grant execute on function public.crowspace_thumbnail_learn_from_experiments(uuid,uuid) to service_role;