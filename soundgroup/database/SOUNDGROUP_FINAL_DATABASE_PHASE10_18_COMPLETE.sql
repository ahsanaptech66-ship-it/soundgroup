-- ================================================================
-- SOUNDGROUP — FINAL DATABASE / FRESH INSTALL
-- Current project baseline: Phase 10.18 Reviews & Ratings Phase 2
-- Consolidated from the project base schema and all historical
-- migrations included in this package.
--
-- IMPORTANT:
--   * This file is intended for a NEW / EMPTY installation.
--   * It recreates the `sound_group` database and does not preserve
--     existing rows.
--   * Existing uploaded files under public/uploads/ are separate
--     from MySQL and are not deleted by this SQL file.
--   * Historical migration files remain in database/migrations/ for
--     project history; they are NOT required when starting from zero
--     with this consolidated file.
--
-- Included schema evolution:
--   Phase 1–2 admin/user role model
--   Phase 3 media catalog fields
--   Phase 4 official/user media origin
--   Phase 7–10 requirements and metadata
--   Phase 10 reviews & ratings
--   Phase 10.18 review helpful votes
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS sound_group;
CREATE DATABASE sound_group
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sound_group;

-- ================================================================
-- USERS
-- ================================================================
CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NULL,
  address VARCHAR(255) NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- MEDIA
-- ================================================================
-- This is the central catalog table used by public media, admin music,
-- admin video, Discover, favorites, history and playlists.
CREATE TABLE media (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  origin ENUM('official','user') NOT NULL DEFAULT 'user',
  type ENUM('audio','video','other') NOT NULL,

  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255) NULL,
  album VARCHAR(255) NULL,
  genre VARCHAR(120) NULL,
  release_year SMALLINT UNSIGNED NULL,
  language VARCHAR(80) NULL,
  description TEXT NULL,

  filename VARCHAR(255) NOT NULL,
  stored_name VARCHAR(255) NOT NULL,
  relative_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(120) NULL,
  size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  duration DECIMAL(12,3) NULL,
  browser_playable TINYINT(1) NOT NULL DEFAULT 1,

  artwork_path VARCHAR(500) NULL,

  is_published TINYINT(1) NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_trending TINYINT(1) NOT NULL DEFAULT 0,

  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_media_user (user_id),
  KEY idx_media_type (type),
  KEY idx_media_origin_user (origin, user_id, type, created_at),
  KEY idx_media_origin_published (origin, is_published, type, created_at),
  KEY idx_media_published_flags (is_published, is_featured, is_trending, type, created_at),

  CONSTRAINT fk_media_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- FAVORITES
-- ================================================================
CREATE TABLE favorites (
  user_id INT UNSIGNED NOT NULL,
  media_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id, media_id),
  KEY idx_favorites_media (media_id),

  CONSTRAINT fk_fav_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_fav_media
    FOREIGN KEY (media_id)
    REFERENCES media (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- HISTORY
-- ================================================================
CREATE TABLE history (
  user_id INT UNSIGNED NOT NULL,
  media_id BIGINT UNSIGNED NOT NULL,
  type ENUM('audio','video','other') NOT NULL,
  current_seconds DECIMAL(12,3) NOT NULL DEFAULT 0,
  duration DECIMAL(12,3) NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id, media_id),
  KEY idx_history_updated (user_id, updated_at),
  KEY idx_history_media (media_id),

  CONSTRAINT fk_history_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_history_media
    FOREIGN KEY (media_id)
    REFERENCES media (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- PLAYLISTS
-- ================================================================
CREATE TABLE playlists (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_playlist_user (user_id),

  CONSTRAINT fk_playlist_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- PLAYLIST ITEMS
-- ================================================================
CREATE TABLE playlist_items (
  playlist_id BIGINT UNSIGNED NOT NULL,
  media_id BIGINT UNSIGNED NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (playlist_id, media_id),
  KEY idx_playlist_items_media (media_id),
  KEY idx_playlist_items_order (playlist_id, position),

  CONSTRAINT fk_playlist_item_playlist
    FOREIGN KEY (playlist_id)
    REFERENCES playlists (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_playlist_item_media
    FOREIGN KEY (media_id)
    REFERENCES media (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- ================================================================
-- SITE SETTINGS
-- ================================================================
CREATE TABLE site_settings (
  setting_key VARCHAR(80) NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('site_name','SOUNDGROUP'),
  ('site_tagline','A local-first entertainment space for music and video.'),
  ('about_text','SOUNDGROUP brings music, video, discovery and personal media together in one local-first experience.'),
  ('contact_text','Use the administrator contact details configured for this installation.');

-- ================================================================
-- CATEGORIES
-- ================================================================
CREATE TABLE categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_type ENUM('genre','language','year','artist','album') NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_category_type_name (category_type, name),
  KEY idx_category_type_name (category_type, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO categories(category_type,name)
SELECT 'genre', genre FROM media WHERE genre IS NOT NULL AND TRIM(genre)<>'' GROUP BY genre;
INSERT IGNORE INTO categories(category_type,name)
SELECT 'language', language FROM media WHERE language IS NOT NULL AND TRIM(language)<>'' GROUP BY language;
INSERT IGNORE INTO categories(category_type,name)
SELECT 'year', CAST(release_year AS CHAR) FROM media WHERE release_year IS NOT NULL GROUP BY release_year;
INSERT IGNORE INTO categories(category_type,name)
SELECT 'artist', artist FROM media WHERE artist IS NOT NULL AND TRIM(artist)<>'' GROUP BY artist;
INSERT IGNORE INTO categories(category_type,name)
SELECT 'album', album FROM media WHERE album IS NOT NULL AND TRIM(album)<>'' GROUP BY album;

-- ================================================================
-- RATINGS
-- ================================================================
CREATE TABLE ratings (
  user_id INT UNSIGNED NOT NULL,
  media_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, media_id),
  KEY idx_ratings_media (media_id),
  KEY idx_ratings_rating (media_id, rating),
  CONSTRAINT fk_ratings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ratings_media FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- REVIEWS
-- ================================================================
CREATE TABLE reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  media_id BIGINT UNSIGNED NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_review_user_media (user_id, media_id),
  KEY idx_reviews_media (media_id, created_at),
  KEY idx_reviews_user (user_id, created_at),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_media FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- REVIEW HELPFUL VOTES
-- ================================================================
CREATE TABLE review_helpful (
  review_id BIGINT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id, user_id),
  KEY idx_helpful_user (user_id),
  CONSTRAINT fk_helpful_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_helpful_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- ANALYTICS EVENTS
-- ================================================================
CREATE TABLE analytics_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_type VARCHAR(40) NOT NULL,
  user_id INT UNSIGNED NULL,
  media_id BIGINT UNSIGNED NULL,
  value DECIMAL(12,3) NULL,
  meta_json TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_events_type_time (event_type, created_at),
  KEY idx_events_media_time (media_id, created_at),
  KEY idx_events_user_time (user_id, created_at),
  CONSTRAINT fk_events_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_events_media FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- SETTINGS
-- ================================================================
CREATE TABLE settings (
  user_id INT UNSIGNED NOT NULL,
  settings_json LONGTEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id),

  CONSTRAINT fk_settings_user
    FOREIGN KEY (user_id)
    REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================
-- POST-IMPORT CHECKS (optional; safe to run after import)
-- ================================================================
-- SELECT TABLE_NAME, ENGINE
-- FROM information_schema.TABLES
-- WHERE TABLE_SCHEMA='sound_group'
-- ORDER BY TABLE_NAME;
--
-- DESCRIBE users;
-- DESCRIBE media;
-- DESCRIBE favorites;
-- DESCRIBE history;
-- DESCRIBE playlists;
-- DESCRIBE playlist_items;
-- DESCRIBE settings;
--
-- To create the first admin:
-- 1) Register through the public website.
-- 2) Then run:
-- UPDATE users SET role='admin', updated_at=CURRENT_TIMESTAMP
-- WHERE email='YOUR_REGISTERED_EMAIL';


-- ================================================================
-- FINAL INSTALL NOTES
-- ================================================================
-- This consolidated file already includes review_helpful. Do NOT run
-- migrations_phase2_reviews_ratings.sql after importing this file.
-- Historical migrations are retained only for development history.
--
-- To create the first admin account after installation:
--   1) Register normally through the public website.
--   2) Replace the email below with that account's email.
--   3) Run: UPDATE users SET role='admin', updated_at=CURRENT_TIMESTAMP
--      WHERE email='YOUR_REGISTERED_EMAIL';
--
-- Expected current tables (13):
--   users, media, favorites, history, playlists, playlist_items,
--   site_settings, categories, ratings, reviews, review_helpful,
--   analytics_events, settings
