-- CrowSpace 3.0 Phase 2 social network schema.
-- Additive: preserves crowspace_wall_posts (legacy profile-wall messages) and friendships.
-- Reuses the existing private storage bucket public/storage.crowspace-media.

create table if not exists public.crowspace_posts (
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(btrim(body)) between 1 and 5000),
 visibility text not null default 'public' check(visibility in ('public','friends','followers','private')),
 post_kind text not null default 'text' check(post_kind in ('text','photo','link','announcement')),
 branch_key text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists crowspace_posts_feed_idx on public.crowspace_posts(created_at desc);
create index if not exists crowspace_posts_author_idx on public.crowspace_posts(author_id,created_at desc);

create table if not exists public.crowspace_post_media (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.crowspace_posts(id) on delete cascade,
 uploaded_by uuid not null references auth.users(id) on delete cascade,
 object_path text not null unique,
 mime_type text not null,
 alt_text text not null default '',
 created_at timestamptz not null default now()
);
create table if not exists public.crowspace_post_comments (
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.crowspace_posts(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 parent_id uuid references public.crowspace_post_comments(id) on delete cascade,
 body text not null check(char_length(btrim(body)) between 1 and 2000),
 created_at timestamptz not null default now(),
 edited_at timestamptz
);
create table if not exists public.crowspace_post_reactions (
 post_id uuid not null references public.crowspace_posts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 reaction text not null default 'like' check(reaction in ('like','love','laugh','wow','support')),
 created_at timestamptz not null default now(),
 primary key(post_id,user_id)
);
create table if not exists public.crowspace_follows (
 follower_id uuid not null references auth.users(id) on delete cascade,
 following_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(follower_id,following_id),
 constraint crowspace_follows_no_self check(follower_id<>following_id)
);
create table if not exists public.crowspace_notifications (
 id uuid primary key default gen_random_uuid(),
 recipient_id uuid not null references auth.users(id) on delete cascade,
 actor_id uuid references auth.users(id) on delete set null,
 notification_type text not null,
 entity_type text not null,
 entity_id uuid,
 message text not null default '',
 read_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists crowspace_post_comments_post_idx on public.crowspace_post_comments(post_id,created_at);
create index if not exists crowspace_post_reactions_post_idx on public.crowspace_post_reactions(post_id);
create index if not exists crowspace_follows_following_idx on public.crowspace_follows(following_id);
create index if not exists crowspace_notifications_recipient_idx on public.crowspace_notifications(recipient_id,created_at desc);

alter table public.crowspace_posts enable row level security;
alter table public.crowspace_post_media enable row level security;
alter table public.crowspace_post_comments enable row level security;
alter table public.crowspace_post_reactions enable row level security;
alter table public.crowspace_follows enable row level security;
alter table public.crowspace_notifications enable row level security;

revoke all on public.crowspace_posts,public.crowspace_post_media,public.crowspace_post_comments,public.crowspace_post_reactions,public.crowspace_follows,public.crowspace_notifications from anon;
revoke all on public.crowspace_posts,public.crowspace_post_media,public.crowspace_post_comments,public.crowspace_post_reactions,public.crowspace_follows,public.crowspace_notifications from authenticated;
grant select,insert,update,delete on public.crowspace_posts to authenticated;
grant select,insert,delete on public.crowspace_post_media to authenticated;
grant select,insert,update,delete on public.crowspace_post_comments to authenticated;
grant select,insert,update,delete on public.crowspace_post_reactions to authenticated;
grant select,insert,delete on public.crowspace_follows to authenticated;
grant select on public.crowspace_notifications to authenticated;
grant update(read_at) on public.crowspace_notifications to authenticated;

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

drop policy if exists "Members read comments on visible posts" on public.crowspace_post_comments;
create policy "Members read comments on visible posts" on public.crowspace_post_comments for select to authenticated using(exists(select 1 from public.crowspace_posts p where p.id=post_id));
drop policy if exists "Members comment on visible posts" on public.crowspace_post_comments;
create policy "Members comment on visible posts" on public.crowspace_post_comments for insert to authenticated with check(author_id=(select auth.uid()) and exists(select 1 from public.crowspace_posts p where p.id=post_id));
drop policy if exists "Authors edit their own post comments" on public.crowspace_post_comments;
create policy "Authors edit their own post comments" on public.crowspace_post_comments for update to authenticated using(author_id=(select auth.uid())) with check(author_id=(select auth.uid()));
drop policy if exists "Authors delete their own post comments" on public.crowspace_post_comments;
create policy "Authors delete their own post comments" on public.crowspace_post_comments for delete to authenticated using(author_id=(select auth.uid()));

drop policy if exists "Members read reactions on visible posts" on public.crowspace_post_reactions;
create policy "Members read reactions on visible posts" on public.crowspace_post_reactions for select to authenticated using(exists(select 1 from public.crowspace_posts p where p.id=post_id));
drop policy if exists "Members react to visible posts" on public.crowspace_post_reactions;
create policy "Members react to visible posts" on public.crowspace_post_reactions for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.crowspace_posts p where p.id=post_id));
drop policy if exists "Members change their own post reaction" on public.crowspace_post_reactions;
create policy "Members change their own post reaction" on public.crowspace_post_reactions for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists "Members remove their own post reaction" on public.crowspace_post_reactions;
create policy "Members remove their own post reaction" on public.crowspace_post_reactions for delete to authenticated using(user_id=(select auth.uid()));

drop policy if exists "Members view CrowSpace follows" on public.crowspace_follows;
create policy "Members view CrowSpace follows" on public.crowspace_follows for select to authenticated using(true);
drop policy if exists "Members follow others as themselves" on public.crowspace_follows;
create policy "Members follow others as themselves" on public.crowspace_follows for insert to authenticated with check(follower_id=(select auth.uid()) and follower_id<>following_id);
drop policy if exists "Members unfollow as themselves" on public.crowspace_follows;
create policy "Members unfollow as themselves" on public.crowspace_follows for delete to authenticated using(follower_id=(select auth.uid()));

drop policy if exists "Members read their own notifications" on public.crowspace_notifications;
create policy "Members read their own notifications" on public.crowspace_notifications for select to authenticated using(recipient_id=(select auth.uid()));
drop policy if exists "Members mark their own notifications read" on public.crowspace_notifications;
create policy "Members mark their own notifications read" on public.crowspace_notifications for update to authenticated using(recipient_id=(select auth.uid())) with check(recipient_id=(select auth.uid()));

drop policy if exists "Members read media attached to visible posts" on public.crowspace_post_media;
create policy "Members read media attached to visible posts" on public.crowspace_post_media for select to authenticated using(exists(select 1 from public.crowspace_posts p where p.id=post_id));
drop policy if exists "Authors attach media to their own posts" on public.crowspace_post_media;
create policy "Authors attach media to their own posts" on public.crowspace_post_media for insert to authenticated with check(uploaded_by=(select auth.uid()) and exists(select 1 from public.crowspace_posts p where p.id=post_id and p.author_id=(select auth.uid())));
drop policy if exists "Authors remove their own post media" on public.crowspace_post_media;
create policy "Authors remove their own post media" on public.crowspace_post_media for delete to authenticated using(uploaded_by=(select auth.uid()));

drop policy if exists "CrowSpace members view feed media" on storage.objects;
create policy "CrowSpace members view feed media" on storage.objects for select to authenticated using(bucket_id='crowspace-media' and name like 'posts/%');
drop policy if exists "Members upload their own feed media" on storage.objects;
create policy "Members upload their own feed media" on storage.objects for insert to authenticated with check(bucket_id='crowspace-media' and name like 'posts/%' and split_part(name,'/',2)=(select auth.uid())::text);
drop policy if exists "Members update their own feed media" on storage.objects;
create policy "Members update their own feed media" on storage.objects for update to authenticated using(bucket_id='crowspace-media' and name like 'posts/%' and split_part(name,'/',2)=(select auth.uid())::text) with check(bucket_id='crowspace-media' and name like 'posts/%' and split_part(name,'/',2)=(select auth.uid())::text);
drop policy if exists "Members delete their own feed media" on storage.objects;
create policy "Members delete their own feed media" on storage.objects for delete to authenticated using(bucket_id='crowspace-media' and name like 'posts/%' and split_part(name,'/',2)=(select auth.uid())::text);

create schema if not exists private;
create or replace function private.crowspace_social_notify()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_recipient uuid; v_actor uuid; v_type text; v_entity_type text; v_entity_id uuid; v_message text;
begin
 if tg_table_name='crowspace_post_comments' then select author_id into v_recipient from public.crowspace_posts where id=new.post_id; v_actor:=new.author_id; v_type:='comment'; v_entity_type:='post'; v_entity_id:=new.post_id; v_message:='commented on your post';
 elsif tg_table_name='crowspace_post_reactions' then select author_id into v_recipient from public.crowspace_posts where id=new.post_id; v_actor:=new.user_id; v_type:='reaction'; v_entity_type:='post'; v_entity_id:=new.post_id; v_message:='reacted to your post';
 elsif tg_table_name='crowspace_follows' then v_recipient:=new.following_id; v_actor:=new.follower_id; v_type:='follow'; v_entity_type:='profile'; v_entity_id:=new.follower_id; v_message:='started following you';
 elsif tg_table_name='friendships' and tg_op='INSERT' then v_recipient:=new.addressee_id; v_actor:=new.requester_id; v_type:='friend_request'; v_entity_type:='friendship'; v_entity_id:=new.id; v_message:='sent you a connection request';
 elsif tg_table_name='friendships' and tg_op='UPDATE' and new.status='accepted' and old.status is distinct from 'accepted' then v_recipient:=new.requester_id; v_actor:=new.addressee_id; v_type:='friend_accepted'; v_entity_type:='friendship'; v_entity_id:=new.id; v_message:='accepted your connection request';
 end if;
 if v_recipient is not null and v_actor is not null and v_recipient<>v_actor then insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message) values(v_recipient,v_actor,v_type,v_entity_type,v_entity_id,v_message); end if;
 return new;
end $$;
revoke all on function private.crowspace_social_notify() from public,anon,authenticated;
drop trigger if exists crowspace_comment_notification on public.crowspace_post_comments;
create trigger crowspace_comment_notification after insert on public.crowspace_post_comments for each row execute function private.crowspace_social_notify();
drop trigger if exists crowspace_reaction_notification on public.crowspace_post_reactions;
create trigger crowspace_reaction_notification after insert on public.crowspace_post_reactions for each row execute function private.crowspace_social_notify();
drop trigger if exists crowspace_follow_notification on public.crowspace_follows;
create trigger crowspace_follow_notification after insert on public.crowspace_follows for each row execute function private.crowspace_social_notify();
drop trigger if exists crowspace_friendship_notification on public.friendships;
create trigger crowspace_friendship_notification after insert or update of status on public.friendships for each row execute function private.crowspace_social_notify();

do $$ declare t text; begin foreach t in array array['crowspace_posts','crowspace_post_comments','crowspace_post_reactions','crowspace_follows','crowspace_notifications'] loop if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then execute format('alter publication supabase_realtime add table public.%I',t); end if; end loop; end $$;
