import { Hono } from 'hono';

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  all: <T = unknown>() => Promise<{ results: T[] }>;
  first: <T = unknown>() => Promise<T | null>;
  run: () => Promise<unknown>;
};

type D1DatabaseBinding = {
  prepare: (query: string) => D1PreparedStatement;
};

type Env = {
  DB?: D1DatabaseBinding;
  FIREBASE_PROJECT_ID?: string;
  PRODUCTION_ORIGIN?: string;
  ADMIN_EMAIL?: string;
  ADMIN_API_TOKEN?: string;
};

const app = new Hono<{ Bindings: Env }>();

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

const isSafeId = (value: string) => /^[a-zA-Z0-9._:@-]{1,160}$/.test(value);

const isAdminRequest = (c: any) => {
  const expected = (c.env.ADMIN_EMAIL || 'pastor.eryeza@gmail.com').toLowerCase();
  const email = (c.req.header('x-admin-email') || '').toLowerCase();
  const configuredToken = c.env.ADMIN_API_TOKEN || '';
  const token = c.req.header('x-admin-token') || '';
  const host = c.req.header('host') || '';
  const isLocalPreview = host.startsWith('127.0.0.1') || host.startsWith('localhost');

  if (configuredToken) return token === configuredToken && email === expected;
  return isLocalPreview && email === expected;
};

const requireAdmin = (c: any) => {
  if (isAdminRequest(c)) return null;
  return c.json({
    error: 'ADMIN_AUTH_REQUIRED',
    message:
      'Admin blog writes require a verified admin session. Local preview accepts the configured admin email; production must set ADMIN_API_TOKEN until the Cloudflare auth migration is complete.',
  }, 401);
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

app.get('/api/user/profile', (c) => {
  const authHeader = c.req.header('authorization');
  if (!authHeader?.startsWith('Bearer ')) return c.json({ error: 'Unauthorized' }, 401);

  return c.json({
    error: 'AUTH_PROVIDER_PENDING',
    message: 'Cloudflare preview is live; Firebase Auth replacement is scheduled for Phase 2.',
  }, 501);
});

export const onRequest = (context: any) =>
  app.fetch(context.request, context.env, context);
