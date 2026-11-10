-- Keep the Phase 2 notifications limited to actual pending requests and accepted requests.
create or replace function private.crowspace_social_notify()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,private as $$
declare v_recipient uuid; v_actor uuid; v_type text; v_entity_type text; v_entity_id uuid; v_message text;
begin
 if tg_table_name='crowspace_post_comments' then select author_id into v_recipient from public.crowspace_posts where id=new.post_id; v_actor:=new.author_id; v_type:='comment'; v_entity_type:='post'; v_entity_id:=new.post_id; v_message:='commented on your post';
 elsif tg_table_name='crowspace_post_reactions' then select author_id into v_recipient from public.crowspace_posts where id=new.post_id; v_actor:=new.user_id; v_type:='reaction'; v_entity_type:='post'; v_entity_id:=new.post_id; v_message:='reacted to your post';
 elsif tg_table_name='crowspace_follows' then v_recipient:=new.following_id; v_actor:=new.follower_id; v_type:='follow'; v_entity_type:='profile'; v_entity_id:=new.following_id; v_message:='started following you';
 elsif tg_table_name='friendships' and tg_op='INSERT' and new.status='pending' then v_recipient:=new.addressee_id; v_actor:=new.requester_id; v_type:='friend_request'; v_entity_type:='friendship'; v_entity_id:=new.id; v_message:='sent you a connection request';
 elsif tg_table_name='friendships' and tg_op='UPDATE' and new.status='accepted' and old.status is distinct from 'accepted' then v_recipient:=new.requester_id; v_actor:=new.addressee_id; v_type:='friend_accepted'; v_entity_type:='friendship'; v_entity_id:=new.id; v_message:='accepted your connection request'; end if;
 if v_recipient is not null and v_actor is not null and v_recipient<>v_actor then insert into public.crowspace_notifications(recipient_id,actor_id,notification_type,entity_type,entity_id,message) values(v_recipient,v_actor,v_type,v_entity_type,v_entity_id,v_message); end if; return new;
end $$;
revoke all on function private.crowspace_social_notify() from public,anon,authenticated;
