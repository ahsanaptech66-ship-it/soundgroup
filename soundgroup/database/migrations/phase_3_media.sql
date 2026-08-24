-- SOUNDGROUP Phase 3: Music / media administration
-- Run once against an existing sound_group database. This migration is additive.

USE sound_group;

SET @db = DATABASE();

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='media' AND COLUMN_NAME='artwork_path')=0,
  'ALTER TABLE media ADD COLUMN artwork_path VARCHAR(500) NULL AFTER browser_playable', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='media' AND COLUMN_NAME='is_published')=0,
  'ALTER TABLE media ADD COLUMN is_published TINYINT(1) NOT NULL DEFAULT 0 AFTER artwork_path', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='media' AND COLUMN_NAME='is_featured')=0,
  'ALTER TABLE media ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER is_published', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='media' AND COLUMN_NAME='is_trending')=0,
  'ALTER TABLE media ADD COLUMN is_trending TINYINT(1) NOT NULL DEFAULT 0 AFTER is_featured', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Existing user uploads stay private by default (is_published=0).
-- Admin uploads can be published from the Phase 3 dashboard.
