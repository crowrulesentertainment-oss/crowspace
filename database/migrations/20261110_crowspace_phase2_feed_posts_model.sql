-- CrowSpace Phase 2 follow-up migration: separate feed posts from legacy wall messages.
create table if not exists public.crowspace_posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(btrim(body)) between 1 and 5000),
 visibility text not null default 'public' check(visibility in ('public','friends','followers','private')),
 post_kind text not null default 'text' check(post_kind in ('text','photo','link','announcement')),
 branch_key text,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists crowspace_posts_feed_idx on public.crowspace_posts(created_at desc);
create index if not exists crowspace_posts_author_idx on public.crowspace_posts(author_id,created_at desc);
alter table public.crowspace_posts enable row level security;
revoke all on public.crowspace_posts from anon;
grant select,insert,update,delete on public.crowspace_posts to authenticated;
drop policy if exists "Members read visible CrowSpace feed posts" on public.crowspace_posts;
create policy "Members read visible CrowSpace feed posts" on public.crowspace_posts for select to authenticated using (
 author_id=(select auth.uid()) or visibility='public'
 or (visibility='friends' and exists(select 1 from public.friendships f where f.status='accepted' and ((f.requester_id=author_id and f.addressee_id=(select auth.uid())) or (f.addressee_id=author_id and f.requester_id=(select auth.uid())))))
 or (visibility='followers' and exists(select 1 from public.crowspace_follows f where f.follower_id=(select auth.uid()) and f.following_id=author_id))
);
drop policy if exists "Members publish their own CrowSpace feed posts" on public.crowspace_posts;
create policy "Members publish their own CrowSpace feed posts" on public.crowspace_posts for insert to authenticated with check(author_id=(select auth.uid()));
drop policy if exists "Authors edit their own CrowSpace feed posts" on public.crowspace_posts;
create policy "Authors edit their own CrowSpace feed posts" on public.crowspace_posts for update to authenticated using(author_id=(select auth.uid())) with check(author_id=(select auth.uid()));
drop policy if exists "Authors delete their own CrowSpace feed posts" on public.crowspace_posts;
create policy "Authors delete their own CrowSpace feed posts" on public.crowspace_posts for delete to authenticated using(author_id=(select auth.uid()));

alter table public.crowspace_post_media drop constraint if exists crowspace_post_media_post_id_fkey;
alter table public.crowspace_post_media add constraint crowspace_post_media_post_id_fkey foreign key(post_id) references public.crowspace_posts(id) on delete cascade;
alter table public.crowspace_post_comments drop constraint if exists crowspace_post_comments_post_id_fkey;
alter table public.crowspace_post_comments add constraint crowspace_post_comments_post_id_fkey foreign key(post_id) references public.crowspace_posts(id) on delete cascade;
alter table public.crowspace_post_reactions drop constraint if exists crowspace_post_reactions_post_id_fkey;
alter table public.crowspace_post_reactions add constraint crowspace_post_reactions_post_id_fkey foreign key(post_id) references public.crowspace_posts(id) on delete cascade;

drop policy if exists "CrowSpace network members view posts" on public.crowspace_wall_posts;
drop policy if exists "Members publish on their own CrowSpace feed" on public.crowspace_wall_posts;
drop policy if exists "Authors edit their own CrowSpace feed posts" on public.crowspace_wall_posts;

drop policy if exists "Members read comments on visible posts" on public.crowspace_post_comments;
create policy "Members read comments on visible posts" on public.crowspace_post_comments for select to authenticated using(exists(select 1 from public.crowspace_posts p where p.id=post_id));
drop policy if exists "Members comment on visible posts" on public.crowspace_post_comments;
create policy "Members comment on visible posts" on public.crowspace_post_comments for insert to authenticated with check(author_id=(select auth.uid()) and exists(select 1 from public.crowspace_posts p where p.id=post_id));
drop policy if exists "Members read reactions on visible posts" on public.crowspace_post_reactions;
create policy "Members read reactions on visible posts" on public.crowspace_post_reactions for select to authenticated using(exists(select 1 from public.crowspace_posts p where p.id=post_id));
drop policy if exists "Members react to visible posts" on public.crowspace_post_reactions;
create policy "Members react to visible posts" on public.crowspace_post_reactions for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.crowspace_posts p where p.id=post_id));
drop policy if exists "Members read media attached to visible posts" on public.crowspace_post_media;
create policy "Members read media attached to visible posts" on public.crowspace_post_media for select to authenticated using(exists(select 1 from public.crowspace_posts p where p.id=post_id));
drop policy if exists "Authors attach media to their own posts" on public.crowspace_post_media;
create policy "Authors attach media to their own posts" on public.crowspace_post_media for insert to authenticated with check(uploaded_by=(select auth.uid()) and exists(select 1 from public.crowspace_posts p where p.id=post_id and p.author_id=(select auth.uid())));

create or replace function private.crowspace_social_notify()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_recipient uuid; v_actor uuid; v_type text; v_entity_type text; v_entity_id uuid; v_message text;
begin
 if tg_table_name='crowspace_post_comments' then select author_id into v_recipient from public.crowspace_posts where id=new.post_id; v_actor:=new.author_id; v_type:='comment'; v_entity_type:='post'; v_entity_id:=new.post_id; v_message:='commented on your post';
 elsif tg_table_name='crowspace_post_reactions' then select author_id into v_recipient from public.crowspace_posts where id=new.post_id; v_actor:=new.user_id; v_type:='reaction'; v_entity_type:='post'; v_entity_id:=new.post_id; v_message:='reacted to your post';
 elsif tg_table_name='crowspace_follows' then v_recipient:=new.following_id; v_actor:=new.follower_id; v_type:='follow'; v_entity_type:='profile'; v_entity_id:=new.follower_id; v_message:='started following you';
 elsif tg_table_name='friendships' and tg_op='INSERT' then v_recipient:=new.addressee_id; v_actor:=new.requester_id; v_type:='friend_request'; v_entity_type:='friendship'; v_entity_id:=new.id; v_message:='sent you a connection request';
 elsif tg_table_name='friendships' and tg_op='UPDATE' and new.status='accepted' and old.status is distinct from 'accepted' then v_recipient:=new.requester_id; v_actor:=new.addressee_id; v_type:='friend_accepted'; v_entity_type:='friendship'; v_entity_id:=new.id; v_message:='accepted your connection request'; end if;
 if v_recipient is not null and v_actor is not null and v_recipient<>v_actor then insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message) values(v_recipient,v_actor,v_type,v_entity_type,v_entity_id,v_message); end if; return new;
end $$;
revoke all on function private.crowspace_social_notify() from public,anon,authenticated;

do $$ declare t text; begin foreach t in array array['crowspace_posts','crowspace_post_comments','crowspace_post_reactions','crowspace_follows','crowspace_notifications'] loop if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then execute format('alter publication supabase_realtime add table public.%I',t); end if; end loop; end $$;
