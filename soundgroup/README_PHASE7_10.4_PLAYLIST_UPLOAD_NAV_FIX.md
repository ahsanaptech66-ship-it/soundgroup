# SOUNDGROUP Phase 7–10.4 — Playlist Persistence + Admin Upload Navigation

## Changes
- Removed the redundant Admin Upload Center sidebar item.
- Renamed Admin sidebar entries to **Add Music** and **Add Video**.
- Renamed the Music upload panel label to **Music Upload** and the action to **Add music**.
- Added a server refresh whenever the public Playlist view is entered while authenticated. This makes the playlist view rehydrate from MySQL even after a page refresh or a prior transient request failure.
- Improved the empty playlist music picker message and action to clearly send users to My Media when no audio is available.

## Scope
- No database schema changes.
- No API changes.
- No public CSS changes.
- No timeline/player changes.


## 7–10.5 Playlist Load Fix

- Fixed public playlist list query to order `playlist_items` by `position, media_id`.
- The `playlist_items` table uses a composite primary key `(playlist_id, media_id)` and has no standalone `id` column.
- This removes the refresh-time SQL error that caused `Could not load playlists: Internal server error.`
- No database schema change was made.
