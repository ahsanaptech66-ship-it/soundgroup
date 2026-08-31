# SOUNDGROUP Theme Persistence Fix

## Scope
Public frontend theme persistence only. No Admin, database schema, media, player, playlist, or review logic changed.

## Root cause
The public settings API wrapper had been commented out, so authenticated settings were not reliably loaded/saved through the backend. In addition, backend settings could overwrite a valid browser theme cookie during boot.

## Fix
- Restored the public `api.settings()` client method.
- During boot, a valid `theme` cookie now takes precedence over a stale/default server theme.
- Other user settings continue to load from the backend normally.
- Existing cookie persistence on theme changes is preserved.

## Expected behavior
- Change theme -> theme stays across public sections.
- Visit Admin -> return to public -> theme remains.
- Refresh / Ctrl+R -> theme remains.
- Open Settings -> theme remains instead of reverting.
- Other settings remain server-persisted.

## Validation
- JavaScript syntax check required.
- PHP syntax check required for all PHP files.
- Verify exactly four theme names remain: Signature, Polar, Obsidian, Aurora.
