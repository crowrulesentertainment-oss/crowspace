-- v104: automatically seed thumbnail source candidates when hero media is created or its source changes
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
 end if;
 return new;
end $$;
revoke all on function public.crowspace_thumbnail_seed_media_source() from public,anon,authenticated;
grant execute on function public.crowspace_thumbnail_seed_media_source() to service_role;
drop trigger if exists trg_crowspace_thumbnail_seed_media_source on public.crowspace_hero_media;
create trigger trg_crowspace_thumbnail_seed_media_source
after insert or update of public_url,storage_path on public.crowspace_hero_media
for each row execute function public.crowspace_thumbnail_seed_media_source();