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

## Method note
Full audit = this live walkthrough (real-user UX) + the expert-team Workflow (security, perf, SEO/GEO,
a11y, feature-parity, content, functionality, positioning — 6/9 already completed and cached; 3
hardened and pending a Workflow resume) → synthesized into the launch plan.
