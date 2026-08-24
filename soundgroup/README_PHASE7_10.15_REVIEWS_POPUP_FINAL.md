# Phase 7–10.15 — Reviews & Ratings Popup Final Refinement

This build intentionally returns to the working popup UX from 7–10.12 rather than the dedicated page.

## Fixes
- Fixed public CSRF namespace mismatch: `reviews.php` now validates `public_csrf`, matching `auth.php?action=csrf`.
- Review POSTs explicitly send the public CSRF token and automatically refresh/retry once on HTTP 419.
- Restored/refined the media details popup and removed dependency on the dedicated media-details page for Discover details/reviews.
- Added metadata duration fallback using the actual media URL when stored duration is missing.
- Kept album, artist, genre, year and language sourced from the same media object; no fake values are added.
- Locked body scroll while the popup is open and bounded the popup to the viewport for responsive behavior.
- Preserved the existing reviews/ratings API and database schema.

## Baseline
This build is based on `SOUNDGROUP_PHASE7_10.12_REVIEWS_DETAILS_FUNCTIONAL_FIX.zip`. The 7–10.13 dedicated page is not used by the public Discover review flow.
