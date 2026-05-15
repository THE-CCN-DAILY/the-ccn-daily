-- Project Phoenix Cloudflare D1 baseline.
-- This schema starts with the domains needed for public publishing and admin accountability.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  tier TEXT NOT NULL DEFAULT 'free',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Devotional life',
  status TEXT NOT NULL DEFAULT 'draft',
  author_name TEXT NOT NULL DEFAULT 'THE CCN DAILY',
  audio_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

CREATE TABLE IF NOT EXISTS highlights (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  text TEXT NOT NULL,
  note TEXT,
  voice_note_url TEXT,
  tags TEXT,
  color TEXT NOT NULL DEFAULT 'yellow',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_highlights_user_content ON highlights(user_id, content_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS ai_usage_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  feature TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'cloudflare-workers-ai',
  model TEXT,
  units INTEGER NOT NULL DEFAULT 0,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_feature_created ON ai_usage_events(feature, created_at DESC);

INSERT OR IGNORE INTO blog_posts (
  id,
  slug,
  title,
  excerpt,
  content,
  category,
  status,
  author_name,
  published_at
) VALUES
(
  'seed-faith-monday',
  'faith-that-can-survive-monday-morning',
  'Faith that can survive Monday morning',
  'The point of a devotional life is not escape from responsibility. It is to become the kind of person who can carry responsibility without losing the soul.',
  'The point of a devotional life is not escape from responsibility. It is to become the kind of person who can carry responsibility without losing the soul. THE CCN DAILY exists for that kind of formation: Scripture before noise, prayer before reaction, and wisdom before hurry.',
  'Work and devotion',
  'published',
  'THE CCN DAILY',
  '2026-05-15T00:00:00.000Z'
),
(
  'seed-quiet-strength',
  'why-quiet-is-not-weakness',
  'Why quiet is not weakness',
  'A quiet heart is not an inactive heart. It is a governed heart: alert, receptive, and less easily ruled by noise.',
  'A quiet heart is not an inactive heart. It is a governed heart: alert, receptive, and less easily ruled by noise. In a noisy age, quiet becomes a form of courage because it refuses to let urgency become lord.',
  'Spiritual formation',
  'published',
  'THE CCN DAILY',
  '2026-05-14T00:00:00.000Z'
),
(
  'seed-professional-rhythm',
  'a-better-rhythm-for-christian-professionals',
  'A better rhythm for Christian professionals',
  'The working believer needs more than motivation. We need Scripture, prayer, reflection, and a way to return to God in the middle of pressure.',
  'The working believer needs more than motivation. We need Scripture, prayer, reflection, and a way to return to God in the middle of pressure. The daily rhythm should be simple enough to keep and deep enough to form us.',
  'Leadership',
  'published',
  'THE CCN DAILY',
  '2026-05-13T00:00:00.000Z'
);
