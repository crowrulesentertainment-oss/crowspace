-- v107: long-term source experiment memory
create table if not exists public.crowspace_thumbnail_source_experiments (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,media_id uuid not null references public.crowspace_hero_media(id) on delete cascade,source_id uuid not null references public.crowspace_thumbnail_source_candidates(id) on delete cascade,prediction_id uuid references public.crowspace_thumbnail_source_predictions(id) on delete set null,selection_mode text not null default 'exploitation' check(selection_mode in ('exploration','exploitation')),predicted_score numeric(6,2),predicted_confidence numeric(6,2),actual_success boolean,prediction_correct boolean,health_before numeric(5,2),health_after numeric(5,2),calibration_before numeric(6,2),calibration_after numeric(6,2),status integer,error_message text,started_at timestamptz not null default now(),completed_at timestamptz,created_at timestamptz not null default now());
alter table public.crowspace_thumbnail_source_experiments enable row level security;
do $$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='crowspace_thumbnail_source_experiments' and policyname='owners select thumbnail experiments') then create policy "owners select thumbnail experiments" on public.crowspace_thumbnail_source_experiments for select to authenticated using(auth.uid()=user_id); end if; end $$;
create index if not exists idx_thumbnail_experiments_source on public.crowspace_thumbnail_source_experiments(source_id,created_at desc);
create index if not exists idx_thumbnail_experiments_media on public.crowspace_thumbnail_source_experiments(media_id,created_at desc);
create or replace function public.crowspace_thumbnail_record_experiment(p_media_id uuid,p_user_id uuid,p_source_url text,p_success boolean,p_status integer default null,p_error text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare c record; pred record; e record; hb numeric; cb numeric;
begin
 select * into c from public.crowspace_thumbnail_source_candidates where media_id=p_media_id and user_id=p_user_id and source_url=p_source_url limit 1;
 if c.id is null then return jsonb_build_object('recorded',false,'reason','candidate_not_found'); end if;
 select * into pred from public.crowspace_thumbnail_source_predictions where media_id=p_media_id and source_id=c.id limit 1;
 hb:=coalesce(c.health_score,50); cb:=coalesce(pred.calibration_score,50);
 select * into e from public.crowspace_thumbnail_source_experiments where media_id=p_media_id and source_id=c.id and completed_at is null order by started_at desc limit 1;
 if e.id is null then
   insert into public.crowspace_thumbnail_source_experiments(user_id,media_id,source_id,prediction_id,selection_mode,predicted_score,predicted_confidence,health_before,calibration_before,actual_success,status,error_message,completed_at)
   values(p_user_id,p_media_id,c.id,pred.id,coalesce(pred.selection_mode,'exploitation'),pred.prediction_score,pred.confidence,hb,cb,p_success,p_status,p_error,now());
 else
   update public.crowspace_thumbnail_source_experiments set actual_success=p_success,status=p_status,error_message=p_error,completed_at=now(),health_after=coalesce(c.health_score,hb),calibration_after=coalesce(pred.calibration_score,cb) where id=e.id;
 end if;
 return jsonb_build_object('recorded',true,'source_id',c.id);
end $$;
revoke all on function public.crowspace_thumbnail_record_experiment(uuid,uuid,text,boolean,integer,text) from public,anon,authenticated;
grant execute on function public.crowspace_thumbnail_record_experiment(uuid,uuid,text,boolean,integer,text) to service_role;