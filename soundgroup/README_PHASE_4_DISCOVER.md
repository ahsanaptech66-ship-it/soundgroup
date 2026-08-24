# SOUNDGROUP Phase 4 — Discover architecture update

## Locked content rules
- Discover is the official SOUNDGROUP catalog.
- Only media published by an account with `users.role = 'admin'` appears in Discover.
- Discover is split into `ALL`, `MUSIC`, and `VIDEOS` views.
- `Featured` and `Trending` only promote already-published official content inside Discover.
- Public `Music` and `Watch` views are user-library views. They no longer include admin-uploaded official content.
- User uploads do not enter Discover automatically.
- No Community section and no public/private toggle were added.

## Discover API
`GET /api/media.php?action=discover&view=all`
returns the full official catalog plus pre-built sections:
- `items`
- `all.featured`
- `all.trendingMusic`
- `all.trendingVideos`
- `all.newMusic`
- `all.latestVideos`
- `music.featured`
- `music.trending`
- `music.newReleases`
- `music.genres`
- `videos.featured`
- `videos.trending`
- `videos.latest`
- `counts`

## Public library API
`GET /api/media.php?action=list` returns only media owned by the logged-in normal user. Admin-owned media is excluded from Music/Watch so official admin content remains Discover-only.

## Database
No Phase 4 Discover migration is required. Existing Phase 3 fields are used:
- `is_published`
- `is_featured`
- `is_trending`
- `user_id`
- `type`

The final consolidated SQL at project completion should keep this routing model documented.
