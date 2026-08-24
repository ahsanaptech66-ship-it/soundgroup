# SOUNDGROUP Phase 7–10.18 — Reviews & Ratings Phase 2

Implemented on top of Phase 7–10.17.

## Added

- Compact rating summary on official Discover cards.
- Rating average and total count.
- Rating distribution (1–5 stars) in the detail popup.
- Review sorting: Newest, Oldest, Most helpful.
- Review load-more (10 at a time, up to 50).
- Helpful toggle per review (one vote per user per review).
- Helpful counts and helpful-aware sorting.
- Batched rating summary endpoint for Discover cards.

## Database

Added `review_helpful` table. For an existing database, import:

`database/migrations_phase2_reviews_ratings.sql`

Fresh installs use the updated `database/sound_group.sql`.

## Scope

No changes to player, playlists, media upload logic, admin styling, or unrelated public sections.
