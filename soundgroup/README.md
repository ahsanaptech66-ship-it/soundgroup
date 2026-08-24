# SOUNDGROUP — PHP/MySQL Backend Ready

## Requirements
- XAMPP with Apache + MySQL
- PHP 8+
- MySQL/MariaDB
- A browser with HTML5 Audio/Video and Web Audio support

## Install
1. Extract the project to `C:\xampp\htdocs\SOUND_GROUP`.
2. Start Apache and MySQL in XAMPP.
3. Open phpMyAdmin and import `database/sound_group.sql`.
4. Check `config/config.php` if your MySQL username/password differs from the XAMPP defaults.
5. Open `http://localhost/SOUND_GROUP/` (root redirects to `/public/`).

## Upload limits
PHP's own limits must allow your media size. In XAMPP's `php.ini`, adjust `upload_max_filesize` and `post_max_size` as needed (for example 512M), then restart Apache.

## Backend API
- `api/auth.php?action=register|login|logout|me`
- `api/media.php?action=list|upload|update|delete|clear`
- `api/favorites.php?action=list|toggle`
- `api/history.php?action=list|save|clear`
- `api/playlists.php?action=list|create|delete|add`
- `api/settings.php?action=get|save`

The frontend `public/app.js` uses these endpoints with same-origin PHP sessions.

## Phase 3
Music Management is available at `admin/media.php`. Run `database/migrations/phase_3_media.sql` once on an existing database. See `README_PHASE_3.md` and `database/README_PHASE_3.md`.
