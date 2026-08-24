-- SOUND GROUP Phase 4 migration
-- Adds an explicit media origin so Admin Dashboard uploads and My Media uploads
-- remain distinct even when the uploader has the admin role.
--
-- Existing data is preserved.
-- Existing admin-owned published/featured/trending media is treated as official
-- because those records match the prior Admin Dashboard publication model.
-- Other existing media is treated as user-origin.

SET @origin_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'media'
    AND COLUMN_NAME = 'origin'
);

SET @origin_sql := IF(
  @origin_exists = 0,
  "ALTER TABLE media ADD COLUMN origin ENUM('official','user') NOT NULL DEFAULT 'user' AFTER user_id",
  'SELECT 1'
);
PREPARE origin_stmt FROM @origin_sql;
EXECUTE origin_stmt;
DEALLOCATE PREPARE origin_stmt;

UPDATE media m
INNER JOIN users u ON u.id = m.user_id
SET m.origin = CASE
  WHEN u.role = 'admin' AND (m.is_published = 1 OR m.is_featured = 1 OR m.is_trending = 1)
    THEN 'official'
  ELSE 'user'
END;

SET @idx1_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'media'
    AND INDEX_NAME = 'idx_media_origin_user'
);
SET @idx1_sql := IF(
  @idx1_exists = 0,
  'CREATE INDEX idx_media_origin_user ON media (origin, user_id, type, created_at)',
  'SELECT 1'
);
PREPARE idx1_stmt FROM @idx1_sql;
EXECUTE idx1_stmt;
DEALLOCATE PREPARE idx1_stmt;

SET @idx2_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'media'
    AND INDEX_NAME = 'idx_media_origin_published'
);
SET @idx2_sql := IF(
  @idx2_exists = 0,
  'CREATE INDEX idx_media_origin_published ON media (origin, is_published, type, created_at)',
  'SELECT 1'
);
PREPARE idx2_stmt FROM @idx2_sql;
EXECUTE idx2_stmt;
DEALLOCATE PREPARE idx2_stmt;
