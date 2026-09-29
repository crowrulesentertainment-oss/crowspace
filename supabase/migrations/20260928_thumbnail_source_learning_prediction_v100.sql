-- v100: source learning and prediction
create table if not exists public.crowspace_thumbnail_source_predictions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 media_id uuid not null references public.crowspace_hero_media(id) on delete cascade,
 source_id uuid not null references public.crowspace_thumbnail_source_candidates(id) on delete cascade,
 prediction_score numeric(6,2) not null default 50,
 confidence numeric(6,2) not null default 0,
 sample_count integer not null default 0,
 predicted_success boolean not null default false,
 features jsonb not null default '{}'::jsonb,
 generated_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(media_id,source_id)
);
alter table public.crowspace_thumbnail_source_predictions enable row level security;
create index if not exists idx_thumbnail_source_predictions_media on public.crowspace_thumbnail_source_predictions(media_id,prediction_score desc,confidence desc);
