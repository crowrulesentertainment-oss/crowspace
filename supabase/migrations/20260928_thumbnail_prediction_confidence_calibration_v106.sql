-- v106: prediction confidence calibration
alter table public.crowspace_thumbnail_source_predictions add column if not exists calibration_score numeric(6,2) not null default 50;
alter table public.crowspace_thumbnail_source_predictions add column if not exists calibration_sample_count integer not null default 0;
alter table public.crowspace_thumbnail_source_predictions add column if not exists calibration_correct_count integer not null default 0;
alter table public.crowspace_thumbnail_source_predictions add column if not exists calibration_error numeric(6,2) not null default 0;
alter table public.crowspace_thumbnail_source_predictions add column if not exists last_calibrated_at timestamptz;
create index if not exists idx_thumbnail_prediction_calibration on public.crowspace_thumbnail_source_predictions(media_id,calibration_score desc,last_calibrated_at desc);

create or replace function public.crowspace_thumbnail_calibrate_prediction(p_prediction_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare p record; total integer; correct integer; observed numeric; err numeric; cal numeric;
begin
 select * into p from public.crowspace_thumbnail_source_predictions where id=p_prediction_id;
 if p.id is null then return jsonb_build_object('calibrated',false,'reason','prediction_not_found'); end if;
 select count(*),count(*) filter(where prediction_correct=true) into total,correct
 from public.crowspace_thumbnail_source_validation_history where prediction_id=p.id and prediction_correct is not null;
 if total=0 then return jsonb_build_object('calibrated',false,'reason','no_feedback'); end if;
 observed:=100.0*correct/total; err:=abs(observed-coalesce(p.confidence,0)); cal:=greatest(0,100-err);
 update public.crowspace_thumbnail_source_predictions
 set calibration_score=cal,calibration_sample_count=total,calibration_correct_count=correct,calibration_error=err,last_calibrated_at=now(),confidence=least(100,greatest(0,(coalesce(confidence,0)*0.5)+(observed*0.5))),updated_at=now()
 where id=p.id;
 return jsonb_build_object('calibrated',true,'observed_success_rate',observed,'confidence_error',err,'calibration_score',cal,'samples',total);
end $$;
revoke all on function public.crowspace_thumbnail_calibrate_prediction(uuid) from public,anon,authenticated;
grant execute on function public.crowspace_thumbnail_calibrate_prediction(uuid) to service_role;

create or replace function public.crowspace_thumbnail_calibrate_predictions(p_limit integer default 250)
returns jsonb language plpgsql security definer set search_path=public as $$
declare r record; n integer:=0;
begin
 for r in select id from public.crowspace_thumbnail_source_predictions order by coalesce(last_calibrated_at,'epoch') asc limit p_limit loop
   if (public.crowspace_thumbnail_calibrate_prediction(r.id)->>'calibrated')::boolean then n:=n+1; end if;
 end loop;
 return jsonb_build_object('calibrated',n);
end $$;
revoke all on function public.crowspace_thumbnail_calibrate_predictions(integer) from public,anon,authenticated;
grant execute on function public.crowspace_thumbnail_calibrate_predictions(integer) to service_role;