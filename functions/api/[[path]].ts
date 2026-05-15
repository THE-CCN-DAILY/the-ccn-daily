import { Hono } from 'hono';

type Env = {
  FIREBASE_PROJECT_ID?: string;
  PRODUCTION_ORIGIN?: string;
};

const app = new Hono<{ Bindings: Env }>();

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
