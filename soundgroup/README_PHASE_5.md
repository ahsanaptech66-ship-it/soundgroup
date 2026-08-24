# SOUNDGROUP — Phase 5

## User Uploads + Admin User Monitoring

Phase 5 completes the personal-media side of the platform. User uploads remain owner-specific and never enter the official Discover catalog. The same rule applies even when the account owner is an administrator: only uploads made through the Admin Dashboard are `origin=official`; uploads made through My Media are `origin=user`.

### Public behavior
- Signed-in user uploads are stored as `origin=user` with `user_id` = current account.
- My Media / Music / Watch query only the signed-in user's `origin=user` media.
- Guest users receive an empty personal-media list.
- User uploads are excluded from Discover, which uses `origin=official` + published media.

### Admin behavior
- New `admin/user-uploads.php` provides User Monitoring.
- New `api/admin_user_media.php` provides admin-only listing, stats, single delete, and bulk delete for `origin=user` audio/video.
- Monitoring does not introduce approval, public/private toggles, or a community section.
- Deletes are limited server-side to user-origin media and remove the database record plus stored file/artwork.
- Monitoring mutations require the current admin session and CSRF token.

### Database
No new migration is required when using the current clean Phase 4 database because `media.origin` and `media.user_id` already exist and the relevant foreign keys cascade related rows.
