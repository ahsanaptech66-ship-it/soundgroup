# SOUNDGROUP Phase 7–10.12 — Reviews / Details Interaction Fix

## Purpose
Fix the public Discover `Details / reviews` action so it is reliably reachable from dynamically-rendered cards and the media details view always resolves the correct official media item.

## Changes
- Replaced the media ID resolver with a robust resolver that searches the local media cache and every official Discover shelf.
- Moved `data-details` handling to one document-level delegated click handler so re-rendered Discover cards cannot lose the action binding.
- Removed the per-card `data-details` listener to avoid duplicate/stale handlers after Discover re-renders.
- Standardized the `.overlay-modal` base rule so every modal with that class is fixed, centered, viewport-contained, and hidden until opened.
- Added shared max-height constraints for modal content and mobile-safe overlay padding.

## Intentionally unchanged
- Reviews / ratings API contract.
- Database schema.
- Playlist logic.
- Player / timeline logic.
- Admin UI.
- Public design outside the modal/detail interaction required for this fix.

## Manual verification
1. Discover → open 3-dot menu → Details / reviews.
2. Repeat for the same release if it appears in multiple Discover shelves.
3. Verify modal is centered and stays within viewport.
4. Close and reopen another release.
5. Refresh and repeat.
6. Verify review/rating data still loads inside the modal.
