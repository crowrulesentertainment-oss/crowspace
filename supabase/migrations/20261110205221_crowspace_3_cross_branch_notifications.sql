create or replace function private.crowspace_notify_branch_post()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare v_follower record; v_division text;
begin
  if auth.uid() is null or auth.uid() <> new.user_id then return new; end if;
  if new.privacy <> 'public' then return new; end if;
  v_division := case new.branch_key
    when 'podcasting' then 'CrowRules Podcasting'
    when 'tacoma-nights' then 'Tacoma Nights'
    when 'back-deck-live' then 'Back Deck Live'
    when 'bonded-in-mystery' then 'Bonded in Mystery'
    when 'tacoma-community-hub' then 'Tacoma Community Hub'
    when 'memorials' then 'CrowRules Memorials'
    when 'dreamscapes' then 'Dreamscapes'
    when 'studios' then 'CrowRules Studios'
    when 'crowrules-plus' then 'CrowRules+'
    when 'records' then 'CrowRules Records'
    when 'spectrum-awards' then 'Spectrum Awards'
    when 'tacoma-community' then 'Community Initiatives'
    else 'CrowSpace Community' end;
  for v_follower in
    select f.follower_user_id from public.podcast_member_follows f
    where f.followed_user_id=new.user_id and f.follower_user_id<>new.user_id
  loop
    if private.crowspace_notifications_allowed(v_follower.follower_user_id) then
      insert into public.crowrules_notifications
        (user_id,actor_user_id,type,title,body,division,action_url,metadata,group_key)
      values
        (v_follower.follower_user_id,new.user_id,'branch_post',
         'New post from someone you follow',
         'A new update was shared in '||v_division||'.',
         new.branch_key,
         'branch.html?division='||coalesce(new.branch_key,'community'),
         jsonb_build_object('post_id',new.id,'branch_key',new.branch_key),
         'branch-post:'||new.id::text);
    end if;
  end loop;
  return new;
end
$function$;
revoke all on function private.crowspace_notify_branch_post() from public,anon,authenticated;
drop trigger if exists crowspace_branch_post_notification on public.podcast_member_posts;
create trigger crowspace_branch_post_notification after insert on public.podcast_member_posts
for each row execute function private.crowspace_notify_branch_post();