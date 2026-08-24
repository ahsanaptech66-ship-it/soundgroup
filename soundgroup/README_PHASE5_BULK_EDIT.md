# SOUNDGROUP — Phase 5 Music Bulk Edit

## What changed
The Music Management page now includes a dedicated **Edit selected** action for bulk editing.

- Appears only when **3 or more music rows** are selected.
- Sits beside **Delete selected** in the music table footer.
- Opens a modal with only safe batch-edit controls:
  - Published: No change / Published / Draft
  - Featured: No change / Yes / No
  - Trending: No change / Yes / No
- Title, artist, album, genre, description, and artwork are intentionally excluded from bulk editing.
- The backend validates admin access, POST method, CSRF, selected IDs, and 0/1 flag values.
- Only `type='audio'` records are updated.
- No database migration is required for this feature.

## Existing delete behavior
- 0–1 selected: footer action area is hidden.
- 2 selected: **Delete selected** is available; **Edit selected** stays hidden.
- 3+ selected: both **Edit selected** and **Delete selected** are available.

## Test checklist
1. Select 1 music row: no footer bulk buttons.
2. Select 2 rows: Delete selected appears; Edit selected does not.
3. Select 3+ rows: both buttons appear.
4. Open Edit selected: all three fields default to No change.
5. Change only Published and Apply: only `is_published` changes.
6. Change Featured/Trending together: only those flags change.
7. Leave all fields at No change: operation is rejected safely.
8. Cancel/ESC closes the modal without changes.
9. Refresh after apply: changes persist.
10. Confirm individual Edit still works unchanged.
