-- v96 Source Candidate Discovery
create or replace function public.crowspace_thumbnail_discover_candidates(p_limit integer default 250)
returns integer language plpgsql security definer set search_path=public as $$
declare n integer:=0; r record; u text;
begin
 for r in select id,user_id,public_url,storage_path from public.crowspace_hero_media where coalesce(public_url,'')<>'' or coalesce(storage_path,'')<>'' limit greatest(1,least(coalesce(p_limit,250),1000)) loop
  if coalesce(r.public_url,'')<>'' then
   insert into public.crowspace_thumbnail_source_candidates(user_id,media_id,source_url,source_type,priority)
   values(r.user_id,r.id,r.public_url,'primary',10) on conflict(media_id,source_url) do update set priority=least(crowspace_thumbnail_source_candidates.priority,10),updated_at=now();
   n:=n+1;
  end if;
  if coalesce(r.storage_path,'')<>'' then
   u:=storage.get_public_url('crowspace-media',r.storage_path);
   if coalesce(u,'')<>'' then
    insert into public.crowspace_thumbnail_source_candidates(user_id,media_id,source_url,source_type,priority)
    values(r.user_id,r.id,u,'storage_path',20) on conflict(media_id,source_url) do update set priority=least(crowspace_thumbnail_source_candidates.priority,20),updated_at=now();
    n:=n+1;
   end if;
  end if;
  insert into public.crowspace_thumbnail_source_candidates(user_id,media_id,source_url,source_type,priority)
  select sr.user_id,sr.media_id,sr.repaired_source_url,'repaired',30 from public.crowspace_thumbnail_source_repairs sr
  where sr.media_id=r.id and sr.user_id=r.user_id and sr.status='repaired' and coalesce(sr.repaired_source_url,'')<>''
  on conflict(media_id,source_url) do update set priority=least(crowspace_thumbnail_source_candidates.priority,30),updated_at=now();
 end loop;
 return n;
end $$;
revoke all on function public.crowspace_thumbnail_discover_candidates(integer) from public,anon,authenticated;
grant execute on function public.crowspace_thumbnail_discover_candidates(integer) to service_role;