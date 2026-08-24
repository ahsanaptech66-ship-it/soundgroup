# SOUNDGROUP — Phase 3

## What Phase 3 adds

Phase 3 introduces a real, protected **Music Management** area while preserving the existing public frontend.

### Admin
- `admin/media.php` — protected Music Management + Upload Center.
- `admin/assets/admin-media.js` — upload, drag/drop, search, filter, sort, selection, bulk actions, edit and delete.
- `admin/assets/admin.css` — Phase 3 admin UI styles are appended without replacing the existing admin design.
- `api/admin_media.php` — admin-only music catalog API with CSRF protection for mutations.
- `database/migrations/phase_3_media.sql` — additive migration for artwork and publishing/curation flags.

### Public
- `public/index.html` — adds an Admin Dashboard link that is hidden for guests and normal users and shown only when the authenticated user's role is `admin`.
- `public/app.js` — updates the Admin link from the existing PHP `auth.php?action=me` role response.
- `api/media/media.php` — the public catalog now exposes published media to guests/users while keeping a user's own unpublished uploads visible to that user.

## Database update required

If the existing `sound_group` database is already in use, run **once**:

`database/migrations/phase_3_media.sql`

This adds:
- `artwork_path`
- `is_published`
- `is_featured`
- `is_trending`

Existing media records remain intact and default to unpublished.

For a brand-new database, use the updated `database/sound_group.sql` instead of the older copy.

## Phase 3 behavior

- Admin uploads audio to `public/uploads/audio/`.
- Optional artwork goes to `public/uploads/images/`.
- Admin can publish/unpublish, feature/unfeature, mark/unmark trending, edit metadata, replace/remove artwork, delete single items, and run bulk actions.
- Public visitors see only published catalog items.
- A logged-in user also sees their own unpublished uploads.
- Video management remains a later phase.

## Test URLs

Public:
`http://localhost/SOUND_GROUP/`

Admin:
`http://localhost/SOUND_GROUP/admin/`

Music Management:
`http://localhost/SOUND_GROUP/admin/media.php`


### Audio format support
Phase 3 accepts common audio formats including MP3, MP2/MPA/MPGA (MPEG audio), WAV, FLAC, M4A/M4B, AAC, OGG/OGA, OPUS, AIFF/AIF/AIFC, WMA, AMR/AWB, CAF, AU/SND and audio-form MPEG files. The browser file picker and drag-and-drop filter now include these extensions, while PHP still validates the detected MIME type. A `.mpeg` file detected by the server as `video/mpeg` is treated as video rather than audio and should be added in Phase 4 Video Management.
