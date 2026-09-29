-- v105: create neutral initial predictions as soon as source candidates are seeded
create or replace function public.crowspace_thumbnail_seed_prediction(p_media_id uuid,p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare pcount integer:=0;
begin
 insert into public.crowspace_thumbnail_source_predictions(user_id,media_id,source_id,prediction_score,confidence,sample_count,predicted_success,features)
 select c.user_id,c.media_id,c.id,50,10,0,false,jsonb_build_object('bootstrap',true,'selection_mode','exploitation')
 from public.crowspace_thumbnail_source_candidates c
 where c.media_id=p_media_id and c.user_id=p_user_id
 on conflict (media_id,source_id) do nothing;
 get diagnostics pcount=row_count;
 return jsonb_build_object('created',pcount);
end $$;
revoke all on function public.crowspace_thumbnail_seed_prediction(uuid,uuid) from public,anon,authenticated;
grant execute on function public.crowspace_thumbnail_seed_prediction(uuid,uuid) to service_role;

create or replace function public.crowspace_thumbnail_seed_media_source()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.media_type <> 'video' then
   insert into public.crowspace_thumbnail_source_candidates(user_id,media_id,source_url,source_type,priority)
   values(new.user_id,new.id,new.public_url,'primary',10)
   on conflict (media_id,source_url) do update set updated_at=now();
   if coalesce(new.storage_path,'')<>'' then
     insert into public.crowspace_thumbnail_source_candidates(user_id,media_id,source_url,source_type,priority)
     values(new.user_id,new.id,'https://cevylpnoexugwgygvtgu.supabase.co/storage/v1/object/public/crowspace-media/'||ltrim(new.storage_path,'/'),'storage_path',20)
     on conflict (media_id,source_url) do update set updated_at=now();
   end if;
   perform public.crowspace_thumbnail_seed_prediction(new.id,new.user_id);
 end if;
 return new;
end $$;
revoke all on function public.crowspace_thumbnail_seed_media_source() from public,anon,authenticated;
grant execute on function public.crowspace_thumbnail_seed_media_source() to service_role;
drop trigger if exists trg_crowspace_thumbnail_seed_media_source on public.crowspace_hero_media;
create trigger trg_crowspace_thumbnail_seed_media_source after insert or update of public_url,storage_path on public.crowspace_hero_media for each row execute function public.crowspace_thumbnail_seed_media_source();