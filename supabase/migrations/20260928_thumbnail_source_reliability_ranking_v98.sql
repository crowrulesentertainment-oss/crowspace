-- v98 Source Reliability Ranking
alter table public.crowspace_thumbnail_source_candidates add column if not exists reliability_score numeric(5,2) not null default 50;
alter table public.crowspace_thumbnail_source_candidates add column if not exists validation_count integer not null default 0;
alter table public.crowspace_thumbnail_source_candidates add column if not exists recent_success_count integer not null default 0;
alter table public.crowspace_thumbnail_source_candidates add column if not exists recent_failure_count integer not null default 0;
create index if not exists idx_thumbnail_source_ranking on public.crowspace_thumbnail_source_candidates(media_id,reliability_score desc,health_score desc,consecutive_failures asc,priority asc);