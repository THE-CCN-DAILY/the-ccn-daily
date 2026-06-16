import { Hono } from 'hono';
import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose';

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  all: <T = unknown>() => Promise<{ results: T[] }>;
  first: <T = unknown>() => Promise<T | null>;
  run: () => Promise<unknown>;
};

type D1DatabaseBinding = {
  prepare: (query: string) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => Promise<unknown[]>;
};

type WorkersAiBinding = {
  run: (model: string, input: unknown) => Promise<unknown>;
};

type R2ObjectBodyLike = {
  body: ReadableStream;
  httpEtag: string;
  writeHttpMetadata: (headers: Headers) => void;
};

type R2BucketBinding = {
  put: (
    key: string,
    value: ReadableStream | ArrayBuffer | string | Blob,
    options?: { httpMetadata?: { contentType?: string } }
  ) => Promise<unknown>;
  get: (key: string) => Promise<R2ObjectBodyLike | null>;
};

type Env = {
  DB?: D1DatabaseBinding;
  AI?: WorkersAiBinding;
  MEDIA_BUCKET?: R2BucketBinding;
  FIREBASE_PROJECT_ID?: string;
  PRODUCTION_ORIGIN?: string;
  ADMIN_EMAIL?: string;
  MEDIA_PUBLIC_BASE_URL?: string;
  WORKERS_AI_TEXT_MODEL?: string;
  // Cloudflare Stream (VOD + live) — REST API, no binding.
  // CF_ACCOUNT_ID: Cloudflare account id. CF_STREAM_TOKEN: API token with Stream:Edit.
  // CF_STREAM_CUSTOMER_SUBDOMAIN: the "customer-<code>" hostname shown in the Stream
  //   dashboard (used to build iframe/HLS playback URLs). Falls back to parsing it from
  //   the live input's playback URLs when present.
  CF_ACCOUNT_ID?: string;
  CF_STREAM_TOKEN?: string;
  CF_STREAM_CUSTOMER_SUBDOMAIN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  AUTH_SECRET?: string;
  RESEND_API_KEY?: string;
  // Flutterwave (payments). SECRET_KEY: server API key for transaction verify.
  // WEBHOOK_HASH: the "Secret hash" set in the Flutterwave dashboard; sent back
  //   on every webhook in the `verif-hash` header. PUBLIC_KEY: client-side key
  //   returned by /api/payments/intent so the client initializes Flutterwave.
  FLUTTERWAVE_SECRET_KEY?: string;
  FLUTTERWAVE_WEBHOOK_HASH?: string;
  // Publishable Flutterwave key (wrangler.toml [vars]); VITE_ name kept as a fallback.
  FLUTTERWAVE_PUBLIC_KEY?: string;
  VITE_FLUTTERWAVE_PUBLIC_KEY?: string;
  // Comma-separated extra admin emails to receive attention alerts (beyond the
  // ministry allowlist). Set via wrangler/dashboard; safe to leave unset.
  ADMIN_NOTIFY_EMAILS?: string;
  // Cloudflare Turnstile secret (wrangler secret). When unset, Turnstile
  // verification is skipped and D1 rate limiting remains the abuse floor.
  TURNSTILE_SECRET_KEY?: string;
};

const app = new Hono<{
  Bindings: Env;
  Variables: { idTokenEmail?: string; idTokenEmailVerified?: boolean; idTokenUid?: string; idTokenRole?: string };
}>();

// Firebase ID-token verification (RS256) against Google's public JWKS.
const firebaseJwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

const verifyFirebaseIdToken = async (token: string, projectId: string) => {
  try {
    const { payload } = await jwtVerify(token, firebaseJwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    const claims = payload as Record<string, unknown>;
    return {
      uid: String(payload.sub ?? ''),
      email: String(claims.email ?? '').toLowerCase(),
      emailVerified: claims.email_verified === true,
    };
  } catch {
    return null;
  }
};

// Verify a Bearer Firebase ID token once per request and stash the result on context,
// so synchronous admin checks (requireAdmin) need no per-route changes.
app.use('*', async (c, next) => {
  const authHeader = c.req.header('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    const projectId = c.env.FIREBASE_PROJECT_ID || 'ccn-daily';
    const session = await verifyFirebaseIdToken(authHeader.slice(7).trim(), projectId);
    if (session) {
      c.set('idTokenEmail', session.email);
      c.set('idTokenEmailVerified', session.emailVerified);
      c.set('idTokenUid', session.uid);
      // Authority comes from the D1 users.role column (the single source of truth).
      // Look it up once per authenticated request so synchronous guards (isAdminRequest)
      // can honor stored roles without each route doing its own query. Public/unauthenticated
      // requests skip this entirely. Failures fall through to the email allowlist bootstrap.
      if (c.env.DB && (session.uid || session.email)) {
        try {
          const row = await c.env.DB.prepare(
            `SELECT role FROM users WHERE id = ? OR email = ? LIMIT 1`,
          ).bind(session.uid, session.email).first<{ role: string }>();
          if (row?.role) c.set('idTokenRole', row.role);
        } catch {
          // D1 unavailable — allowlist bootstrap still authorizes the founder.
        }
      }
    }
  }
  await next();
});

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  status: 'draft' | 'published' | 'archived';
  author_name: string;
  audio_url?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type HighlightRow = {
  id: string;
  user_id: string;
  content_id: string;
  text: string;
  note?: string | null;
  voice_note_url?: string | null;
  tags?: string | null;
  color: 'yellow' | 'blue' | 'green' | 'pink';
  created_at?: string | null;
  updated_at?: string | null;
};

type JournalEntryRow = {
  id: string;
  user_id: string;
  text: string;
  color: 'blue' | 'green' | 'yellow' | 'pink';
  prompt?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ChallengeRow = {
  id: string;
  title: string;
  description: string;
  duration?: string | null;
  source_type?: string | null;
  cover_url?: string | null;
  status: 'draft' | 'published' | 'archived';
  start_date: string;
  participants_count: number;
  // Community challenge extensions:
  challenge_type?: string | null; // 'open' (join anytime) | 'scheduled' (timed)
  end_date?: string | null;       // scheduled challenges only
  live_url?: string | null;       // optional live session link (e.g. Cloudflare Stream)
  created_at?: string | null;
  updated_at?: string | null;
};

type ChallengeModuleRow = {
  id: string;
  challenge_id: string;
  title: string;
  description: string;
  content: string;
  day_number: number;
  video_url?: string | null;
  audio_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type ChallengeParticipantRow = {
  challenge_id: string;
  user_id: string;
  completed_modules: string;
  joined_at?: string | null;
  updated_at?: string | null;
};

type CourseRow = {
  id: string;
  title: string;
  description: string;
  instructor: string;
  cover_url?: string | null;
  status: 'draft' | 'published' | 'archived';
  is_premium: number;
  module_count: number;
  created_at?: string | null;
  updated_at?: string | null;
};

type CourseModuleRow = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  content: string;
  module_order: number;
  video_url?: string | null;
  audio_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type CourseProgressRow = {
  course_id: string;
  user_id: string;
  completed_modules: string;
  last_accessed?: string | null;
  updated_at?: string | null;
};

type EventRow = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  type: 'online' | 'physical';
  attendee_count: number;
  streaming_platform?: string | null;
  status: 'draft' | 'published' | 'archived';
  created_at?: string | null;
  updated_at?: string | null;
};

type PrayerRequestRow = {
  id: string;
  text: string;
  author: string;
  author_uid?: string | null;
  prayer_count: number;
  testimony?: string | null;
  is_anonymous: number;
  created_at?: string | null;
  updated_at?: string | null;
};

type CommunityMessageRow = {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at?: string | null;
};

type LiveStreamSettingsRow = {
  id: string;
  status: 'offline' | 'live';
  playback_id?: string | null;
  stream_id?: string | null;
  title: string;
  viewer_count: number;
  updated_at?: string | null;
};

type LiveStreamMessageRow = {
  id: string;
  user_id: string;
  user_name: string;
  text: string;
  created_at?: string | null;
};

type DevotionalRow = {
  id: string;
  title: string;
  content: string;
  description: string;
  devotional_date: string;
  audio_url?: string | null;
  status: 'draft' | 'published' | 'archived';
  author_id?: string | null;
  is_premium: number;
  price: number;
  created_at?: string | null;
  updated_at?: string | null;
};

type AudiobookRow = {
  id: string;
  title: string;
  description: string;
  author: string;
  audio_url: string;
  cover_url?: string | null;
  status: 'draft' | 'published' | 'archived';
  is_premium: number;
  price: number;
  created_at?: string | null;
  updated_at?: string | null;
};

type BookRow = {
  id: string;
  title: string;
  description: string;
  author: string;
  file_url: string;
  cover_url?: string | null;
  status: 'draft' | 'published' | 'archived';
  is_premium: number;
  price: number;
  // Print edition (added idempotently by ensureBookPrintColumns):
  print_enabled?: number | null;          // 0/1 — does a print edition exist at all
  print_countries?: string | null;        // comma ISO codes where print ships today (e.g. 'UG,KE')
  print_price_usd?: number | null;        // USD list price for the print edition
  created_at?: string | null;
  updated_at?: string | null;
};

type NotificationRow = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'in-app' | 'email' | 'both';
  read: number;
  date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type GamificationRow = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  points: number;
  unlocked_achievements: string;
  updated_at?: string | null;
};

type UserRow = {
  id: string;
  email: string;
  display_name?: string | null;
  photo_url?: string | null;
  role: 'admin' | 'lead_developer' | 'group_lead' | 'family_lead' | 'user';
  tier: string;
  created_at?: string | null;
  updated_at?: string | null;
  last_active_at?: string | null;
};

type HouseholdMemberRow = {
  id: string;
  owner_id: string;
  name: string;
  email: string;
  role: 'owner' | 'member' | 'pending';
  status: 'active' | 'pending';
  joined_at?: string | null;
  invited_at?: string | null;
  updated_at?: string | null;
};

type GroupMemberRow = {
  id: string;
  leader_id: string;
  name: string;
  email: string;
  role: 'leader' | 'member' | 'pending';
  status: 'active' | 'pending';
  engagement_score: number;
  last_active_at?: string | null;
  invited_at?: string | null;
  updated_at?: string | null;
};

type GroupAssignmentRow = {
  id: string;
  leader_id: string;
  title: string;
  assignment_type: 'devotional' | 'course' | 'challenge' | 'practice';
  progress: number;
  created_at?: string | null;
  updated_at?: string | null;
};

type AiUsageRow = {
  id: string;
  user_id?: string | null;
  feature: string;
  provider: string;
  model?: string | null;
  units: number;
  metadata?: string | null;
  created_at?: string | null;
};

const fallbackPosts: BlogPostRow[] = [
  {
    id: 'seed-faith-monday',
    slug: 'faith-that-can-survive-monday-morning',
    title: 'Faith that can survive Monday morning',
    excerpt:
      'The point of a devotional life is not escape from responsibility. It is to become the kind of person who can carry responsibility without losing the soul.',
    content:
      'The point of a devotional life is not escape from responsibility. It is to become the kind of person who can carry responsibility without losing the soul.',
    category: 'Work and devotion',
    status: 'published',
    author_name: 'THE CCN DAILY',
    published_at: '2026-05-15T00:00:00.000Z',
  },
  {
    id: 'seed-quiet-strength',
    slug: 'why-quiet-is-not-weakness',
    title: 'Why quiet is not weakness',
    excerpt:
      'A quiet heart is not an inactive heart. It is a governed heart: alert, receptive, and less easily ruled by noise.',
    content:
      'A quiet heart is not an inactive heart. It is a governed heart: alert, receptive, and less easily ruled by noise.',
    category: 'Spiritual formation',
    status: 'published',
    author_name: 'THE CCN DAILY',
    published_at: '2026-05-14T00:00:00.000Z',
  },
  {
    id: 'seed-professional-rhythm',
    slug: 'a-better-rhythm-for-christian-professionals',
    title: 'A better rhythm for Christian professionals',
    excerpt:
      'The working believer needs more than motivation. We need Scripture, prayer, reflection, and a way to return to God in the middle of pressure.',
    content:
      'The working believer needs more than motivation. We need Scripture, prayer, reflection, and a way to return to God in the middle of pressure.',
    category: 'Leadership',
    status: 'published',
    author_name: 'THE CCN DAILY',
    published_at: '2026-05-13T00:00:00.000Z',
  },
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 96);

const mapPost = (row: BlogPostRow) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  excerpt: row.excerpt,
  content: row.content,
  category: row.category,
  status: row.status,
  authorName: row.author_name,
  audioUrl: row.audio_url || undefined,
  seoTitle: row.seo_title || undefined,
  seoDescription: row.seo_description || undefined,
  publishedAt: row.published_at || undefined,
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined,
});

const parseTags = (value?: string | null) => {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

const mapHighlight = (row: HighlightRow) => ({
  id: row.id,
  contentId: row.content_id,
  text: row.text,
  note: row.note || undefined,
  voiceNoteUrl: row.voice_note_url || undefined,
  tags: parseTags(row.tags),
  color: row.color,
  createdAt: row.created_at || new Date().toISOString(),
});

const mapJournalEntry = (row: JournalEntryRow) => ({
  id: row.id,
  userId: row.user_id,
  text: row.text,
  color: row.color,
  prompt: row.prompt || undefined,
  createdAt: row.created_at || new Date().toISOString(),
  updatedAt: row.updated_at || undefined,
});

// Derived lifecycle phase for the member radar. Open challenges are always
// joinable; scheduled challenges move upcoming → active → ended by their window.
const challengePhase = (row: ChallengeRow): 'open' | 'upcoming' | 'active' | 'ended' => {
  if ((row.challenge_type || 'open') !== 'scheduled') return 'open';
  const now = Date.now();
  const start = row.start_date ? Date.parse(row.start_date) : NaN;
  const end = row.end_date ? Date.parse(row.end_date) : NaN;
  if (!Number.isNaN(start) && now < start) return 'upcoming';
  if (!Number.isNaN(end) && now > end) return 'ended';
  return 'active';
};

const mapChallenge = (row: ChallengeRow) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  duration: row.duration || undefined,
  sourceType: row.source_type || undefined,
  coverUrl: row.cover_url || undefined,
  status: row.status,
  startDate: row.start_date,
  participantsCount: row.participants_count || 0,
  challengeType: (row.challenge_type || 'open') as 'open' | 'scheduled',
  endDate: row.end_date || undefined,
  liveUrl: row.live_url || undefined,
  phase: challengePhase(row),
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined,
});

// D1/SQLite has no "ADD COLUMN IF NOT EXISTS"; add each new challenge column
// idempotently so existing databases gain the community-challenge fields
// without a manual migration. A duplicate-column error means it already exists.
const ensureChallengeColumns = async (db: D1DatabaseBinding) => {
  const columns = [
    "ALTER TABLE challenges ADD COLUMN challenge_type TEXT NOT NULL DEFAULT 'open'",
    'ALTER TABLE challenges ADD COLUMN end_date TEXT',
    'ALTER TABLE challenges ADD COLUMN live_url TEXT',
  ];
  for (const sql of columns) {
    try { await db.prepare(sql).run(); } catch { /* column already present */ }
  }
};

const mapChallengeModule = (row: ChallengeModuleRow) => ({
  id: row.id,
  challengeId: row.challenge_id,
  title: row.title,
  description: row.description,
  content: row.content,
  dayNumber: row.day_number,
  videoUrl: row.video_url || undefined,
  audioUrl: row.audio_url || undefined,
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined,
});

const mapChallengeParticipant = (row: ChallengeParticipantRow) => ({
  challengeId: row.challenge_id,
  userId: row.user_id,
  completedModules: parseTags(row.completed_modules) || [],
  joinedAt: row.joined_at || undefined,
  updatedAt: row.updated_at || undefined,
});

const mapCourse = (row: CourseRow) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  instructor: row.instructor,
  coverUrl: row.cover_url || undefined,
  status: row.status,
  isPremium: Boolean(row.is_premium),
  moduleCount: row.module_count || 0,
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined,
});

const mapCourseModule = (row: CourseModuleRow) => ({
  id: row.id,
  courseId: row.course_id,
  title: row.title,
  description: row.description,
  content: row.content,
  order: row.module_order,
  videoUrl: row.video_url || undefined,
  audioUrl: row.audio_url || undefined,
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined,
});

const mapCourseProgress = (row: CourseProgressRow) => ({
  courseId: row.course_id,
  userId: row.user_id,
  completedModules: parseTags(row.completed_modules) || [],
  lastAccessed: row.last_accessed || undefined,
  updatedAt: row.updated_at || undefined,
});

const mapEvent = (row: EventRow) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  date: row.event_date,
  type: row.type,
  attendeeCount: row.attendee_count,
  streamingPlatform: row.streaming_platform || undefined,
  status: row.status,
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined,
});

const mapPrayerRequest = (row: PrayerRequestRow) => ({
  id: row.id,
  text: row.text,
  author: row.author,
  authorUid: row.author_uid || undefined,
  prayerCount: row.prayer_count || 0,
  testimony: row.testimony || undefined,
  isAnonymous: Boolean(row.is_anonymous),
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined,
});

const mapCommunityMessage = (row: CommunityMessageRow) => ({
  id: row.id,
  userId: row.user_id,
  user: row.user_name,
  text: row.text,
  createdAt: row.created_at || undefined,
});

const mapLiveStreamSettings = (row?: LiveStreamSettingsRow | null) => ({
  status: row?.status || 'offline',
  isLive: row?.status === 'live' && Boolean(row.playback_id),
  playbackId: row?.playback_id || undefined,
  streamId: row?.stream_id || undefined,
  title: row?.title || 'Global Broadcast',
  viewerCount: row?.viewer_count || 0,
  updatedAt: row?.updated_at || undefined,
});

const mapLiveStreamMessage = (row: LiveStreamMessageRow) => ({
  id: row.id,
  userId: row.user_id,
  user: row.user_name,
  text: row.text,
  createdAt: row.created_at || undefined,
});

const mapDevotional = (row: DevotionalRow) => ({
  id: row.id,
  title: row.title,
  description: row.description || row.content,
  content: row.content,
  date: row.devotional_date,
  audioUrl: row.audio_url || undefined,
  status: row.status,
  isPremium: Boolean(row.is_premium),
  price: Number(row.price || 0),
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined,
});

const mapAudiobook = (row: AudiobookRow) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  author: row.author,
  audioUrl: row.audio_url,
  coverUrl: row.cover_url || undefined,
  status: row.status,
  isPremium: Boolean(row.is_premium),
  price: Number(row.price || 0),
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined,
});

const mapBook = (row: BookRow) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  author: row.author,
  fileUrl: row.file_url,
  coverUrl: row.cover_url || undefined,
  status: row.status,
  isPremium: Boolean(row.is_premium),
  price: Number(row.price || 0),
  printEnabled: Boolean(row.print_enabled),
  printCountries: (row.print_countries || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
  printPriceUsd: Number(row.print_price_usd || 0),
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined,
});

// Idempotent column adds for the print edition (D1 has no ADD COLUMN IF NOT
// EXISTS). A duplicate-column error means the column is already present.
const ensureBookPrintColumns = async (db: D1DatabaseBinding) => {
  const stmts = [
    'ALTER TABLE books ADD COLUMN print_enabled INTEGER NOT NULL DEFAULT 0',
    'ALTER TABLE books ADD COLUMN print_countries TEXT',
    'ALTER TABLE books ADD COLUMN print_price_usd REAL NOT NULL DEFAULT 0',
  ];
  for (const sql of stmts) {
    try { await db.prepare(sql).run(); } catch { /* already present */ }
  }
};

// Print-edition waitlist / access-request table. Africa (and other regions far
// from POD hubs) has real book-distribution friction; this captures interest so
// the ministry can arrange shipping or stand up a distribution centre.
const ensureBookPrintRequestsTable = async (db: D1DatabaseBinding) => {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS book_print_requests (
      id TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      book_title TEXT NOT NULL DEFAULT '',
      user_id TEXT,
      name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();
  await db.prepare(
    `CREATE INDEX IF NOT EXISTS idx_book_print_requests_created ON book_print_requests(created_at DESC)`
  ).run();
};

// ISO country → display name for the print availability UI (the common African
// markets first, then a few global ones). Unknown codes fall back to the code.
const COUNTRY_NAMES: Record<string, string> = {
  UG: 'Uganda', KE: 'Kenya', TZ: 'Tanzania', RW: 'Rwanda', NG: 'Nigeria',
  GH: 'Ghana', ZA: 'South Africa', ZM: 'Zambia', US: 'United States',
  GB: 'United Kingdom', CA: 'Canada', AU: 'Australia',
};

const mapNotification = (row: NotificationRow) => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  message: row.message,
  type: row.type,
  read: Boolean(row.read),
  date: row.date || row.created_at || new Date().toISOString(),
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined,
});

const mapGamification = (row: GamificationRow) => ({
  userId: row.user_id,
  stats: {
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    points: row.points,
  },
  unlockedAchievements: parseTags(row.unlocked_achievements) || [],
  updatedAt: row.updated_at || undefined,
});

const mapUser = (row: UserRow) => ({
  id: row.id,
  uid: row.id,
  email: row.email,
  displayName: row.display_name || undefined,
  photoURL: row.photo_url || undefined,
  role: row.role,
  tier: row.tier,
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined,
  lastActiveAt: row.last_active_at || undefined,
});

const mapHouseholdMember = (row: HouseholdMemberRow) => ({
  id: row.id,
  ownerId: row.owner_id,
  name: row.name,
  email: row.email,
  role: row.role,
  status: row.status,
  joinedAt: row.joined_at || undefined,
  invitedAt: row.invited_at || undefined,
  updatedAt: row.updated_at || undefined,
});

const mapGroupMember = (row: GroupMemberRow) => ({
  id: row.id,
  leaderId: row.leader_id,
  name: row.name,
  email: row.email,
  role: row.role,
  status: row.status,
  engagementScore: Number(row.engagement_score || 0),
  lastActiveAt: row.last_active_at || undefined,
  invitedAt: row.invited_at || undefined,
  updatedAt: row.updated_at || undefined,
});

const mapGroupAssignment = (row: GroupAssignmentRow) => ({
  id: row.id,
  leaderId: row.leader_id,
  title: row.title,
  type: row.assignment_type,
  progress: Number(row.progress || 0),
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined,
});

const estimateAiCost = (model = '', units = 0) => {
  const normalized = model.toLowerCase();
  if (normalized.includes('70b')) return (units / 1000) * 0.002;
  if (normalized.includes('8b')) return (units / 1000) * 0.0005;
  return (units / 1000) * 0.001;
};

const mapAiUsage = (row: AiUsageRow) => {
  const model = row.model || '';
  return {
    userId: row.user_id || 'anonymous',
    feature: row.feature,
    model,
    tokens: row.units,
    costEstimate: estimateAiCost(model, row.units),
    timestamp: row.created_at || new Date().toISOString(),
  };
};

const isSafeId = (value: string) => /^[a-zA-Z0-9._:@-]{1,160}$/.test(value);

// Secrets set from Windows shells can arrive with a UTF-8 BOM prefix, which
// makes the Authorization header non-ASCII and Resend reject the key as
// invalid. Strip BOM and stray whitespace at point of use.
const resendKey = (env: Env) => (env.RESEND_API_KEY || '').replace(/^﻿/, '').trim();

const ADMIN_EMAILS = ['pastor.eryeza@gmail.com', 'ccndaily@gmail.com'];

const isAdminRequest = (c: any) => {
  // Admin authority is granted on a verified Firebase ID token (set by the auth middleware) when
  // EITHER (a) the email is a ministry-owner on the bootstrap allowlist — the un-removable founder
  // fallback so the owner can never be locked out — OR (b) the user's stored D1 role is 'admin'
  // (the single source of truth, so in-app promotions actually take effect).
  // The old spoofable x-admin-email + x-admin-token shared-secret scheme and the host-based
  // localhost bypass were removed (host headers are client-supplied).
  const sessionEmail = (c.get('idTokenEmail') || '').toLowerCase();
  if (!sessionEmail || c.get('idTokenEmailVerified') !== true) return false;
  return Boolean(
    ADMIN_EMAILS.includes(sessionEmail) ||
    c.get('idTokenRole') === 'admin',
  );
};

const requireAdmin = (c: any) => {
  if (isAdminRequest(c)) return null;
  return c.json({
    error: 'ADMIN_AUTH_REQUIRED',
    message:
      'Admin actions require a verified ministry-owner session. Sign in with an admin account so the request carries a valid Firebase ID token.',
  }, 401);
};

// ─── Abuse protection: durable rate limiting + Turnstile ─────────────────────
// Rate limits are stored in D1 (fixed-window counters) so they survive isolate
// recycling and apply across all edge locations sharing the database. The table
// self-provisions like the other ensure* tables, so deploys never depend on a
// separate schema apply.

const ensureRateLimitTable = async (db: D1DatabaseBinding) => {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS rate_limit_hits (
      scope TEXT NOT NULL,
      bucket_key TEXT NOT NULL,
      window_start INTEGER NOT NULL,
      hits INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (scope, bucket_key, window_start)
    )`
  ).run();
};

const requestIp = (c: any) =>
  c.req.header('CF-Connecting-IP') || c.req.header('x-forwarded-for') || 'unknown';

// Returns null when the request is allowed, or a 429 JSON response when the
// fixed-window limit is exceeded. Fails open (allows) if D1 is unavailable so
// an infrastructure hiccup never blocks legitimate ministry traffic.
const enforceRateLimit = async (
  c: any,
  scope: string,
  key: string,
  limit: number,
  windowSeconds: number,
) => {
  const db: D1DatabaseBinding | undefined = c.env.DB;
  if (!db) return null;

  try {
    await ensureRateLimitTable(db);
    const nowSeconds = Math.floor(Date.now() / 1000);
    const windowStart = Math.floor(nowSeconds / windowSeconds) * windowSeconds;

    const row = await db.prepare(
      `INSERT INTO rate_limit_hits (scope, bucket_key, window_start, hits)
       VALUES (?, ?, ?, 1)
       ON CONFLICT(scope, bucket_key, window_start) DO UPDATE SET hits = hits + 1
       RETURNING hits`
    ).bind(scope, key, windowStart).first<{ hits: number }>();

    // Opportunistic cleanup of expired windows (~5% of requests).
    if (Math.random() < 0.05) {
      await db.prepare(
        `DELETE FROM rate_limit_hits WHERE window_start < ?`
      ).bind(nowSeconds - windowSeconds * 2).run();
    }

    if (Number(row?.hits || 0) > limit) {
      const retryAfter = windowStart + windowSeconds - nowSeconds;
      return c.json(
        { error: 'Too many requests. Please wait a moment and try again.' },
        429,
        { 'Retry-After': String(Math.max(1, retryAfter)) },
      );
    }
  } catch (error) {
    console.error('Rate limit check failed', error);
  }

  return null;
};

// Verifies a Cloudflare Turnstile token when TURNSTILE_SECRET_KEY is configured.
// When the secret is not set (e.g. before the widget is provisioned in the
// dashboard) verification is skipped so the route keeps working — rate limiting
// above remains the durable floor either way.
const verifyTurnstile = async (c: any, token: unknown): Promise<boolean> => {
  const secret = c.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== 'string' || !token) return false;

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: requestIp(c) }),
    });
    const outcome = await response.json() as { success?: boolean };
    return outcome.success === true;
  } catch (error) {
    console.error('Turnstile verification failed', error);
    return false;
  }
};

// SECURITY (C-2): Ensure the authenticated user can only read/write their own data.
// Returns null (allow) when the token UID matches the requested userId.
// Returns 401 when no token is present, 403 when a different user's token is present.
const requireSelf = (c: any, userId: string) => {
  const tokenUid = c.get('idTokenUid');
  if (tokenUid === userId) return null;
  return c.json({ error: 'forbidden' }, tokenUid ? 403 : 401);
};

const isLocalPreviewRequest = (c: any) => {
  // Preview auth must be EXPLICITLY opted in via an env var that is set ONLY in local
  // .dev.vars (never in production). Do NOT trust the Host header (spoofable) or CF_PAGES
  // (set on production deployments too) — that allowed forging an admin session in prod.
  return c.env.PREVIEW_AUTH === 'enabled';
};

const decodeXml = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

const tag = (xml: string, name: string) => {
  const match = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i').exec(xml);
  return match ? decodeXml(match[1]) : '';
};

const attr = (xml: string, name: string, attrName: string) => {
  const match = new RegExp(`<${name}[^>]*\\s${attrName}=["']([^"']*)["']`, 'i').exec(xml);
  return match ? decodeXml(match[1]) : '';
};

const stripTags = (value: string) => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const isoDate = (value: string) => {
  if (!value) return '';
  const time = Date.parse(value);
  return Number.isNaN(time) ? '' : new Date(time).toISOString();
};

const extractAiText = (result: any) => {
  if (!result) return '';
  if (typeof result === 'string') return result;
  if (typeof result.response === 'string') return result.response;
  if (typeof result.text === 'string') return result.text;
  if (typeof result.result?.response === 'string') return result.result.response;
  if (Array.isArray(result.choices) && typeof result.choices[0]?.message?.content === 'string') {
    return result.choices[0].message.content;
  }
  return '';
};

const fallbackAiText = (feature: string, prompt: string) => {
  if (feature === 'tags') return JSON.stringify(['Reflection', 'Prayer', 'Growth']);
  if (feature === 'groundedPrayer') {
    return JSON.stringify([
      {
        title: 'Pray for leaders under pressure',
        uri: 'https://theccndaily.com',
        snippet: 'Ask God for wisdom, restraint, and courage for people carrying public responsibility.',
      },
      {
        title: 'Pray for families carrying hidden burdens',
        uri: 'https://theccndaily.com',
        snippet: 'Remember households navigating grief, financial strain, loneliness, and uncertainty.',
      },
      {
        title: 'Pray for workers seeking integrity',
        uri: 'https://theccndaily.com',
        snippet: 'Pray for Christians to serve with excellence without losing the life of God within them.',
      },
    ]);
  }
  if (feature === 'devotional') {
    return JSON.stringify({
      title: 'Grace for the Work in Front of You',
      openingVerse: 'Colossians 3:23, NKJV',
      body:
        'God meets you in the ordinary work of the day. Bring him your tasks, your limits, and your decisions. Let prayer steady your attention before pressure names your worth.',
      prayer:
        'Father, I receive grace for the work in front of me. Teach me to serve with a quiet heart, clear judgment, and faithful love. Amen.',
      declaration: 'I will walk with God in the middle of my responsibilities.',
      furtherStudy: ['Colossians 3:23', 'Psalm 90:17', 'James 1:5'],
    });
  }
  if (feature === 'deepStudy') {
    return 'Cloudflare Workers AI is not configured in this preview. The question has been received, but production theological generation requires the AI binding.';
  }
  return `Cloudflare Workers AI is not configured in this preview. Your prompt was received: ${prompt.slice(0, 180)}`;
};

const parseRss = (xml: string) => {
  const channel = /<channel>([\s\S]*?)<\/channel>/i.exec(xml)?.[1] ?? xml;
  const channelMeta = channel.replace(/<item[\s\S]*?<\/item>/gi, '');
  const items: Array<Record<string, unknown>> = [];
  const itemRx = /<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi;
  let itemMatch: RegExpExecArray | null;

  while ((itemMatch = itemRx.exec(channel)) !== null) {
    const item = itemMatch[1];
    const enclosureUrl = attr(item, 'enclosure', 'url');
    const enclosureType = attr(item, 'enclosure', 'type');
    const enclosureLength = attr(item, 'enclosure', 'length');
    const image = attr(item, 'itunes:image', 'href');
    const duration = tag(item, 'itunes:duration');
    const summary = tag(item, 'itunes:summary');
    const content = tag(item, 'content:encoded') || tag(item, 'description');
    const pubDate = tag(item, 'pubDate');
    items.push({
      title: tag(item, 'title'),
      link: tag(item, 'link'),
      guid: tag(item, 'guid'),
      pubDate,
      creator: tag(item, 'dc:creator') || tag(item, 'itunes:author') || tag(item, 'author'),
      content,
      contentSnippet: stripTags(content).slice(0, 500),
      enclosure: enclosureUrl ? { url: enclosureUrl, type: enclosureType, length: enclosureLength } : undefined,
      itunes: { duration, image, summary },
      isoDate: isoDate(pubDate),
    });
  }

  return {
    title: tag(channelMeta, 'title'),
    description: tag(channelMeta, 'description'),
    link: tag(channelMeta, 'link'),
    image: tag(tag(channelMeta, 'image'), 'url') || attr(channelMeta, 'itunes:image', 'href'),
    items,
  };
};

const isAllowedRemoteFeed = (url: URL) => {
  if (!['https:', 'http:'].includes(url.protocol)) return false;
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) return false;
  return true;
};

app.get('/api/health', (c) =>
  c.json({
    status: 'ok',
    app: 'project-phoenix',
    runtime: 'cloudflare-pages',
    firebaseProjectConfigured: Boolean(c.env.FIREBASE_PROJECT_ID),
  })
);

app.get('/api/ai/diagnostics', (c) =>
  // Return only non-sensitive status fields. Internal infra details
  // (provider implementation, production origin) are intentionally omitted.
  c.json({
    cloudflarePages: 'connected',
    database: c.env.DB ? 'connected' : 'missing',
    workersAi: c.env.AI ? 'connected' : 'fallback',
    mediaBucket: c.env.MEDIA_BUCKET ? 'connected' : 'missing',
    apiKeySource: 'cloudflare-binding',
    model: c.env.WORKERS_AI_TEXT_MODEL || '@cf/meta/llama-3.1-8b-instruct',
  })
);

app.post('/api/ai/generate', async (c) => {
  // SECURITY (H-2): Require a verified Firebase ID token to prevent unauthenticated
  // cost-abuse. Signed-in users get their UID from the auth middleware set above.
  if (!c.get('idTokenUid')) return c.json({ error: 'Authentication required' }, 401);

  // Per-user quota: caps Workers AI cost even from signed-in accounts.
  const limited = await enforceRateLimit(c, 'ai-generate', String(c.get('idTokenUid')), 30, 600);
  if (limited) return limited;

  const body = await c.req.json();
  const feature = String(body.feature || 'general').trim();
  const prompt = String(body.prompt || '').trim();
  const systemInstruction = String(body.systemInstruction || '').trim();
  const history = Array.isArray(body.history) ? body.history.slice(-12) : [];
  const userId = String(body.userId || 'anonymous');
  const model = String(
    body.model ||
    c.env.WORKERS_AI_TEXT_MODEL ||
    '@cf/meta/llama-3.1-8b-instruct'
  );

  if (!prompt && history.length === 0) return c.json({ error: 'prompt is required' }, 400);

  let text = '';
  let provider = 'cloudflare-workers-ai';
  let fallback = false;

  if (c.env.AI?.run) {
    const messages = [
      ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
      ...history.map((message: any) => ({
        role: message.role === 'assistant' || message.role === 'model' ? 'assistant' : 'user',
        content: String(message.content || message.text || ''),
      })).filter((message: any) => message.content),
      ...(prompt ? [{ role: 'user', content: prompt }] : []),
    ];

    // Workers AI defaults to a small output budget (~256 tokens), which
    // truncates long generations (devotionals) mid-JSON. The client's `units`
    // hint doubles as the output budget, bounded to keep costs sane.
    const maxTokens = Math.max(256, Math.min(4096, Number(body.maxTokens || body.units || 1024)));

    try {
      const result = await c.env.AI.run(model, { messages, max_tokens: maxTokens });
      text = extractAiText(result);
    } catch (error) {
      console.error('Workers AI generation failed', error);
      text = fallbackAiText(feature, prompt);
      fallback = true;
      provider = 'cloudflare-workers-ai-fallback';
    }
  } else {
    text = fallbackAiText(feature, prompt);
    fallback = true;
    provider = 'cloudflare-workers-ai-fallback';
  }

  const units = Number(body.units || Math.ceil((prompt.length + text.length) / 4) || 0);
  if (c.env.DB) {
    await c.env.DB.prepare(
      `INSERT INTO ai_usage_events (id, user_id, feature, provider, model, units, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).bind(
      crypto.randomUUID(),
      userId,
      feature,
      provider,
      model,
      units,
      JSON.stringify({ fallback })
    ).run();
  }

  return c.json({ text, model, provider, fallback });
});

app.post('/api/ai/usage', async (c) => {
  if (!c.env.DB) return c.json({ ok: true, source: 'fallback' });

  const body = await c.req.json();
  const userId = String(body.userId || 'anonymous').trim();
  const feature = String(body.feature || 'general').trim();
  const model = String(body.model || 'unknown').trim();
  const units = Math.max(0, Number(body.tokens || body.units || 0));

  await c.env.DB.prepare(
    `INSERT INTO ai_usage_events (id, user_id, feature, provider, model, units, metadata, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).bind(
    crypto.randomUUID(),
    userId,
    feature,
    'cloudflare-workers-ai',
    model,
    units,
    JSON.stringify({ source: 'client-usage-log' })
  ).run();

  return c.json({ ok: true, source: 'd1' });
});

app.get('/api/ai/usage', async (c) => {
  if (!c.env.DB) return c.json({ totalCost: 0, featureBreakdown: {}, recentLogs: [], source: 'fallback' });

  const days = Math.max(1, Math.min(365, Number(c.req.query('days') || 30)));
  const result = await c.env.DB.prepare(
    `SELECT * FROM ai_usage_events
     WHERE datetime(created_at) >= datetime('now', ?)
     ORDER BY created_at DESC
     LIMIT 1000`
  ).bind(`-${days} days`).all<AiUsageRow>();

  const recentLogs = result.results.map(mapAiUsage);
  const totalCost = recentLogs.reduce((sum, log) => sum + (log.costEstimate || 0), 0);
  const featureBreakdown = recentLogs.reduce<Record<string, number>>((acc, log) => {
    acc[log.feature] = (acc[log.feature] || 0) + (log.costEstimate || 0);
    return acc;
  }, {});

  return c.json({ totalCost, featureBreakdown, recentLogs, source: 'd1' });
});

app.get('/api/rss', async (c) => {
  const rawUrl = c.req.query('url');
  if (!rawUrl) return c.json({ error: 'Missing url parameter' }, 400);

  let feedUrl: URL;
  try {
    feedUrl = new URL(rawUrl);
  } catch {
    return c.json({ error: 'Invalid url parameter' }, 400);
  }

  if (!isAllowedRemoteFeed(feedUrl)) {
    return c.json({ error: 'RSS feed host is not allowed' }, 400);
  }

  try {
    const response = await fetch(feedUrl.toString(), {
      headers: { 'User-Agent': 'The-CCN-Daily-RSS/1.0' },
    });
    if (!response.ok) {
      return c.json({ error: 'Failed to fetch RSS feed', status: response.status }, 502);
    }

    const xml = await response.text();
    return c.json(parseRss(xml));
  } catch {
    return c.json({ error: 'Failed to fetch or parse RSS feed' }, 500);
  }
});

app.get('/api/blog/posts', async (c) => {
  if (!c.env.DB) {
    return c.json({ posts: fallbackPosts.map(mapPost), source: 'fallback' });
  }

  const result = await c.env.DB.prepare(
    `SELECT * FROM blog_posts
     WHERE status = 'published'
     ORDER BY COALESCE(published_at, created_at) DESC`
  ).all<BlogPostRow>();

  return c.json({ posts: result.results.map(mapPost), source: 'd1' });
});

app.get('/api/blog/posts/:slug', async (c) => {
  const slug = c.req.param('slug');
  const fallback = fallbackPosts.find((post) => post.slug === slug && post.status === 'published');

  if (!c.env.DB) {
    if (!fallback) return c.json({ error: 'Post not found' }, 404);
    return c.json({ post: mapPost(fallback), source: 'fallback' });
  }

  const post = await c.env.DB.prepare(
    `SELECT * FROM blog_posts WHERE slug = ? AND status = 'published' LIMIT 1`
  ).bind(slug).first<BlogPostRow>();

  if (!post) return c.json({ error: 'Post not found' }, 404);
  return c.json({ post: mapPost(post), source: 'd1' });
});

app.get('/api/admin/blog/posts', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  if (!c.env.DB) return c.json({ posts: fallbackPosts.map(mapPost), source: 'fallback' });

  const result = await c.env.DB.prepare(
    `SELECT * FROM blog_posts ORDER BY updated_at DESC, created_at DESC`
  ).all<BlogPostRow>();

  return c.json({ posts: result.results.map(mapPost), source: 'd1' });
});

app.post('/api/admin/blog/posts', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const title = String(body.title || '').trim();
  if (!title) return c.json({ error: 'Title is required' }, 400);

  const id = String(body.id || crypto.randomUUID());
  const slug = slugify(String(body.slug || title));
  const status = ['draft', 'published', 'archived'].includes(body.status) ? body.status : 'draft';
  const publishedAt = status === 'published'
    ? String(body.publishedAt || new Date().toISOString())
    : body.publishedAt || null;

  await c.env.DB.prepare(
    `INSERT INTO blog_posts (
      id, slug, title, excerpt, content, category, status, author_name,
      audio_url, seo_title, seo_description, published_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      slug = excluded.slug,
      title = excluded.title,
      excerpt = excluded.excerpt,
      content = excluded.content,
      category = excluded.category,
      status = excluded.status,
      author_name = excluded.author_name,
      audio_url = excluded.audio_url,
      seo_title = excluded.seo_title,
      seo_description = excluded.seo_description,
      published_at = excluded.published_at,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(
    id,
    slug,
    title,
    String(body.excerpt || '').trim(),
    String(body.content || '').trim(),
    String(body.category || 'Devotional life').trim(),
    status,
    String(body.authorName || 'THE CCN DAILY').trim(),
    body.audioUrl || null,
    body.seoTitle || null,
    body.seoDescription || null,
    publishedAt
  ).run();

  const post = await c.env.DB.prepare(`SELECT * FROM blog_posts WHERE id = ? LIMIT 1`)
    .bind(id)
    .first<BlogPostRow>();

  return c.json({ post: post ? mapPost(post) : null });
});

app.delete('/api/admin/blog/posts/:id', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const id = c.req.param('id');
  const existing = await c.env.DB.prepare(`SELECT id FROM blog_posts WHERE id = ? LIMIT 1`).bind(id).first<{ id: string }>();
  if (!existing) return c.json({ error: 'Post not found' }, 404);

  await c.env.DB.prepare(`DELETE FROM blog_posts WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});

app.get('/api/challenges', async (c) => {
  if (!c.env.DB) return c.json({ challenges: [], source: 'fallback' });

  // Public route always returns published challenges only.
  // Draft listing is handled by authenticated admin routes.
  const result = await c.env.DB.prepare(
    `SELECT * FROM challenges WHERE status = 'published' ORDER BY start_date DESC, created_at DESC`
  ).all<ChallengeRow>();

  return c.json({ challenges: result.results.map(mapChallenge), source: 'd1' });
});

app.get('/api/challenges/:id', async (c) => {
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid challenge id' }, 400);
  if (!c.env.DB) return c.json({ error: 'Challenge not found' }, 404);

  const challenge = await c.env.DB.prepare(
    `SELECT * FROM challenges WHERE id = ? LIMIT 1`
  ).bind(id).first<ChallengeRow>();

  if (!challenge) return c.json({ error: 'Challenge not found' }, 404);

  const modules = await c.env.DB.prepare(
    `SELECT * FROM challenge_modules WHERE challenge_id = ? ORDER BY day_number ASC`
  ).bind(id).all<ChallengeModuleRow>();

  const userId = c.req.query('userId') || '';
  let participant = null;
  if (userId && isSafeId(userId)) {
    const row = await c.env.DB.prepare(
      `SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ? LIMIT 1`
    ).bind(id, userId).first<ChallengeParticipantRow>();
    participant = row ? mapChallengeParticipant(row) : null;
  }

  return c.json({
    challenge: mapChallenge(challenge),
    modules: modules.results.map(mapChallengeModule),
    participant,
    source: 'd1',
  });
});

app.get('/api/challenges/:id/modules', async (c) => {
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid challenge id' }, 400);
  if (!c.env.DB) return c.json({ modules: [], source: 'fallback' });

  const result = await c.env.DB.prepare(
    `SELECT * FROM challenge_modules WHERE challenge_id = ? ORDER BY day_number ASC`
  ).bind(id).all<ChallengeModuleRow>();

  return c.json({ modules: result.results.map(mapChallengeModule), source: 'd1' });
});

app.get('/api/challenges/:id/modules/:moduleId', async (c) => {
  const id = c.req.param('id');
  const moduleId = c.req.param('moduleId');
  if (!isSafeId(id) || !isSafeId(moduleId)) return c.json({ error: 'Invalid challenge module identifier' }, 400);
  if (!c.env.DB) return c.json({ error: 'Module not found' }, 404);

  const module = await c.env.DB.prepare(
    `SELECT * FROM challenge_modules WHERE challenge_id = ? AND id = ? LIMIT 1`
  ).bind(id, moduleId).first<ChallengeModuleRow>();

  if (!module) return c.json({ error: 'Module not found' }, 404);

  const userId = c.req.query('userId') || '';
  let completed = false;
  if (userId && isSafeId(userId)) {
    const participant = await c.env.DB.prepare(
      `SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ? LIMIT 1`
    ).bind(id, userId).first<ChallengeParticipantRow>();
    const completedModules = participant ? parseTags(participant.completed_modules) || [] : [];
    completed = completedModules.includes(moduleId);
  }

  return c.json({ module: mapChallengeModule(module), completed, source: 'd1' });
});

app.post('/api/challenges/:id/participants', async (c) => {
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid challenge id' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const userId = String(body.userId || '').trim();
  if (!isSafeId(userId)) return c.json({ error: 'Valid userId is required' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;

  const existing = await c.env.DB.prepare(
    `SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ? LIMIT 1`
  ).bind(id, userId).first<ChallengeParticipantRow>();

  await c.env.DB.prepare(
    `INSERT INTO challenge_participants (challenge_id, user_id, completed_modules, joined_at, updated_at)
     VALUES (?, ?, '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(challenge_id, user_id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`
  ).bind(id, userId).run();

  if (!existing) {
    await c.env.DB.prepare(
      `UPDATE challenges
       SET participants_count = participants_count + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(id).run();
  }

  const participant = await c.env.DB.prepare(
    `SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ? LIMIT 1`
  ).bind(id, userId).first<ChallengeParticipantRow>();
  const challenge = await c.env.DB.prepare(
    `SELECT * FROM challenges WHERE id = ? LIMIT 1`
  ).bind(id).first<ChallengeRow>();

  return c.json({
    participant: participant ? mapChallengeParticipant(participant) : null,
    challenge: challenge ? mapChallenge(challenge) : null,
  });
});

app.post('/api/challenges/:id/modules/:moduleId/complete', async (c) => {
  const id = c.req.param('id');
  const moduleId = c.req.param('moduleId');
  if (!isSafeId(id) || !isSafeId(moduleId)) return c.json({ error: 'Invalid challenge module identifier' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const userId = String(body.userId || '').trim();
  if (!isSafeId(userId)) return c.json({ error: 'Valid userId is required' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;

  const participant = await c.env.DB.prepare(
    `SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ? LIMIT 1`
  ).bind(id, userId).first<ChallengeParticipantRow>();

  const completedModules = participant ? parseTags(participant.completed_modules) || [] : [];
  const nextCompleted = Array.from(new Set([...completedModules, moduleId]));

  await c.env.DB.prepare(
    `INSERT INTO challenge_participants (challenge_id, user_id, completed_modules, joined_at, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(challenge_id, user_id) DO UPDATE SET
       completed_modules = excluded.completed_modules,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(id, userId, JSON.stringify(nextCompleted)).run();

  const updated = await c.env.DB.prepare(
    `SELECT * FROM challenge_participants WHERE challenge_id = ? AND user_id = ? LIMIT 1`
  ).bind(id, userId).first<ChallengeParticipantRow>();

  return c.json({ participant: updated ? mapChallengeParticipant(updated) : null });
});

// GET /api/challenges/:id/progress
// Shared progress for everyone walking the challenge together: a roster of
// participants with their completion percentage, so the community can see and
// spur one another on. Names come from the D1 users table; anonymous if absent.
app.get('/api/challenges/:id/progress', async (c) => {
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid challenge id' }, 400);
  if (!c.env.DB) return c.json({ participants: [], moduleCount: 0, source: 'fallback' });

  const moduleCountRow = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM challenge_modules WHERE challenge_id = ?`
  ).bind(id).first<{ count: number }>();
  const moduleCount = Number(moduleCountRow?.count || 0);

  const rows = await c.env.DB.prepare(
    `SELECT p.user_id, p.completed_modules, p.joined_at, u.display_name
     FROM challenge_participants p
     LEFT JOIN users u ON u.id = p.user_id
     WHERE p.challenge_id = ?
     ORDER BY p.joined_at ASC
     LIMIT 500`
  ).bind(id).all<{ user_id: string; completed_modules: string; joined_at: string; display_name?: string | null }>();

  const participants = rows.results.map((row) => {
    const done = (parseTags(row.completed_modules) || []).length;
    return {
      userId: row.user_id,
      name: row.display_name || 'Community member',
      completed: done,
      percent: moduleCount > 0 ? Math.min(100, Math.round((done / moduleCount) * 100)) : 0,
      joinedAt: row.joined_at,
    };
  }).sort((a, b) => b.percent - a.percent);

  return c.json({ participants, moduleCount, source: 'd1' });
});

// POST /api/challenges/:id/invite
// Any signed-in participant can invite a friend to walk the challenge with
// them. Best-effort email via Resend; rate-limited to prevent abuse.
app.post('/api/challenges/:id/invite', async (c) => {
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid challenge id' }, 400);
  if (!c.get('idTokenUid')) return c.json({ error: 'Authentication required' }, 401);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const limited = await enforceRateLimit(c, 'challenge-invite', String(c.get('idTokenUid')), 20, 3600);
  if (limited) return limited;

  const body = await c.req.json().catch(() => ({} as Record<string, unknown>));
  const email = String(body.email || '').trim().toLowerCase();
  if (!email || !isValidEmail(email)) return c.json({ error: 'Valid email is required' }, 400);

  const challenge = await c.env.DB.prepare(
    `SELECT * FROM challenges WHERE id = ? AND status = 'published' LIMIT 1`
  ).bind(id).first<ChallengeRow>();
  if (!challenge) return c.json({ error: 'Challenge not found' }, 404);

  let emailSent = false;
  const inviterEmail = String(c.get('idTokenEmail') || '').trim();
  let inviterLabel = inviterEmail;
  try {
    const inviter = await c.env.DB.prepare(
      `SELECT display_name FROM users WHERE id = ? LIMIT 1`
    ).bind(String(c.get('idTokenUid'))).first<{ display_name?: string | null }>();
    if (inviter?.display_name) inviterLabel = inviter.display_name;
  } catch { /* cosmetic */ }

  if (resendKey(c.env)) {
    const origin = c.env.PRODUCTION_ORIGIN || 'https://theccndaily.com';
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey(c.env)}` },
        body: JSON.stringify({
          from: 'THE CCN DAILY <gifts@updates.theccndaily.com>',
          to: [email],
          subject: `You're invited to a CCN Daily challenge`,
          html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#1a1210;color:#f0ebe4;padding:40px 32px;border-radius:12px">
            <h2 style="color:#F27D26;font-size:22px;margin-bottom:8px">Walk this with me.</h2>
            <p>${sanitizeInput(inviterLabel) || 'A friend'} invited you to join the <strong>${sanitizeInput(challenge.title)}</strong> challenge on THE CCN DAILY.</p>
            <p style="color:#c8b89a">${sanitizeInput(String(challenge.description || '').slice(0, 200))}</p>
            <p><a href="${origin}/#/app/challenges/${encodeURIComponent(id)}" style="display:inline-block;margin-top:12px;padding:12px 24px;background:#F27D26;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:bold">Join the challenge</a></p>
            <p style="margin-top:32px;font-size:12px;color:#7a6a60">THE CCN DAILY — theccndaily.com</p>
          </div>`,
        }),
      });
      emailSent = res.ok;
    } catch { /* best-effort */ }
  }

  return c.json({ ok: true, emailSent });
});

app.post('/api/admin/challenges', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const title = String(body.title || '').trim();
  if (!title) return c.json({ error: 'Title is required' }, 400);

  const id = String(body.id || `challenge-${slugify(title)}-${Date.now()}`);
  if (!isSafeId(id)) return c.json({ error: 'Invalid challenge id' }, 400);
  const status = ['draft', 'published', 'archived'].includes(body.status) ? body.status : 'published';
  const challengeType = body.challengeType === 'scheduled' ? 'scheduled' : 'open';
  // Open challenges have no window; scheduled ones carry start/end.
  const endDate = challengeType === 'scheduled' && body.endDate ? String(body.endDate) : null;
  const liveUrl = typeof body.liveUrl === 'string' && body.liveUrl.trim() ? body.liveUrl.trim() : null;

  await ensureChallengeColumns(c.env.DB);

  await c.env.DB.prepare(
    `INSERT INTO challenges (
      id, title, description, duration, source_type, cover_url, status, start_date,
      participants_count, challenge_type, end_date, live_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      duration = excluded.duration,
      source_type = excluded.source_type,
      cover_url = excluded.cover_url,
      status = excluded.status,
      start_date = excluded.start_date,
      participants_count = excluded.participants_count,
      challenge_type = excluded.challenge_type,
      end_date = excluded.end_date,
      live_url = excluded.live_url,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(
    id,
    title,
    String(body.description || '').trim(),
    body.duration || null,
    body.sourceType || null,
    body.coverUrl || null,
    status,
    body.startDate || new Date().toISOString(),
    Number(body.participantsCount || body.participants || 0),
    challengeType,
    endDate,
    liveUrl
  ).run();

  const curriculum = Array.isArray(body.curriculum) ? body.curriculum : [];
  const tasks = Array.isArray(body.tasks) ? body.tasks : [];
  const modules = curriculum.length
    ? curriculum
    : tasks.map((task: string, idx: number) => ({
      day: idx + 1,
      title: `Day ${idx + 1}`,
      content: task,
      task,
    }));

  for (const item of modules.slice(0, 80)) {
    const dayNumber = Number(item.day || item.dayNumber || modules.indexOf(item) + 1);
    const moduleTitle = String(item.title || `Day ${dayNumber}`).trim();
    const moduleId = String(item.id || `${id}-day-${dayNumber}`);
    if (!isSafeId(moduleId)) continue;

    await c.env.DB.prepare(
      `INSERT INTO challenge_modules (
        id, challenge_id, title, description, content, day_number, video_url, audio_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(challenge_id, id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        content = excluded.content,
        day_number = excluded.day_number,
        video_url = excluded.video_url,
        audio_url = excluded.audio_url,
        updated_at = CURRENT_TIMESTAMP`
    ).bind(
      moduleId,
      id,
      moduleTitle,
      String(item.description || item.task || '').trim(),
      String(item.content || item.task || '').trim(),
      dayNumber,
      item.videoUrl || null,
      item.audioUrl || null
    ).run();
  }

  const challenge = await c.env.DB.prepare(
    `SELECT * FROM challenges WHERE id = ? LIMIT 1`
  ).bind(id).first<ChallengeRow>();

  return c.json({ challenge: challenge ? mapChallenge(challenge) : null });
});

app.post('/api/admin/challenges/:id/modules', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  const challengeId = c.req.param('id');
  if (!isSafeId(challengeId)) return c.json({ error: 'Invalid challenge id' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const title = String(body.title || '').trim();
  if (!title) return c.json({ error: 'Title is required' }, 400);
  const dayNumber = Math.max(1, Number(body.dayNumber || 1));
  const id = String(body.id || `${challengeId}-day-${dayNumber}`);
  if (!isSafeId(id)) return c.json({ error: 'Invalid module id' }, 400);

  await c.env.DB.prepare(
    `INSERT INTO challenge_modules (
      id, challenge_id, title, description, content, day_number, video_url, audio_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(challenge_id, id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      content = excluded.content,
      day_number = excluded.day_number,
      video_url = excluded.video_url,
      audio_url = excluded.audio_url,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(
    id,
    challengeId,
    title,
    String(body.description || '').trim(),
    String(body.content || '').trim(),
    dayNumber,
    body.videoUrl || null,
    body.audioUrl || null
  ).run();

  const module = await c.env.DB.prepare(
    `SELECT * FROM challenge_modules WHERE challenge_id = ? AND id = ? LIMIT 1`
  ).bind(challengeId, id).first<ChallengeModuleRow>();

  return c.json({ module: module ? mapChallengeModule(module) : null });
});

app.delete('/api/admin/challenges/:id/modules/:moduleId', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  const challengeId = c.req.param('id');
  const moduleId = c.req.param('moduleId');
  if (!isSafeId(challengeId) || !isSafeId(moduleId)) return c.json({ error: 'Invalid module identifier' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  await c.env.DB.prepare(
    `DELETE FROM challenge_modules WHERE challenge_id = ? AND id = ?`
  ).bind(challengeId, moduleId).run();

  return c.json({ ok: true });
});

app.get('/api/courses', async (c) => {
  if (!c.env.DB) return c.json({ courses: [], source: 'fallback' });

  // Public route always returns published courses only.
  // Draft listing is handled by authenticated admin routes.
  const result = await c.env.DB.prepare(
    `SELECT * FROM courses WHERE status = 'published' ORDER BY created_at DESC`
  ).all<CourseRow>();

  return c.json({ courses: result.results.map(mapCourse), source: 'd1' });
});

app.get('/api/courses/:id', async (c) => {
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid course id' }, 400);
  if (!c.env.DB) return c.json({ error: 'Course not found' }, 404);

  const course = await c.env.DB.prepare(
    `SELECT * FROM courses WHERE id = ? LIMIT 1`
  ).bind(id).first<CourseRow>();

  if (!course) return c.json({ error: 'Course not found' }, 404);

  const modules = await c.env.DB.prepare(
    `SELECT * FROM course_modules WHERE course_id = ? ORDER BY module_order ASC`
  ).bind(id).all<CourseModuleRow>();

  const userId = c.req.query('userId') || '';
  let progress = null;
  if (userId && isSafeId(userId)) {
    const row = await c.env.DB.prepare(
      `SELECT * FROM course_progress WHERE course_id = ? AND user_id = ? LIMIT 1`
    ).bind(id, userId).first<CourseProgressRow>();
    progress = row ? mapCourseProgress(row) : null;
  }

  return c.json({
    course: mapCourse(course),
    modules: modules.results.map(mapCourseModule),
    progress,
    source: 'd1',
  });
});

app.get('/api/courses/:id/modules', async (c) => {
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid course id' }, 400);
  if (!c.env.DB) return c.json({ modules: [], source: 'fallback' });

  const result = await c.env.DB.prepare(
    `SELECT * FROM course_modules WHERE course_id = ? ORDER BY module_order ASC`
  ).bind(id).all<CourseModuleRow>();

  return c.json({ modules: result.results.map(mapCourseModule), source: 'd1' });
});

app.post('/api/courses/:id/modules/:moduleId/complete', async (c) => {
  const courseId = c.req.param('id');
  const moduleId = c.req.param('moduleId');
  if (!isSafeId(courseId) || !isSafeId(moduleId)) return c.json({ error: 'Invalid course module identifier' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const userId = String(body.userId || '').trim();
  if (!isSafeId(userId)) return c.json({ error: 'Valid userId is required' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;

  const existing = await c.env.DB.prepare(
    `SELECT * FROM course_progress WHERE course_id = ? AND user_id = ? LIMIT 1`
  ).bind(courseId, userId).first<CourseProgressRow>();

  const completedModules = existing ? parseTags(existing.completed_modules) || [] : [];
  const nextCompleted = Array.from(new Set([...completedModules, moduleId]));

  await c.env.DB.prepare(
    `INSERT INTO course_progress (course_id, user_id, completed_modules, last_accessed, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(course_id, user_id) DO UPDATE SET
       completed_modules = excluded.completed_modules,
       last_accessed = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(courseId, userId, JSON.stringify(nextCompleted)).run();

  const updated = await c.env.DB.prepare(
    `SELECT * FROM course_progress WHERE course_id = ? AND user_id = ? LIMIT 1`
  ).bind(courseId, userId).first<CourseProgressRow>();

  return c.json({ progress: updated ? mapCourseProgress(updated) : null });
});

app.post('/api/admin/courses', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const title = String(body.title || '').trim();
  if (!title) return c.json({ error: 'Title is required' }, 400);

  const id = String(body.id || `course-${slugify(title)}-${Date.now()}`);
  if (!isSafeId(id)) return c.json({ error: 'Invalid course id' }, 400);
  const status = ['draft', 'published', 'archived'].includes(body.status) ? body.status : 'published';

  await c.env.DB.prepare(
    `INSERT INTO courses (
      id, title, description, instructor, cover_url, status, is_premium, module_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      instructor = excluded.instructor,
      cover_url = excluded.cover_url,
      status = excluded.status,
      is_premium = excluded.is_premium,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(
    id,
    title,
    String(body.description || '').trim(),
    String(body.instructor || 'THE CCN DAILY').trim(),
    body.coverUrl || null,
    status,
    body.isPremium ? 1 : 0,
    Math.max(0, Number(body.moduleCount || 0)),
    body.createdAt || null
  ).run();

  const course = await c.env.DB.prepare(
    `SELECT * FROM courses WHERE id = ? LIMIT 1`
  ).bind(id).first<CourseRow>();

  return c.json({ course: course ? mapCourse(course) : null });
});

app.post('/api/admin/courses/:id/modules', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  const courseId = c.req.param('id');
  if (!isSafeId(courseId)) return c.json({ error: 'Invalid course id' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const title = String(body.title || '').trim();
  if (!title) return c.json({ error: 'Title is required' }, 400);
  const order = Math.max(1, Number(body.order || 1));
  const id = String(body.id || `${courseId}-module-${order}`);
  if (!isSafeId(id)) return c.json({ error: 'Invalid module id' }, 400);

  await c.env.DB.prepare(
    `INSERT INTO course_modules (
      id, course_id, title, description, content, module_order, video_url, audio_url, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(course_id, id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      content = excluded.content,
      module_order = excluded.module_order,
      video_url = excluded.video_url,
      audio_url = excluded.audio_url,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(
    id,
    courseId,
    title,
    String(body.description || '').trim(),
    String(body.content || '').trim(),
    order,
    body.videoUrl || null,
    body.audioUrl || null
  ).run();

  await c.env.DB.prepare(
    `UPDATE courses
     SET module_count = (SELECT COUNT(*) FROM course_modules WHERE course_id = ?),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(courseId, courseId).run();

  const module = await c.env.DB.prepare(
    `SELECT * FROM course_modules WHERE course_id = ? AND id = ? LIMIT 1`
  ).bind(courseId, id).first<CourseModuleRow>();

  return c.json({ module: module ? mapCourseModule(module) : null });
});

app.delete('/api/admin/courses/:id/modules/:moduleId', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  const courseId = c.req.param('id');
  const moduleId = c.req.param('moduleId');
  if (!isSafeId(courseId) || !isSafeId(moduleId)) return c.json({ error: 'Invalid module identifier' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  await c.env.DB.prepare(
    `DELETE FROM course_modules WHERE course_id = ? AND id = ?`
  ).bind(courseId, moduleId).run();

  await c.env.DB.prepare(
    `UPDATE courses
     SET module_count = (SELECT COUNT(*) FROM course_modules WHERE course_id = ?),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(courseId, courseId).run();

  return c.json({ ok: true });
});

app.get('/api/events', async (c) => {
  if (!c.env.DB) return c.json({ events: [], source: 'fallback' });
  const result = await c.env.DB.prepare(
    `SELECT * FROM events
     WHERE status = 'published' AND event_date >= datetime('now', '-1 day')
     ORDER BY event_date ASC`
  ).all<EventRow>();
  return c.json({ events: result.results.map(mapEvent), source: 'd1' });
});

app.post('/api/events/:id/register', async (c) => {
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid event id' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json().catch(() => ({}));
  const userId = String(body.userId || 'anonymous').trim() || 'anonymous';
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);

  const event = await c.env.DB.prepare(`SELECT * FROM events WHERE id = ? LIMIT 1`).bind(id).first<EventRow>();
  if (!event) return c.json({ error: 'Event not found' }, 404);

  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO event_registrations (event_id, user_id, created_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)`
  ).bind(id, userId).run();

  await c.env.DB.prepare(
    `UPDATE events
     SET attendee_count = (SELECT COUNT(*) FROM event_registrations WHERE event_id = ?),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(id, id).run();

  const updated = await c.env.DB.prepare(`SELECT * FROM events WHERE id = ? LIMIT 1`).bind(id).first<EventRow>();
  return c.json({ event: updated ? mapEvent(updated) : null, source: 'd1' });
});

app.post('/api/admin/events', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const eventDate = String(body.date || body.eventDate || '').trim();
  const type = String(body.type || 'online') === 'physical' ? 'physical' : 'online';
  const streamingPlatform = String(body.streamingPlatform || '').trim() || null;
  const status = contentStatus(body.status);

  if (!title) return c.json({ error: 'Event title is required' }, 400);
  if (!eventDate || Number.isNaN(new Date(eventDate).getTime())) {
    return c.json({ error: 'A valid event date is required' }, 400);
  }

  const id = String(body.id || crypto.randomUUID()).trim();
  if (!isSafeId(id)) return c.json({ error: 'Invalid event id' }, 400);

  await c.env.DB.prepare(
    `INSERT INTO events (
      id, title, description, event_date, type, attendee_count, streaming_platform, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      event_date = excluded.event_date,
      type = excluded.type,
      streaming_platform = excluded.streaming_platform,
      status = excluded.status,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(id, title, description, new Date(eventDate).toISOString(), type, streamingPlatform, status).run();

  const event = await c.env.DB.prepare(`SELECT * FROM events WHERE id = ? LIMIT 1`).bind(id).first<EventRow>();
  return c.json({ event: event ? mapEvent(event) : null, source: 'd1' });
});

app.delete('/api/admin/events/:id', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid event id' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  await c.env.DB.prepare(`DELETE FROM event_registrations WHERE event_id = ?`).bind(id).run();
  await c.env.DB.prepare(`DELETE FROM events WHERE id = ?`).bind(id).run();

  return c.json({ ok: true });
});

app.get('/api/community/prayer-requests', async (c) => {
  if (!c.env.DB) return c.json({ requests: [], source: 'fallback' });

  const result = await c.env.DB.prepare(
    `SELECT * FROM prayer_requests
     ORDER BY created_at DESC
     LIMIT 100`
  ).all<PrayerRequestRow>();

  return c.json({ requests: result.results.map(mapPrayerRequest), source: 'd1' });
});

app.post('/api/community/prayer-requests', async (c) => {
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const limited = await enforceRateLimit(c, 'prayer-request', requestIp(c), 5, 600);
  if (limited) return limited;

  const body = await c.req.json();
  const text = String(body.text || '').trim();
  const isAnonymous = Boolean(body.isAnonymous);
  const authorUid = String(body.authorUid || '').trim() || null;
  const author = isAnonymous ? 'Anonymous' : String(body.author || 'Community Member').trim();
  const prayerCount = Math.max(0, Number(body.prayerCount || 1));
  const testimony = String(body.testimony || '').trim() || null;
  const id = String(body.id || crypto.randomUUID()).trim();

  if (!text) return c.json({ error: 'Prayer request text is required' }, 400);
  if (!isSafeId(id)) return c.json({ error: 'Invalid prayer request id' }, 400);
  if (authorUid && !isSafeId(authorUid)) return c.json({ error: 'Invalid author id' }, 400);

  await c.env.DB.prepare(
    `INSERT INTO prayer_requests (
      id, text, author, author_uid, prayer_count, testimony, is_anonymous, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      text = excluded.text,
      author = excluded.author,
      author_uid = excluded.author_uid,
      prayer_count = excluded.prayer_count,
      testimony = excluded.testimony,
      is_anonymous = excluded.is_anonymous,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(id, text, author || 'Community Member', authorUid, prayerCount, testimony, isAnonymous ? 1 : 0).run();

  if (prayerCount > 0) {
    await c.env.DB.prepare(
      `INSERT OR IGNORE INTO prayer_request_prayers (request_id, user_id, created_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)`
    ).bind(id, authorUid || `seed:${id}`).run();
  }

  const request = await c.env.DB.prepare(
    `SELECT * FROM prayer_requests WHERE id = ? LIMIT 1`
  ).bind(id).first<PrayerRequestRow>();

  return c.json({ request: request ? mapPrayerRequest(request) : null, source: 'd1' });
});

app.post('/api/community/prayer-requests/:id/pray', async (c) => {
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid prayer request id' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const limited = await enforceRateLimit(c, 'prayer-tap', requestIp(c), 30, 600);
  if (limited) return limited;

  const body = await c.req.json().catch(() => ({}));
  const userId = String(body.userId || 'anonymous').trim() || 'anonymous';
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);

  const existing = await c.env.DB.prepare(
    `SELECT * FROM prayer_requests WHERE id = ? LIMIT 1`
  ).bind(id).first<PrayerRequestRow>();
  if (!existing) return c.json({ error: 'Prayer request not found' }, 404);

  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO prayer_request_prayers (request_id, user_id, created_at)
     VALUES (?, ?, CURRENT_TIMESTAMP)`
  ).bind(id, userId).run();

  await c.env.DB.prepare(
    `UPDATE prayer_requests
     SET prayer_count = MAX(prayer_count, (SELECT COUNT(*) FROM prayer_request_prayers WHERE request_id = ?)),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).bind(id, id).run();

  const request = await c.env.DB.prepare(
    `SELECT * FROM prayer_requests WHERE id = ? LIMIT 1`
  ).bind(id).first<PrayerRequestRow>();

  return c.json({ request: request ? mapPrayerRequest(request) : null, source: 'd1' });
});

app.delete('/api/admin/community/prayer-requests/:id', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid prayer request id' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  await c.env.DB.prepare(`DELETE FROM prayer_request_prayers WHERE request_id = ?`).bind(id).run();
  await c.env.DB.prepare(`DELETE FROM prayer_requests WHERE id = ?`).bind(id).run();

  return c.json({ ok: true });
});

app.get('/api/community/rooms/messages', async (c) => {
  if (!c.env.DB) return c.json({ messages: [], source: 'fallback' });
  const rawLimit = Number(c.req.query('limit') || 50);
  const messageLimit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 50, 1), 100);

  const result = await c.env.DB.prepare(
    `SELECT * FROM (
       SELECT * FROM community_messages ORDER BY created_at DESC LIMIT ?
     ) ORDER BY created_at ASC`
  ).bind(messageLimit).all<CommunityMessageRow>();

  return c.json({ messages: result.results.map(mapCommunityMessage), source: 'd1' });
});

app.post('/api/community/rooms/messages', async (c) => {
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const text = String(body.text || '').trim();
  const userId = String(body.userId || 'anonymous').trim() || 'anonymous';
  const user = String(body.user || 'Anonymous').trim() || 'Anonymous';
  const id = String(body.id || crypto.randomUUID()).trim();

  if (!text) return c.json({ error: 'Message text is required' }, 400);
  if (!isSafeId(id)) return c.json({ error: 'Invalid message id' }, 400);
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);

  await c.env.DB.prepare(
    `INSERT INTO community_messages (id, user_id, user_name, text, created_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).bind(id, userId, user, text).run();

  const message = await c.env.DB.prepare(
    `SELECT * FROM community_messages WHERE id = ? LIMIT 1`
  ).bind(id).first<CommunityMessageRow>();

  return c.json({ message: message ? mapCommunityMessage(message) : null, source: 'd1' });
});

app.delete('/api/admin/community/messages/:id', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid message id' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  await c.env.DB.prepare(`DELETE FROM community_messages WHERE id = ?`).bind(id).run();

  return c.json({ ok: true });
});

app.get('/api/live/status', async (c) => {
  if (!c.env.DB) return c.json({ stream: mapLiveStreamSettings(null), source: 'fallback' });

  const stream = await c.env.DB.prepare(
    `SELECT * FROM live_stream_settings WHERE id = 'main' LIMIT 1`
  ).first<LiveStreamSettingsRow>();

  return c.json({ stream: mapLiveStreamSettings(stream), source: 'd1' });
});

app.put('/api/admin/live/status', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const playbackId = String(body.playbackId || '').trim() || null;
  const streamId = String(body.streamId || '').trim() || null;
  const title = String(body.title || 'Global Broadcast').trim() || 'Global Broadcast';
  const status = String(body.status || (playbackId ? 'live' : 'offline')) === 'live' ? 'live' : 'offline';
  const viewerCount = Math.max(0, Number(body.viewerCount || 0));

  await c.env.DB.prepare(
    `INSERT INTO live_stream_settings (
      id, status, playback_id, stream_id, title, viewer_count, updated_at
    ) VALUES ('main', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      status = excluded.status,
      playback_id = excluded.playback_id,
      stream_id = excluded.stream_id,
      title = excluded.title,
      viewer_count = excluded.viewer_count,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(status, playbackId, streamId, title, viewerCount).run();

  const stream = await c.env.DB.prepare(
    `SELECT * FROM live_stream_settings WHERE id = 'main' LIMIT 1`
  ).first<LiveStreamSettingsRow>();

  return c.json({ stream: mapLiveStreamSettings(stream), source: 'd1' });
});

app.get('/api/live/chat/messages', async (c) => {
  if (!c.env.DB) return c.json({ messages: [], source: 'fallback' });
  const rawLimit = Number(c.req.query('limit') || 100);
  const messageLimit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 100, 1), 150);

  const result = await c.env.DB.prepare(
    `SELECT * FROM (
       SELECT * FROM live_stream_messages ORDER BY created_at DESC LIMIT ?
     ) ORDER BY created_at ASC`
  ).bind(messageLimit).all<LiveStreamMessageRow>();

  return c.json({ messages: result.results.map(mapLiveStreamMessage), source: 'd1' });
});

app.post('/api/live/chat/messages', async (c) => {
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const text = String(body.text || '').trim();
  const userId = String(body.userId || 'anonymous').trim() || 'anonymous';
  const user = String(body.user || 'Anonymous').trim() || 'Anonymous';
  const id = String(body.id || crypto.randomUUID()).trim();

  if (!text) return c.json({ error: 'Message text is required' }, 400);
  if (!isSafeId(id)) return c.json({ error: 'Invalid message id' }, 400);
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);

  await c.env.DB.prepare(
    `INSERT INTO live_stream_messages (id, user_id, user_name, text, created_at)
     VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`
  ).bind(id, userId, user, text).run();

  const message = await c.env.DB.prepare(
    `SELECT * FROM live_stream_messages WHERE id = ? LIMIT 1`
  ).bind(id).first<LiveStreamMessageRow>();

  return c.json({ message: message ? mapLiveStreamMessage(message) : null, source: 'd1' });
});

app.delete('/api/admin/live/chat/messages/:id', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid message id' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  await c.env.DB.prepare(`DELETE FROM live_stream_messages WHERE id = ?`).bind(id).run();

  return c.json({ ok: true });
});

// Cloudflare Stream helpers.
const STREAM_API_BASE = 'https://api.cloudflare.com/client/v4';

const streamConfigured = (env: Env): boolean =>
  Boolean(env.CF_ACCOUNT_ID && env.CF_STREAM_TOKEN);

// Derive the "customer-<code>.cloudflarestream.com" host from a Stream playback URL.
const parseStreamCustomerSubdomain = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  const match = value.match(/(customer-[a-z0-9]+)\.cloudflarestream\.com/i);
  return match ? match[1] : '';
};

const resolveStreamCustomerSubdomain = (env: Env, ...candidates: unknown[]): string => {
  for (const candidate of candidates) {
    const parsed = parseStreamCustomerSubdomain(candidate);
    if (parsed) return parsed;
  }
  return env.CF_STREAM_CUSTOMER_SUBDOMAIN || '';
};

// POST /api/stream/live — create a Cloudflare Stream live input (RTMPS ingest + uid).
app.post('/api/stream/live', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  if (!streamConfigured(c.env)) {
    return c.json({
      error: 'STREAM_NOT_CONFIGURED',
      message: 'CF_ACCOUNT_ID and CF_STREAM_TOKEN must be configured before live stream keys can be generated.',
    }, 501);
  }

  const response = await fetch(
    `${STREAM_API_BASE}/accounts/${c.env.CF_ACCOUNT_ID}/stream/live_inputs`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.CF_STREAM_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meta: { name: 'CCN DAILY Global Broadcast' },
        recording: { mode: 'automatic' },
      }),
    }
  );

  const data: any = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    const message = data?.errors?.[0]?.message || 'Cloudflare Stream live input creation failed.';
    return c.json({ error: 'STREAM_REQUEST_FAILED', message, details: data }, response.status as any);
  }

  const result = data?.result || {};
  const uid: string = result?.uid || '';
  const ingestUrl: string = result?.rtmps?.url || '';
  const streamKey: string = result?.rtmps?.streamKey || '';
  const customerSubdomain = resolveStreamCustomerSubdomain(
    c.env,
    result?.playback?.hls,
    result?.playback?.dash,
  );

  if (c.env.DB && uid) {
    // playback_id / stream_id are provider-neutral; both hold the Stream uid.
    await c.env.DB.prepare(
      `INSERT INTO live_stream_settings (
        id, status, playback_id, stream_id, title, viewer_count, updated_at
      ) VALUES ('main', 'live', ?, ?, 'Global Broadcast', 0, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        status = 'live',
        playback_id = excluded.playback_id,
        stream_id = excluded.stream_id,
        title = excluded.title,
        updated_at = CURRENT_TIMESTAMP`
    ).bind(uid, uid).run();
  }

  // playbackId == uid (consumed by the player iframe/HLS). ingestUrl + streamKey go into OBS.
  return c.json({
    streamKey,
    playbackId: uid,
    streamId: uid,
    ingestUrl,
    customerSubdomain,
    source: 'cloudflare-stream',
  });
});

// POST /api/stream/upload — one-time direct creator upload URL for VOD.
app.post('/api/stream/upload', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  if (!streamConfigured(c.env)) {
    return c.json({
      error: 'STREAM_NOT_CONFIGURED',
      message: 'CF_ACCOUNT_ID and CF_STREAM_TOKEN must be configured before video uploads can be generated.',
    }, 501);
  }

  const response = await fetch(
    `${STREAM_API_BASE}/accounts/${c.env.CF_ACCOUNT_ID}/stream/direct_upload`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.CF_STREAM_TOKEN}`,
        'Content-Type': 'application/json',
      },
      // Cap at 4h; tune as needed. requireSignedURLs left false for public playback.
      body: JSON.stringify({ maxDurationSeconds: 14400 }),
    }
  );

  const data: any = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    const message = data?.errors?.[0]?.message || 'Cloudflare Stream direct upload creation failed.';
    return c.json({ error: 'STREAM_REQUEST_FAILED', message, details: data }, response.status as any);
  }

  const result = data?.result || {};
  return c.json({
    uploadUrl: result?.uploadURL || '',
    uploadId: result?.uid || '',
    source: 'cloudflare-stream',
  });
});

const contentTypes = ['devotionals', 'audiobooks', 'books', 'challenges', 'courses'] as const;
type ContentType = typeof contentTypes[number];

const isContentType = (value: string): value is ContentType =>
  (contentTypes as readonly string[]).includes(value);

const contentStatus = (value: unknown) =>
  ['draft', 'published', 'archived'].includes(String(value)) ? String(value) : 'published';

const contentTypeFromParam = (c: any) => {
  const type = c.req.param('type');
  return isContentType(type) ? type : null;
};

const listContentByType = async (c: any, type: ContentType, includeDrafts: boolean) => {
  if (!c.env.DB) return c.json({ items: [], source: 'fallback' });

  if (type === 'devotionals') {
    const result = await c.env.DB.prepare(
      includeDrafts
        ? `SELECT * FROM devotionals ORDER BY devotional_date DESC, created_at DESC`
        : `SELECT * FROM devotionals WHERE status = 'published' ORDER BY devotional_date DESC, created_at DESC`
    ).all() as { results: DevotionalRow[] };
    return c.json({ items: result.results.map(mapDevotional), source: 'd1' });
  }

  if (type === 'audiobooks') {
    const result = await c.env.DB.prepare(
      includeDrafts
        ? `SELECT * FROM audiobooks ORDER BY created_at DESC`
        : `SELECT * FROM audiobooks WHERE status = 'published' ORDER BY created_at DESC`
    ).all() as { results: AudiobookRow[] };
    return c.json({ items: result.results.map(mapAudiobook), source: 'd1' });
  }

  if (type === 'books') {
    const result = await c.env.DB.prepare(
      includeDrafts
        ? `SELECT * FROM books ORDER BY created_at DESC`
        : `SELECT * FROM books WHERE status = 'published' ORDER BY created_at DESC`
    ).all() as { results: BookRow[] };
    return c.json({ items: result.results.map(mapBook), source: 'd1' });
  }

  if (type === 'challenges') {
    const result = await c.env.DB.prepare(
      includeDrafts
        ? `SELECT * FROM challenges ORDER BY start_date DESC, created_at DESC`
        : `SELECT * FROM challenges WHERE status = 'published' ORDER BY start_date DESC, created_at DESC`
    ).all() as { results: ChallengeRow[] };
    return c.json({ items: result.results.map(mapChallenge), source: 'd1' });
  }

  const result = await c.env.DB.prepare(
    includeDrafts
      ? `SELECT * FROM courses ORDER BY created_at DESC`
      : `SELECT * FROM courses WHERE status = 'published' ORDER BY created_at DESC`
  ).all() as { results: CourseRow[] };
  return c.json({ items: result.results.map(mapCourse), source: 'd1' });
};

app.get('/api/devotionals/today', async (c) => {
  if (!c.env.DB) return c.json({ devotional: null, source: 'fallback' });
  const date = String(c.req.query('date') || new Date().toISOString().slice(0, 10));
  const devotional = await c.env.DB.prepare(
    `SELECT * FROM devotionals
     WHERE status = 'published' AND devotional_date <= ?
     ORDER BY devotional_date DESC, created_at DESC
     LIMIT 1`
  ).bind(date).first<DevotionalRow>();

  return c.json({ devotional: devotional ? mapDevotional(devotional) : null, source: 'd1' });
});

app.get('/api/audiobooks', async (c) => {
  if (!c.env.DB) return c.json({ audiobooks: [], source: 'fallback' });
  const result = await c.env.DB.prepare(
    `SELECT * FROM audiobooks WHERE status = 'published' ORDER BY created_at DESC`
  ).all<AudiobookRow>();
  return c.json({ audiobooks: result.results.map(mapAudiobook), source: 'd1' });
});

app.get('/api/books', async (c) => {
  if (!c.env.DB) return c.json({ books: [], source: 'fallback' });
  const result = await c.env.DB.prepare(
    `SELECT * FROM books WHERE status = 'published' ORDER BY created_at DESC`
  ).all<BookRow>();
  return c.json({ books: result.results.map(mapBook), source: 'd1' });
});

// GET /api/books/:id/print — print-edition availability for the visitor's
// country (Cloudflare gives us request.cf.country). Returns one of:
//   notOffered  — no print edition exists for this title
//   available   — ships to the visitor's country now, with a localized price
//   comingSoon  — print exists but not yet in their country (offer the waitlist)
app.get('/api/books/:id/print', async (c) => {
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid book id' }, 400);
  if (!c.env.DB) return c.json({ state: 'notOffered', source: 'fallback' });

  const country = String((c.req.raw as any)?.cf?.country || c.req.query('country') || 'US').toUpperCase();
  const book = await c.env.DB.prepare(`SELECT * FROM books WHERE id = ? LIMIT 1`).bind(id).first<BookRow>();
  if (!book) return c.json({ error: 'Book not found' }, 404);

  const mapped = mapBook(book);
  const countryName = COUNTRY_NAMES[country] || country;
  if (!mapped.printEnabled) {
    return c.json({ state: 'notOffered', country, countryName });
  }

  const available = mapped.printCountries.includes(country);
  if (available) {
    const local = await localizeAmount(c.env.DB, mapped.printPriceUsd, country);
    return c.json({
      state: 'available',
      country,
      countryName,
      priceUsd: mapped.printPriceUsd,
      price: local.amount,
      currency: local.currency,
    });
  }

  return c.json({ state: 'comingSoon', country, countryName });
});

// POST /api/books/:id/print-request — capture a print access / waitlist request
// from a reader whose country has no distribution yet. Best-effort admin email.
app.post('/api/books/:id/print-request', async (c) => {
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid book id' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const ip = requestIp(c);
  const limited = await enforceRateLimit(c, 'print-request', ip, 5, 3600);
  if (limited) return limited;

  const body = await c.req.json().catch(() => ({} as Record<string, unknown>));
  const email = String(body.email || c.get('idTokenEmail') || '').trim().toLowerCase();
  if (!email || !isValidEmail(email)) return c.json({ error: 'Valid email is required' }, 400);
  const name = sanitizeInput(String(body.name || '').trim().slice(0, 120));
  const country = String(body.country || (c.req.raw as any)?.cf?.country || '').toUpperCase().slice(0, 2);
  const message = sanitizeInput(String(body.message || '').trim().slice(0, 1000));

  await ensureBookPrintRequestsTable(c.env.DB);
  const book = await c.env.DB.prepare(`SELECT title FROM books WHERE id = ? LIMIT 1`).bind(id).first<{ title: string }>();

  await c.env.DB.prepare(
    `INSERT INTO book_print_requests (id, book_id, book_title, user_id, name, email, country, message, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', CURRENT_TIMESTAMP)`
  ).bind(
    `printreq_${crypto.randomUUID()}`,
    id,
    book?.title || '',
    c.get('idTokenUid') || null,
    name,
    email,
    country,
    message,
  ).run();

  // Attention-only admin alert; reader detail stays in the dashboard.
  if (resendKey(c.env)) {
    const recipients = [...new Set([...ADMIN_EMAILS, ...String(c.env.ADMIN_NOTIFY_EMAILS || '').split(',').map((s) => s.trim())])].filter(isValidEmail);
    if (recipients.length) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey(c.env)}` },
        body: JSON.stringify({
          from: 'THE CCN DAILY <gifts@updates.theccndaily.com>',
          to: recipients,
          subject: `Print access requested — ${COUNTRY_NAMES[country] || country || 'unknown country'}`,
          html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#1a1210;color:#f0ebe4;padding:40px 32px;border-radius:12px">
            <h2 style="color:#F27D26;font-size:20px;margin-bottom:8px">Someone wants a print copy</h2>
            <p>A reader in <strong>${sanitizeInput(COUNTRY_NAMES[country] || country || 'an unlisted country')}</strong> requested the print edition of <strong>${sanitizeInput(book?.title || 'a book')}</strong>.</p>
            <p>Open the dashboard to see all print requests and arrange shipping or a distribution point.</p>
            <p style="margin-top:24px;font-size:12px;color:#7a6a60">Reader details stay in the app.</p>
          </div>`,
        }),
      }).catch(() => {});
    }
  }

  return c.json({ ok: true });
});

// GET /api/admin/print-requests — the follow-up queue for arranging print
// distribution in regions without a centre yet.
app.get('/api/admin/print-requests', async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  if (!c.env.DB) return c.json({ requests: [], source: 'fallback' });
  await ensureBookPrintRequestsTable(c.env.DB);
  const result = await c.env.DB.prepare(
    `SELECT * FROM book_print_requests ORDER BY created_at DESC LIMIT 300`
  ).all<{ id: string; book_id: string; book_title: string; name: string; email: string; country: string; message: string; status: string; created_at: string }>();
  return c.json({
    requests: result.results.map((r) => ({
      id: r.id,
      bookId: r.book_id,
      bookTitle: r.book_title,
      name: r.name,
      email: r.email,
      country: r.country,
      countryName: COUNTRY_NAMES[r.country] || r.country,
      message: r.message,
      status: r.status,
      createdAt: r.created_at,
    })),
    source: 'd1',
  });
});

// POST /api/admin/books/:id/print — set a book's print edition availability:
// which countries it ships to today and the USD list price.
app.post('/api/admin/books/:id/print', async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'Invalid book id' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json().catch(() => ({} as Record<string, unknown>));
  const printEnabled = body.printEnabled ? 1 : 0;
  const countries = Array.isArray(body.printCountries)
    ? body.printCountries.map((x: unknown) => String(x).toUpperCase().trim()).filter((x: string) => /^[A-Z]{2}$/.test(x))
    : String(body.printCountries || '').split(',').map((s) => s.toUpperCase().trim()).filter((x) => /^[A-Z]{2}$/.test(x));
  const priceUsd = Math.max(0, Number(body.printPriceUsd || 0));

  await ensureBookPrintColumns(c.env.DB);
  await c.env.DB.prepare(
    `UPDATE books SET print_enabled = ?, print_countries = ?, print_price_usd = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).bind(printEnabled, countries.join(','), priceUsd, id).run();

  const book = await c.env.DB.prepare(`SELECT * FROM books WHERE id = ? LIMIT 1`).bind(id).first<BookRow>();
  return c.json({ book: book ? mapBook(book) : null });
});

app.post('/api/admin/content/media', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  if (!c.env.MEDIA_BUCKET) {
    return c.json({
      error: 'MEDIA_BUCKET_NOT_CONFIGURED',
      message: 'Cloudflare R2 is not bound yet. Paste a hosted media URL or configure the MEDIA_BUCKET R2 binding.',
    }, 503);
  }

  const form = await c.req.formData();
  const file = form.get('file');
  const type = String(form.get('type') || '').trim();
  const role = String(form.get('role') || 'file').trim();
  if (!isContentType(type)) return c.json({ error: 'Unsupported content type' }, 400);
  if (!(file instanceof File)) return c.json({ error: 'File is required' }, 400);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 120) || 'upload.bin';
  const key = `${type}/${role}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  await c.env.MEDIA_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  });

  const publicBase = (c.env.MEDIA_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  const url = publicBase ? `${publicBase}/${key}` : `/api/media/${key}`;

  if (c.env.DB) {
    await c.env.DB.prepare(
      `INSERT INTO media_assets (
        id, content_type, role, file_name, object_key, public_url, content_type_header, size_bytes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
    ).bind(
      crypto.randomUUID(),
      type,
      role,
      file.name,
      key,
      url,
      file.type || null,
      file.size || 0
    ).run();
  }

  return c.json({ url, key, source: 'r2' });
});

app.get('/api/admin/content/:type', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  const type = contentTypeFromParam(c);
  if (!type) return c.json({ error: 'Unsupported content type' }, 400);
  return listContentByType(c, type, c.req.query('includeDrafts') === 'true');
});

app.post('/api/admin/content/:type', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  const type = contentTypeFromParam(c);
  if (!type) return c.json({ error: 'Unsupported content type' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const title = String(body.title || '').trim();
  if (!title) return c.json({ error: 'Title is required' }, 400);
  const status = contentStatus(body.status);
  const idPrefix = type.slice(0, -1) || type;
  const id = String(body.id || `${idPrefix}-${slugify(title)}-${Date.now()}`);
  if (!isSafeId(id)) return c.json({ error: 'Invalid content id' }, 400);

  if (type === 'devotionals') {
    await c.env.DB.prepare(
      `INSERT INTO devotionals (
        id, title, content, description, devotional_date, audio_url, status, author_id,
        is_premium, price, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        description = excluded.description,
        devotional_date = excluded.devotional_date,
        audio_url = excluded.audio_url,
        status = excluded.status,
        author_id = excluded.author_id,
        is_premium = excluded.is_premium,
        price = excluded.price,
        updated_at = CURRENT_TIMESTAMP`
    ).bind(
      id,
      title,
      String(body.content || body.description || '').trim(),
      String(body.description || '').trim(),
      String(body.date || body.devotionalDate || new Date().toISOString().slice(0, 10)),
      body.audioUrl || null,
      status,
      body.authorId || null,
      body.isPremium ? 1 : 0,
      Number(body.price || 0)
    ).run();

    const item = await c.env.DB.prepare(`SELECT * FROM devotionals WHERE id = ? LIMIT 1`)
      .bind(id).first<DevotionalRow>();
    return c.json({ item: item ? mapDevotional(item) : null, source: 'd1' });
  }

  if (type === 'audiobooks') {
    await c.env.DB.prepare(
      `INSERT INTO audiobooks (
        id, title, description, author, audio_url, cover_url, status, is_premium, price,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        author = excluded.author,
        audio_url = excluded.audio_url,
        cover_url = excluded.cover_url,
        status = excluded.status,
        is_premium = excluded.is_premium,
        price = excluded.price,
        updated_at = CURRENT_TIMESTAMP`
    ).bind(
      id,
      title,
      String(body.description || '').trim(),
      String(body.author || 'THE CCN DAILY').trim(),
      String(body.audioUrl || '').trim(),
      body.coverUrl || null,
      status,
      body.isPremium ? 1 : 0,
      Number(body.price || 0)
    ).run();

    const item = await c.env.DB.prepare(`SELECT * FROM audiobooks WHERE id = ? LIMIT 1`)
      .bind(id).first<AudiobookRow>();
    return c.json({ item: item ? mapAudiobook(item) : null, source: 'd1' });
  }

  if (type === 'books') {
    await c.env.DB.prepare(
      `INSERT INTO books (
        id, title, description, author, file_url, cover_url, status, is_premium, price,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        author = excluded.author,
        file_url = excluded.file_url,
        cover_url = excluded.cover_url,
        status = excluded.status,
        is_premium = excluded.is_premium,
        price = excluded.price,
        updated_at = CURRENT_TIMESTAMP`
    ).bind(
      id,
      title,
      String(body.description || '').trim(),
      String(body.author || 'THE CCN DAILY').trim(),
      String(body.fileUrl || '').trim(),
      body.coverUrl || null,
      status,
      body.isPremium ? 1 : 0,
      Number(body.price || 0)
    ).run();

    const item = await c.env.DB.prepare(`SELECT * FROM books WHERE id = ? LIMIT 1`)
      .bind(id).first<BookRow>();
    return c.json({ item: item ? mapBook(item) : null, source: 'd1' });
  }

  if (type === 'challenges') {
    await c.env.DB.prepare(
      `INSERT INTO challenges (
        id, title, description, duration, source_type, cover_url, status, start_date,
        participants_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        duration = excluded.duration,
        source_type = excluded.source_type,
        cover_url = excluded.cover_url,
        status = excluded.status,
        start_date = excluded.start_date,
        updated_at = CURRENT_TIMESTAMP`
    ).bind(
      id,
      title,
      String(body.description || '').trim(),
      body.duration || null,
      body.sourceType || 'content-manager',
      body.coverUrl || null,
      status,
      body.startDate || body.date || new Date().toISOString(),
      Number(body.participantsCount || 0)
    ).run();

    const item = await c.env.DB.prepare(`SELECT * FROM challenges WHERE id = ? LIMIT 1`)
      .bind(id).first<ChallengeRow>();
    return c.json({ item: item ? mapChallenge(item) : null, source: 'd1' });
  }

  await c.env.DB.prepare(
    `INSERT INTO courses (
      id, title, description, instructor, cover_url, status, is_premium, module_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      instructor = excluded.instructor,
      cover_url = excluded.cover_url,
      status = excluded.status,
      is_premium = excluded.is_premium,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(
    id,
    title,
    String(body.description || '').trim(),
    String(body.instructor || body.author || 'THE CCN DAILY').trim(),
    body.coverUrl || null,
    status,
    body.isPremium ? 1 : 0,
    Math.max(0, Number(body.moduleCount || 0))
  ).run();

  const item = await c.env.DB.prepare(`SELECT * FROM courses WHERE id = ? LIMIT 1`)
    .bind(id).first<CourseRow>();
  return c.json({ item: item ? mapCourse(item) : null, source: 'd1' });
});

app.delete('/api/admin/content/:type/:id', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  const type = contentTypeFromParam(c);
  const id = c.req.param('id');
  if (!type) return c.json({ error: 'Unsupported content type' }, 400);
  if (!isSafeId(id)) return c.json({ error: 'Invalid content id' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const table = type === 'devotionals' ? 'devotionals'
    : type === 'audiobooks' ? 'audiobooks'
      : type === 'books' ? 'books'
        : type === 'challenges' ? 'challenges'
          : 'courses';

  await c.env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  return c.json({ ok: true });
});

const HOUSEHOLD_MAX_SEATS = 5;

const ensureHouseholdTables = async (db: D1DatabaseBinding) => {
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS household_members (
        id TEXT PRIMARY KEY,
        owner_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        status TEXT NOT NULL DEFAULT 'active',
        joined_at TEXT,
        invited_at TEXT,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    ),
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_household_members_owner_email ON household_members(owner_id, email)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_household_members_owner ON household_members(owner_id, role, updated_at DESC)`),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS group_members (
        id TEXT PRIMARY KEY,
        leader_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        status TEXT NOT NULL DEFAULT 'active',
        engagement_score INTEGER NOT NULL DEFAULT 0,
        last_active_at TEXT,
        invited_at TEXT,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    ),
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_group_members_leader_email ON group_members(leader_id, email)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_group_members_leader ON group_members(leader_id, role, updated_at DESC)`),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS group_assignments (
        id TEXT PRIMARY KEY,
        leader_id TEXT NOT NULL,
        title TEXT NOT NULL,
        assignment_type TEXT NOT NULL DEFAULT 'practice',
        progress INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    ),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_group_assignments_leader_created ON group_assignments(leader_id, created_at DESC)`),
  ]);
};

const fallbackNameFromEmail = (email: string) => {
  const local = email.split('@')[0] || 'Member';
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Member';
};

const ensureHouseholdOwner = async (db: D1DatabaseBinding, userId: string, c: any) => {
  const email = String(c.get('idTokenEmail') || '').trim().toLowerCase();
  const name = email ? fallbackNameFromEmail(email) : 'You';
  await db.prepare(
    `INSERT INTO household_members (id, owner_id, name, email, role, status, joined_at, updated_at)
     VALUES (?, ?, ?, ?, 'owner', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(owner_id, email) DO UPDATE SET
       name = CASE WHEN household_members.role = 'owner' THEN excluded.name ELSE household_members.name END,
       status = 'active',
       joined_at = COALESCE(household_members.joined_at, CURRENT_TIMESTAMP),
       updated_at = CURRENT_TIMESTAMP`
  ).bind(`owner_${userId}`, userId, name, email || `${userId}@local.ccn`).run();
};

// Flip pending invitations to active once the invited email has a real account.
// Runs opportunistically on dashboard reads so no separate redemption flow is
// needed: invitee signs in with the invited email and their seat activates.
const reconcilePendingSeats = async (
  db: D1DatabaseBinding,
  table: 'household_members' | 'group_members',
  ownerColumn: 'owner_id' | 'leader_id',
  ownerId: string,
) => {
  try {
    await db.prepare(
      `UPDATE ${table}
       SET role = 'member', status = 'active',
           ${table === 'household_members' ? "joined_at = COALESCE(joined_at, CURRENT_TIMESTAMP)," : ''}
           updated_at = CURRENT_TIMESTAMP
       WHERE ${ownerColumn} = ? AND role = 'pending'
         AND email IN (SELECT LOWER(email) FROM users WHERE email IS NOT NULL)`
    ).bind(ownerId).run();
  } catch (error) {
    console.error('Seat reconciliation failed', error);
  }
};

// Invitation email — best-effort; the durable seat record is the source of truth.
const sendSeatInviteEmail = async (
  c: any,
  inviteeEmail: string,
  inviteeName: string,
  context: 'household' | 'group',
) => {
  if (!c.env.RESEND_API_KEY || !isValidEmail(inviteeEmail)) return false;

  // Prefer the inviter's display name over their raw email — warmer, and the
  // invitee usually knows the person by name.
  let inviterLabel = String(c.get('idTokenEmail') || '').trim();
  try {
    const inviterUid = c.get('idTokenUid');
    const db: D1DatabaseBinding | undefined = c.env.DB;
    if (inviterUid && db) {
      const inviter = await db.prepare(
        `SELECT display_name FROM users WHERE id = ? LIMIT 1`
      ).bind(inviterUid).first<{ display_name?: string | null }>();
      if (inviter?.display_name) inviterLabel = inviter.display_name;
    }
  } catch {
    // Name lookup is cosmetic; fall back to the email.
  }

  const origin = c.env.PRODUCTION_ORIGIN || 'https://theccndaily.com';
  const heading = context === 'household'
    ? 'You have a place at the Family Table.'
    : 'You have been invited to walk with a group.';
  const detail = context === 'household'
    ? 'A household seat on THE CCN DAILY has been reserved for you — daily Scripture, prayer, courses, and encouragement, shared as a family.'
    : 'A group leader has invited you into a shared rhythm of Scripture practice, gentle accountability, and encouragement on THE CCN DAILY.';
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey(c.env)}` },
      body: JSON.stringify({
        from: 'THE CCN DAILY <gifts@updates.theccndaily.com>',
        to: [inviteeEmail],
        subject: 'You have been invited to THE CCN DAILY',
        html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#1a1210;color:#f0ebe4;padding:40px 32px;border-radius:12px">
          <h2 style="color:#F27D26;font-size:22px;margin-bottom:8px">${heading}</h2>
          <p>Hello ${sanitizeInput(inviteeName) || 'Friend'},</p>
          <p>${detail}</p>
          ${inviterLabel ? `<p style="font-size:13px;color:#c8b89a">Invited by ${sanitizeInput(inviterLabel)}</p>` : ''}
          <p><a href="${origin}/#/onboarding" style="display:inline-block;margin-top:12px;padding:12px 24px;background:#F27D26;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:bold">Take your seat</a></p>
          <p style="margin-top:16px;font-size:13px;color:#c8b89a">Sign in with this email address (${sanitizeInput(inviteeEmail)}) and your seat will be waiting.</p>
          <p style="margin-top:32px;font-size:12px;color:#7a6a60">THE CCN DAILY — theccndaily.com</p>
        </div>`,
      }),
    });
    if (!response.ok) {
      console.error('Invite email rejected by Resend', response.status, await response.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (error) {
    console.error('Invite email send failed', error);
    return false;
  }
};

const ensureGroupLeader = async (db: D1DatabaseBinding, userId: string, c: any) => {
  const email = String(c.get('idTokenEmail') || '').trim().toLowerCase();
  const name = email ? fallbackNameFromEmail(email) : 'You';
  await db.prepare(
    `INSERT INTO group_members (
      id, leader_id, name, email, role, status, engagement_score, last_active_at, updated_at
    ) VALUES (?, ?, ?, ?, 'leader', 'active', 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(leader_id, email) DO UPDATE SET
      name = CASE WHEN group_members.role = 'leader' THEN excluded.name ELSE group_members.name END,
      status = 'active',
      engagement_score = 100,
      last_active_at = COALESCE(group_members.last_active_at, CURRENT_TIMESTAMP),
      updated_at = CURRENT_TIMESTAMP`
  ).bind(`leader_${userId}`, userId, name, email || `${userId}@local.ccn`).run();
};

app.get('/api/users/:userId/household/members', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ members: [], maxSeats: HOUSEHOLD_MAX_SEATS, source: 'fallback' });

  await ensureHouseholdTables(c.env.DB);
  await ensureHouseholdOwner(c.env.DB, userId, c);
  await reconcilePendingSeats(c.env.DB, 'household_members', 'owner_id', userId);

  const result = await c.env.DB.prepare(
    `SELECT * FROM household_members
     WHERE owner_id = ?
     ORDER BY CASE role WHEN 'owner' THEN 0 WHEN 'member' THEN 1 ELSE 2 END, COALESCE(joined_at, invited_at, updated_at) ASC`
  ).bind(userId).all<HouseholdMemberRow>();

  return c.json({ members: result.results.map(mapHouseholdMember), maxSeats: HOUSEHOLD_MAX_SEATS, source: 'd1' });
});

app.post('/api/users/:userId/household/invites', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json().catch(() => ({} as Record<string, unknown>));
  const email = String(body.email || '').trim().toLowerCase();
  const name = sanitizeInput(String(body.name || fallbackNameFromEmail(email)).trim().slice(0, 120));
  if (!email || !isValidEmail(email)) return c.json({ error: 'Valid email is required' }, 400);

  await ensureHouseholdTables(c.env.DB);
  await ensureHouseholdOwner(c.env.DB, userId, c);

  const seatCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as count FROM household_members WHERE owner_id = ?`
  ).bind(userId).first<{ count: number }>();
  if (Number(seatCount?.count || 0) >= HOUSEHOLD_MAX_SEATS) {
    return c.json({ error: 'No available household seats' }, 409);
  }

  const id = `house_${crypto.randomUUID()}`;
  await c.env.DB.prepare(
    `INSERT INTO household_members (id, owner_id, name, email, role, status, invited_at, updated_at)
     VALUES (?, ?, ?, ?, 'pending', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(owner_id, email) DO UPDATE SET
       name = excluded.name,
       role = CASE WHEN household_members.role = 'owner' THEN 'owner' ELSE 'pending' END,
       status = CASE WHEN household_members.role = 'owner' THEN 'active' ELSE 'pending' END,
       invited_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(id, userId, name || 'Pending Invite', email).run();

  const member = await c.env.DB.prepare(
    `SELECT * FROM household_members WHERE owner_id = ? AND email = ? LIMIT 1`
  ).bind(userId, email).first<HouseholdMemberRow>();

  const emailSent = await sendSeatInviteEmail(c, email, name, 'household');

  return c.json({ member: member ? mapHouseholdMember(member) : null, emailSent, source: 'd1' });
});

app.delete('/api/users/:userId/household/members/:id', async (c) => {
  const userId = c.req.param('userId');
  const id = c.req.param('id');
  if (!isSafeId(userId) || !isSafeId(id)) return c.json({ error: 'Invalid household identifier' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  await ensureHouseholdTables(c.env.DB);
  await c.env.DB.prepare(
    `DELETE FROM household_members WHERE owner_id = ? AND id = ? AND role != 'owner'`
  ).bind(userId, id).run();

  return c.json({ ok: true });
});

app.get('/api/users/:userId/group/overview', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ members: [], assignments: [], source: 'fallback' });

  await ensureHouseholdTables(c.env.DB);
  await ensureGroupLeader(c.env.DB, userId, c);
  await reconcilePendingSeats(c.env.DB, 'group_members', 'leader_id', userId);

  const [members, assignments] = await Promise.all([
    c.env.DB.prepare(
      `SELECT * FROM group_members
       WHERE leader_id = ?
       ORDER BY CASE role WHEN 'leader' THEN 0 WHEN 'member' THEN 1 ELSE 2 END, COALESCE(last_active_at, invited_at, updated_at) DESC`
    ).bind(userId).all<GroupMemberRow>(),
    c.env.DB.prepare(
      `SELECT * FROM group_assignments
       WHERE leader_id = ?
       ORDER BY created_at DESC`
    ).bind(userId).all<GroupAssignmentRow>(),
  ]);

  return c.json({
    members: members.results.map(mapGroupMember),
    assignments: assignments.results.map(mapGroupAssignment),
    source: 'd1',
  });
});

app.post('/api/users/:userId/group/invites', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json().catch(() => ({} as Record<string, unknown>));
  const email = String(body.email || '').trim().toLowerCase();
  const name = sanitizeInput(String(body.name || fallbackNameFromEmail(email)).trim().slice(0, 120));
  if (!email || !isValidEmail(email)) return c.json({ error: 'Valid email is required' }, 400);

  await ensureHouseholdTables(c.env.DB);
  await ensureGroupLeader(c.env.DB, userId, c);

  const id = `group_${crypto.randomUUID()}`;
  await c.env.DB.prepare(
    `INSERT INTO group_members (
      id, leader_id, name, email, role, status, engagement_score, invited_at, updated_at
    ) VALUES (?, ?, ?, ?, 'pending', 'pending', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(leader_id, email) DO UPDATE SET
      name = excluded.name,
      role = CASE WHEN group_members.role = 'leader' THEN 'leader' ELSE 'pending' END,
      status = CASE WHEN group_members.role = 'leader' THEN 'active' ELSE 'pending' END,
      invited_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(id, userId, name || 'Pending Invite', email).run();

  const member = await c.env.DB.prepare(
    `SELECT * FROM group_members WHERE leader_id = ? AND email = ? LIMIT 1`
  ).bind(userId, email).first<GroupMemberRow>();

  const emailSent = await sendSeatInviteEmail(c, email, name, 'group');

  return c.json({ member: member ? mapGroupMember(member) : null, emailSent, source: 'd1' });
});

app.delete('/api/users/:userId/group/members/:id', async (c) => {
  const userId = c.req.param('userId');
  const id = c.req.param('id');
  if (!isSafeId(userId) || !isSafeId(id)) return c.json({ error: 'Invalid group member identifier' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  await ensureHouseholdTables(c.env.DB);
  await c.env.DB.prepare(
    `DELETE FROM group_members WHERE leader_id = ? AND id = ? AND role != 'leader'`
  ).bind(userId, id).run();

  return c.json({ ok: true });
});

app.post('/api/users/:userId/group/assignments', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json().catch(() => ({} as Record<string, unknown>));
  const title = sanitizeInput(String(body.title || '').trim().slice(0, 160));
  const type = ['devotional', 'course', 'challenge', 'practice'].includes(String(body.type))
    ? String(body.type)
    : 'practice';
  if (!title) return c.json({ error: 'Assignment title is required' }, 400);

  await ensureHouseholdTables(c.env.DB);
  await ensureGroupLeader(c.env.DB, userId, c);

  const id = `assign_${crypto.randomUUID()}`;
  await c.env.DB.prepare(
    `INSERT INTO group_assignments (id, leader_id, title, assignment_type, progress, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  ).bind(id, userId, title, type).run();

  const assignment = await c.env.DB.prepare(
    `SELECT * FROM group_assignments WHERE leader_id = ? AND id = ? LIMIT 1`
  ).bind(userId, id).first<GroupAssignmentRow>();

  return c.json({ assignment: assignment ? mapGroupAssignment(assignment) : null, source: 'd1' });
});

app.delete('/api/users/:userId/group/assignments/:id', async (c) => {
  const userId = c.req.param('userId');
  const id = c.req.param('id');
  if (!isSafeId(userId) || !isSafeId(id)) return c.json({ error: 'Invalid assignment identifier' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  await ensureHouseholdTables(c.env.DB);
  await c.env.DB.prepare(
    `DELETE FROM group_assignments WHERE leader_id = ? AND id = ?`
  ).bind(userId, id).run();

  return c.json({ ok: true });
});

app.get('/api/media/*', async (c) => {
  const key = c.req.path.replace(/^\/api\/media\//, '');
  if (!key || !c.env.MEDIA_BUCKET) return c.json({ error: 'Media not found' }, 404);
  const object = await c.env.MEDIA_BUCKET.get(key);
  if (!object) return c.json({ error: 'Media not found' }, 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  return new Response(object.body, { headers });
});

app.get('/api/users/:userId/notifications', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ notifications: [], source: 'fallback' });

  const result = await c.env.DB.prepare(
    `SELECT * FROM notifications
     WHERE user_id IN (?, 'broadcast')
     ORDER BY date DESC, created_at DESC
     LIMIT 100`
  ).bind(userId).all<NotificationRow>();

  return c.json({ notifications: result.results.map(mapNotification), source: 'd1' });
});

app.post('/api/users/:userId/notifications', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const title = String(body.title || '').trim();
  const message = String(body.message || '').trim();
  if (!title) return c.json({ error: 'title is required' }, 400);
  if (!message) return c.json({ error: 'message is required' }, 400);

  const id = String(body.id || crypto.randomUUID());
  if (!isSafeId(id)) return c.json({ error: 'Invalid notification id' }, 400);
  const type = ['in-app', 'email', 'both'].includes(body.type) ? body.type : 'in-app';

  await c.env.DB.prepare(
    `INSERT INTO notifications (id, user_id, title, message, type, read, date, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 0, COALESCE(?, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       message = excluded.message,
       type = excluded.type,
       updated_at = CURRENT_TIMESTAMP`
  ).bind(id, userId, title, message, type, body.date || null).run();

  const notification = await c.env.DB.prepare(
    `SELECT * FROM notifications WHERE id = ? LIMIT 1`
  ).bind(id).first<NotificationRow>();

  return c.json({ notification: notification ? mapNotification(notification) : null });
});

app.patch('/api/users/:userId/notifications/:id', async (c) => {
  const userId = c.req.param('userId');
  const id = c.req.param('id');
  if (!isSafeId(userId) || !isSafeId(id)) return c.json({ error: 'Invalid notification identifier' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  await c.env.DB.prepare(
    `UPDATE notifications
     SET read = 1, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id IN (?, 'broadcast')`
  ).bind(id, userId).run();

  return c.json({ ok: true });
});

app.post('/api/users/:userId/notifications/mark-all-read', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  await c.env.DB.prepare(
    `UPDATE notifications
     SET read = 1, updated_at = CURRENT_TIMESTAMP
     WHERE user_id IN (?, 'broadcast')`
  ).bind(userId).run();

  return c.json({ ok: true });
});

const earningPoints: Record<string, number> = {
  e1: 5,
  e2: 10,
  e3: 20,
  e4: 5,
  e5: 15,
  e6: 10,
};

const ensureGamificationRow = async (db: D1DatabaseBinding, userId: string) => {
  await db.prepare(
    `INSERT INTO user_gamification (user_id, current_streak, longest_streak, points, unlocked_achievements, updated_at)
     VALUES (?, 0, 0, 0, '[]', CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO NOTHING`
  ).bind(userId).run();

  return db.prepare(
    `SELECT * FROM user_gamification WHERE user_id = ? LIMIT 1`
  ).bind(userId).first<GamificationRow>();
};

app.get('/api/users/:userId/gamification', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) {
    return c.json({
      gamification: {
        userId,
        stats: { currentStreak: 0, longestStreak: 0, points: 0 },
        unlockedAchievements: [],
      },
      source: 'fallback',
    });
  }

  const row = await ensureGamificationRow(c.env.DB, userId);
  return c.json({ gamification: row ? mapGamification(row) : null, source: 'd1' });
});

app.post('/api/users/:userId/gamification/events', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const actionId = String(body.actionId || '').trim();
  const points = earningPoints[actionId] || 0;
  if (!points) return c.json({ error: 'Unknown earning action' }, 400);

  const existing = await ensureGamificationRow(c.env.DB, userId);
  const unlocked = existing ? parseTags(existing.unlocked_achievements) || [] : ['a1', 'a2', 'a3', 'a4'];
  const nextUnlocked = new Set(unlocked);
  let bonusPoints = 0;

  if (actionId === 'e4' && !nextUnlocked.has('a5')) {
    nextUnlocked.add('a5');
    bonusPoints += 15;
  }

  if (actionId === 'e5' && !nextUnlocked.has('a6')) {
    nextUnlocked.add('a6');
    bonusPoints += 25;
  }

  await c.env.DB.prepare(
    `UPDATE user_gamification
     SET points = points + ?,
         unlocked_achievements = ?,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(points + bonusPoints, JSON.stringify(Array.from(nextUnlocked)), userId).run();

  const updated = await ensureGamificationRow(c.env.DB, userId);
  return c.json({ gamification: updated ? mapGamification(updated) : null });
});

app.post('/api/users/:userId/gamification/redeem', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const cost = Math.max(0, Number(body.cost || 0));
  if (!cost) return c.json({ error: 'cost is required' }, 400);

  await ensureGamificationRow(c.env.DB, userId);
  await c.env.DB.prepare(
    `UPDATE user_gamification
     SET points = CASE WHEN points >= ? THEN points - ? ELSE points END,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(cost, cost, userId).run();

  const updated = await ensureGamificationRow(c.env.DB, userId);
  return c.json({ gamification: updated ? mapGamification(updated) : null });
});

app.get('/api/users/:userId/highlights', async (c) => {
  const userId = c.req.param('userId');
  const contentId = c.req.query('contentId') || '';
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!contentId) return c.json({ error: 'Missing contentId' }, 400);
  if (!c.env.DB) return c.json({ highlights: [], source: 'fallback' });

  const result = await c.env.DB.prepare(
    `SELECT * FROM highlights
     WHERE user_id = ? AND content_id = ?
     ORDER BY created_at ASC`
  ).bind(userId, contentId).all<HighlightRow>();

  return c.json({ highlights: result.results.map(mapHighlight), source: 'd1' });
});

app.post('/api/users/:userId/highlights', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const id = String(body.id || crypto.randomUUID());
  if (!isSafeId(id)) return c.json({ error: 'Invalid highlight id' }, 400);

  const contentId = String(body.contentId || '').trim();
  const text = String(body.text || '').trim();
  if (!contentId) return c.json({ error: 'contentId is required' }, 400);
  if (!text) return c.json({ error: 'text is required' }, 400);

  const color = ['yellow', 'blue', 'green', 'pink'].includes(body.color) ? body.color : 'yellow';
  const tags = Array.isArray(body.tags) ? JSON.stringify(body.tags.slice(0, 20)) : null;

  await c.env.DB.prepare(
    `INSERT INTO highlights (
      id, user_id, content_id, text, note, voice_note_url, tags, color, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, id) DO UPDATE SET
      content_id = excluded.content_id,
      text = excluded.text,
      note = excluded.note,
      voice_note_url = excluded.voice_note_url,
      tags = excluded.tags,
      color = excluded.color,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(
    id,
    userId,
    contentId,
    text,
    body.note ?? null,
    body.voiceNoteUrl ?? null,
    tags,
    color,
    body.createdAt || null
  ).run();

  const highlight = await c.env.DB.prepare(
    `SELECT * FROM highlights WHERE user_id = ? AND id = ? LIMIT 1`
  ).bind(userId, id).first<HighlightRow>();

  return c.json({ highlight: highlight ? mapHighlight(highlight) : null });
});

app.patch('/api/users/:userId/highlights/:id', async (c) => {
  const userId = c.req.param('userId');
  const id = c.req.param('id');
  if (!isSafeId(userId) || !isSafeId(id)) return c.json({ error: 'Invalid highlight identifier' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const tags = Array.isArray(body.tags) ? JSON.stringify(body.tags.slice(0, 20)) : null;

  await c.env.DB.prepare(
    `UPDATE highlights
     SET note = COALESCE(?, note),
         voice_note_url = COALESCE(?, voice_note_url),
         tags = COALESCE(?, tags),
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ? AND id = ?`
  ).bind(
    body.note ?? null,
    body.voiceNoteUrl ?? null,
    tags,
    userId,
    id
  ).run();

  const highlight = await c.env.DB.prepare(
    `SELECT * FROM highlights WHERE user_id = ? AND id = ? LIMIT 1`
  ).bind(userId, id).first<HighlightRow>();

  if (!highlight) return c.json({ error: 'Highlight not found' }, 404);
  return c.json({ highlight: mapHighlight(highlight) });
});

app.delete('/api/users/:userId/highlights/:id', async (c) => {
  const userId = c.req.param('userId');
  const id = c.req.param('id');
  if (!isSafeId(userId) || !isSafeId(id)) return c.json({ error: 'Invalid highlight identifier' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  await c.env.DB.prepare(`DELETE FROM highlights WHERE user_id = ? AND id = ?`).bind(userId, id).run();
  return c.json({ ok: true });
});

app.get('/api/users/:userId/journal', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ entries: [], source: 'fallback' });

  const result = await c.env.DB.prepare(
    `SELECT * FROM journal_entries
     WHERE user_id = ?
     ORDER BY created_at DESC`
  ).bind(userId).all<JournalEntryRow>();

  return c.json({ entries: result.results.map(mapJournalEntry), source: 'd1' });
});

app.post('/api/users/:userId/journal', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const body = await c.req.json();
  const id = String(body.id || crypto.randomUUID());
  if (!isSafeId(id)) return c.json({ error: 'Invalid journal entry id' }, 400);

  const text = String(body.text || '').trim();
  if (!text) return c.json({ error: 'text is required' }, 400);
  if (text.length > 12000) return c.json({ error: 'text must be 12000 characters or fewer' }, 400);

  const color = ['blue', 'green', 'yellow', 'pink'].includes(body.color) ? body.color : 'blue';
  const prompt = String(body.prompt || '').trim() || null;

  await c.env.DB.prepare(
    `INSERT INTO journal_entries (
      id, user_id, text, color, prompt, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, id) DO UPDATE SET
      text = excluded.text,
      color = excluded.color,
      prompt = excluded.prompt,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(
    id,
    userId,
    text,
    color,
    prompt,
    body.createdAt || null
  ).run();

  const entry = await c.env.DB.prepare(
    `SELECT * FROM journal_entries WHERE user_id = ? AND id = ? LIMIT 1`
  ).bind(userId, id).first<JournalEntryRow>();

  return c.json({ entry: entry ? mapJournalEntry(entry) : null });
});

app.delete('/api/users/:userId/journal/:id', async (c) => {
  const userId = c.req.param('userId');
  const id = c.req.param('id');
  if (!isSafeId(userId) || !isSafeId(id)) return c.json({ error: 'Invalid journal entry identifier' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  await c.env.DB.prepare(`DELETE FROM journal_entries WHERE user_id = ? AND id = ?`).bind(userId, id).run();
  return c.json({ ok: true });
});

app.get('/api/admin/users', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  if (!c.env.DB) return c.json({ users: [], stats: { total: 0, admins: 0, active30d: 0 }, source: 'fallback' });

  const users = await c.env.DB.prepare(
    `SELECT * FROM users ORDER BY COALESCE(last_active_at, created_at) DESC`
  ).all<UserRow>();

  const stats = await c.env.DB.prepare(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
      SUM(CASE WHEN last_active_at >= datetime('now', '-30 days') THEN 1 ELSE 0 END) as active30d
     FROM users`
  ).first<{ total: number; admins: number; active30d: number }>();

  return c.json({
    users: users.results.map(mapUser),
    stats: {
      total: Number(stats?.total || 0),
      admins: Number(stats?.admins || 0),
      active30d: Number(stats?.active30d || 0),
    },
    source: 'd1',
  });
});

// POST /api/admin/users/:id/role — promote/demote a user. D1 users.role is the single
// source of truth (see isAdminRequest). Admin-guarded. The bootstrap super-admin emails
// can never be demoted here so the founder is never locked out of the role table.
const ASSIGNABLE_ROLES = ['user', 'family_lead', 'group_lead', 'lead_developer', 'admin'] as const;

app.post('/api/admin/users/:id/role', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;
  if (!c.env.DB) return c.json({ error: 'DB_UNAVAILABLE', message: 'User store is unavailable.' }, 503);

  const id = c.req.param('id');
  if (!isSafeId(id)) return c.json({ error: 'INVALID_ID' }, 400);

  const body = await c.req.json().catch(() => ({}));
  const role = String(body.role || '').trim();
  if (!ASSIGNABLE_ROLES.includes(role as (typeof ASSIGNABLE_ROLES)[number])) {
    return c.json({ error: 'INVALID_ROLE', message: `Role must be one of: ${ASSIGNABLE_ROLES.join(', ')}` }, 400);
  }

  const target = await c.env.DB.prepare(
    `SELECT id, email, role FROM users WHERE id = ? LIMIT 1`,
  ).bind(id).first<{ id: string; email: string; role: string }>();
  if (!target) return c.json({ error: 'USER_NOT_FOUND' }, 404);

  // The founder allowlist is the un-removable root: never let it be demoted below admin.
  if (ADMIN_EMAILS.includes((target.email || '').toLowerCase()) && role !== 'admin') {
    return c.json({ error: 'PROTECTED_SUPER_ADMIN', message: 'The founder account cannot be demoted.' }, 409);
  }

  await c.env.DB.prepare(
    `UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
  ).bind(role, id).run();

  const updated = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ? LIMIT 1`).bind(id).first<UserRow>();
  return c.json({ user: updated ? mapUser(updated) : null, source: 'd1' });
});

app.post('/api/auth/profile', async (c) => {
  // SECURITY (C-3): identity + role come from the VERIFIED Firebase ID token, never the
  // request body. Previously role/tier were derived from body.email, so anyone could POST
  // {email:"pastor.eryeza@gmail.com"} and receive an admin profile. Require a verified token.
  const sessionUid = c.get('idTokenUid');
  const sessionEmail = (c.get('idTokenEmail') || '').toLowerCase();
  const sessionEmailVerified = c.get('idTokenEmailVerified') === true;
  if (!sessionUid || !sessionEmail) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const body = await c.req.json().catch(() => ({}));
  const id = sessionUid;
  const email = sessionEmail;

  const displayName = String(body.displayName || '').trim() || null;
  const photoUrl = String(body.photoURL || body.photoUrl || '').trim() || null;
  // Admin only for a VERIFIED ministry-owner email (matches isAdminRequest's allowlist).
  const isMinistryAdmin = sessionEmailVerified && ADMIN_EMAILS.includes(email);
  const defaultRole = isMinistryAdmin ? 'admin' : 'user';
  const defaultTier = isMinistryAdmin ? 'max' : 'free';

  if (!c.env.DB) {
    return c.json({
      user: {
        uid: id,
        id,
        email,
        displayName: displayName || undefined,
        photoURL: photoUrl || undefined,
        role: defaultRole,
        tier: defaultTier,
      },
      source: 'fallback',
    });
  }

  await c.env.DB.prepare(
    `INSERT INTO users (
      id, email, display_name, photo_url, role, tier, created_at, updated_at, last_active_at
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(email) DO UPDATE SET
      display_name = excluded.display_name,
      photo_url = excluded.photo_url,
      last_active_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(id, email, displayName, photoUrl, defaultRole, defaultTier).run();

  const user = await c.env.DB.prepare(
    `SELECT * FROM users WHERE email = ? LIMIT 1`
  ).bind(email).first<UserRow>();

  if (!user) return c.json({ error: 'Profile could not be loaded' }, 500);
  return c.json({ user: mapUser(user), source: 'd1' });
});

app.get('/api/auth/preview-session', async (c) => {
  if (!isLocalPreviewRequest(c)) {
    return c.json({
      error: 'PREVIEW_SESSION_UNAVAILABLE',
      message: 'Preview sessions are only available on the local Cloudflare Pages preview server.',
    }, 404);
  }

  const adminEmail = (c.env.ADMIN_EMAIL || 'pastor.eryeza@gmail.com').toLowerCase();
  const previewUser = {
    uid: 'preview-admin',
    id: 'preview-admin',
    email: adminEmail,
    displayName: 'Preview Admin',
    photoURL: undefined,
    role: 'admin',
    tier: 'max',
  };

  if (!c.env.DB) {
    return c.json({ user: previewUser, source: 'preview-fallback' });
  }

  await c.env.DB.prepare(
    `INSERT INTO users (
      id, email, display_name, photo_url, role, tier, created_at, updated_at, last_active_at
    ) VALUES (?, ?, ?, ?, 'admin', 'max', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(email) DO UPDATE SET
      role = 'admin',
      tier = 'max',
      last_active_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP`
  ).bind(previewUser.id, previewUser.email, previewUser.displayName, null).run();

  const user = await c.env.DB.prepare(
    `SELECT * FROM users WHERE email = ? LIMIT 1`
  ).bind(previewUser.email).first<UserRow>();

  return c.json({ user: user ? mapUser(user) : previewUser, source: 'local-preview' });
});

// ─── Cloudflare-native Google OAuth + JWT session ────────────────────────────

const JWT_COOKIE = 'ccn_session';
// No hardcoded fallback secret: a missing AUTH_SECRET must fail closed, never sign
// with a public constant (which would let anyone forge an admin session JWT).

async function signSession(payload: Record<string, unknown>, secret: string): Promise<string> {
  const key = new TextEncoder().encode(secret);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

async function verifySession(token: string, secret: string): Promise<Record<string, unknown> | null> {
  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, key);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getCookieValue(req: Request, name: string): string | undefined {
  const header = req.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return undefined;
}

function makeSessionCookie(token: string): string {
  return `${JWT_COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`;
}

function clearSessionCookie(): string {
  return `${JWT_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

async function upsertGoogleUser(
  db: D1DatabaseBinding,
  userId: string,
  email: string,
  displayName: string,
  photoUrl: string | null,
  adminEmail: string,
): Promise<{ role: string; tier: string }> {
  const isAdmin = email === adminEmail;
  await db.prepare(
    `INSERT INTO users (id, email, display_name, photo_url, role, tier, created_at, updated_at, last_active_at)
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT(email) DO UPDATE SET
       display_name = excluded.display_name,
       photo_url    = excluded.photo_url,
       last_active_at = CURRENT_TIMESTAMP,
       updated_at   = CURRENT_TIMESTAMP`
  ).bind(userId, email, displayName, photoUrl, isAdmin ? 'admin' : 'user', isAdmin ? 'max' : 'free').run();

  const row = await db.prepare(`SELECT role, tier FROM users WHERE email = ? LIMIT 1`).bind(email).first<{ role: string; tier: string }>();
  return row || { role: isAdmin ? 'admin' : 'user', tier: isAdmin ? 'max' : 'free' };
}

// GET /api/auth/google — redirect to Google OAuth (or issue preview session locally)
app.get('/api/auth/google', async (c) => {
  const secret = c.env.AUTH_SECRET;
  if (!secret) return c.json({ error: 'AUTH_NOT_CONFIGURED', message: 'Server auth is not configured.' }, 500);
  const adminEmail = (c.env.ADMIN_EMAIL || 'pastor.eryeza@gmail.com').toLowerCase();

  if (isLocalPreviewRequest(c)) {
    if (c.env.DB) {
      await upsertGoogleUser(c.env.DB, 'preview-admin', adminEmail, 'Preview Admin', null, adminEmail);
    }
    const token = await signSession({ sub: 'preview-admin', email: adminEmail, name: 'Preview Admin', picture: null, role: 'admin', tier: 'max' }, secret);
    return new Response(null, {
      status: 302,
      headers: { Location: '/app/guided-journey', 'Set-Cookie': makeSessionCookie(token) },
    });
  }

  if (!c.env.GOOGLE_CLIENT_ID) {
    return c.json({ error: 'GOOGLE_CLIENT_ID is not configured. Add it as a Cloudflare secret.' }, 503);
  }

  const state = crypto.randomUUID();
  const origin = new URL(c.req.url).origin;
  const callbackUrl = `${origin}/api/auth/callback/google`;

  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', c.env.GOOGLE_CLIENT_ID);
  googleUrl.searchParams.set('redirect_uri', callbackUrl);
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('state', state);
  googleUrl.searchParams.set('access_type', 'online');
  googleUrl.searchParams.set('prompt', 'select_account');

  return new Response(null, {
    status: 302,
    headers: {
      Location: googleUrl.toString(),
      'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/api/auth; Max-Age=600`,
    },
  });
});

// GET /api/auth/callback/google — exchange code, issue session cookie
app.get('/api/auth/callback/google', async (c) => {
  const { code, state, error } = c.req.query();

  if (error) return new Response(null, { status: 302, headers: { Location: '/?auth_error=access_denied' } });

  const storedState = getCookieValue(c.req.raw, 'oauth_state');
  if (!storedState || storedState !== state) {
    return new Response(null, { status: 302, headers: { Location: '/?auth_error=state_mismatch' } });
  }

  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) {
    return c.json({ error: 'Google OAuth credentials are not configured.' }, 503);
  }

  const origin = new URL(c.req.url).origin;
  const callbackUrl = `${origin}/api/auth/callback/google`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: c.env.GOOGLE_CLIENT_ID, client_secret: c.env.GOOGLE_CLIENT_SECRET, redirect_uri: callbackUrl, grant_type: 'authorization_code' }).toString(),
  });

  if (!tokenRes.ok) return new Response(null, { status: 302, headers: { Location: '/?auth_error=token_failed' } });

  const tokens = await tokenRes.json() as { access_token: string };

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) return new Response(null, { status: 302, headers: { Location: '/?auth_error=userinfo_failed' } });

  const gu = await userRes.json() as { sub: string; email: string; name: string; picture?: string };
  const email = gu.email.toLowerCase();
  const userId = `google-${gu.sub}`;
  const adminEmail = (c.env.ADMIN_EMAIL || 'pastor.eryeza@gmail.com').toLowerCase();

  const { role, tier } = c.env.DB
    ? await upsertGoogleUser(c.env.DB, userId, email, gu.name, gu.picture || null, adminEmail)
    : { role: email === adminEmail ? 'admin' : 'user', tier: email === adminEmail ? 'max' : 'free' };

  const secret = c.env.AUTH_SECRET;
  if (!secret) return c.json({ error: 'AUTH_NOT_CONFIGURED', message: 'Server auth is not configured.' }, 500);
  const token = await signSession({ sub: userId, email, name: gu.name, picture: gu.picture || null, role, tier }, secret);

  return new Response(null, {
    status: 302,
    headers: { Location: '/app/guided-journey', 'Set-Cookie': makeSessionCookie(token) },
  });
});

// GET /api/auth/session — return current user from JWT cookie
app.get('/api/auth/session', async (c) => {
  const secret = c.env.AUTH_SECRET;
  if (!secret) return c.json({ user: null }, 200);
  const token = getCookieValue(c.req.raw, JWT_COOKIE);
  if (!token) return c.json({ user: null });

  const payload = await verifySession(token, secret);
  if (!payload) return c.json({ user: null });

  if (c.env.DB && payload.email) {
    const row = await c.env.DB.prepare(`SELECT * FROM users WHERE email = ? LIMIT 1`).bind(payload.email).first<UserRow>();
    if (row) {
      return c.json({
        user: {
          uid: row.id, id: row.id,
          email: row.email,
          displayName: row.display_name || payload.name || '',
          photoURL: row.photo_url || payload.picture || null,
          role: row.role,
          tier: row.tier,
        },
      });
    }
  }

  return c.json({
    user: {
      uid: String(payload.sub),
      id: String(payload.sub),
      email: String(payload.email),
      displayName: String(payload.name || ''),
      photoURL: payload.picture ? String(payload.picture) : null,
      role: String(payload.role || 'user'),
      tier: String(payload.tier || 'free'),
    },
  });
});

// POST /api/auth/signout — clear session cookie
app.post('/api/auth/signout', (c) => {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearSessionCookie() },
  });
});

// ─── Contact / Help Form ─────────────────────────────────────────────────────
// Accepts POST from both authenticated and anonymous users.
// Security: validates all fields, sanitizes input, rate-limits by hashed IP.
const CONTACT_CATEGORIES = [
  'Technical Issue',
  'Content Feedback',
  'Account Question',
  'Prayer & Spiritual Support',
  'Partnership / Business',
  'Other',
];

function sanitizeInput(str: string): string {
  return str.replace(/<[^>]*>/g, '').replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[c] ?? c;
  }).trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

app.post('/api/contact', async (c) => {
  // ── CSRF: only allow same origin and trusted clients
  const origin = c.req.header('origin') ?? '';
  const productionOrigin = c.env.PRODUCTION_ORIGIN ?? 'https://theccndaily.com';
  const allowedOrigins = [productionOrigin, 'http://localhost:5173', 'http://localhost:8788'];
  const isPagesPreview = /^https:\/\/[a-z0-9-]+\.project-phoenix-ccn-daily\.pages\.dev$/.test(origin);
  if (!isPagesPreview && !allowedOrigins.some(o => origin.startsWith(o))) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // ── Durable rate limiting (D1 fixed window, shared across isolates)
  const ip = requestIp(c);
  const limited = await enforceRateLimit(c, 'contact', ip, 3, 600);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  // ── Turnstile (enforced once TURNSTILE_SECRET_KEY is provisioned)
  if (!(await verifyTurnstile(c, body.turnstileToken))) {
    return c.json({ error: 'Verification failed. Please refresh and try again.' }, 403);
  }

  const name     = typeof body.name     === 'string' ? body.name.trim()     : '';
  const email    = typeof body.email    === 'string' ? body.email.trim()    : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const message  = typeof body.message  === 'string' ? body.message.trim()  : '';

  // ── Validation
  if (!name || name.length > 100)              return c.json({ error: 'Invalid name' }, 422);
  if (!email || !isValidEmail(email))           return c.json({ error: 'Invalid email' }, 422);
  if (!CONTACT_CATEGORIES.includes(category))  return c.json({ error: 'Invalid category' }, 422);
  if (message.length < 10 || message.length > 2000) return c.json({ error: 'Message must be 10–2000 characters' }, 422);

  // ── Write to D1 if available, otherwise log (graceful degradation)
  const db = c.env.DB;
  if (db) {
    try {
      await db.prepare(
        `CREATE TABLE IF NOT EXISTS help_messages (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          category TEXT NOT NULL,
          message TEXT NOT NULL,
          ip_hint TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`
      ).run();
      await db.prepare(
        `INSERT INTO help_messages (id, name, email, category, message, ip_hint, created_at)
         VALUES (lower(hex(randomblob(8))), ?, ?, ?, ?, ?, datetime('now'))`
      ).bind(
        sanitizeInput(name),
        sanitizeInput(email),
        category,
        sanitizeInput(message),
        ip.slice(0, 8) // store only first octet hint, not full IP
      ).run();
    } catch (error) {
      console.error('Help message write failed', error);
      return c.json({ error: 'Your message could not be saved. Please try again.' }, 500);
    }
  }

  return c.json({ success: true });
});

// Admin: read contact/help submissions stored in D1 by /api/contact.
app.get('/api/admin/help-messages', async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  if (!c.env.DB) return c.json({ messages: [], source: 'fallback' });

  try {
    const result = await c.env.DB.prepare(
      `SELECT id, name, email, category, message, created_at
       FROM help_messages
       ORDER BY created_at DESC
       LIMIT 200`
    ).all<{ id: string; name: string; email: string; category: string; message: string; created_at: string }>();

    return c.json({
      messages: result.results.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        category: row.category,
        message: row.message,
        createdAt: row.created_at,
      })),
      source: 'd1',
    });
  } catch {
    // Table may not exist until the first submission arrives.
    return c.json({ messages: [], source: 'd1' });
  }
});

// ── Email: gift notification ───────────────────────────────────────────────
app.post('/api/email/gift', async (c) => {
  const origin = c.req.header('origin') || '';
  const production = c.env.PRODUCTION_ORIGIN || 'https://theccndaily.com';
  const isLocal = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
  if (!isLocal && origin !== production) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const limited = await enforceRateLimit(c, 'email-gift', requestIp(c), 5, 3600);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
  }

  const recipientEmail = typeof body.recipientEmail === 'string' ? body.recipientEmail.trim() : '';
  const senderName     = typeof body.senderName     === 'string' ? body.senderName.trim()     : 'THE CCN DAILY Team';
  const giftedItem     = typeof body.giftedItemTitle === 'string' ? body.giftedItemTitle.trim() : 'a gift';
  const personalMsg    = typeof body.personalMessage === 'string' ? body.personalMessage.trim() : '';

  if (!recipientEmail || !isValidEmail(recipientEmail)) {
    return c.json({ error: 'Valid recipient email is required' }, 422);
  }

  // Graceful fallback: if Resend is not configured, acknowledge without sending
  if (!c.env.RESEND_API_KEY) {
    return c.json({ success: true, source: 'no-op', reason: 'RESEND_API_KEY not configured' });
  }

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#1a1210;color:#f0ebe4;padding:40px 32px;border-radius:12px">
      <h2 style="color:#F27D26;font-size:22px;margin-bottom:8px">You have received a gift.</h2>
      <p style="margin:0 0 16px"><strong>${sanitizeInput(senderName)}</strong> has shared <strong>${sanitizeInput(giftedItem)}</strong> with you through THE CCN DAILY.</p>
      ${personalMsg ? `<blockquote style="border-left:3px solid #F27D26;padding-left:16px;margin:20px 0;font-style:italic;color:#c8b89a">${sanitizeInput(personalMsg)}</blockquote>` : ''}
      <p>Log in to your account to access your content.</p>
      <p style="margin-top:32px;font-size:12px;color:#7a6a60">THE CCN DAILY — theccndaily.com</p>
    </div>`;

  const text = `${senderName} has shared ${giftedItem} with you through THE CCN DAILY.${personalMsg ? '\n\n"' + personalMsg + '"' : ''}\n\nLog in to your account to access your content.`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey(c.env)}`,
      },
      body: JSON.stringify({
        from: 'THE CCN DAILY <gifts@updates.theccndaily.com>',
        to: [recipientEmail],
        subject: `You've received a gift: ${giftedItem}`,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as Record<string, unknown>;
      return c.json({ success: false, error: String(err.message || 'Email send failed') }, 502);
    }

    const data = await res.json() as Record<string, unknown>;
    return c.json({ success: true, messageId: data.id || undefined, source: 'resend' });
  } catch {
    return c.json({ success: false, error: 'Email delivery failed' }, 500);
  }
});

// ── Scholarships (admin-decided) ───────────────────────────────────────────────
// Admin accepts/declines a scholarship application. On accept we grant the tier in D1
// for a fixed window (same entitlement path the payment webhook uses) and email the
// applicant. On decline we email the reason. The Firestore application record + any
// in-app notification are written by the admin client; this endpoint owns the D1 grant
// + email (the parts the client cannot do).
app.post('/api/admin/scholarship-decide', async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;

  const body = await c.req.json().catch(() => ({} as Record<string, unknown>));
  const decision = body.decision === 'accept' ? 'accept' : 'decline';
  const email = String(body.email || '').trim();
  const name = String(body.name || 'Friend').trim();
  const declineReason = String(body.declineReason || '').trim();

  if (decision === 'accept') {
    if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);
    const userId = String(body.userId || '').trim();
    if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);

    const tier = body.tier === 'max' ? 'max' : body.tier === 'partner' ? 'partner' : 'pro';
    const months = Number(body.months) > 0 ? Math.min(Math.floor(Number(body.months)), 24) : 6;
    const ends = new Date();
    ends.setMonth(ends.getMonth() + months);
    const endsAt = ends.toISOString();
    const resourceId = `tier:${tier}`;
    const entitlementId = crypto.randomUUID();

    await c.env.DB.batch([
      c.env.DB.prepare(
        `INSERT INTO user_subscriptions (user_id, tier, status, started_at, ends_at, updated_at)
         VALUES (?, ?, 'active', CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO UPDATE SET
           tier = excluded.tier, status = 'active',
           started_at = COALESCE(user_subscriptions.started_at, CURRENT_TIMESTAMP),
           ends_at = excluded.ends_at, updated_at = CURRENT_TIMESTAMP`
      ).bind(userId, tier, endsAt),
      c.env.DB.prepare(`UPDATE users SET tier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(tier, userId),
      c.env.DB.prepare(
        `INSERT INTO user_entitlements (id, user_id, resource_id, access_type, source, starts_at, ends_at, is_active)
         VALUES (?, ?, ?, 'subscription_included', 'scholarship', CURRENT_TIMESTAMP, ?, 1)`
      ).bind(entitlementId, userId, resourceId, endsAt),
    ]);

    if (c.env.RESEND_API_KEY && email && isValidEmail(email)) {
      const html = `
        <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#1a1210;color:#f0ebe4;padding:40px 32px;border-radius:12px">
          <h2 style="color:#F27D26;font-size:22px;margin-bottom:8px">Your scholarship is approved 🎉</h2>
          <p>Dear ${sanitizeInput(name)},</p>
          <p>We're glad to welcome you. Your <strong>Growth (premium)</strong> access is now active for <strong>${months} months</strong> — full access to courses, audiobooks, study tools, and the growing library.</p>
          <p>Log in to theccndaily.com and begin. May it deepen your walk.</p>
          <p style="margin-top:32px;font-size:12px;color:#7a6a60">THE CCN DAILY — theccndaily.com</p>
        </div>`;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey(c.env)}` },
        body: JSON.stringify({ from: 'THE CCN DAILY <gifts@updates.theccndaily.com>', to: [email], subject: 'Your CCN Daily scholarship is approved', html }),
      }).catch(() => {});
    }

    return c.json({ decided: 'accept', tier, endsAt });
  }

  // Decline — email the reason (best-effort).
  if (c.env.RESEND_API_KEY && email && isValidEmail(email)) {
    const html = `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#1a1210;color:#f0ebe4;padding:40px 32px;border-radius:12px">
        <h2 style="color:#F27D26;font-size:22px;margin-bottom:8px">About your scholarship application</h2>
        <p>Dear ${sanitizeInput(name)},</p>
        <p>Thank you for applying. We're unable to approve your scholarship at this time.</p>
        ${declineReason ? `<blockquote style="border-left:3px solid #F27D26;padding-left:16px;margin:20px 0;font-style:italic;color:#c8b89a">${sanitizeInput(declineReason)}</blockquote>` : ''}
        <p>You're warmly welcome to continue on the free plan, and to apply again later.</p>
        <p style="margin-top:32px;font-size:12px;color:#7a6a60">THE CCN DAILY — theccndaily.com</p>
      </div>`;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey(c.env)}` },
      body: JSON.stringify({ from: 'THE CCN DAILY <gifts@updates.theccndaily.com>', to: [email], subject: 'Your CCN Daily scholarship application', html }),
    }).catch(() => {});
  }

  return c.json({ decided: 'decline' });
});

// POST /api/scholarship-submitted — called by the applicant right after they create
// their application. Sends them an acknowledgement, and alerts admins that something
// needs review IN THE DASHBOARD (no applicant data in the alert — the dashboard is the
// system of record). The applicant email is taken from the verified token, never the
// body, so this can't be used to email arbitrary addresses.
app.post('/api/scholarship-submitted', async (c) => {
  const applicantEmail = (c.get('idTokenEmail') || '').trim();
  const uid = c.get('idTokenUid');
  if (!uid || !applicantEmail) return c.json({ error: 'unauthorized' }, 401);

  // Caps acknowledgement/alert email volume per applicant (Resend cost + admin noise).
  const limited = await enforceRateLimit(c, 'scholarship-submit', String(uid), 3, 3600);
  if (limited) return limited;

  if (!c.env.RESEND_API_KEY) return c.json({ ok: true, source: 'no-op' });

  const body = await c.req.json().catch(() => ({} as Record<string, unknown>));
  const name = sanitizeInput(String(body.name || 'Friend').trim().slice(0, 120));
  const sendEmail = (to: string[], subject: string, html: string) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey(c.env)}` },
      body: JSON.stringify({ from: 'THE CCN DAILY <gifts@updates.theccndaily.com>', to, subject, html }),
    }).catch(() => {});

  // 1. Acknowledge to the applicant.
  if (isValidEmail(applicantEmail)) {
    await sendEmail(
      [applicantEmail],
      'We received your scholarship application',
      `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#1a1210;color:#f0ebe4;padding:40px 32px;border-radius:12px">
        <h2 style="color:#F27D26;font-size:22px;margin-bottom:8px">Thank you, ${name}.</h2>
        <p>We've received your scholarship application and our team will review it soon. We'll email you with the outcome.</p>
        <p>Grace and peace,<br/>THE CCN DAILY</p>
        <p style="margin-top:32px;font-size:12px;color:#7a6a60">theccndaily.com</p>
      </div>`,
    );
  }

  // 2. Attention-only alert to admins — points to the dashboard, carries no applicant data.
  const extras = String(c.env.ADMIN_NOTIFY_EMAILS || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  const recipients = [...new Set([...ADMIN_EMAILS, ...extras])].filter(isValidEmail);
  if (recipients.length) {
    await sendEmail(
      recipients,
      'New scholarship application — review needed',
      `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#1a1210;color:#f0ebe4;padding:40px 32px;border-radius:12px">
        <h2 style="color:#F27D26;font-size:22px;margin-bottom:8px">A scholarship application needs review</h2>
        <p>A new application has been submitted. Open the dashboard to review and decide.</p>
        <p><a href="https://theccndaily.com/#/studio/scholarships" style="color:#F27D26">Review in the dashboard →</a></p>
        <p style="margin-top:32px;font-size:12px;color:#7a6a60">You're receiving this because you help steward CCN Daily. Details stay in the app.</p>
      </div>`,
    );
  }

  return c.json({ ok: true });
});

// ── Payments → entitlements (server-authoritative) ─────────────────────────────
// The CLIENT NEVER sets the price or grants access. Flow:
//   1. POST /api/payments/intent  → server computes the authoritative price from
//      tier + billing cycle + PPP (request.cf.country), records a `pending`
//      user_purchases row keyed by a server-generated tx_ref, and returns the
//      amount/currency/tx_ref/publicKey for the client to initialize Flutterwave.
//   2. Flutterwave charges the customer and calls our webhook.
//   3. POST /api/payments/flutterwave/webhook → verify verif-hash, RE-VERIFY the
//      transaction via Flutterwave's API, confirm status + amount, then (idempotently)
//      upsert the subscription, write the entitlement, and mark the purchase active.

type PaidTierServer = 'pro' | 'max' | 'partner';

// Base USD prices (authoritative; mirror types/pricing.ts + utils/ppp.ts).
const TIER_BASE_PRICE_USD: Record<PaidTierServer, { monthly: number; yearly: number }> = {
  pro: { monthly: 8.99, yearly: 59.99 },
  max: { monthly: 14.99, yearly: 129.99 },
  partner: { monthly: 24.99, yearly: 199.99 },
};

// PPP multipliers by tier (mirror utils/ppp.ts PPP_MULTIPLIERS).
const PPP_TIER_MULTIPLIER = { TIER_1: 1.0, TIER_2: 0.7, TIER_3: 0.5, TIER_4: 0.3 } as const;
type PppTier = keyof typeof PPP_TIER_MULTIPLIER;

// Country → PPP tier + currency. Mirrors utils/ppp.ts and ADDS Uganda (UG).
// Currency is the suggested local currency; amounts are computed in USD and only
// converted to a non-USD currency when we hold a reliable rate. To stay safe with
// money, we charge in USD by default unless the local currency is explicitly mapped
// with a fixed display rate below.
const COUNTRY_PPP_SERVER: Record<string, { tier: PppTier; currency: string }> = {
  US: { tier: 'TIER_1', currency: 'USD' },
  GB: { tier: 'TIER_1', currency: 'USD' },
  BR: { tier: 'TIER_3', currency: 'USD' },
  ZA: { tier: 'TIER_3', currency: 'USD' },
  IN: { tier: 'TIER_4', currency: 'USD' },
  NG: { tier: 'TIER_4', currency: 'USD' },
  KE: { tier: 'TIER_4', currency: 'USD' },
  PH: { tier: 'TIER_4', currency: 'USD' },
  UG: { tier: 'TIER_4', currency: 'USD' }, // Uganda — added per spec
};

// ─── Local-currency charging (mobile money unlock) ──────────────────────────
// Flutterwave only offers mobile-money rails when the charge currency is the
// local one. For supported countries we convert the PPP-adjusted USD price to
// a rounded local amount at a cached daily rate; everywhere else stays USD
// (cards). Conversion is server-authoritative and fail-safe: any rate problem
// falls back to USD rather than blocking a payment.

const LOCAL_CHARGE_CURRENCIES: Record<string, { currency: string; roundTo: number }> = {
  UG: { currency: 'UGX', roundTo: 500 },
  KE: { currency: 'KES', roundTo: 10 },
  TZ: { currency: 'TZS', roundTo: 500 },
  RW: { currency: 'RWF', roundTo: 100 },
  GH: { currency: 'GHS', roundTo: 1 },
  NG: { currency: 'NGN', roundTo: 100 },
  ZM: { currency: 'ZMW', roundTo: 1 },
  MW: { currency: 'MWK', roundTo: 100 },
  CM: { currency: 'XAF', roundTo: 100 },
  CI: { currency: 'XOF', roundTo: 100 },
  SN: { currency: 'XOF', roundTo: 100 },
  ZA: { currency: 'ZAR', roundTo: 1 },
};

const FX_CACHE_HOURS = 24;

const ensureFxTable = async (db: D1DatabaseBinding) => {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS fx_rates (
      currency TEXT PRIMARY KEY,
      usd_rate REAL NOT NULL,
      fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();
};

// Returns units of `currency` per 1 USD, from the daily D1 cache or a free
// public rate feed. Returns null when no trustworthy rate is available.
const getUsdRate = async (db: D1DatabaseBinding, currency: string): Promise<number | null> => {
  try {
    await ensureFxTable(db);
    const cached = await db.prepare(
      `SELECT usd_rate, fetched_at FROM fx_rates WHERE currency = ? LIMIT 1`
    ).bind(currency).first<{ usd_rate: number; fetched_at: string }>();

    const fresh = cached && Date.now() - Date.parse(cached.fetched_at) < FX_CACHE_HOURS * 3600 * 1000;
    if (cached && fresh && cached.usd_rate > 0) return cached.usd_rate;

    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json().catch(() => null) as { result?: string; rates?: Record<string, number> } | null;
    const rate = data?.result === 'success' ? Number(data.rates?.[currency]) : NaN;

    if (Number.isFinite(rate) && rate > 0) {
      await db.prepare(
        `INSERT INTO fx_rates (currency, usd_rate, fetched_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(currency) DO UPDATE SET usd_rate = excluded.usd_rate, fetched_at = CURRENT_TIMESTAMP`
      ).bind(currency, rate).run();
      return rate;
    }

    // Feed unavailable — a stale cached rate is still better than losing
    // mobile money, as the webhook verifies the recorded amount either way.
    if (cached && cached.usd_rate > 0) return cached.usd_rate;
    return null;
  } catch (error) {
    console.error('FX rate lookup failed', error);
    return null;
  }
};

// Convert a USD amount for the visitor's country. Rounds to a clean local
// denomination so prices read naturally (e.g. UGX 16,500 not UGX 16,437.18).
const localizeAmount = async (
  db: D1DatabaseBinding | undefined,
  usdAmount: number,
  country: string,
): Promise<{ amount: number; currency: string; usdAmount: number }> => {
  const local = LOCAL_CHARGE_CURRENCIES[(country || '').toUpperCase()];
  if (!local || !db) return { amount: usdAmount, currency: 'USD', usdAmount };

  const rate = await getUsdRate(db, local.currency);
  if (!rate) return { amount: usdAmount, currency: 'USD', usdAmount };

  const converted = usdAmount * rate;
  const rounded = Math.max(local.roundTo, Math.round(converted / local.roundTo) * local.roundTo);
  return { amount: rounded, currency: local.currency, usdAmount };
};

// Compute the AUTHORITATIVE amount + currency for a tier/cycle/country.
const computeAuthoritativePrice = (
  tier: PaidTierServer,
  cycle: 'monthly' | 'yearly',
  country: string,
): { amount: number; currency: string; pppTier: PppTier; country: string } => {
  const upper = (country || 'US').toUpperCase();
  const geo = COUNTRY_PPP_SERVER[upper] || COUNTRY_PPP_SERVER.US;
  const base = TIER_BASE_PRICE_USD[tier][cycle];
  const amount = Number((base * PPP_TIER_MULTIPLIER[geo.tier]).toFixed(2));
  return { amount, currency: geo.currency, pppTier: geo.tier, country: upper };
};

const isPaidTierServer = (value: unknown): value is PaidTierServer =>
  value === 'pro' || value === 'max' || value === 'partner';

// POST /api/payments/intent
// Body: { userId, tier, billingCycle }. Records a pending purchase and returns the
// SERVER-computed amount + tx_ref so the client never sets the price.
app.post('/api/payments/intent', async (c) => {
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>));
  const userId = String(body.userId || '').trim();
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);

  // requireSelf: the authenticated token must match the userId in the body.
  const denied = requireSelf(c, userId); if (denied) return denied;

  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const tier = body.tier;
  if (!isPaidTierServer(tier)) return c.json({ error: 'Invalid tier' }, 400);

  const billingCycle: 'monthly' | 'yearly' = body.billingCycle === 'yearly' ? 'yearly' : 'monthly';

  // request.cf.country is provided by Cloudflare at the edge.
  const country = String((c.req.raw as any)?.cf?.country || 'US');

  const usdPrice = computeAuthoritativePrice(tier, billingCycle, country);
  if (!(usdPrice.amount > 0)) return c.json({ error: 'Could not compute price' }, 500);

  // Charge in the local currency where it unlocks mobile money; USD elsewhere.
  const { amount, currency, usdAmount } = await localizeAmount(c.env.DB, usdPrice.amount, country);

  const resourceId = `tier:${tier}`;
  const txRef = `sub_${userId}_${tier}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const id = crypto.randomUUID();

  // Record a pending purchase. The webhook later flips it to active after verifying.
  await c.env.DB.prepare(
    `INSERT INTO user_purchases (id, user_id, resource_id, tx_ref, amount, currency, status, purchased_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`
  ).bind(id, userId, resourceId, txRef, amount, currency).run();

  return c.json({
    tx_ref: txRef,
    amount,
    currency,
    usdAmount,
    billingCycle,
    tier,
    // Server-authoritative public key. FLUTTERWAVE_PUBLIC_KEY is the committed
    // (publishable) key in wrangler.toml [vars]; VITE_ name kept as a fallback.
    publicKey: c.env.FLUTTERWAVE_PUBLIC_KEY || c.env.VITE_FLUTTERWAVE_PUBLIC_KEY || undefined,
  });
});

// POST /api/giving/intent
// Creates a server-owned amount and tx_ref before the client opens Flutterwave.
// The webhook can verify the transaction against this pending row without granting
// subscription access because donation rows use resource_id = donation:*.
app.post('/api/giving/intent', async (c) => {
  const body = await c.req.json().catch(() => ({} as Record<string, unknown>));
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 1) return c.json({ error: 'Invalid giving amount' }, 400);
  if (amount > 100000) return c.json({ error: 'Giving amount is too large' }, 400);

  const userId = String(body.userId || '').trim();
  if (userId) {
    if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
    const denied = requireSelf(c, userId); if (denied) return denied;
  }

  const donorEmail = String(body.donorEmail || '').trim();
  if (donorEmail && !isValidEmail(donorEmail)) return c.json({ error: 'Invalid donor email' }, 400);
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const giftType = body.giftType === 'monthly' ? 'monthly' : 'one-time';

  // The client suggests gift amounts in USD; charge in the local currency
  // where that unlocks mobile money for the giver.
  const country = String((c.req.raw as any)?.cf?.country || 'US');
  const { amount: localAmount, currency, usdAmount } = await localizeAmount(
    c.env.DB,
    Number(amount.toFixed(2)),
    country,
  );
  const safeAmount = currency === 'USD' ? Number(localAmount.toFixed(2)) : localAmount;
  const txRef = `give_${userId || 'guest'}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const id = crypto.randomUUID();

  await c.env.DB.prepare(
    `INSERT INTO user_purchases (id, user_id, resource_id, tx_ref, amount, currency, status, purchased_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`
  ).bind(
    id,
    userId || `guest:${crypto.randomUUID()}`,
    `donation:${giftType}`,
    txRef,
    safeAmount,
    currency
  ).run();

  return c.json({
    tx_ref: txRef,
    amount: safeAmount,
    currency,
    usdAmount,
    giftType,
    publicKey: c.env.FLUTTERWAVE_PUBLIC_KEY || c.env.VITE_FLUTTERWAVE_PUBLIC_KEY || undefined,
  });
});

// GET /api/giving/status/:txRef
// Lets the client read back the server-verified donation state after Flutterwave
// calls the webhook. This endpoint intentionally returns no donor identity.
app.get('/api/giving/status/:txRef', async (c) => {
  const txRef = c.req.param('txRef');
  if (!isSafeId(txRef) || !txRef.startsWith('give_')) {
    return c.json({ error: 'Invalid giving reference' }, 400);
  }
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  const purchase = await c.env.DB.prepare(
    `SELECT tx_ref, resource_id, amount, currency, status
     FROM user_purchases
     WHERE tx_ref = ? AND resource_id LIKE 'donation:%'
     LIMIT 1`
  ).bind(txRef).first<{
    tx_ref: string;
    resource_id: string;
    amount: number;
    currency: string;
    status: string;
  }>();

  if (!purchase) return c.json({ tx_ref: txRef, status: 'unknown' });

  const giftType = purchase.resource_id === 'donation:monthly' ? 'monthly' : 'one-time';
  const status =
    purchase.status === 'active' || purchase.status === 'failed' || purchase.status === 'pending'
      ? purchase.status
      : 'unknown';

  return c.json({
    tx_ref: purchase.tx_ref,
    status,
    amount: Number(purchase.amount || 0),
    currency: purchase.currency || 'USD',
    giftType,
  });
});
// GET /api/admin/growth/summary
// Real growth signals from D1 — no sample data. Revenue figures are verified
// purchases (webhook-confirmed) in the last 30 days.
app.get('/api/admin/growth/summary', async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  if (!c.env.DB) {
    return c.json({ source: 'fallback', totalMembers: 0, activeSubscribers: 0, tierBreakdown: [], revenue30d: 0, revenueCount30d: 0, giving30d: 0, givingCount30d: 0 });
  }

  const [tiers, revenue, giving, members] = await Promise.all([
    c.env.DB.prepare(
      `SELECT tier, COUNT(*) as count FROM user_subscriptions WHERE status = 'active' GROUP BY tier ORDER BY count DESC`
    ).all<{ tier: string; count: number }>(),
    c.env.DB.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM user_purchases
       WHERE resource_id LIKE 'tier:%' AND status = 'active' AND datetime(purchased_at) >= datetime('now', '-30 days')`
    ).first<{ total: number; count: number }>(),
    c.env.DB.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM user_purchases
       WHERE resource_id LIKE 'donation:%' AND status = 'active' AND datetime(purchased_at) >= datetime('now', '-30 days')`
    ).first<{ total: number; count: number }>(),
    c.env.DB.prepare(`SELECT COUNT(*) as count FROM users`).first<{ count: number }>(),
  ]);

  const tierBreakdown = tiers.results.map((row) => ({ tier: row.tier, count: Number(row.count || 0) }));

  return c.json({
    source: 'd1',
    totalMembers: Number(members?.count || 0),
    activeSubscribers: tierBreakdown.reduce((sum, row) => sum + row.count, 0),
    tierBreakdown,
    revenue30d: Number(revenue?.total || 0),
    revenueCount30d: Number(revenue?.count || 0),
    giving30d: Number(giving?.total || 0),
    givingCount30d: Number(giving?.count || 0),
  });
});

// GET /api/admin/giving/report
// Stewardship summary of verified giving: totals per currency/type plus the
// most recent verified gifts. Reads the same user_purchases rows the webhook
// marks active, so the report needs no separate ledger.
app.get('/api/admin/giving/report', async (c) => {
  const denied = requireAdmin(c); if (denied) return denied;
  if (!c.env.DB) return c.json({ totals: [], recent: [], source: 'fallback' });

  const [totals, recent] = await Promise.all([
    c.env.DB.prepare(
      `SELECT currency, resource_id, COUNT(*) as gift_count, SUM(amount) as total_amount
       FROM user_purchases
       WHERE resource_id LIKE 'donation:%' AND status = 'active'
       GROUP BY currency, resource_id
       ORDER BY total_amount DESC`
    ).all<{ currency: string; resource_id: string; gift_count: number; total_amount: number }>(),
    c.env.DB.prepare(
      `SELECT tx_ref, amount, currency, resource_id, status, purchased_at
       FROM user_purchases
       WHERE resource_id LIKE 'donation:%'
       ORDER BY purchased_at DESC
       LIMIT 50`
    ).all<{ tx_ref: string; amount: number; currency: string; resource_id: string; status: string; purchased_at: string }>(),
  ]);

  return c.json({
    totals: totals.results.map((row) => ({
      currency: row.currency || 'USD',
      giftType: row.resource_id === 'donation:monthly' ? 'monthly' : 'one-time',
      giftCount: Number(row.gift_count || 0),
      totalAmount: Number(row.total_amount || 0),
    })),
    recent: recent.results.map((row) => ({
      txRef: row.tx_ref,
      amount: Number(row.amount || 0),
      currency: row.currency || 'USD',
      giftType: row.resource_id === 'donation:monthly' ? 'monthly' : 'one-time',
      status: row.status,
      purchasedAt: row.purchased_at,
    })),
    source: 'd1',
  });
});

// Map a tier marker resource_id back to the tier (e.g. 'tier:pro' → 'pro').
const tierFromResourceId = (resourceId: string): string =>
  resourceId.startsWith('tier:') ? resourceId.slice('tier:'.length) : '';

// POST /api/payments/flutterwave/webhook
// Verifies the verif-hash header, re-verifies the transaction via Flutterwave's API,
// confirms status + amount, then idempotently grants the subscription/entitlement.
app.post('/api/payments/flutterwave/webhook', async (c) => {
  const expectedHash = c.env.FLUTTERWAVE_WEBHOOK_HASH;
  const signature = c.req.header('verif-hash') || '';
  // Reject if the secret hash is not configured or does not match.
  if (!expectedHash || signature !== expectedHash) {
    return c.json({ error: 'invalid signature' }, 401);
  }

  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);
  if (!c.env.FLUTTERWAVE_SECRET_KEY) return c.json({ error: 'payment verification not configured' }, 503);

  const event = await c.req.json().catch(() => null) as Record<string, any> | null;
  if (!event) return c.json({ error: 'invalid payload' }, 400);

  // Flutterwave charge events: data.id (transaction id), data.tx_ref, data.status.
  const data = (event.data || {}) as Record<string, any>;
  const transactionId = data.id;
  const txRef = String(data.tx_ref || '').trim();
  const eventStatus = String(data.status || event.status || '').toLowerCase();

  // Only act on successful charge events. Acknowledge everything else with 200 so
  // Flutterwave does not retry, but do not grant access.
  if (!transactionId || !txRef) return c.json({ received: true, ignored: 'missing id or tx_ref' });
  if (eventStatus !== 'successful') return c.json({ received: true, ignored: `status=${eventStatus}` });

  // Look up the pending purchase we created at intent time.
  const purchase = await c.env.DB.prepare(
    `SELECT * FROM user_purchases WHERE tx_ref = ? LIMIT 1`
  ).bind(txRef).first<{
    id: string; user_id: string; resource_id: string; tx_ref: string;
    amount: number; currency: string; status: string;
  }>();

  if (!purchase) return c.json({ received: true, ignored: 'unknown tx_ref' });

  // Idempotency: if already granted, acknowledge without re-granting.
  if (purchase.status === 'active') return c.json({ received: true, idempotent: true });

  // RE-VERIFY with Flutterwave's API — never trust the webhook body alone.
  let verifyJson: Record<string, any> | null = null;
  try {
    const verifyRes = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(String(transactionId))}/verify`,
      { headers: { Authorization: `Bearer ${c.env.FLUTTERWAVE_SECRET_KEY}` } },
    );
    verifyJson = await verifyRes.json().catch(() => null) as Record<string, any> | null;
  } catch {
    return c.json({ error: 'verification request failed' }, 502);
  }

  const verified = (verifyJson?.data || {}) as Record<string, any>;
  const verifiedStatus = String(verified.status || '').toLowerCase();
  const verifiedAmount = Number(verified.amount);
  const verifiedCurrency = String(verified.currency || '').toUpperCase();
  const verifiedTxRef = String(verified.tx_ref || '').trim();

  // Confirm: API call succeeded, charge successful, tx_ref matches, amount matches
  // (>= guards against rounding; currency must match what we recorded).
  const apiOk = String(verifyJson?.status || '').toLowerCase() === 'success';
  const amountOk = Number.isFinite(verifiedAmount) && verifiedAmount >= purchase.amount;
  const currencyOk = verifiedCurrency === String(purchase.currency || '').toUpperCase();
  const txRefOk = verifiedTxRef === txRef;

  if (!apiOk || verifiedStatus !== 'successful' || !amountOk || !currencyOk || !txRefOk) {
    // Mark the purchase failed (idempotent-safe) but acknowledge so FLW stops retrying.
    await c.env.DB.prepare(
      `UPDATE user_purchases SET status = 'failed' WHERE tx_ref = ? AND status = 'pending'`
    ).bind(txRef).run();
    return c.json({ received: true, verified: false });
  }

  if (purchase.resource_id.startsWith('donation:')) {
    await c.env.DB.prepare(
      `UPDATE user_purchases SET status = 'active' WHERE tx_ref = ? AND status = 'pending'`
    ).bind(txRef).run();

    // Donor receipt — best-effort: a failed email must never fail the webhook,
    // the gift is already verified and recorded above.
    const donorEmail = String(verified.customer?.email || '').trim();
    const donorName = sanitizeInput(String(verified.customer?.name || 'Friend').trim().slice(0, 120)) || 'Friend';
    if (c.env.RESEND_API_KEY && isValidEmail(donorEmail)) {
      const giftLabel = purchase.resource_id === 'donation:monthly' ? 'monthly gift' : 'gift';
      const amountLabel = `${purchase.currency || 'USD'} ${Number(purchase.amount || 0).toLocaleString()}`;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey(c.env)}` },
        body: JSON.stringify({
          from: 'THE CCN DAILY <gifts@updates.theccndaily.com>',
          to: [donorEmail],
          subject: 'Thank you — your gift to THE CCN DAILY',
          html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;background:#1a1210;color:#f0ebe4;padding:40px 32px;border-radius:12px">
            <h2 style="color:#F27D26;font-size:22px;margin-bottom:8px">Thank you, ${donorName}.</h2>
            <p>Your ${giftLabel} of <strong>${amountLabel}</strong> has been received and verified.</p>
            <p>Every gift carries Scripture, prayer, and daily formation to people who need it. We are grateful you chose to sow here.</p>
            <p style="margin:20px 0 0;font-size:13px;color:#c8b89a">Receipt reference: ${txRef}</p>
            <p>Grace and peace,<br/>THE CCN DAILY</p>
            <p style="margin-top:32px;font-size:12px;color:#7a6a60">theccndaily.com</p>
          </div>`,
        }),
      }).catch(() => {});
    }

    return c.json({ received: true, donationRecorded: true });
  }

  const tier = tierFromResourceId(purchase.resource_id);
  if (!isPaidTierServer(tier)) {
    return c.json({ received: true, ignored: 'non-subscription purchase' });
  }

  const userId = purchase.user_id;

  // Grant the subscription + entitlement. Done as a batch so partial writes don't
  // leave the user half-granted. Idempotent on tx_ref via the purchase status guard.
  const entitlementId = crypto.randomUUID();
  await c.env.DB.batch([
    // Upsert subscription → active for this tier.
    c.env.DB.prepare(
      `INSERT INTO user_subscriptions (user_id, tier, status, started_at, ends_at, updated_at)
       VALUES (?, ?, 'active', CURRENT_TIMESTAMP, NULL, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
         tier = excluded.tier,
         status = 'active',
         started_at = COALESCE(user_subscriptions.started_at, CURRENT_TIMESTAMP),
         updated_at = CURRENT_TIMESTAMP`
    ).bind(userId, tier),
    // Keep the denormalized users.tier in sync (best-effort; row may not exist).
    c.env.DB.prepare(
      `UPDATE users SET tier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).bind(tier, userId),
    // Write the subscription entitlement keyed by the tier marker.
    c.env.DB.prepare(
      `INSERT INTO user_entitlements (id, user_id, resource_id, access_type, source, starts_at, ends_at, is_active)
       VALUES (?, ?, ?, 'subscription_included', 'subscription', CURRENT_TIMESTAMP, NULL, 1)`
    ).bind(entitlementId, userId, purchase.resource_id),
    // Flip the purchase active (guarded so a concurrent webhook can't double-grant).
    c.env.DB.prepare(
      `UPDATE user_purchases SET status = 'active' WHERE tx_ref = ? AND status = 'pending'`
    ).bind(txRef),
  ]);

  return c.json({ received: true, granted: true });
});

// GET /api/users/:userId/subscription
// Returns the user's current subscription + active entitlements from D1.
app.get('/api/users/:userId/subscription', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  const denied = requireSelf(c, userId); if (denied) return denied;

  if (!c.env.DB) {
    return c.json({ tier: 'free', status: 'none', entitlements: [], source: 'fallback' });
  }

  const sub = await c.env.DB.prepare(
    `SELECT tier, status, started_at, ends_at FROM user_subscriptions WHERE user_id = ? LIMIT 1`
  ).bind(userId).first<{ tier: string; status: string; started_at: string | null; ends_at: string | null }>();

  const entResult = await c.env.DB.prepare(
    `SELECT id, user_id, resource_id, access_type, source, starts_at, ends_at, is_active
     FROM user_entitlements
     WHERE user_id = ? AND is_active = 1`
  ).bind(userId).all<{
    id: string; user_id: string; resource_id: string; access_type: string;
    source: string; starts_at: string; ends_at: string | null; is_active: number;
  }>();

  const entitlements = entResult.results.map((e) => ({
    id: e.id,
    userId: e.user_id,
    resourceId: e.resource_id,
    accessType: e.access_type,
    source: e.source,
    startsAt: e.starts_at,
    endsAt: e.ends_at,
    isActive: e.is_active === 1,
  }));

  return c.json({
    tier: sub?.tier || 'free',
    status: sub?.status || 'none',
    endsAt: sub?.ends_at || null,
    entitlements,
    source: 'd1',
  });
});

export const onRequest = (context: any) =>
  app.fetch(context.request, context.env, context);
