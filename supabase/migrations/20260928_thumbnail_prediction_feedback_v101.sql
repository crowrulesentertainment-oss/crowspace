-- v101: prediction feedback loop
alter table public.crowspace_thumbnail_source_validation_history add column if not exists prediction_id uuid references public.crowspace_thumbnail_source_predictions(id) on delete set null;
alter table public.crowspace_thumbnail_source_validation_history add column if not exists predicted_score numeric(6,2);
alter table public.crowspace_thumbnail_source_validation_history add column if not exists predicted_confidence numeric(6,2);
alter table public.crowspace_thumbnail_source_validation_history add column if not exists prediction_correct boolean;
create index if not exists idx_thumbnail_validation_prediction on public.crowspace_thumbnail_source_validation_history(prediction_id,checked_at desc);
