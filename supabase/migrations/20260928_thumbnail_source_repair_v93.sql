-- v93 thumbnail source repair
create table if not exists public.crowspace_thumbnail_source_repairs(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 media_id uuid not null references public.crowspace_hero_media(id) on delete cascade,
 job_id uuid references public.crowspace_thumbnail_jobs(id) on delete set null,
 old_source_url text, repaired_source_url text,
 repair_method text not null default 'storage_path',
 status text not null default 'tested' check(status in('tested','repaired','failed')),
 error_message text, created_at timestamptz not null default now()
);
alter table public.crowspace_thumbnail_source_repairs enable row level security;
create policy if not exists "owners select thumbnail source repairs" on public.crowspace_thumbnail_source_repairs for select to authenticated using((select auth.uid())=user_id);
create index if not exists idx_thumbnail_source_repairs_media on public.crowspace_thumbnail_source_repairs(media_id,created_at desc);
create or replace function public.crowspace_thumbnail_repair_candidates(p_media_id uuid,p_user_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$ declare m record; candidates jsonb:='[]'::jsonb; begin select public_url,storage_path,user_id into m from public.crowspace_hero_media where id=p_media_id and user_id=p_user_id; if not found then raise exception 'Media not found'; end if; if nullif(m.public_url,'') is not null then candidates:=candidates||jsonb_build_array(jsonb_build_object('url',m.public_url,'method','current_public_url')); end if; if nullif(m.storage_path,'') is not null then candidates:=candidates||jsonb_build_array(jsonb_build_object('path',m.storage_path,'method','storage_path','bucket','crowspace-media')); end if; return jsonb_build_object('media_id',p_media_id,'candidates',candidates); end $$;
revoke all on function public.crowspace_thumbnail_repair_candidates(uuid,uuid) from public,anon,authenticated;
grant execute on function public.crowspace_thumbnail_repair_candidates(uuid,uuid) to service_role;