# SOUNDGROUP — PHASE 7–10 ONE-SHOT DELIVERY

This package consolidates the planned Phase 7–10 requirements on top of the stable Phase 6.0.2/classmate-styled baseline.

## Scope

### Phase 7 — Admin Foundation Completion
- User management: list/search/filter users, edit profile data, role, active/inactive state, delete users with media-file cleanup.
- Website information management: site name, tagline, about text, contact text.
- Metadata/category management: Genre, Language, Year, Artist, Album.
- Admin analytics dashboard with 7/30/90-day summaries, daily activity, top content, active users.
- Admin review moderation.

### Phase 8 — Public Counterpart
- Public site information loaded from the database.
- Latest official music: 5 items.
- Latest official videos: 5 items.
- Public Year and Language filters for Music and Watch.
- Public metadata supports Artist, Album, Genre, Year, Language.
- Newly added official media can show a NEW badge.
- Public review/rating detail UI is available from media cards.

### Phase 9 — Reviews & Ratings
- One rating per user/media, 1–5 stars.
- One review per user/media with edit/update behavior.
- Delete own review.
- Review access respects published-official or own-user media ownership.
- Admin can moderate/delete reviews.

### Phase 10 — Search & Discovery Completion
- Search covers title/name, artist, album, genre, year and language across the active catalog.
- Music and Watch filters include Year and Language.
- Existing Discover/Music/Watch behavior remains intact.

## Additional requirement alignment
- Registration now collects mandatory Name, Phone, Address and Email, plus password and terms.
- Existing numeric `users.id` remains the unique USERID/database identifier; no additional username table was introduced.
- Inactive users are blocked from login/authenticated access and inactive admins are rejected by the new admin endpoints.

## Database changes
The consolidated `database/sound_group.sql` includes the Phase 7–10 schema. A separate migration is provided for an already-imported Phase 6 database:

`database/migrations/phase_7_10_requirements.sql`

New/extended data structures:
- `users.phone`
- `users.address`
- `users.is_active`
- `media.release_year`
- `media.language`
- `site_settings`
- `categories`
- `ratings`
- `reviews`
- `analytics_events`

## Main changed files

### Public
- `public/index.html`
- `public/app.js`
- `public/styles.css`

### Admin
- `admin/users.php`
- `admin/settings.php`
- `admin/analytics.php`
- `admin/reviews.php`
- `admin/assets/admin-users.js`
- `admin/assets/admin-settings.js`
- `admin/assets/admin-analytics.js`
- `admin/assets/admin-reviews.js`
- `admin/assets/admin.css` (minimal additive Phase 7–10 rules only)

### APIs / backend
- `api/admin_users.php`
- `api/site.php`
- `api/admin_content.php`
- `api/analytics.php`
- `api/reviews.php`
- `api/admin_reviews.php`
- `api/auth/auth.php`
- `api/admin.php`
- `api/admin_media.php`
- `api/admin_video.php`
- `api/media/media.php`
- `api/favorites/favorites.php`
- `config/config.php`
- `admin/includes/guard.php`

## Testing performed
- PHP syntax: all project PHP files passed.
- JavaScript syntax: all project JS files passed `node --check`.
- Key admin/public HTML IDs checked for duplicates.
- Public and Admin CSS brace balance checked.
- Radio references re-checked: none found in the public code.
- Required new database objects checked in the consolidated SQL.
- Key media upload/search SQL paths were manually cross-checked for new Year/Language parameters.

## Important runtime verification checklist

1. Fresh database import from `database/sound_group.sql`.
2. Existing database migration using `database/migrations/phase_7_10_requirements.sql` if preserving current data.
3. Register a new user with Name + Phone + Address + Email.
4. Login, logout, inactive-user behavior.
5. Admin Users: search, edit, activate/deactivate, delete a test user.
6. Admin Website & Catalog: edit site info and categories.
7. Admin Analytics: verify events appear after playback/favorite/upload actions.
8. Admin Reviews: search and delete a test review.
9. Public Home: verify site information and exactly 5 latest official music + 5 latest official videos.
10. Public Music/Watch: filter by Year and Language.
11. Public media details: rating, review, edit review, delete own review.
12. Search: title, artist, album, genre, year, language.
13. Regression: uploads, My Media ownership, Discover origin rules, playlists, favorites, history, player/timeline, admin monitoring and bulk actions.

## Rollback

The pre-Phase-7–10 baseline is the stable Phase 6.0.2/classmate-styled package. Keep that ZIP untouched. If any Phase 7–10 runtime change causes a regression, restore the baseline project and database, then re-apply only the specific feature under investigation.

## Scope discipline

No unrelated architecture rewrite was performed. Public HTML/CSS changes in this package are limited to the explicitly requested Phase 7–10 requirement features. Existing Phase 5/6 functionality remains the baseline and should be regression-tested before moving on.


## 7–10.2 fix — Public My Media upload

Fixed the user-owned media INSERT statement in `api/media/media.php`: adding `release_year` and `language` had increased the column count to 16, but the prepared statement still had 14 placeholders. The mismatch caused My Media uploads to fail after the Phase 7–10 schema expansion. The statement now has 16 placeholders matching its 16 columns/values.

## Phase 7–10.3 fixes
- Fixed admin playlist API bootstrap path to use `../config/config.php`, resolving the `Invalid server response` playlist page error.
- Standardized Admin sidebar content across Analytics, Reviews, Settings, and Playlist pages, including Upload Center and persistent user/logout area.
