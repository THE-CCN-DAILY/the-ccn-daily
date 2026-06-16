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

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  prompt TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, id)
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created ON journal_entries(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration TEXT,
  source_type TEXT,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  start_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  participants_count INTEGER NOT NULL DEFAULT 0,
  -- Community challenge extensions (added idempotently by ensureChallengeColumns):
  challenge_type TEXT NOT NULL DEFAULT 'open', -- 'open' (join anytime) | 'scheduled'
  end_date TEXT,                                -- scheduled challenges only
  live_url TEXT,                                -- optional live session link
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_challenges_status_start ON challenges(status, start_date DESC);

CREATE TABLE IF NOT EXISTS challenge_modules (
  id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  day_number INTEGER NOT NULL DEFAULT 1,
  video_url TEXT,
  audio_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (challenge_id, id),
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_challenge_modules_day ON challenge_modules(challenge_id, day_number ASC);

CREATE TABLE IF NOT EXISTS challenge_participants (
  challenge_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  completed_modules TEXT NOT NULL DEFAULT '[]',
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (challenge_id, user_id),
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id, joined_at DESC);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  instructor TEXT NOT NULL DEFAULT 'THE CCN DAILY',
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  is_premium INTEGER NOT NULL DEFAULT 0,
  module_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_status_created ON courses(status, created_at DESC);

CREATE TABLE IF NOT EXISTS devotionals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  devotional_date TEXT NOT NULL,
  audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  author_id TEXT,
  is_premium INTEGER NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devotionals_status_date ON devotionals(status, devotional_date DESC);

CREATE TABLE IF NOT EXISTS audiobooks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT 'THE CCN DAILY',
  audio_url TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  is_premium INTEGER NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audiobooks_status_created ON audiobooks(status, created_at DESC);

CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT 'THE CCN DAILY',
  file_url TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  is_premium INTEGER NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  -- Print edition (added idempotently by ensureBookPrintColumns):
  print_enabled INTEGER NOT NULL DEFAULT 0,  -- a physical edition exists
  print_countries TEXT,                       -- comma ISO codes that ship today (e.g. 'UG,KE')
  print_price_usd REAL NOT NULL DEFAULT 0,    -- USD list price for print
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_books_status_created ON books(status, created_at DESC);

-- Print access / waitlist requests from readers in regions without a
-- distribution centre yet (Africa-first, but global where POD shipping is dear).
CREATE TABLE IF NOT EXISTS book_print_requests (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  book_title TEXT NOT NULL DEFAULT '',
  user_id TEXT,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new', -- new | contacted | fulfilled
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_book_print_requests_created ON book_print_requests(created_at DESC);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  role TEXT NOT NULL,
  file_name TEXT NOT NULL,
  object_key TEXT NOT NULL,
  public_url TEXT NOT NULL,
  content_type_header TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_assets_content_type ON media_assets(content_type, created_at DESC);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_date TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'online',
  attendee_count INTEGER NOT NULL DEFAULT 0,
  streaming_platform TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_status_date ON events(status, event_date ASC);

CREATE TABLE IF NOT EXISTS event_registrations (
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON event_registrations(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS prayer_requests (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Anonymous',
  author_uid TEXT,
  prayer_count INTEGER NOT NULL DEFAULT 0,
  testimony TEXT,
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prayer_requests_created ON prayer_requests(created_at DESC);

CREATE TABLE IF NOT EXISTS prayer_request_prayers (
  request_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (request_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_prayer_request_prayers_user ON prayer_request_prayers(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS community_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_community_messages_created ON community_messages(created_at DESC);

CREATE TABLE IF NOT EXISTS live_stream_settings (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'offline',
  playback_id TEXT,
  stream_id TEXT,
  title TEXT NOT NULL DEFAULT 'Global Broadcast',
  viewer_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS live_stream_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_live_stream_messages_created ON live_stream_messages(created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'broadcast',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'in-app',
  read INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_date ON notifications(user_id, date DESC);

CREATE TABLE IF NOT EXISTS user_gamification (
  user_id TEXT PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 7,
  longest_streak INTEGER NOT NULL DEFAULT 21,
  points INTEGER NOT NULL DEFAULT 1250,
  unlocked_achievements TEXT NOT NULL DEFAULT '["a1","a2","a3","a4"]',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_modules (
  id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  module_order INTEGER NOT NULL DEFAULT 1,
  video_url TEXT,
  audio_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (course_id, id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_course_modules_order ON course_modules(course_id, module_order ASC);

CREATE TABLE IF NOT EXISTS course_progress (
  course_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  completed_modules TEXT NOT NULL DEFAULT '[]',
  last_accessed TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (course_id, user_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_course_progress_user ON course_progress(user_id, last_accessed DESC);

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

-- ── Payments & entitlements (server-authoritative) ─────────────────────────────
-- Entitlements and active subscriptions are ONLY granted server-side, after the
-- Flutterwave webhook re-verifies a transaction. The client never writes these.

-- One row per user describing their current subscription tier/status.
CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id TEXT PRIMARY KEY,
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'none', -- active | expired | canceled | none
  started_at TEXT,
  ends_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status, ends_at);

-- One row per granted entitlement (subscription-included, owned, or trial).
-- resource_id may be a tier marker (e.g. 'tier:pro') for subscription grants, or a
-- concrete resource id for a la carte purchases.
CREATE TABLE IF NOT EXISTS user_entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  access_type TEXT NOT NULL DEFAULT 'subscription_included', -- subscription_included | owned_perpetual | trial_limited
  source TEXT NOT NULL DEFAULT 'subscription', -- purchase | subscription | trial | grant
  starts_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_user_entitlements_user_active ON user_entitlements(user_id, is_active, resource_id);

-- One row per purchase attempt. Created 'pending' at intent time; flipped to
-- 'active' (or 'failed') by the webhook after re-verification. Idempotent on tx_ref.
CREATE TABLE IF NOT EXISTS user_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_id TEXT NOT NULL, -- tier marker (e.g. 'tier:pro') or concrete resource id
  tx_ref TEXT NOT NULL UNIQUE,
  amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- pending | active | failed | refunded | revoked
  purchased_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_purchases_user ON user_purchases(user_id, purchased_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_purchases_tx_ref ON user_purchases(tx_ref);

-- Household and leader dashboards ------------------------------------------------
-- These tables back user-visible seat management, group invites, and assignment
-- workflows. Invitation delivery can be layered on separately; the dashboard state
-- itself is durable and owned by the authenticated account.

CREATE TABLE IF NOT EXISTS household_members (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- owner | member | pending
  status TEXT NOT NULL DEFAULT 'active', -- active | pending
  joined_at TEXT,
  invited_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_household_members_owner_email ON household_members(owner_id, email);
CREATE INDEX IF NOT EXISTS idx_household_members_owner ON household_members(owner_id, role, updated_at DESC);

CREATE TABLE IF NOT EXISTS group_members (
  id TEXT PRIMARY KEY,
  leader_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- leader | member | pending
  status TEXT NOT NULL DEFAULT 'active', -- active | pending
  engagement_score INTEGER NOT NULL DEFAULT 0,
  last_active_at TEXT,
  invited_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_leader_email ON group_members(leader_id, email);
CREATE INDEX IF NOT EXISTS idx_group_members_leader ON group_members(leader_id, role, updated_at DESC);

CREATE TABLE IF NOT EXISTS group_assignments (
  id TEXT PRIMARY KEY,
  leader_id TEXT NOT NULL,
  title TEXT NOT NULL,
  assignment_type TEXT NOT NULL DEFAULT 'practice', -- devotional | course | challenge | practice
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_group_assignments_leader_created ON group_assignments(leader_id, created_at DESC);

-- Abuse protection ----------------------------------------------------------
-- Durable fixed-window rate limit counters shared across worker isolates.
CREATE TABLE IF NOT EXISTS rate_limit_hits (
  scope TEXT NOT NULL,
  bucket_key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (scope, bucket_key, window_start)
);

-- Daily-cached FX rates for local-currency charging (mobile money unlock).
CREATE TABLE IF NOT EXISTS fx_rates (
  currency TEXT PRIMARY KEY,
  usd_rate REAL NOT NULL,
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Contact / help form submissions written by /api/contact.
CREATE TABLE IF NOT EXISTS help_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_hint TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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

INSERT OR IGNORE INTO challenges (
  id,
  title,
  description,
  duration,
  source_type,
  status,
  start_date,
  participants_count
) VALUES
(
  'seed-rhythm-at-work',
  'Seven Days of Quiet Strength at Work',
  'A guided challenge for Christian professionals who want to practice Scripture, prayer, and faithful attention inside ordinary work pressure.',
  '7 Days',
  'Seed',
  'published',
  '2026-05-16T00:00:00.000Z',
  0
);

INSERT OR IGNORE INTO challenge_modules (
  id,
  challenge_id,
  title,
  description,
  content,
  day_number
) VALUES
(
  'seed-rhythm-at-work-day-1',
  'seed-rhythm-at-work',
  'Begin Before the Noise',
  'Start the day with a short act of attention before work names your mood.',
  'Read Colossians 3:23. Write one sentence naming the work God has placed before you today, then pray for grace to do it with a quiet heart.',
  1
),
(
  'seed-rhythm-at-work-day-2',
  'seed-rhythm-at-work',
  'Choose the Next Faithful Step',
  'Practice obedience in one clear action instead of carrying the whole week at once.',
  'Read James 1:5. Name one decision that needs wisdom. Ask God for clarity, then take the next faithful step.',
  2
);

INSERT OR IGNORE INTO courses (
  id,
  title,
  description,
  instructor,
  status,
  is_premium,
  module_count,
  created_at
) VALUES
(
  'seed-formed-for-work',
  'Formed for Work and Witness',
  'A practical formation course for believers who want Scripture, prayer, and wisdom to shape the way they work, lead, and serve.',
  'THE CCN DAILY',
  'published',
  0,
  2,
  '2026-05-16T00:00:00.000Z'
);

INSERT OR IGNORE INTO course_modules (
  id,
  course_id,
  title,
  description,
  content,
  module_order
) VALUES
(
  'seed-formed-for-work-1',
  'seed-formed-for-work',
  'Work as Worship',
  'Recover a biblical view of daily work without turning productivity into an idol.',
  'Read Colossians 3:23 and Psalm 90:17. Write down one area where your work needs the peace and excellence of God.',
  1
),
(
  'seed-formed-for-work-2',
  'seed-formed-for-work',
  'Wisdom Under Pressure',
  'Practice prayerful judgment when decisions arrive quickly.',
  'Read James 1:5. Identify one pressure point at work and write a short prayer for wisdom before acting.',
  2
);
