# SOUND GROUP — Phase 4 Media Origin Fix

## Purpose

This migration separates **Official SOUNDGROUP media** uploaded from the Admin Dashboard from **personal My Media uploads**, even when the uploader is an admin.

## Final rules

- Admin Dashboard upload → `origin = official` → can appear in public Discover when published.
- My Media upload → `origin = user` → visible only to its owner in Music/Watch/My Media.
- User uploads never enter Discover.
- Official Discover content never enters an owner's personal Music/Watch library.
- Public edit/delete/clear endpoints can only operate on `origin = user` media owned by the current user.
- Admin Dashboard APIs can manage official media and continue to monitor existing media according to the existing admin UI.

## Migration

Run once against the existing `sound_group` database:

`database/migrations/phase_4_media_origin.sql`

Do **not** re-import the full `database/sound_group.sql` over an existing live database.

The migration preserves existing rows and backfills origin. Because older rows did not record where they were uploaded from, existing admin-owned media that is already published/featured/trending is classified as `official`; other existing rows are classified as `user`.

Future uploads are unambiguous because the server sets the origin from the upload endpoint itself.
