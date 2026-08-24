# SOUNDGROUP API

The root API files are the public entry points. The nested implementation files are kept separated by domain for maintainability.

| Domain | Entry point | Actions |
|---|---|---|
| Auth | `/api/auth.php` | me, login, register, logout |
| Media | `/api/media.php` | list, upload, update, delete, clear |
| Favorites | `/api/favorites.php` | list, toggle |
| History | `/api/history.php` | list, save, clear |
| Playlists | `/api/playlists.php` | list, create, rename, delete, add, remove, reorder |
| Settings | `/api/settings.php` | get, save |
