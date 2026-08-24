-- SOUNDGROUP Phase 1 + 2 admin activation
-- IMPORTANT: Do NOT run this file blindly with a made-up email.
-- 1) Register a normal SOUNDGROUP account first using the public website.
-- 2) Replace the email below with that account's actual email.
-- 3) Run this UPDATE once in the sound_group database.

USE sound_group;

UPDATE users
SET role = 'admin', updated_at = CURRENT_TIMESTAMP
WHERE email = 'REPLACE_WITH_YOUR_ADMIN_EMAIL@example.com';

-- Verify:
-- SELECT id, name, email, role FROM users ORDER BY id DESC;
