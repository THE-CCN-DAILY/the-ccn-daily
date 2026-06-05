# THE CCN DAILY Launch-Ready Cohesion Plan

Last updated: 2026-06-05

## Direction

THE CCN DAILY should feel like a daily reading desk: Scripture first, prayer close at hand, community present but quiet, and admin work calm enough to support ministry without overwhelming the person operating it.

The design base is `D:\THE CCN DAILY\Design systems\The CCN Daily Design System`: parchment surfaces, crimson/ember restraint, serif-led hierarchy, small card radii, soft warm shadows, no hype, no emoji, and no public AI positioning. Background intelligence can power the app, but the product sells the fruit: devotion, guidance, reflection, audio, courses, prayer, stewardship.

## Expert Review Summary

### Feature Integrity

Launchable foundations are present: routing, auth, roles, public content, Cloudflare Pages Functions, D1-backed subscriptions, Flutterwave webhook verification, RSS proxying, courses/challenges, community routes, and admin tools.

Main launch risk: several polished surfaces still rely on different data sources or mock/local state. Books, announcements, scholarships, donations, highlights, settings, and some dashboards are split across Firestore and D1/Cloudflare.

### Premium UX

The landing page is the strongest current surface, but the app still mixes devotional publication with SaaS dashboard conventions. The most visible corrections are:

- Keep light mode parchment-led and make dark mode “candlelit chapel,” not black/orange tech.
- Use crimson as primary action color, amber only as flame/warmth.
- Make cards feel like paper: small radii, soft warm shadows, fewer icon chips.
- Make member dashboards feel like daily formation spaces before they feel like dashboards.
- Make admin dashboards feel like calm stewardship consoles.

### Copy And Voice

The strongest copy pattern is concrete and pastoral: “Scripture depth, structured practice, and community accountability.” Remove public or screenshot-prone phrases that make models the hero, including “AI-driven,” “sentient,” “Veo,” “Gemini,” “generate,” and machine-like personalization claims.

Use this rule everywhere: sell the fruit, hide the fuel.

### Cloudflare

Current Cloudflare usage is strong: Pages, Functions, D1, R2, Workers AI, Stream REST groundwork, and geo-aware pricing.

Free or underused launch wins:

- Turnstile and durable rate limiting for contact, scholarship, comments/testimonies, public submissions, and high-cost background routes.
- Entitlement-aware R2 media delivery for paid books/audio/video.
- D1 migrations rather than one-shot schema applies.
- Cache/KV for public content and RSS.
- Web Analytics and structured operational events.
- Queues for email, scholarship decisions, post-payment fulfillment, and media processing.

## Launch-Ready Workstreams

### 1. Visual Cohesion

Status: in progress.

Done:

- Shared `Card` primitive moved closer to paper-card treatment.
- Pricing scholarship card removed; student/sponsored access moved to subtle lower link.
- User dashboard, admin dashboard, family dashboard, and leader dashboard received first-pass premium headers and calmer language.
- Public/screenshot-prone AI/model language reduced.

Next:

- Continue visual QA on signed-in screens that require auth state: dashboard, admin dashboard, family dashboard, leader dashboard, and scholarship.
- Continue card cleanup on pricing, dashboard strips, family/leader member rows, admin tables, and upgrade modal.
- Tune dark mode toward candlelit browns, lifted shadows, crimson/ember restraint.
- Reduce pill-shaped controls where they are not primary subscription CTAs.

### 2. Copy Cohesion

Status: in progress.

Done:

- Replaced “Sentient Guide” with “Prayer Companion.”
- Replaced explicit model/tool language in upgrade, roadmap, admin, media, and visual sanctuary surfaces.
- Removed prominent scholarship competition from pricing.

Next:

- Continue the user-visible copy audit for “generate,” “prototype,” “coming soon,” and tech-first wording.
- Convert admin labels from operational jargon to stewardship language while preserving clarity.
- Polish landing/pricing headlines for warmer specificity.

### 3. Feature Integration

Status: not complete.

Priorities:

1. Decide source of truth by domain: D1 vs Firestore for books, announcements, donations, highlights, scholarships, and settings.
2. Move donations to server-authoritative intent/webhook/readback like subscriptions.
3. Replace mock family/leader dashboard state with real household/group APIs and seat/member workflows.
4. Align books library with Cloudflare `/api/books` or document Firestore as the intentional boundary.
5. Unify scholarship application, review, decision, notification, and access grant.
6. Complete analytics beyond stubs.
7. Replace podcast placeholder links.

### 4. Cloudflare Launch Hardening

Status: planned.

Priorities:

1. Add Turnstile binding and verification helper.
2. Add durable rate limit storage.
3. Gate `/api/media/*` by entitlement for premium assets.
4. Move D1 schema changes into migrations.
5. Add cache headers/Cache API for public RSS/content.
6. Add Web Analytics and operational event logging.
7. Introduce Queues for slow side effects.

### 5. Verification And Release

Required before production:

- `npm run lint`
- `npm run build`
- Forbidden public-copy scan for model/tool language
- Staging deploy to `https://staging.project-phoenix-ccn-daily.pages.dev/`
- Visual QA of landing, pricing, user dashboard, admin dashboard, family dashboard, leader dashboard, sign-in, and scholarship application
- Production deploy to `https://theccndaily.com/` only after staging passes
- GitHub branch pushed and clean

## Current Evidence

- Latest pushed branch: `phase-e-visual-authoring`
- Latest design checkpoint: `a500d7b style: polish launch surfaces and readiness plan`
- Current in-progress checkpoint: copy and route cleanup for Devotional Prep, Quote Graphics, Grace Links, Prayer Companion, Course Studio, Expert Council, diagnostics, and launch checklist.
- Verified gates at checkpoint:
  - `npm run lint` passed
  - `npm run build` passed
  - forbidden phrase scan returned no matches for the highest-risk public/model terms
