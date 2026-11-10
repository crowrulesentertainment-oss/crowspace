-- Least-privilege grant correction for the Phase 2 tables.
revoke all on public.crowspace_posts from anon;
revoke all on public.crowspace_post_media from anon;
revoke all on public.crowspace_post_comments from anon;
revoke all on public.crowspace_post_reactions from anon;
revoke all on public.crowspace_follows from anon;
revoke all on public.crowspace_notifications from anon;
revoke all on public.crowspace_post_media from authenticated;
grant select,insert,delete on public.crowspace_post_media to authenticated;
revoke all on public.crowspace_follows from authenticated;
grant select,insert,delete on public.crowspace_follows to authenticated;
revoke all on public.crowspace_notifications from authenticated;
grant select on public.crowspace_notifications to authenticated;
grant update(read_at) on public.crowspace_notifications to authenticated;
drop policy if exists "CrowSpace network members view posts" on public.crowspace_wall_posts;
drop policy if exists "Members publish on their own CrowSpace feed" on public.crowspace_wall_posts;
drop policy if exists "Authors edit their own CrowSpace feed posts" on public.crowspace_wall_posts;
