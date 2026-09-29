-- v103: automatic candidate seeding and bootstrap learning
create or replace function public.crowspace_thumbnail_bootstrap_sources(p_limit integer default 250)
returns jsonb language plpgsql security definer set search_path=public as $$
declare seeded integer:=0; storage_seeded integer:=0; repaired_seeded integer:=0;
begin
 insert into public.crowspace_thumbnail_source_candidates(user_id,media_id,source_url,source_type,priority)
 select m.user_id,m.id,m.public_url,'primary',10 from public.crowspace_hero_media m
 where coalesce(m.public_url,'')<>'' and coalesce(m.media_type,'')<>'video' limit p_limit
 on conflict (media_id,source_url) do update set updated_at=now();
 get diagnostics seeded=row_count;
 insert into public.crowspace_thumbnail_source_candidates(user_id,media_id,source_url,source_type,priority)
 select m.user_id,m.id,'https://cevylpnoexugwgygvtgu.supabase.co/storage/v1/object/public/crowspace-media/'||ltrim(m.storage_path,'/'),'storage_path',20
 from public.crowspace_hero_media m
 where coalesce(m.storage_path,'')<>'' and coalesce(m.media_type,'')<>'video' limit p_limit
 on conflict (media_id,source_url) do update set updated_at=now();
 get diagnostics storage_seeded=row_count;
 insert into public.crowspace_thumbnail_source_candidates(user_id,media_id,source_url,source_type,priority)
 select r.user_id,r.media_id,r.repaired_source_url,'repaired',30 from public.crowspace_thumbnail_source_repairs r
 where r.status='repaired' and coalesce(r.repaired_source_url,'')<>'' limit p_limit
 on conflict (media_id,source_url) do update set updated_at=now();
 get diagnostics repaired_seeded=row_count;
 return jsonb_build_object('seeded_public_urls',seeded,'seeded_storage_paths',storage_seeded,'seeded_repaired_sources',repaired_seeded);
end $$;
revoke all on function public.crowspace_thumbnail_bootstrap_sources(integer) from public,anon,authenticated;
grant execute on function public.crowspace_thumbnail_bootstrap_sources(integer) to service_role;