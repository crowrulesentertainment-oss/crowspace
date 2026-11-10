-- CrowSpace Phase 3.2: community announcements, pins, activity and notifications.
-- Additive schema changes. Existing CrowSpace and CrowRules systems are preserved.

alter table public.crowspace_community_posts
  add column if not exists is_announcement boolean not null default false,
  add column if not exists pinned_at timestamptz;
create index if not exists crowspace_community_posts_pinned_idx
  on public.crowspace_community_posts(community_id,pinned_at desc,created_at desc);
create index if not exists crowspace_events_discovery_idx
  on public.crowspace_events(starts_at,visibility,event_type);

drop policy if exists "Read discussions as active member" on public.crowspace_community_posts;
create policy "Read discussions as active member"
on public.crowspace_community_posts for select to authenticated
using (exists (select 1 from public.crowspace_community_members m
 where m.community_id=crowspace_community_posts.community_id and m.user_id=(select auth.uid()) and m.status='active'));

drop policy if exists "Active members publish discussions" on public.crowspace_community_posts;
create policy "Active members publish discussions"
on public.crowspace_community_posts for insert to authenticated
with check (author_id=(select auth.uid())
 and exists(select 1 from public.crowspace_community_members m
  where m.community_id=crowspace_community_posts.community_id and m.user_id=(select auth.uid()) and m.status='active')
 and (is_announcement=false or private.crowspace_member_role(community_id,(select auth.uid())) in ('owner','admin','moderator')));

create policy "Community managers pin discussions"
on public.crowspace_community_posts for update to authenticated
using(private.crowspace_member_role(community_id,(select auth.uid())) in ('owner','admin','moderator'))
with check(private.crowspace_member_role(community_id,(select auth.uid())) in ('owner','admin','moderator'));

create or replace function private.crowspace_guard_community_post_features()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_role text;
begin
 v_role:=private.crowspace_member_role(new.community_id,(select auth.uid()));
 if tg_op='INSERT' then
  if (new.is_announcement or new.pinned_at is not null) and v_role not in ('owner','admin','moderator') then
   raise exception 'Only community managers can publish announcements or pin discussions';
  end if;
 elsif tg_op='UPDATE' then
  if (new.is_announcement is distinct from old.is_announcement or new.pinned_at is distinct from old.pinned_at)
   and v_role not in ('owner','admin','moderator') then
   raise exception 'Only community managers can change announcement or pin status';
  end if;
 end if;
 return new;
end;
$$;
revoke all on function private.crowspace_guard_community_post_features() from public,anon,authenticated;
drop trigger if exists crowspace_guard_community_post_features on public.crowspace_community_posts;
create trigger crowspace_guard_community_post_features before insert or update on public.crowspace_community_posts
for each row execute function private.crowspace_guard_community_post_features();

create or replace function private.crowspace_emit_community_activity()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_community_id uuid; v_actor uuid; v_entity_id uuid; v_type text; v_message text; v_recipient uuid; v_post_author uuid;
begin
 if tg_table_name='crowspace_community_posts' then
  if not new.is_announcement then return new; end if;
  v_community_id:=new.community_id;v_actor:=new.author_id;v_entity_id:=new.id;
  v_type:='community_announcement';v_message:='A community announcement was posted.';
 elsif tg_table_name='crowspace_events' then
  if new.community_id is null then return new; end if;
  v_community_id:=new.community_id;v_actor:=new.creator_id;v_entity_id:=new.id;
  v_type:='community_event';v_message:='A new community event was created.';
 elsif tg_table_name='crowspace_community_comments' then
  select p.community_id,p.author_id into v_community_id,v_post_author from public.crowspace_community_posts p where p.id=new.post_id;
  v_actor:=new.author_id;v_entity_id:=new.post_id;
  if v_post_author is null or v_post_author=v_actor then return new; end if;
  insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message)
   values(v_post_author,v_actor,'community_comment','community_post',v_entity_id,'Someone commented on your community discussion.');
  return new;
 elsif tg_table_name='crowspace_community_members' then
  if new.status<>'active' then return new; end if;
  v_community_id:=new.community_id;v_actor:=new.user_id;v_entity_id:=new.community_id;
  v_type:='community_member_join';v_message:='A new member joined your community.';
  for v_recipient in select m.user_id from public.crowspace_community_members m
   where m.community_id=v_community_id and m.status='active' and m.role in ('owner','admin','moderator') and m.user_id<>v_actor
  loop
   insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message)
    values(v_recipient,v_actor,v_type,'community',v_entity_id,v_message);
  end loop;
  return new;
 else return new;
 end if;
 for v_recipient in select m.user_id from public.crowspace_community_members m
  where m.community_id=v_community_id and m.status='active' and m.user_id<>v_actor
 loop
  insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message)
   values(v_recipient,v_actor,v_type,case when v_type='community_event' then 'event' else 'community_post' end,v_entity_id,v_message);
 end loop;
 return new;
end;
$$;
revoke all on function private.crowspace_emit_community_activity() from public,anon,authenticated;
drop trigger if exists crowspace_notify_community_announcement on public.crowspace_community_posts;
create trigger crowspace_notify_community_announcement after insert on public.crowspace_community_posts
for each row when(new.is_announcement=true) execute function private.crowspace_emit_community_activity();
drop trigger if exists crowspace_notify_community_event on public.crowspace_events;
create trigger crowspace_notify_community_event after insert on public.crowspace_events
for each row when(new.community_id is not null) execute function private.crowspace_emit_community_activity();
drop trigger if exists crowspace_notify_community_comment on public.crowspace_community_comments;
create trigger crowspace_notify_community_comment after insert on public.crowspace_community_comments
for each row execute function private.crowspace_emit_community_activity();
drop trigger if exists crowspace_notify_community_member_join on public.crowspace_community_members;
create trigger crowspace_notify_community_member_join after insert on public.crowspace_community_members
for each row when(new.status='active') execute function private.crowspace_emit_community_activity();

-- Pinning uses a narrowly scoped RPC so community managers cannot gain broad post-edit rights.
drop policy if exists "Community managers pin discussions" on public.crowspace_community_posts;
create or replace function public.crowspace_set_community_post_pin(p_post_id uuid,p_pinned boolean)
returns void language plpgsql security definer set search_path=''
as $$
declare v_community_id uuid;
begin
 select p.community_id into v_community_id from public.crowspace_community_posts p where p.id=p_post_id;
 if v_community_id is null then raise exception 'Discussion not found'; end if;
 if private.crowspace_member_role(v_community_id,(select auth.uid())) not in ('owner','admin','moderator') then
  raise exception 'Only community managers can pin discussions';
 end if;
 update public.crowspace_community_posts
 set pinned_at=case when p_pinned then now() else null end,updated_at=now()
 where id=p_post_id;
end;
$$;
revoke all on function public.crowspace_set_community_post_pin(uuid,boolean) from public,anon;
grant execute on function public.crowspace_set_community_post_pin(uuid,boolean) to authenticated;
