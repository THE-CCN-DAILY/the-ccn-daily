/**
 * Post-build SEO prerender.
 *
 * The app is a client-rendered SPA, so non-JS crawlers and social link-preview
 * scrapers only ever saw the generic index.html. This script writes a per-route
 * static HTML file (same JS/CSS bundle, only the <head> meta swapped) for each
 * public route, plus one per published blog post, and regenerates sitemap.xml —
 * so every public URL serves correct, unique title / description / canonical /
 * Open Graph metadata in the raw HTML. The SPA still boots and renders normally.
 *
 * Runs automatically after `vite build` (see package.json). Safe by design:
 * any failure (e.g. the blog fetch) is logged and skipped — it never fails the build.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const ORIGIN = 'https://theccndaily.com';
const OG_IMAGE = `${ORIGIN}/logo-wordmark-white.webp`;
const API = `${ORIGIN}/api/blog/posts`;

// Escape a string for safe use inside an HTML double-quoted attribute.
const attr = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\s+/g, ' ')
    .trim();

// Static public routes. `path` '' is the home (overwrites dist/index.html).
const ROUTES = [
  {
    path: '',
    title: 'THE CCN DAILY — Your personal devotional space',
    description:
      'A quiet daily rhythm for Scripture, prayer, work, and spiritual steadiness. THE CCN DAILY helps busy professionals begin again with God every day.',
  },
  {
    path: 'blog',
    title: 'Blog — THE CCN DAILY',
    description:
      'Essays and devotionals on faith, work, leadership, and endurance — written to help you carry responsibility without losing the soul.',
  },
  {
    path: 'newsletter',
    title: 'Newsletter — THE CCN DAILY',
    description:
      'Scripture-anchored essays and devotionals for faith, work, and leadership — delivered straight to your inbox.',
  },
  {
    path: 'podcasts',
    title: 'Podcasts — THE CCN DAILY',
    description:
      'Pastoral conversations and audio formation for commutes, quiet rooms, and workday resets. Press play anywhere.',
  },
  {
    path: 'pricing',
    title: 'Pricing & Plans — THE CCN DAILY',
    description:
      'Choose a plan and unlock the full daily-formation library — devotionals, Bible, podcasts, audiobooks, courses, and community.',
  },
  {
    path: 'give',
    title: 'Give — THE CCN DAILY',
    description:
      'Partner with what God is building. Your gift sustains daily Scripture, devotionals, and discipleship for thousands.',
  },
];

/** Swap the head meta of the base index.html for one route's values. */
const renderHtml = (base, { title, description, url, ogType = 'website' }) => {
  let html = base;
  const t = attr(title);
  const d = attr(description);
  const u = attr(url);

  const set = (re, replacement) => {
    if (re.test(html)) html = html.replace(re, replacement);
  };

  set(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`);
  set(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${d}" />`);
  set(/<meta\s+property="og:type"[^>]*>/i, `<meta property="og:type" content="${attr(ogType)}" />`);
  set(/<meta\s+property="og:title"[^>]*>/i, `<meta property="og:title" content="${t}" />`);
  set(/<meta\s+property="og:description"[^>]*>/i, `<meta property="og:description" content="${d}" />`);
  set(/<meta\s+property="og:url"[^>]*>/i, `<meta property="og:url" content="${u}" />`);
  set(/<meta\s+name="twitter:title"[^>]*>/i, `<meta name="twitter:title" content="${t}" />`);
  set(/<meta\s+name="twitter:description"[^>]*>/i, `<meta name="twitter:description" content="${d}" />`);

  // Canonical: replace an existing one or inject before </head>.
  if (/<link\s+rel="canonical"[^>]*>/i.test(html)) {
    html = html.replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${u}" />`);
  } else {
    html = html.replace(/<\/head>/i, `  <link rel="canonical" href="${u}" />\n</head>`);
  }
  return html;
};

const writeRouteHtml = async (routePath, html) => {
  if (routePath === '') {
    await writeFile(path.join(DIST, 'index.html'), html, 'utf8');
    return;
  }
  // Write `<route>.html` (not `<route>/index.html`) so Cloudflare Pages serves it
  // directly at the clean path with NO trailing-slash 308 redirect — keeping the
  // served URL identical to the canonical we emit.
  const file = path.join(DIST, `${routePath}.html`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html, 'utf8');
};

async function main() {
  const indexPath = path.join(DIST, 'index.html');
  if (!existsSync(indexPath)) {
    console.warn('[prerender] dist/index.html not found — skipping (did vite build run?).');
    return;
  }
  const base = await readFile(indexPath, 'utf8');

  const sitemap = [];
  const today = new Date().toISOString().slice(0, 10);

  // 1) Static public routes
  for (const route of ROUTES) {
    const url = route.path ? `${ORIGIN}/${route.path}` : ORIGIN;
    const html = renderHtml(base, { ...route, url });
    await writeRouteHtml(route.path, html);
    sitemap.push({ loc: url, lastmod: today, priority: route.path ? '0.8' : '1.0' });
    console.log(`[prerender] ${url}`);
  }

  // 2) Blog posts (best-effort — never fail the build on a fetch error)
  try {
    const res = await fetch(API, { headers: { accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const posts = Array.isArray(data?.posts) ? data.posts : [];
      let n = 0;
      for (const post of posts) {
        const slug = String(post.slug || '').trim();
        if (!slug) continue;
        const url = `${ORIGIN}/blog/${slug}`;
        const title = `${post.title || 'Devotional'} — THE CCN DAILY`;
        const description = post.excerpt || post.description || post.title || '';
        const html = renderHtml(base, { title, description, url, ogType: 'article' });
        await writeRouteHtml(`blog/${slug}`, html);
        sitemap.push({
          loc: url,
          lastmod: (post.publishedAt || post.createdAt || today).slice(0, 10),
          priority: '0.7',
        });
        n += 1;
      }
      console.log(`[prerender] blog posts prerendered: ${n}`);
    } else {
      console.warn(`[prerender] blog fetch ${res.status} — skipping blog prerender.`);
    }
  } catch (err) {
    console.warn(`[prerender] blog fetch failed (${err?.message || err}) — skipping blog prerender.`);
  }

  // 3) Sitemap
  const urls = sitemap
    .map(
      (u) =>
        `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>weekly</changefreq><priority>${u.priority}</priority></url>`,
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  await writeFile(path.join(DIST, 'sitemap.xml'), xml, 'utf8');
  console.log(`[prerender] sitemap.xml written with ${sitemap.length} urls.`);
}

main().catch((err) => {
  // Never fail the build because of prerender.
  console.warn(`[prerender] unexpected error — continuing: ${err?.message || err}`);
});
