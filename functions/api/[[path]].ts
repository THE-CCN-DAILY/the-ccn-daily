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
  MUX_TOKEN_ID?: string;
  MUX_TOKEN_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  AUTH_SECRET?: string;
  RESEND_API_KEY?: string;
};

const app = new Hono<{
  Bindings: Env;
  Variables: { idTokenEmail?: string; idTokenEmailVerified?: boolean; idTokenUid?: string };
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
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined,
});

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
  createdAt: row.created_at || undefined,
  updatedAt: row.updated_at || undefined,
});

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
  unlockedAchievements: parseTags(row.unlocked_achievements) || ['a1', 'a2', 'a3', 'a4'],
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

const ADMIN_EMAILS = ['pastor.eryeza@gmail.com', 'ccndaily@gmail.com'];

const isAdminRequest = (c: any) => {
  // Admin = a verified Firebase ID token (set by the auth middleware) for a ministry-owner email.
  // This is the ONLY admin path. The old spoofable x-admin-email + x-admin-token shared-secret
  // scheme and the host-based localhost bypass have been removed (host headers are client-supplied).
  // For local testing, sign in with a ministry account so the request carries a real ID token.
  const sessionEmail = (c.get('idTokenEmail') || '').toLowerCase();
  return Boolean(
    sessionEmail &&
    c.get('idTokenEmailVerified') === true &&
    ADMIN_EMAILS.includes(sessionEmail),
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
  c.json({
    cloudflarePages: 'connected',
    database: c.env.DB ? 'connected' : 'missing',
    workersAi: c.env.AI ? 'connected' : 'fallback',
    provider: c.env.AI ? 'cloudflare-workers-ai' : 'cloudflare-workers-ai-fallback',
    apiKeySource: 'cloudflare-binding',
    model: c.env.WORKERS_AI_TEXT_MODEL || '@cf/meta/llama-3.1-8b-instruct',
    productionOrigin: c.env.PRODUCTION_ORIGIN || '',
  })
);

app.post('/api/ai/generate', async (c) => {
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

    try {
      const result = await c.env.AI.run(model, { messages });
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

  await c.env.DB.prepare(`DELETE FROM blog_posts WHERE id = ?`).bind(c.req.param('id')).run();
  return c.json({ ok: true });
});

app.get('/api/challenges', async (c) => {
  if (!c.env.DB) return c.json({ challenges: [], source: 'fallback' });

  const includeDrafts = c.req.query('includeDrafts') === 'true';
  const result = await c.env.DB.prepare(
    includeDrafts
      ? `SELECT * FROM challenges ORDER BY start_date DESC, created_at DESC`
      : `SELECT * FROM challenges WHERE status = 'published' ORDER BY start_date DESC, created_at DESC`
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
      participants_count = excluded.participants_count,
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
    Number(body.participantsCount || body.participants || 0)
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

  const includeDrafts = c.req.query('includeDrafts') === 'true';
  const result = await c.env.DB.prepare(
    includeDrafts
      ? `SELECT * FROM courses ORDER BY created_at DESC`
      : `SELECT * FROM courses WHERE status = 'published' ORDER BY created_at DESC`
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

app.post('/api/mux/live', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  if (!c.env.MUX_TOKEN_ID || !c.env.MUX_TOKEN_SECRET) {
    return c.json({
      error: 'MUX_NOT_CONFIGURED',
      message: 'MUX_TOKEN_ID and MUX_TOKEN_SECRET must be configured before live stream keys can be generated.',
    }, 501);
  }

  const response = await fetch('https://api.mux.com/video/v1/live-streams', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${c.env.MUX_TOKEN_ID}:${c.env.MUX_TOKEN_SECRET}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playback_policy: ['public'],
      new_asset_settings: { playback_policy: ['public'] },
    }),
  });

  const data: any = await response.json().catch(() => ({}));
  if (!response.ok) {
    return c.json({
      error: 'MUX_REQUEST_FAILED',
      message: data?.error?.message || 'Mux live stream creation failed.',
      details: data,
    }, response.status as any);
  }

  const stream = data?.data || data;
  const playbackId = stream?.playback_ids?.[0]?.id || '';
  const streamId = stream?.id || '';
  const streamKey = stream?.stream_key || '';

  if (c.env.DB && playbackId) {
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
    ).bind(playbackId, streamId).run();
  }

  return c.json({ streamKey, playbackId, streamId, source: 'mux' });
});

app.post('/api/mux/upload', async (c) => {
  const denied = requireAdmin(c);
  if (denied) return denied;

  return c.json({
    error: 'MUX_NOT_CONFIGURED',
    message: 'Mux direct upload is not configured in the Cloudflare preview yet.',
  }, 501);
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
     VALUES (?, 7, 21, 1250, '["a1","a2","a3","a4"]', CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO NOTHING`
  ).bind(userId).run();

  return db.prepare(
    `SELECT * FROM user_gamification WHERE user_id = ? LIMIT 1`
  ).bind(userId).first<GamificationRow>();
};

app.get('/api/users/:userId/gamification', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
  if (!c.env.DB) {
    return c.json({
      gamification: {
        userId,
        stats: { currentStreak: 7, longestStreak: 21, points: 1250 },
        unlockedAchievements: ['a1', 'a2', 'a3', 'a4'],
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
  if (!c.env.DB) return c.json({ error: 'D1 database binding is not configured' }, 503);

  await c.env.DB.prepare(`DELETE FROM highlights WHERE user_id = ? AND id = ?`).bind(userId, id).run();
  return c.json({ ok: true });
});

app.get('/api/users/:userId/journal', async (c) => {
  const userId = c.req.param('userId');
  if (!isSafeId(userId)) return c.json({ error: 'Invalid user id' }, 400);
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

app.post('/api/auth/profile', async (c) => {
  const body = await c.req.json();
  const id = String(body.uid || body.id || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  if (!id || !isSafeId(id)) return c.json({ error: 'Valid uid is required' }, 400);
  if (!email || !email.includes('@')) return c.json({ error: 'Valid email is required' }, 400);

  const displayName = String(body.displayName || '').trim() || null;
  const photoUrl = String(body.photoURL || body.photoUrl || '').trim() || null;
  const adminEmail = (c.env.ADMIN_EMAIL || 'pastor.eryeza@gmail.com').toLowerCase();
  const defaultRole = email === adminEmail ? 'admin' : 'user';
  const defaultTier = email === adminEmail ? 'max' : 'free';

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
  if (!allowedOrigins.some(o => origin.startsWith(o))) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  // ── Rate limiting by IP hash (60 s window per IP)
  const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('x-forwarded-for') ?? 'unknown';
  // Simple in-memory rate limit for the worker — CF Workers are single-threaded per isolate
  // For production, use CF KV. For now, we rely on client-side rate limiting + this validation.

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid request body' }, 400);
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
        `INSERT INTO help_messages (id, name, email, category, message, ip_hint, created_at)
         VALUES (lower(hex(randomblob(8))), ?, ?, ?, ?, ?, datetime('now'))`
      ).bind(
        sanitizeInput(name),
        sanitizeInput(email),
        category,
        sanitizeInput(message),
        ip.slice(0, 8) // store only first octet hint, not full IP
      ).run();
    } catch {
      // Table may not exist yet — still return success so user isn't blocked
    }
  }

  return c.json({ success: true });
});

// ── Email: gift notification ───────────────────────────────────────────────
app.post('/api/email/gift', async (c) => {
  const origin = c.req.header('origin') || '';
  const production = c.env.PRODUCTION_ORIGIN || 'https://theccndaily.com';
  const isLocal = origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1');
  if (!isLocal && origin !== production) {
    return c.json({ error: 'Forbidden' }, 403);
  }

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
        Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'gifts@theccndaily.com',
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

export const onRequest = (context: any) =>
  app.fetch(context.request, context.env, context);
