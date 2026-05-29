# Live Real-User Walkthrough — Findings

Captured by driving the **authenticated** staging app (signed in as **Founder**), 2026-05-29.
This is the "real user's eyes" layer of the audit — supplements the expert-team code/benchmark audit.

## ✅ What's genuinely working
- **Core daily experience is real, not hollow.** `/#/app/guided-journey` ("The Daily Sanctuary")
  renders a full guided-journey timeline: Start → Opening Prayer → Daily Devotional → Journaling →
  Guided Prayer → Declaration → Further Study → Finish, with a polished "Prepare Your Heart" intro,
  a "Step Inside" CTA, and a "Pray Aloud" option. Well-designed.
- **Logo lockup** renders correctly in the authenticated header.
- **Onboarding** now saves and lands the user in the app (post-fix).

## 🔴 Issues found (live)

### CRITICAL — RBAC / role taxonomy inconsistency
- Signed-in role shows as **"Founder"**, but clicking **STRATEGY** returns a denial toast:
  *"Strategy mode is reserved for Admins and Lead Developers."*
- Root problem: the Strategy gate allows only `admin` / `lead_developer`, but the account is
  assigned `founder` — a role the gate doesn't recognize. Meanwhile the **STRATEGY tab is shown
  in the nav even though the role can't use it** (should hide if not permitted, or grant access).
- Related: founder/admin status is granted to `ccndaily@gmail.com`; **pastor.eryeza@gmail.com must
  get the same status** (owner request).
- Action: reconcile the role model (decide whether `founder` ⊇ `admin` privileges), gate nav
  visibility on actual permission, and ensure both ministry emails get full access.

### MEDIUM — Slow auth resolution
- After sign-in, an **"Authenticating…" spinner persists ~5–7s** before the app renders. Feels
  broken on first load. Fix: faster auth-state resolution and/or a skeleton instead of a bare spinner.

### LOW — Guided-journey timeline labels
- The step labels under the timeline icons (OPENING PRAYER / DAILY DEVOTIONAL / JOURNALING …)
  **overlap/crowd** at desktop width. Needs spacing/responsive treatment.

## Still to walk (authenticated)
Bible Reader, Books, Reading Plans, News, Podcast Library, Courses, Community/Prayer, Journal,
Giving, Pricing, Notifications, and the landing-page Reviews section (for the reviews feature build).
Plus: verify each content surface is **populated vs empty** (D1 seeding).

## Code-level audit (data & auth wiring) — 2026-05-29

### Architecture is genuinely backend-driven (good)
- Only `data/gamificationData.ts` is static/mock. Every other surface fetches real data via
  `/api/*` (e.g. `getTodayDevotional` → `/api/devotionals/today`, `listAudiobooks` → `/api/audiobooks`,
  admin content → `/api/admin/content/*`). The app is real, not a mockup.

### CRITICAL (launch blocker) — Admin Content Manager is non-functional in production
- `services/contentService.ts` authorizes admin writes by sending only an `x-admin-email` header
  (hardcoded `pastor.eryeza@gmail.com`, line 24/43). It never sends `x-admin-token`.
- Backend `isAdminRequest` (`functions/api/[[path]].ts:618`) requires, when `ADMIN_API_TOKEN` is set
  (it is, in prod), BOTH a matching `x-admin-token` AND the email. So the browser's admin calls
  return **401 ADMIN_AUTH_REQUIRED** in production.
- Net effect: **the founder cannot publish/edit devotionals, books, audiobooks, or courses through
  the UI in production.** The "manage content without code" promise is broken. The code comments
  confirm it's a transitional state pending a real auth migration.
- A secret token must never be shipped to the browser, so the fix is NOT to send the token from the
  client. **Proper fix:** real session-based admin auth — verify the Firebase ID token server-side in
  the Functions and derive admin from the verified email (the ministry allowlist), then drop the
  header/token scheme. Medium backend task; unblocks all admin content management.

### Security (corrected, not a trivial bypass)
- The admin gate is reasonably guarded in prod (token required); the email-only path is limited to
  localhost preview. So this is NOT an "anyone can forge admin" hole. The real risk is the
  *incomplete/transitional* scheme (brittle, and a hardcoded admin email in client code) — replace
  with verified-session auth.

## CRITICAL — Fragmented content storage (publish path ≠ display path)

The app has **two parallel, unsynced content systems**, so published content can silently fail to
appear where users see it:

| Content | Published to | Read/displayed from | Result |
|---|---|---|---|
| Devotionals | Firestore `devotionals` (`ContentManagerPage:120`) | D1 via `/api/devotionals/today` (guided journey); Firestore `devotionals` (`DashboardPage:262`) | Guided-journey "today" reads a *different store* than the Content Manager writes |
| Podcasts | Firestore `admin_podcasts` (`ContentManagerPage:927`) | Firestore `podcastEpisodes` (`DashboardPage:296`) | **Collection-name mismatch** — published podcasts never show on the dashboard |
| Newsletters | Firestore `admin_newsletters` (`ContentManagerPage:1147`) | (verify reader) | Likely same split |
| Catalog (books/courses/audiobooks) | D1 via `/api/admin/content/*` | D1 endpoints | Self-consistent, but blocked by the admin-auth issue above |

**This is likely a top reason the app "felt unfinished":** content gets published but doesn't surface.
**Fix:** pick ONE source of truth per content type (recommend D1 for catalog/devotionals, Firestore
only for user-generated data), align collection/endpoint names, and route publish + display through
the same store. Then seed/migrate existing content.

## Confirmed working (wired to real data)
- **Giving / donations / pricing:** real Flutterwave checkout + Firestore `donations`/`settings`
  (`GivingPage`, `DonationPage`, `PricingPage`). Payment key configurable via admin.
- **User data:** Bible highlights (`users/{uid}/highlights`), help messages (`helpMessages`),
  journal/notes, admin resources/inbox/discounts (Firestore `onSnapshot`) — all wired.
- **Landing testimonials:** 3 **hardcoded placeholders** (`LandingPage.tsx:153`), no submission path,
  no avatars — to be replaced by the real reviews feature.

## Unfinished features shipped into production (quality risk)
These present "demo"/placeholder experiences to real users and undercut the premium feel:
- `AudiobookLibraryPage:180` — "Coming Soon" (though `/api/audiobooks` exists)
- `TestimoniesPage:19` — hardcoded placeholder testimonies ("replace with live Firebase query")
- `GraceLinkPage:17` — `mockGiftableItems`, gifting not wired
- `GrowthConsole:5` — demo analytics data, not connected
- `VisionaryLab` / `VisualSanctuary` / `VoiceCompanion` — AI demo/prototype pages
- **Decision needed:** finish, hide, or clearly label each before launch. A $200M app ships no
  "Coming Soon" or demo-data screens in primary navigation.

## Payments risk
- `GivingPage:14` — Flutterwave key falls back to a **sandbox test key** (`FLWPUBK_TEST-…`) if
  `VITE_FLUTTERWAVE_PUBLIC_KEY` is missing → real gifts silently wouldn't process. Confirm the live
  key is set in every deploy env (it was uploaded to prod, but the fallback is a footgun).

## SEO / GEO gaps (zero-budget discovery is currently near-impossible)
- `public/` has **no `robots.txt`, no `sitemap.xml`, no `llms.txt`** (only FCM SW + webmanifest).
- HashRouter `/#/` URLs are poorly crawlable; `index.html` lacks `og:image`/Twitter image and JSON-LD
  structured data; canonical is static.
- To be found by Google **and** surfaced by Gemini/AI engines: migrate to BrowserRouter (SPA fallback
  already exists in `_redirects`), add Organization/WebSite/Article schema, `robots.txt` + `sitemap.xml`
  + `llms.txt`, and per-route meta/OG. (Full plan from the SEO/GEO expert pending Workflow resume.)

## Visual / UX — premium-tonal assessment

**The design-token system (`index.css`) is already premium and tonally disciplined** — tinted warm
surfaces (paper/espresso, never pure white/black), deep chromatic text, a single dominant flame family
(crimson→ember→amber→gold) + sage support, dark-mode contrast adjustments, warm-tinted shadows,
three themes (dark/paper/sepia), and a real Cormorant + EB Garamond + Inter Tight pairing. The
foundation does NOT need a redesign — it needs targeted application polish.

**Polish gaps (application, not system):**
- **Hero headline is under-contrast** — the core value prop recedes instead of being the focal moment.
  Use `--fg-1` at full strength for the H1; reserve the muted tone for sub-copy. (Also a WCAG issue.)
- **Hero atmosphere image (cross) reads murky/underexposed** — lift exposure or add a tonal scrim so it
  feels crafted, not muddy.
- **Wordmark missing in the public header** (flame only) — weak brand lockup at the most-seen spot.
- **Guided-journey timeline labels crowd/overlap** at desktop width — needs spacing/responsive rule.
- **Sign-in modal backdrop** was too transparent (improved in a later build — verify).

## Accessibility (WCAG 2.2) — code-level
- Low-contrast hero text fails AA contrast (above).
- Heavy `motion/react` usage across pages — **verify `prefers-reduced-motion`** is honored (motion
  sickness / a11y). Needs a global reduced-motion guard.
- Modal focus-trap, ARIA labelling, and keyboard nav need a dedicated pass (not yet verified).
- Positive: light/sepia/dark themes aid low-vision and reading comfort.

## Performance — code-level
- **Main JS bundle ≈ 2.5 MB (689 KB gzip) + 538 KB Firebase chunk**, with **no route code-splitting**
  (`App.tsx` imports pages eagerly; no `React.lazy`/`Suspense`). Blows the landing JS budget; hurts
  LCP/TBT — and likely the ~5–7s perceived auth delay. **Fix:** route-based lazy-loading + manualChunks;
  lazy-load Firebase and heavy libs (Mux, Flutterwave, remotion) only where used.
- **3 Google Font families imported via render-blocking `@import`** (`index.css:1`) with many weights.
  Self-host + subset, use `font-display: swap`, preload only the critical weight.

## Method note
Full audit = this live walkthrough (real-user UX) + the expert-team Workflow (security, perf, SEO/GEO,
a11y, feature-parity, content, functionality, positioning — 6/9 already completed and cached; 3
hardened and pending a Workflow resume) → synthesized into the launch plan.
