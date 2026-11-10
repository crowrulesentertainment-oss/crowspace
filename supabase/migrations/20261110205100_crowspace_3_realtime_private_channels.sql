create policy "CrowSpace direct participants broadcast publish"
on realtime.messages for insert to authenticated
with check (extension='broadcast' and exists (
 select 1 from public.podcast_direct_conversations c
 where realtime.topic()='crowspace:dm:'||c.id::text
 and auth.uid() in (c.participant_low,c.participant_high) and c.status='accepted'
));
create policy "CrowSpace direct participants broadcast receive"
on realtime.messages for select to authenticated
using (extension='broadcast' and exists (
 select 1 from public.podcast_direct_conversations c
 where realtime.topic()='crowspace:dm:'||c.id::text
 and auth.uid() in (c.participant_low,c.participant_high) and c.status='accepted'
));
create policy "CrowSpace group members broadcast publish"
on realtime.messages for insert to authenticated
with check (extension='broadcast' and exists (
 select 1 from public.crowspace_group_members m
 where realtime.topic()='crowspace:group:'||m.group_id::text and m.user_id=auth.uid()
));
create policy "CrowSpace group members broadcast receive"
on realtime.messages for select to authenticated
using (extension='broadcast' and exists (
 select 1 from public.crowspace_group_members m
 where realtime.topic()='crowspace:group:'||m.group_id::text and m.user_id=auth.uid()
));