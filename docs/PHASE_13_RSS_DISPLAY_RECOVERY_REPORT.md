# Phase 13 - RSS Display Recovery Report

Date: 2026-05-18
Branch: `codex/project-phoenix-cloudflare-thoughtstream`

## Recovered Lost-Chat Guidance

- Podcast and newsletter are public proof surfaces, not secondary routes.
- Real RSS must visibly render in preview:
  - Podcast feed: Anchor/Spotify RSS for `Devotion In Season`.
  - Newsletter feed: Substack RSS for `THE CCN DAILY`.
- Build and API checks are not enough. The rendered pages must be visually checked after the feed has loaded.
- Static-preview failures were previously caused by running Vite without the API/RSS proxy. Cloudflare Pages preview on `8788` is the correct local stack for RSS proof.
- Earlier "loading" screenshots were timing artifacts, not proof of a broken feed, but they exposed the need to wait before taking screenshots.
- Podcast display had already been called out for overly long mobile descriptions, dead download UI, and feed artifacts.
- Newsletter display needed the same treatment: no raw feed HTML, no Substack widget markup, readable excerpts, and clean empty/error states.

## What Changed

- Added `utils/feedText.ts` for shared RSS text cleanup:
  - strips HTML, scripts, styles, and CDATA wrappers
  - decodes common HTML entities
  - removes separator artifacts
  - fixes leading source-feed text artifacts such as `n this episode`
  - creates controlled excerpts
- Updated `pages/PodcastPage.tsx`:
  - uses the shared feed cleaner
  - adds a real feed error state
  - fixes the wrong empty-state message on the Recent tab
  - keeps Favorites separate from feed availability
- Updated `pages/NewsletterPage.tsx`:
  - stops rendering RSS content through `dangerouslySetInnerHTML`
  - renders clean text excerpts from real Substack feed content
  - adds a clean empty state
  - keeps public navigation to blog and podcasts

## Verification

Passed:

```powershell
npm run lint
npm run cf:typecheck
npm run build
```

Live RSS endpoints on `http://127.0.0.1:8788`:

```text
GET /api/rss?url=https://anchor.fm/s/f7311ecc/podcast/rss -> 200, returns Devotion In Season with audio enclosures
GET /api/rss?url=https://theccndaily.substack.com/feed -> 200, returns THE CCN DAILY
```

Rendered-page verification with Playwright:

```text
/newsletter -> real Substack title found, raw HTML not found
/podcasts -> real podcast title found, separator artifacts not found, broken leading "n this episode" not found
```

Visual artifacts:

- `artifacts/phase13-rss-display/newsletter-mobile-clean-feed.png`
- `artifacts/phase13-rss-display/podcasts-mobile-clean-feed.png`

## Preview Checklist

Open `http://127.0.0.1:8788`.

- `/newsletter`: latest Substack posts should show as clean readable excerpts, not raw Substack HTML or embedded widget text.
- `/podcasts`: latest Anchor podcast episodes should show with real titles, playable audio buttons, short mobile-safe excerpts, and no separator junk.
- Both pages should show actual feed content after loading, not permanent loading states.
- Both pages should have useful failure/empty states if the feed is unavailable.

## Remaining Gap

These pages are now cleaner, but they are still route-level presentation improvements. A later public-facing design pass can make the podcast and newsletter pages more editorial and distinctive after the remaining Firebase migration slices are reduced.
