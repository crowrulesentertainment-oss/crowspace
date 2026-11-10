-- CrowSpace Phase 4: private messaging and real-time communication
-- Additive only. Existing CrowSpace group-chat tables are reused and preserved.

create table if not exists public.crowspace_direct_conversations (
 id uuid primary key default gen_random_uuid(),
 participant_low uuid not null references auth.users(id) on delete cascade,
 participant_high uuid not null references auth.users(id) on delete cascade,
 initiated_by uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 last_message_at timestamptz,
 constraint crowspace_direct_pair_order check(participant_low<participant_high),
 constraint crowspace_direct_pair_unique unique(participant_low,participant_high),
 constraint crowspace_direct_pair_distinct check(participant_low<>participant_high)
);
create table if not exists public.crowspace_direct_members (
 conversation_id uuid not null references public.crowspace_direct_conversations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 last_read_at timestamptz, archived_at timestamptz, muted_until timestamptz, pinned_at timestamptz,
 joined_at timestamptz not null default now(), primary key(conversation_id,user_id)
);
create table if not exists public.crowspace_direct_messages (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.crowspace_direct_conversations(id) on delete cascade,
 sender_id uuid not null references auth.users(id) on delete cascade,
 body text not null default '',
 message_type text not null default 'text' check(message_type in ('text','audio','image','video','file')),
 created_at timestamptz not null default now(), edited_at timestamptz, deleted_at timestamptz,
 constraint crowspace_direct_message_body_length check(char_length(body)<=5000)
);
create table if not exists public.crowspace_direct_attachments (
 id uuid primary key default gen_random_uuid(),
 message_id uuid not null references public.crowspace_direct_messages(id) on delete cascade,
 conversation_id uuid not null references public.crowspace_direct_conversations(id) on delete cascade,
 uploaded_by uuid not null references auth.users(id) on delete cascade,
 object_path text not null unique, file_name text not null, mime_type text not null,
 size_bytes bigint not null check(size_bytes between 1 and 12582912), created_at timestamptz not null default now()
);
create table if not exists public.crowspace_direct_blocks (
 blocker_id uuid not null references auth.users(id) on delete cascade,
 blocked_user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(blocker_id,blocked_user_id), check(blocker_id<>blocked_user_id)
);
create table if not exists public.crowspace_direct_reports (
 id uuid primary key default gen_random_uuid(),
 conversation_id uuid not null references public.crowspace_direct_conversations(id) on delete cascade,
 message_id uuid references public.crowspace_direct_messages(id) on delete set null,
 reporter_id uuid not null references auth.users(id) on delete cascade,
 reported_user_id uuid not null references auth.users(id) on delete cascade,
 reason text not null check(reason in ('harassment','spam','threats','inappropriate','other')),
 details text not null default '' check(char_length(details)<=2000),
 status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
 created_at timestamptz not null default now(), check(reporter_id<>reported_user_id)
);

create index if not exists crowspace_direct_members_user_idx on public.crowspace_direct_members(user_id,archived_at,pinned_at);
create index if not exists crowspace_direct_messages_conversation_idx on public.crowspace_direct_messages(conversation_id,created_at desc);
create index if not exists crowspace_direct_attachments_conversation_idx on public.crowspace_direct_attachments(conversation_id);
create index if not exists crowspace_direct_reports_status_idx on public.crowspace_direct_reports(status,created_at desc);

create or replace function private.crowspace_is_direct_member(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.crowspace_direct_members m where m.conversation_id=p_conversation_id and m.user_id=(select auth.uid())); $$;
create or replace function private.crowspace_direct_can_send(p_conversation_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.crowspace_direct_conversations c
 where c.id=p_conversation_id and (select auth.uid()) in (c.participant_low,c.participant_high)
 and not exists(select 1 from public.crowspace_direct_blocks b where
 (b.blocker_id=(select auth.uid()) and b.blocked_user_id in (c.participant_low,c.participant_high))
 or (b.blocked_user_id=(select auth.uid()) and b.blocker_id in (c.participant_low,c.participant_high)))); $$;
grant execute on function private.crowspace_is_direct_member(uuid),private.crowspace_direct_can_send(uuid) to authenticated;

create or replace function public.crowspace_start_direct_conversation(p_other_user uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_me uuid:=(select auth.uid()); v_low uuid; v_high uuid; v_id uuid;
begin
 if v_me is null then raise exception 'Authentication required'; end if;
 if p_other_user is null or p_other_user=v_me then raise exception 'Choose another member'; end if;
 if not exists(select 1 from public.crowspace_profiles p where p.user_id=p_other_user) then raise exception 'Member not found'; end if;
 if exists(select 1 from public.crowspace_direct_blocks b where (b.blocker_id=v_me and b.blocked_user_id=p_other_user) or (b.blocker_id=p_other_user and b.blocked_user_id=v_me)) then raise exception 'Messaging is unavailable for this member'; end if;
 v_low:=least(v_me,p_other_user); v_high:=greatest(v_me,p_other_user);
 insert into public.crowspace_direct_conversations(participant_low,participant_high,initiated_by)
 values(v_low,v_high,v_me) on conflict(participant_low,participant_high)
 do update set updated_at=public.crowspace_direct_conversations.updated_at returning id into v_id;
 insert into public.crowspace_direct_members(conversation_id,user_id) values(v_id,v_me),(v_id,p_other_user) on conflict do nothing;
 return v_id;
end $$;
revoke all on function public.crowspace_start_direct_conversation(uuid) from public,anon;
grant execute on function public.crowspace_start_direct_conversation(uuid) to authenticated;

create or replace function private.crowspace_direct_message_notify()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 update public.crowspace_direct_conversations set last_message_at=new.created_at,updated_at=new.created_at where id=new.conversation_id;
 insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message)
 select m.user_id,new.sender_id,'direct_message','direct_message',new.conversation_id,'sent you a message'
 from public.crowspace_direct_members m where m.conversation_id=new.conversation_id and m.user_id<>new.sender_id;
 return new;
end $$;
revoke all on function private.crowspace_direct_message_notify() from public,anon,authenticated;
drop trigger if exists crowspace_direct_message_notify on public.crowspace_direct_messages;
create trigger crowspace_direct_message_notify after insert on public.crowspace_direct_messages for each row execute function private.crowspace_direct_message_notify();

alter table public.crowspace_direct_conversations enable row level security;
alter table public.crowspace_direct_members enable row level security;
alter table public.crowspace_direct_messages enable row level security;
alter table public.crowspace_direct_attachments enable row level security;
alter table public.crowspace_direct_blocks enable row level security;
alter table public.crowspace_direct_reports enable row level security;
revoke all on public.crowspace_direct_conversations,public.crowspace_direct_members,public.crowspace_direct_messages,public.crowspace_direct_attachments,public.crowspace_direct_blocks,public.crowspace_direct_reports from anon,public;
grant select on public.crowspace_direct_conversations,public.crowspace_direct_members,public.crowspace_direct_messages,public.crowspace_direct_attachments,public.crowspace_direct_blocks to authenticated;
grant insert,update,delete on public.crowspace_direct_messages to authenticated;
grant insert,select,delete on public.crowspace_direct_attachments to authenticated;
grant insert,select,delete on public.crowspace_direct_blocks to authenticated;
grant insert on public.crowspace_direct_reports to authenticated;

create policy "Direct members read their conversations" on public.crowspace_direct_conversations for select to authenticated using(private.crowspace_is_direct_member(id));
create policy "Direct participants read conversation membership" on public.crowspace_direct_members for select to authenticated using(private.crowspace_is_direct_member(conversation_id));
create policy "Members update own direct preferences" on public.crowspace_direct_members for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy "Direct members read messages" on public.crowspace_direct_messages for select to authenticated using(private.crowspace_is_direct_member(conversation_id));
create policy "Direct members send messages" on public.crowspace_direct_messages for insert to authenticated with check(sender_id=(select auth.uid()) and private.crowspace_direct_can_send(conversation_id));
create policy "Senders edit own direct messages" on public.crowspace_direct_messages for update to authenticated using(sender_id=(select auth.uid()) and private.crowspace_is_direct_member(conversation_id)) with check(sender_id=(select auth.uid()) and private.crowspace_is_direct_member(conversation_id));
create policy "Senders delete own direct messages" on public.crowspace_direct_messages for delete to authenticated using(sender_id=(select auth.uid()) and private.crowspace_is_direct_member(conversation_id));
create policy "Direct members read attachments" on public.crowspace_direct_attachments for select to authenticated using(private.crowspace_is_direct_member(conversation_id));
create policy "Senders attach files to own direct messages" on public.crowspace_direct_attachments for insert to authenticated with check(uploaded_by=(select auth.uid()) and private.crowspace_is_direct_member(conversation_id) and exists(select 1 from public.crowspace_direct_messages m where m.id=message_id and m.conversation_id=crowspace_direct_attachments.conversation_id and m.sender_id=(select auth.uid())));
create policy "Members read own direct blocks" on public.crowspace_direct_blocks for select to authenticated using(blocker_id=(select auth.uid()));
create policy "Members block users" on public.crowspace_direct_blocks for insert to authenticated with check(blocker_id=(select auth.uid()) and blocker_id<>blocked_user_id);
create policy "Members unblock users" on public.crowspace_direct_blocks for delete to authenticated using(blocker_id=(select auth.uid()));
create policy "Members report direct messages" on public.crowspace_direct_reports for insert to authenticated with check(reporter_id=(select auth.uid()) and reporter_id<>reported_user_id and private.crowspace_is_direct_member(conversation_id) and (message_id is null or exists(select 1 from public.crowspace_direct_messages m where m.id=message_id and m.conversation_id=crowspace_direct_reports.conversation_id and m.sender_id=reported_user_id)));

create or replace function private.crowspace_guard_direct_member_update()
returns trigger language plpgsql set search_path=''
as $$ begin if new.conversation_id<>old.conversation_id or new.user_id<>old.user_id or new.joined_at<>old.joined_at then raise exception 'Direct conversation membership identity is immutable'; end if; return new; end $$;
create trigger crowspace_guard_direct_member_update before update on public.crowspace_direct_members for each row execute function private.crowspace_guard_direct_member_update();
create or replace function private.crowspace_guard_direct_message_identity()
returns trigger language plpgsql set search_path=''
as $$ begin if new.conversation_id<>old.conversation_id or new.sender_id<>old.sender_id or new.created_at<>old.created_at then raise exception 'Message identity is immutable'; end if; return new; end $$;
create trigger crowspace_guard_direct_message_identity before update on public.crowspace_direct_messages for each row execute function private.crowspace_guard_direct_message_identity();

-- Reuse the existing private Messenger bucket and legacy group-chat schema.
alter table public.crowspace_group_members add column if not exists archived_at timestamptz;
alter table public.crowspace_group_members add column if not exists muted_until timestamptz;
alter table public.crowspace_group_members add column if not exists pinned_at timestamptz;
create index if not exists crowspace_group_members_user_inbox_idx on public.crowspace_group_members(user_id,archived_at,pinned_at);
update storage.buckets set allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain','audio/webm','audio/ogg','audio/mp4','audio/mpeg','video/mp4','video/webm'],file_size_limit=12582912 where id='crowspace-messenger';
create policy "CrowSpace direct members read their message uploads" on storage.objects for select to authenticated using(bucket_id='crowspace-messenger' and (storage.foldername(name))[1]='dm' and (storage.foldername(name))[2] ~* '^[0-9a-f-]{36}$' and private.crowspace_is_direct_member(((storage.foldername(name))[2])::uuid));
create policy "CrowSpace direct members delete own message uploads" on storage.objects for delete to authenticated using(bucket_id='crowspace-messenger' and (storage.foldername(name))[1]='dm' and (storage.foldername(name))[3]=(select auth.uid())::text and private.crowspace_is_direct_member(((storage.foldername(name))[2])::uuid));

create or replace function public.crowspace_group_manage_member(p_group_id uuid,p_user_id uuid,p_action text)
returns boolean language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=(select auth.uid()); v_creator uuid; v_target_role text;
begin
 if v_actor is null then raise exception 'Authentication required'; end if;
 if p_action not in ('promote_admin','demote_member','remove') then raise exception 'Unsupported action'; end if;
 select created_by into v_creator from public.crowspace_group_conversations where id=p_group_id;
 if v_creator is null or not private.crowspace_is_group_admin(p_group_id) then raise exception 'Group administrator access required'; end if;
 select role into v_target_role from public.crowspace_group_members where group_id=p_group_id and user_id=p_user_id;
 if v_target_role is null then raise exception 'Group member not found'; end if;
 if p_user_id=v_creator then raise exception 'The group owner cannot be changed or removed'; end if;
 if p_action in ('promote_admin','demote_member') and v_actor<>v_creator then raise exception 'Only the group owner can change administrator roles'; end if;
 if p_action='promote_admin' then update public.crowspace_group_members set role='admin' where group_id=p_group_id and user_id=p_user_id and role='member';
 elsif p_action='demote_member' then update public.crowspace_group_members set role='member' where group_id=p_group_id and user_id=p_user_id and role='admin';
 elsif p_action='remove' then if v_actor<>v_creator and v_target_role<>'member' then raise exception 'Admins may only remove regular members'; end if; delete from public.crowspace_group_members where group_id=p_group_id and user_id=p_user_id;
 end if;
 return true;
end $$;
revoke all on function public.crowspace_group_manage_member(uuid,uuid,text) from public,anon;
grant execute on function public.crowspace_group_manage_member(uuid,uuid,text) to authenticated;

create or replace function private.crowspace_realtime_can_access(p_topic text)
returns boolean language plpgsql stable security definer set search_path=''
as $$
declare v_kind text; v_id uuid;
begin
 if p_topic !~ '^crowspace-(dm|group):[0-9a-f-]{36}$' then return false; end if;
 v_kind:=split_part(p_topic,':',1); v_id:=split_part(p_topic,':',2)::uuid;
 if v_kind='crowspace-dm' then return private.crowspace_is_direct_member(v_id); end if;
 return private.crowspace_is_group_member(v_id);
end $$;
revoke all on function private.crowspace_realtime_can_access(text) from public,anon;
grant execute on function private.crowspace_realtime_can_access(text) to authenticated;
create policy "CrowSpace conversation members receive realtime" on realtime.messages for select to authenticated using((select realtime.topic()) like 'crowspace-%' and private.crowspace_realtime_can_access((select realtime.topic())) and extension in ('broadcast','presence'));
create policy "CrowSpace conversation members send realtime" on realtime.messages for insert to authenticated with check((select realtime.topic()) like 'crowspace-%' and private.crowspace_realtime_can_access((select realtime.topic())) and extension in ('broadcast','presence'));

do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='crowspace_direct_messages') then alter publication supabase_realtime add table public.crowspace_direct_messages; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='crowspace_direct_members') then alter publication supabase_realtime add table public.crowspace_direct_members; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='crowspace_direct_attachments') then alter publication supabase_realtime add table public.crowspace_direct_attachments; end if;
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='crowspace_group_message_attachments') then alter publication supabase_realtime add table public.crowspace_group_message_attachments; end if;
end $$;
