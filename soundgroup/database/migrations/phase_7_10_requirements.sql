USE sound_group;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(40) NULL AFTER email,
  ADD COLUMN IF NOT EXISTS address VARCHAR(255) NULL AFTER phone,
  ADD COLUMN IF NOT EXISTS is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role;

ALTER TABLE media
  ADD COLUMN IF NOT EXISTS release_year SMALLINT UNSIGNED NULL AFTER genre,
  ADD COLUMN IF NOT EXISTS language VARCHAR(80) NULL AFTER release_year;

CREATE TABLE IF NOT EXISTS site_settings (
  setting_key VARCHAR(80) NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_type ENUM('genre','language','year','artist','album') NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_category_type_name (category_type, name),
  KEY idx_category_type_name (category_type, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ratings (
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

CREATE TABLE IF NOT EXISTS reviews (
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

CREATE TABLE IF NOT EXISTS analytics_events (
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

INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('site_name','SOUNDGROUP'),
  ('site_tagline','A local-first entertainment space for music and video.'),
  ('about_text','SOUNDGROUP brings music, video, discovery and personal media together in one local-first experience.'),
  ('contact_text','Use the administrator contact details configured for this installation.')
ON DUPLICATE KEY UPDATE setting_key=VALUES(setting_key);

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
