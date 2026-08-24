# SOUNDGROUP PHASE 6 — PLAYLIST TEST PLAN

## Public user flow
1. Sign in as a normal user.
2. Open Playlists.
3. Click New playlist; modal must open.
4. Create a playlist with a valid name; card must appear immediately.
5. Open the playlist card; detail modal must open.
6. Rename the playlist; title and list must update.
7. Add an audio track from the Add music picker.
8. Confirm the track appears in the detail list.
9. Play the track from the detail view.
10. Play all; verify the player queue contains the playlist's playable audio in order.
11. Move a track up/down; refresh the playlist; order must persist.
12. Remove a track; refresh; removed link must remain gone.
13. Add the same track twice; second add must be rejected as duplicate.
14. Open Discover and add an official published audio item to the playlist; it must work.
15. Try to add another user's private audio via direct API request; it must be rejected.
16. Delete the playlist; its card disappears and playlist items are removed by foreign-key cascade.
17. Logout/login; remaining playlists must persist for the same owner.
18. Guest mode must not expose the user's personal playlists.

## Admin flow
1. Sign in as admin.
2. Open Admin > Playlists.
3. Confirm all playlists are listed with owner, item count, created and updated timestamps.
4. Refresh; data remains consistent.
5. Delete a test playlist from admin; confirm it is removed for the owner as well.
6. Confirm non-admin access to the admin playlist API is denied.

## Regression checks
- Music/Watch/Discover still render.
- Add to playlist control still appears on media cards.
- Audio playback still works.
- Favorites/history are untouched.
- User uploads and admin monitoring are untouched.
- No SQL migration is required for Phase 6.
