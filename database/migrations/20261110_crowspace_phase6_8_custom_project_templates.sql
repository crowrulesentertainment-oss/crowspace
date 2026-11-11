create table if not exists public.crowspace_project_templates (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(btrim(title)) between 2 and 100),
 description text not null default '' check (char_length(description) <= 1500),
 category text not null default 'general' check (char_length(category) between 2 and 60),
 visibility text not null default 'private' check (visibility in ('private','shared')),
 template_data jsonb not null default '{"milestones":[]}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint crowspace_project_templates_data_object check (jsonb_typeof(template_data)='object'),
 constraint crowspace_project_templates_milestones_array check (
  jsonb_typeof(template_data->'milestones')='array'
  and jsonb_array_length(template_data->'milestones') <= 50
 )
);
create index if not exists crowspace_project_templates_owner_updated_idx
 on public.crowspace_project_templates(owner_id,updated_at desc);
create index if not exists crowspace_project_templates_shared_category_idx
 on public.crowspace_project_templates(category,updated_at desc)
 where visibility='shared';
alter table public.crowspace_project_templates enable row level security;
revoke all on public.crowspace_project_templates from anon;
revoke all on public.crowspace_project_templates from public;
grant select,insert,update,delete on public.crowspace_project_templates to authenticated;
drop policy if exists "Members can read shared or own project templates" on public.crowspace_project_templates;
create policy "Members can read shared or own project templates"
 on public.crowspace_project_templates for select to authenticated
 using (owner_id=(select auth.uid()) or visibility='shared');
drop policy if exists "Members can create own project templates" on public.crowspace_project_templates;
create policy "Members can create own project templates"
 on public.crowspace_project_templates for insert to authenticated
 with check (owner_id=(select auth.uid()));
drop policy if exists "Owners can update own project templates" on public.crowspace_project_templates;
create policy "Owners can update own project templates"
 on public.crowspace_project_templates for update to authenticated
 using (owner_id=(select auth.uid()))
 with check (owner_id=(select auth.uid()));
drop policy if exists "Owners can delete own project templates" on public.crowspace_project_templates;
create policy "Owners can delete own project templates"
 on public.crowspace_project_templates for delete to authenticated
 using (owner_id=(select auth.uid()));