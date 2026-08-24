# SOUNDGROUP Phase 7–10.9 — Public Reviews & Ratings Integration

## Scope
This build connects the existing Phase 7–10 review/rating backend to the public media detail experience without changing the database schema.

## Public behavior
- Official published SOUNDGROUP music and videos expose a shared Details / reviews flow.
- User-owned/private My Media entries show details only; community reviews/ratings are not exposed for private content.
- One user can hold one rating per media item; rating updates replace the previous rating.
- One user can hold one review per media item; saving again updates the existing review.
- Other users can read public reviews on the same official release.
- Review authors can delete their own review.
- Guests can read community reviews but must log in to rate or write a review.
- Empty, loading, and no-review states are handled in the modal.

## Backend contract used
`api/reviews.php`
- `summary` — GET with `media_id`
- `rate` — POST JSON
- `review` — POST JSON
- `delete_review` — POST JSON

No SQL migration is required for this build; `ratings` and `reviews` already exist in the Phase 7–10 schema.

## Files changed
- `public/app.js`
- `public/styles.css`
- `README_PHASE7_10.9_REVIEWS_RATINGS_PUBLIC.md`

## Verification
- PHP syntax: all project PHP files
- JavaScript syntax: `public/app.js`
- HTML duplicate IDs: none detected
- CSS brace balance: checked
- API endpoint ↔ frontend action names: cross-checked
- Existing database schema: unchanged

## Manual test checklist
1. Guest opens an official Discover item → can read reviews → rating/review controls require login.
2. User A rates an official release → average/count update.
3. User A writes a review → review appears.
4. User B opens the same release → sees User A's review.
5. User A saves another review → existing review updates instead of duplicating.
6. User A deletes their review → it disappears.
7. Refresh the site and reopen the same release → reviews/ratings still load from the backend.
8. Open a private My Media item → details work, community reviews/ratings are not exposed.
9. Existing playback, favorites, playlists, uploads, and admin pages continue to work.

## Future Phase 2 idea
Do not add card-level rating summaries, review sorting, rating distributions, helpful votes, or advanced moderation in this build. Those can be considered after the basic system is proven stable.


## 7-10.10 Review/Discover interaction fixes
- Card menus now resolve within their own `.media-card` instead of using duplicate DOM ids.
- Duplicate `menu-{id}` markup was removed to prevent intermittent/frozen three-dot menus when the same media appears in multiple Discover sections.
- Media detail/reviews modal is now viewport-bounded with internal scrolling.
- Reviews are positioned directly below the community rating, with a contained review list; the user's review composer remains available after the community list.
- No database/API changes.
