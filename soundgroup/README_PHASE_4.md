# SOUNDGROUP — Phase 4

## Scope
Phase 4 adds:
- Admin Video Management in a separate admin page/code path.
- Video upload, drag/drop, multi-upload, thumbnail upload, edit, publish/draft, featured, trending, bulk actions, search/filter/sort and delete.
- Public Discover as the official SOUNDGROUP catalog only.
- Discover sections for Featured, Music and Videos.
- Published official catalog data loaded from MySQL/PHP, separate from user-owned media.
- No new SQL migration is required: the existing `media` schema already supports `type='video'`, artwork, publish/feature/trending flags and browser-playable metadata.

## URLs
- Public: `http://localhost/SOUND_GROUP/`
- Admin: `http://localhost/SOUND_GROUP/admin/`
- Video management: `http://localhost/SOUND_GROUP/admin/videos.php`

## Database
If the database already contains the Phase 1–3 migrations, do not re-import `database/sound_group.sql`.
Phase 4 is schema-compatible with the existing Phase 3 media migration and does not add new columns.

## Test order
1. Confirm Apache + MySQL are running.
2. Log in with an admin account.
3. Open `/admin/videos.php`.
4. Upload a small MP4 and publish it.
5. Add a thumbnail and metadata; edit it afterwards.
6. Confirm the video appears in Admin Video Management.
7. Open `/public/`, then Discover.
8. Confirm the video appears under Discover → Videos.
9. Upload a draft and confirm it does not appear in Discover.
10. Test search, filters, bulk actions and delete.
11. Confirm Music Management still works.
12. Confirm user uploads remain outside the official Discover catalog.

## Notes
Video upload accepts common video containers including MP4, WebM, MKV, MOV, M4V, AVI, OGV, 3GP, MPEG/MPG and transport-stream variants. Upload acceptance does not guarantee native playback in every browser; browser codec support still applies.
