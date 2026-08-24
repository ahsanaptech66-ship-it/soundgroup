# SOUNDGROUP — PHASE 3 TEST & SETUP GUIDE

## 1. Keep your existing database

Do **not** re-import the full `database/sound_group.sql` if your Phase 1 + 2 database already exists and contains your users/media.

Run the one-time migration:

`database/migrations/phase_3_media.sql`

In phpMyAdmin:
1. Select `sound_group`.
2. Open **Import** or **SQL**.
3. Use `phase_3_media.sql`.
4. Execute it once.

The migration adds four media columns and preserves existing rows.

## 2. Make an admin

If you already have an admin account, keep using it.
If you need the first admin, register a normal account and set its `users.role` to `admin` in phpMyAdmin.

## 3. Test admin music management

Open:

`http://localhost/SOUND_GROUP/admin/media.php`

Test in this order:
- Page loads.
- Search.
- Status filter.
- Featured/Trending filter.
- Sort.
- Select one row.
- Select all visible rows.
- Publish / Unpublish.
- Feature / Trending.
- Edit title, artist, album, genre and description.
- Replace artwork.
- Remove artwork.
- Delete one track.
- Bulk delete.
- Drag-and-drop audio upload.
- Browse audio upload.
- Multi-file audio upload.
- Publish-on-upload.
- Artwork-on-upload.

## 4. Test the public site

Open:

`http://localhost/SOUND_GROUP/`

As a guest:
- Published admin music should appear in the public catalog.
- Draft admin music should not appear.
- The **Admin Dashboard** link must not appear.

As a normal user:
- Published catalog remains visible.
- The **Admin Dashboard** link must not appear.
- Their own unpublished uploads remain visible to that user.

As an admin:
- Published catalog remains visible.
- **Admin Dashboard** link appears.
- Clicking it opens `/admin/`.

## 5. Upload limits

The application validates audio uploads at 512 MB and artwork at 10 MB. PHP/XAMPP `upload_max_filesize` and `post_max_size` must also allow the file size you intend to upload.

## Phase 3 boundary

Video management is intentionally not included yet. Users, playlists, homepage controls and analytics remain in later phases.
