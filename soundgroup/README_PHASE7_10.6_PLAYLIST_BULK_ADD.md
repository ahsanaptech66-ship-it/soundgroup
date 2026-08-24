# SOUNDGROUP Phase 7–10.6 — Playlist Bulk Add

## Change
The public playlist music picker now supports multi-selection so users can add several eligible audio tracks in one visit.

## UX
- Each available track toggles selection instead of immediately closing the picker.
- `Select all` selects/clears all available tracks.
- `Add selected (N)` adds the selected tracks using the existing playlist `add` API.
- The picker stays open after a successful add and refreshes to show the remaining available tracks.
- Empty playlists still show the My Media route when no eligible audio exists.
- Partial failures are reported without discarding successful additions.

## Scope
- `public/app.js`
- `public/index.html`
- `public/styles.css`
- No database or PHP/API changes.

## Regression intent
Existing single-track add, playlist persistence, remove, reorder, play-all, and ownership behavior are preserved through the existing `add` API and existing playlist state.
