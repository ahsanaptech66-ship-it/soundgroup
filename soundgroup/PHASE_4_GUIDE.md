# SOUNDGROUP Phase 4 Guide

This phase uses the latest Phase 3 MPEG-fixed package as its base.

### What changed
**Admin**
- Added `admin/videos.php`.
- Added `admin/assets/admin-video.js`.
- Added video-management styles to `admin/assets/admin.css`.
- Added `api/admin_video.php`.
- Enabled the Videos navigation item in the admin panel.

**Public**
- `public/index.html`: Discover now has official Featured, Music and Videos sections.
- `public/app.js`: loads a dedicated published catalog and keeps official Discover content separate from the user's own media collection.
- `public/styles.css`: small official-catalog card styling additions.
- `api/media/media.php`: added `action=discover` for published SOUNDGROUP catalog items only.

### Important content rule
- Admin-published content is the official Discover catalog.
- User uploads are not automatically placed in Discover.
- The public/private toggle and Community section are not introduced.

### Database
No new Phase 4 migration is required because the existing media schema already supports video records and the Phase 3 fields used here.

## Discover update — official catalog routing
- Discover now uses ALL / MUSIC / VIDEOS tabs.
- Only admin-owned, published media appears in Discover.
- Music and Watch remain user-library views and exclude admin-owned media.
- Featured/Trending affect Discover presentation only; they do not route admin media into Music/Watch.
- No new SQL migration is required for this Discover update.
See `README_PHASE_4_DISCOVER.md` for the API contract and content rules.

## Phase 4.1 — Media Origin Fix

A dedicated migration `database/migrations/phase_4_media_origin.sql` adds an explicit `media.origin` field so the same admin account can safely have both official Admin Dashboard uploads and personal My Media uploads without routing or persistence conflicts.
