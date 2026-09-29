-- v99: source validation history and fresh reliability intelligence
create table if not exists public.crowspace_thumbnail_source_validation_history (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 media_id uuid not null references public.crowspace_hero_media(id) on delete cascade,
 source_id uuid references public.crowspace_thumbnail_source_candidates(id) on delete set null,
 source_url text not null,
 success boolean not null,
 status integer,
 content_type text,
 response_bytes bigint,
 error_message text,
 checked_at timestamptz not null default now()
);
alter table public.crowspace_thumbnail_source_validation_history enable row level security;
create index if not exists idx_thumbnail_source_validation_history_media on public.crowspace_thumbnail_source_validation_history(media_id,checked_at desc);
create index if not exists idx_thumbnail_source_validation_history_source on public.crowspace_thumbnail_source_validation_history(source_id,checked_at desc);