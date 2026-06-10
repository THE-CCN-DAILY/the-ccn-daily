# THE CCN DAILY Launch-Ready Cohesion Plan

Last updated: 2026-06-10

## Direction

THE CCN DAILY should feel like a daily reading desk: Scripture first, prayer close at hand, community present but quiet, and admin work calm enough to support ministry without overwhelming the person operating it.

The design base is `D:\THE CCN DAILY\Design systems\The CCN Daily Design System`: parchment surfaces, crimson/ember restraint, serif-led hierarchy, small card radii, soft warm shadows, no hype, no emoji, and no public AI positioning. Background intelligence can power the app, but the product sells the fruit: devotion, guidance, reflection, audio, courses, prayer, stewardship.

## Expert Review Summary

### Feature Integrity

Launchable foundations are present: routing, auth, roles, public content, Cloudflare Pages Functions, D1-backed subscriptions, Flutterwave webhook verification, RSS proxying, courses/challenges, community routes, prayer/visual formation surfaces, and admin tools.

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

- Continue the user-visible copy audit for tech-first wording and any labels that imply a feature is not usable today.
- Convert admin labels from operational jargon to stewardship language while preserving clarity.
- Polish landing/pricing headlines for warmer specificity.

### 3. Feature Integration

Status: not complete.

Priorities:

1. Decide source of truth by domain: D1 vs Firestore for books, announcements, donations, highlights, scholarships, and settings.
2. Move donations to server-authoritative intent/webhook/readback like subscriptions. (Done — server-created intents, webhook verification, readback.)
3. Replace mock family/leader dashboard state with real household/group APIs and seat/member workflows. (Done 2026-06-10 — D1 `household_members`, `group_members`, `group_assignments` tables; eight authenticated self-scoped routes; both dashboards load, invite, remove, and assign through the live API; leader "Coming Soon" cards replaced with live cohort data.)
4. Align books library with Cloudflare `/api/books` or document Firestore as the intentional boundary. (Done — admin and member books route through the D1 catalog first.)
5. Unify scholarship application, review, decision, notification, and access grant.
6. Complete analytics beyond stubs.
7. Replace podcast placeholder links. (Verified 2026-06-10 — no placeholder episode links remain in PodcastPage; episodes come from the RSS proxy.)

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

## Launch Readiness Assessment (2026-06-10)

Independent review on top of the expert findings above, after completing the household/group workstream.

### Ready for launch

- Public surfaces: landing, pricing, blog, newsletter, podcast, giving, sign-in.
- Payments: server-priced subscription intents, Flutterwave webhook verification, D1 entitlement readback, fail-closed gating. Giving uses the same server-authoritative pattern.
- Member surfaces: Daily Journey, Prayer Companion, Visual Sanctuary, courses, challenges, journal, books (D1 catalog first), community, account settings with D1 plan readback.
- Family and leader plans: household seats, group members, and shared assignments are durable in D1 with self-scoped authenticated routes — no mock state remains on either dashboard.
- Admin studio: content manager, blog studio, announcements, scholarship review, roles, diagnostics.
- Release gates green at this checkpoint: `npm run lint`, `npm run build`, `npm run cf:typecheck`.

### Should precede or closely follow launch (hardening, not blockers)

1. Turnstile + durable rate limiting on public submissions. (Done 2026-06-10 — D1-backed fixed-window rate limiting on `/api/contact` (3/10 min/IP), prayer-request create (5/10 min/IP) and pray taps (30/10 min/IP), gift emails (5/h/IP), `/api/ai/generate` (30/10 min per user), scholarship submission (3/h per user). Turnstile verification helper enforced on `/api/contact` once `TURNSTILE_SECRET_KEY` + `VITE_TURNSTILE_SITE_KEY` are provisioned; until then rate limiting is the floor. The Help form now submits through the protected worker route into D1, and the admin Support Inbox shows those messages alongside Resend webhook email. Keys provisioned 2026-06-11: widget "THE CCN DAILY" created in the Cloudflare dashboard (theccndaily.com + project-phoenix-ccn-daily.pages.dev), TURNSTILE_SECRET_KEY set for production and preview, site key in the build. Verified live: widget renders on the Help form, tokenless submissions return 403 on staging and production.)
2. Donor receipt emails and an admin giving report (giving works and verifies; stewardship reporting is manual until then).
3. Signed-in visual QA pass on staging (dashboard, admin, family, leader, scholarship, Prayer Companion, Visual Sanctuary).
4. Household/group invite delivery: seats and invitations are durable, but invited members are not yet emailed a join link. Position copy as "seat reserved" until invite email ships via Resend.

### Post-launch backlog

- D1 migrations directory instead of one-shot schema applies.
- KV/Cache API for public RSS and content reads.
- Queues for email, scholarship decisions, and media processing.
- Engagement scoring fed by real activity events (group `engagement_score` currently only moves when set server-side).
- Bundle splitting: main chunk is ~1.6 MB minified; code-split admin studio and reader surfaces.

## Current Evidence

- Latest pushed branch: `phase-e-visual-authoring`
- Latest functional checkpoint: `a18513c feat: household and group dashboards on live D1 seat APIs`
- Latest deployed staging alias: `https://staging.project-phoenix-ccn-daily.pages.dev/`
- Latest staging deployment URL: `https://bebdb1a3.project-phoenix-ccn-daily.pages.dev`
- Current in-progress checkpoint: books/admin catalog consolidation and remaining signed-in dashboard/admin QA.
- Verified gates at checkpoint:
  - `npm run lint` passed
  - `npm run build` passed
  - `npm run cf:typecheck` passed
  - Wrangler staging deploy passed
  - `GET /api/giving/status/give_missing` on staging returned `200` with `status: "unknown"`, confirming the giving readback route is live
  - Auth/Settings tier readback build deployed to staging at `https://917c80d1.project-phoenix-ccn-daily.pages.dev`
  - Books Library admin catalog consolidation build deployed to staging at `https://bebdb1a3.project-phoenix-ccn-daily.pages.dev`
  - forbidden phrase scan returned no public “coming soon” labels in the reviewed app surfaces; remaining internal/admin technology references are being reviewed for clarity

## Current Expert Meeting Notes

### Convened Review Team

- Product theologian and pastoral copy lead: checks whether each feature serves Scripture, prayer, formation, and community rather than novelty.
- Premium devotional UX lead: checks whether screens feel like a calm reading desk and stewardship console instead of a busy SaaS bundle.
- Feature integration lead: checks whether routes, data stores, entitlements, and dashboard promises behave as one product.
- Cloudflare launch architect: checks the free or underused platform strengths that can make the app faster, safer, and cheaper.
- Release QA lead: checks public copy, build gates, staging deployment, and visual QA coverage before production.

### What Is Functioning Today

- Public landing, pricing, newsletter, podcast, giving, and sign-in routes are present.
- Student access is connected through the subtle pricing link rather than a competing pricing card.
- Daily Journey includes Scripture, prayer, devotional, journaling, declaration, further study, and Prayer Companion access.
- Prayer Companion has working browser speech/type flow and does not depend on an external voice provider.
- Visual Sanctuary has a working interactive atmosphere and does not depend on cinematic video generation.
- Member Books Library now reads the Cloudflare/D1 catalog first for published books, with Firestore as a fallback.
- Hosted ebook files open as real browser/download editions.
- Giving pages now request a server-created donation intent before opening Flutterwave, so amount, currency, public key, and tx_ref come from Cloudflare rather than the browser.
- Donation webhooks now mark verified giving rows active without granting subscription entitlements, and giving pages wait for Cloudflare/D1 readback before showing thank-you states.
- Giving pages no longer ship the Flutterwave sandbox demo key as a fallback; missing configuration stops payment launch with a clear message.
- Account settings and app-level user tier hydration now prefer D1 subscription readback, so plan labels and access-sensitive surfaces no longer rely only on stale Firestore profile data.
- Books Library admin writes now go through the Cloudflare/D1 books catalog first, with Firestore kept only as a compatibility fallback for older records.
- Admin content, announcement, scholarship review, diagnostics, growth, release ops, and role-gated studio routes exist.
- Cloudflare Pages Functions, D1-backed subscription/payment readback, R2 upload path, and Workers background service routing are present.

### Remaining Cohesion Risks

- Some docs and internal admin strategy pages still describe background technology as a differentiator; public app surfaces should keep selling Scripture, practice, audio, courses, prayer, and community.
- Data source boundaries are still mixed: Firestore remains in auth/content/community/settings/scholarship flows while D1 backs selected Cloudflare endpoints and subscription readback.
- Family and leader dashboards need end-to-end member/seat/group workflows verified with real data, not only visual polish.
- Donations still need donor receipt emails, admin giving reports, and a dedicated long-term giving table, but the live gift confirmation path now uses server-authoritative intent, webhook verification, and readback.
- Visual QA still needs signed-in screenshots for dashboard, admin dashboard, family dashboard, leader dashboard, scholarship application/review, Prayer Companion, and Visual Sanctuary.

### Feature Integration Findings

- Books are now member-visible from the D1 catalog first, and the Books Library admin surface writes through the same Cloudflare catalog service. Remaining hardening is richer metadata migration for multi-format/POD purchase links.
- Donations are safer because sandbox fallback keys were removed, giving starts with a server-created intent, the webhook completes donation rows after verification, and clients read back verified status before showing success. Remaining production hardening: donor receipt/admin reporting and a dedicated giving ledger.
- Admin resource uploads are detached from the D1 content catalog. Resource Manager should either write through the same catalog service or be clearly limited to a non-public holding area.
- Settings plan labels now read from D1 subscription state first. Remaining work is to complete the same source-of-truth decision for every settings preference domain.
- Prayer Circle is device-local while Prayer Wall is API-backed. This is acceptable only if Prayer Circle remains positioned as a personal practice rather than a cross-device prayer record.
- Courses and challenges are the strongest integrated content lanes, with API-backed user pages and module managers. Remaining hardening is mostly around admin listing and draft expectations.
- Dashboard is visually cohesive but still more of a portal than a state hub; continue cards should eventually read real course/challenge/reading progress.

### Immediate Launch Plan

1. Finish signed-in visual QA and copy QA on the member dashboards, admin dashboards, scholarship flow, Prayer Companion, and Visual Sanctuary.
2. Complete donation operations after verified gift confirmation: donor receipts, admin reporting, and a dedicated giving ledger.
3. Pick and document the source of truth for each data domain: books, announcements, donations, highlights, scholarships, settings, household seats, and group cohorts.
4. Add Turnstile and durable rate limiting to public submissions and high-cost background routes.
5. Add Cloudflare cache/KV strategy for public RSS/content and move D1 schema changes into migrations.
