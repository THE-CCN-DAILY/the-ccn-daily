# SEO, GEO & AI-Bot Policy

_What ships in the repo, and what the founder configures in the Cloudflare dashboard._

## 1. What shipped (in-repo, live)

### Per-page metadata (`hooks/usePageMeta.ts`)
A hash-routed SPA serves one `index.html`, so every route shared one `<title>`. The
`usePageMeta` hook now sets a distinct title + description (and mirrors them into OG /
Twitter tags) per public page, and can inject page-scoped JSON-LD. Googlebot renders
client JS, so it reads these for the page a visitor actually lands on.

Applied to: Landing, Blog, Blog post, Pricing, Newsletter, Podcast.

### Article structured data
Each blog post injects `Article` JSON-LD (headline, author, datePublished, section,
publisher) on top of the global `Organization` + `WebSite` graph in `index.html`. This
is what rich results and answer engines parse to attribute and cite the content.

### AI-bot policy (`public/robots.txt`)
The strategy is **be cited, don't be strip-mined**:
- **Allowed** (they send readers / cite us): Googlebot, Google-Extended (Gemini
  grounding), Bingbot, DuckDuckBot, Applebot, OAI-SearchBot + ChatGPT-User (ChatGPT
  live retrieval), PerplexityBot + Perplexity-User.
- **Disallowed** (pure training crawlers — content in, nothing back): GPTBot, CCBot,
  Bytespider, Omgilibot, Diffbot.
- **Default-open** (`User-agent: *  Allow: /`) keeps the site discoverable for everyone
  else.

> Note: blocking GPTBot (OpenAI's *training* crawler) does **not** block OAI-SearchBot /
> ChatGPT-User (the *answer* crawlers) — so we keep ChatGPT answer-citation while
> declining training. ClaudeBot / Anthropic and Meta's crawlers are intentionally left
> on default-open because they also power live answer retrieval; flip them to Disallow
> if the founder decides otherwise.

## 2. Founder's Cloudflare dashboard task (item G)

robots.txt is advisory — well-behaved bots honor it; scrapers ignore it. Enforce it at
the edge in the Cloudflare zone for `theccndaily.com`:

1. **Bots → "Block AI Scrapers and Crawlers"** — turn ON. Cloudflare's managed list
   blocks known training scrapers at the edge. (Free tier.)
2. **AI Labyrinth** — turn ON. Feeds decoy content to bots that ignore robots.txt; a
   no-rules honeypot that protects server resources. Ref: https://blog.cloudflare.com/ai-labyrinth/
3. **Verify answer engines still pass.** Cloudflare's "Block AI bots" can be scoped to
   *block AI scrapers but allow AI search/assistants*. Pick that scope so PerplexityBot /
   OAI-SearchBot / Google-Extended keep reaching the site (this directly serves GEO).
   If using a custom WAF rule instead, allow the answer-engine user-agents above and
   challenge/block only the training ones.
4. **Cloudflare Web Analytics** — confirm it's enabled for the zone (privacy-friendly,
   no cookie banner) to measure the organic + AI-referral traffic this work is meant to grow.

This is a signed-in browser task (like the Turnstile setup), and the allowlist is a
strategic content call — confirm the block scope before enabling so it doesn't trade
away the answer-engine reach in §1.

## 3. The big deferred lever — prerender / BrowserRouter

The largest SEO ceiling is that public routes are `/#/...` hash URLs. The clean paths in
`sitemap.xml` (`/blog`, `/blog/:slug`, …) currently fall through to the SPA shell and
only render after JS routes the hash. The real unlock is migrating HashRouter →
BrowserRouter and prerendering the public routes (Cloudflare Pages Functions / static
prerender), so each public page is server-rendered with its own real URL, title, OG, and
JSON-LD that even non-JS scrapers read. This touches routing, the `/__/auth` redirect
proxy, and `_redirects`, so it's a dedicated change — not folded into this pass.

## 4. Book & audiobook reviews (item E) — BUILT & DEPLOYED (2026-06-16)

Shipped to production (commit `53fefb7`). D1 `book_reviews` table (self-provisioning,
`content_type` serves books + audiobooks), worker routes (member submit→pending, public
approved-only list + aggregate, admin queue + approve/reject via `requireAdmin`),
`review_links` on books/audiobooks, `ProductReviews` on the book page + an expandable
panel on the audiobook library, `ReviewModerationPage` at `/studio/reviews`, and
marketplace-link fields in the Books Library editor. Verified live (endpoints + admin
session). Original plan below for reference:

- **D1 table** `book_reviews(id, book_id, user_id, author_name, rating, body,
  status TEXT DEFAULT 'pending', created_at)`; self-provision via an `ensure*` helper like
  the other tables.
- **Worker routes:** `POST /api/books/:id/reviews` (auth'd member submit → status
  `pending`); `GET /api/books/:id/reviews` (returns **approved** only for the public book
  view); admin `GET /api/admin/reviews?status=pending`, `POST /api/admin/reviews/:id/status`
  ({approved|rejected}) — reuse the Comment Moderation pattern + `requireAdmin`.
- **Marketplace links:** store admin-settable external links on the book record
  (`review_links` JSON: Amazon, Goodreads, Apple Books…); render a "Loved it? Review it
  on…" affordance only when present. Admin sets them in the book editor.
- **Client:** review form + star rating on the book/audiobook page (approved reviews
  list + aggregate rating); admin moderation list reusing the existing moderation UI.
- Optionally add `Review` / `aggregateRating` JSON-LD to the book page once approved
  reviews exist (more rich-result surface).
