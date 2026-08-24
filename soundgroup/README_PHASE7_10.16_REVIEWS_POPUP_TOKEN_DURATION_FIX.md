# SOUNDGROUP Phase 7–10.16 — Reviews Popup Token + Duration Fix

## Baseline
Phase 7–10.15 Reviews Popup Final.

## Fixes
- Fixed the public rating mutation CSRF namespace mismatch: rating now validates the same `public_csrf` session token issued by `api/auth.php?action=csrf` and sent by the public JS client.
- Strengthened duration resolution in the public media-details popup: uses stored duration first, then history/current player metadata, then a metadata-only media element with a longer timeout.
- No database schema changes.
- No public page redesign.

## Verification
- PHP syntax and JS syntax checked.
- Review API rating/review/delete CSRF paths cross-checked.
- Media duration field and frontend duration fallbacks cross-checked.
