# Phase 7–10 Database Migration

Use this migration only when upgrading an existing Phase 6 database instead of importing the fresh consolidated `database/sound_group.sql`.

It adds the fields/tables needed for:
- user address/phone/active status
- media release year/language
- website information
- metadata categories
- ratings
- reviews
- analytics events

Fresh installs should prefer the root consolidated `database/sound_group.sql` so all tables are created in one import.
