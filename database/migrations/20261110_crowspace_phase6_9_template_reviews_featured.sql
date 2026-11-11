create table if not exists public.crowspace_project_template_reviews (
 id uuid primary key default gen_random_uuid(),
 template_id uuid not null references public.crowspace_project_templates(id) on delete cascade,
 reviewer_id uuid not null references auth.users(id) on delete cascade,
 rating smallint not null check (rating between 1 and 5),
 review_text text not null default '' check (char_length(review_text) <= 2000),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint crowspace_project_template_reviews_one_per_member unique(template_id,reviewer_id)
);
create index if not exists crowspace_project_template_reviews_template_created_idx
 on public.crowspace_project_template_reviews(template_id,created_at desc);
alter table public.crowspace_project_template_reviews enable row level security;
revoke all on public.crowspace_project_template_reviews from anon;
revoke all on public.crowspace_project_template_reviews from public;
grant select,insert,update,delete on public.crowspace_project_template_reviews to authenticated;
drop policy if exists "Members can read reviews on shared templates" on public.crowspace_project_template_reviews;
create policy "Members can read reviews on shared templates"
 on public.crowspace_project_template_reviews for select to authenticated
 using (exists(select 1 from public.crowspace_project_templates t where t.id=template_id and (t.visibility='shared' or t.owner_id=(select auth.uid()))));
drop policy if exists "Members can review shared templates" on public.crowspace_project_template_reviews;
create policy "Members can review shared templates"
 on public.crowspace_project_template_reviews for insert to authenticated
 with check (
  reviewer_id=(select auth.uid())
  and exists(select 1 from public.crowspace_project_templates t where t.id=template_id and t.visibility='shared' and t.owner_id<>(select auth.uid()))
 );
drop policy if exists "Members can update own template reviews" on public.crowspace_project_template_reviews;
create policy "Members can update own template reviews"
 on public.crowspace_project_template_reviews for update to authenticated
 using (reviewer_id=(select auth.uid()))
 with check (
  reviewer_id=(select auth.uid())
  and exists(select 1 from public.crowspace_project_templates t where t.id=template_id and t.visibility='shared' and t.owner_id<>(select auth.uid()))
 );
drop policy if exists "Members can delete own template reviews" on public.crowspace_project_template_reviews;
create policy "Members can delete own template reviews"
 on public.crowspace_project_template_reviews for delete to authenticated
 using (reviewer_id=(select auth.uid()));

create table if not exists public.crowspace_featured_project_templates (
 template_id uuid primary key references public.crowspace_project_templates(id) on delete cascade,
 featured_by uuid not null references auth.users(id),
 created_at timestamptz not null default now()
);
alter table public.crowspace_featured_project_templates enable row level security;
revoke all on public.crowspace_featured_project_templates from anon;
revoke all on public.crowspace_featured_project_templates from public;
grant select,insert,delete on public.crowspace_featured_project_templates to authenticated;
drop policy if exists "Members can read featured shared templates" on public.crowspace_featured_project_templates;
create policy "Members can read featured shared templates"
 on public.crowspace_featured_project_templates for select to authenticated
 using (exists(select 1 from public.crowspace_project_templates t where t.id=template_id and t.visibility='shared'));
drop policy if exists "CrowSpace admins can feature shared templates" on public.crowspace_featured_project_templates;
create policy "CrowSpace admins can feature shared templates"
 on public.crowspace_featured_project_templates for insert to authenticated
 with check (
  featured_by=(select auth.uid())
  and (select auth.jwt()->'app_metadata'->>'crowspace_admin')='true'
  and exists(select 1 from public.crowspace_project_templates t where t.id=template_id and t.visibility='shared')
 );
drop policy if exists "CrowSpace admins can remove featured templates" on public.crowspace_featured_project_templates;
create policy "CrowSpace admins can remove featured templates"
 on public.crowspace_featured_project_templates for delete to authenticated
 using ((select auth.jwt()->'app_metadata'->>'crowspace_admin')='true');

create or replace function public.crowspace_guard_template_review_changes()
returns trigger language plpgsql security invoker set search_path=pg_catalog
as $$
begin
 if tg_op='UPDATE' then
  if new.template_id is distinct from old.template_id or new.reviewer_id is distinct from old.reviewer_id then
   raise exception 'Review ownership and template cannot be changed';
  end if;
 end if;
 new.updated_at=now();
 return new;
end;
$$;
revoke all on function public.crowspace_guard_template_review_changes() from public,anon,authenticated;
drop trigger if exists crowspace_guard_template_review_changes on public.crowspace_project_template_reviews;
create trigger crowspace_guard_template_review_changes before update on public.crowspace_project_template_reviews
 for each row execute function public.crowspace_guard_template_review_changes();
