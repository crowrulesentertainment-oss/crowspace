# CrowSpace 3.0 release QA checklist

Passing GitHub Actions is necessary but does not prove authenticated application workflows work.

## Automated checks
- [ ] CrowSpace CI passes on the pull request.
- [ ] Required database migration files and version prefixes validate.

## Authenticated member browser pass
Use two separate test-member accounts and synthetic test content.
- [ ] Sign in, refresh, and confirm the session persists.
- [ ] Edit profile details, branch affiliations, and creator portfolio; save and reload.
- [ ] View each member profile while signed in as the other account.
- [ ] Discover creators and follow displayed portfolio links.
- [ ] Create a group, select a branch, and verify branch filtering.
- [ ] Create an event, RSVP from the second account, and verify both views.
- [ ] Publish a branch post and confirm the follower notification appears.
- [ ] Confirm existing community content and memberships remain available.

## Messenger pass
- [ ] Start a direct conversation and accept the request from the second account.
- [ ] Exchange messages in both directions and refresh both sessions.
- [ ] Confirm typing indicators appear only to conversation participants.
- [ ] Record, send, and play a voice note in both sessions.
- [ ] Confirm a non-participant cannot access conversation attachments.
- [ ] Report a conversation and verify it appears in the moderation desk.

## WebRTC pass (two browsers or devices)
- [ ] Audio call connects, has two-way audio, and ends cleanly.
- [ ] Video call connects, has two-way audio/video, and ends cleanly.
- [ ] Denied microphone/camera permissions show a useful error.
- [ ] Test on separate networks; document whether TURN relay is required.
- [ ] Verify hangup, refresh, and interrupted-call cleanup.

## Administrator and authorization pass
- [ ] Admin can open the moderation desk and view submitted reports.
- [ ] Admin can update report status and the change persists after refresh.
- [ ] Ordinary member is denied access to admin moderation data/actions.
- [ ] Direct database/API requests are denied by RLS for unauthorized users.
- [ ] Notification preferences are respected by cross-branch notifications.

## Responsive and regression pass
- [ ] Desktop: current Chrome/Edge and Firefox.
- [ ] Mobile: narrow viewport, navigation, profile forms, Messenger, and event forms.
- [ ] No uncaught console exceptions or failed first-party asset/network requests.
- [ ] Existing account, friend, group, event, and message records remain intact.

## Release controls
- [ ] Review final CI run and changed-file diff.
- [ ] Confirm production Supabase migration state before release.
- [ ] Obtain explicit approval before merging to main.
- [ ] Deploy only after merge approval and a separate deployment go-ahead.
