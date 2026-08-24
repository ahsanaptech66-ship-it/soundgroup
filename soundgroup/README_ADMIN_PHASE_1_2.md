# SOUNDGROUP — Admin Phase 1 + 2

## What was added
- `admin/login.php` — separate administrator login.
- `admin/index.php` — protected Liquid Glass admin dashboard.
- `admin/includes/guard.php` — server-side admin page protection.
- `admin/assets/admin.css` — admin-only visual system, aligned with the public SOUNDGROUP look.
- `admin/assets/admin.js` — admin login, dashboard API calls, responsive nav, refresh and logout.
- `api/admin.php` — admin authentication and dashboard API.
- `database/migrations/phase_1_2_admin.sql` — non-destructive role activation helper.
- `database/README_ADMIN.md` — exact XAMPP/phpMyAdmin activation instructions.

## Existing public files
`public/index.html`, `public/styles.css`, `public/app.js`, and the existing API/database structure are preserved. Public auth now also records the user's role in the session for consistency.

## Admin activation
Register a normal account first, then promote that exact email to `admin` in phpMyAdmin using the SQL in `database/README_ADMIN.md`.

## URLs
- Public: `http://localhost/SOUND_GROUP/`
- Admin: `http://localhost/SOUND_GROUP/admin/`

## Phase 1 + 2 boundary
Phase 1 + 2 focus on secure admin authentication and the dashboard overview. Phase 3 adds the separate Music Management and Upload Center at `admin/media.php` plus the admin entry point in the public navigation. Video management, users, playlists, homepage controls and analytics remain phased later.
