# THE CCN DAILY — Handoff & Next-Session Plan

_Last updated: 2026-06-12. Branch: `phase-e-visual-authoring`. Deploy flow: gates → commit/push → staging → verify → production (wrangler). Production is autonomous pre-launch; no approval pauses needed except where noted._

---

## 1. Status — what shipped this session (all live on production)

| Commit | What |
|---|---|
| `7f7f7f3` | Turnstile keys provisioned + verified |
| `2e641b0` → `2aa0a08` | Donor receipts, giving report, seat invite emails; **fixed the entire email pipeline** (Resend domain verification, verified sender subdomain, BOM-stripped API key) |
| `1bc9231` | Invite emails show inviter display name; DMARC on send subdomain |
| `d4357b5` | Honest admin signals: diagnostics auth (401 fixed), live R2 status, real Growth Console (dropped fake MRR / MAX-plan copy) |
| `acbf56c` | **Personal devotional generator works end-to-end** (member `/app/devotional`, admin bypass, 70B model, robust parsing, token budget) |
| `8966cf6` | Enforced anti-slop voice pipeline + theological guardrails (deterministic blacklist scrub + corrective pass) |
| `1239e8f` | PPP local-currency charging (UGX/KES/GHS/NGN…) unlocks mobile money for African givers; USD-card fallback elsewhere |
| `9eeb25a` | Community challenges: open vs scheduled, radar opt-in, shared-progress roster, email invites, live-session links |
| `a829d37` | Warm EB Garamond serif reading register app-wide + optical sizing (chrome stays sans) |
| `64fb1dd` | Real CCN brand flame in Team Counsel (was a stock Lucide flame) |
| `62a18be` | Hero → "Your personal devotional space.", bible-flame emblem, flame favicon (PNG primary), comfortable heading line-heights, softened diagnostics note |
| `9a2efb1`/`abb072c` | **One giving engine**: `/app/giving` now renders the canonical `/give` page; welcome copy → "Welcome to your digital spiritual home" |
| `7f3038e` | Codex audit: removed dead admin buttons (incl. unbuilt "Voice Training/Kai"), wired Challenge Templates + Books & Courses, deleted orphan `PublicGivingPage.tsx` |
| `11223ff` | Print-edition distribution with country availability + waitlists (the print half of original #25) |

**In flight (do NOT duplicate):**
- **EPUB → reading-plan + book "reading-plan edition"** — a spawned worktree session is building this on `phase-e-visual-authoring`. Pull before starting new work.
- **Dyslexia-friendly reader font** — spawned as a background chip (reuse Atkinson Hyperlegible, already loaded).

**Known cosmetic note:** the 70B devotional output occasionally still slips a near-banned phrase; the deterministic scrub catches the hard blacklist but the prompt-level avoidance isn't perfect. Low priority.

---

## 2. Next-session plan (start fresh here to save tokens)

> **First step every session:** `git pull` on `phase-e-visual-authoring` (the spawned reading-plan session may have pushed). Run `npm run lint && npm run cf:typecheck && npm run build` to confirm a clean base.

### A. Admin/Strategy surface — hide from users, gate behind `/admin` (HIGH — pre-launch correctness)

**Problem 1 — the Strategy leak.** In `components/Layout.tsx` the `SANCTUARY / STRATEGY` toggle pill (around lines 230–236) renders for **every** signed-in user. It only role-checks on *click* (`toggleMode` shows "reserved for Admins…" error, lines ~167). A regular member should never even see "Strategy."
- **Fix:** only render the toggle when `user?.role === 'admin' || user?.role === 'lead_developer'`. Non-privileged users get no toggle and never see Command Center nav.

**Problem 2 — no hard URL boundary.** Admin/Strategy lives under `/studio/*` inside the same app shell. A user could land there by typing a URL.
- **Fix:** move the admin surface behind an `/admin` path (or keep `/studio/*` but add a top-level guard) so any non-admin hitting an admin route is redirected to `/app/dashboard`. `RequireRole` already gates individual routes server-trip-free; add a route-group guard + redirect so there's a single clear boundary. Consider routing admin at `theccndaily.com/#/admin/*` and 404/redirect for non-admins.

### B. Roles — streamline, fix promotion, document authority (HIGH — currently broken)

**Why promotion fails today.** Roles have **three disagreeing sources of truth:**
1. `pages/Roles.tsx` writes role to **Firestore** (`updateDoc(userRef, { role })`, line ~41) — likely blocked by Firestore rules or simply not what gates anything.
2. The worker's `isAdminRequest` (`functions/api/[[path]].ts`) authorizes admin by a **hardcoded email allowlist** `ADMIN_EMAILS = ['pastor.eryeza@gmail.com','ccndaily@gmail.com']` — ignores any stored role.
3. The D1 `users` table has its own `role` column (`UserRow.role`, ~line 353).

**Plan:**
- Pick **D1 `users.role` as the single source of truth.** Add an admin-only worker route `POST /api/admin/users/:id/role` (guard with `requireAdmin`) that updates `users.role`; have the client (`Roles.tsx`) call it instead of writing Firestore.
- Keep a **bootstrap super-admin** via the email allowlist so the founder can never be locked out, but make normal admin authority read the D1 role so promotions actually take effect.
- Make `AuthContext` hydrate `user.role` from the D1 user record (it already reads D1 subscription).
- **Answer the founder's question, in-app + docs:**
  - **Admin** = ministry operator: can manage content (blog, books, courses, challenges, announcements), review scholarships, moderate comments, see giving reports, manage roles, see diagnostics/growth. Cannot change billing/secrets.
  - **You (founder / super-admin)** = the email-allowlisted owner: everything an admin can do **plus** you're the un-removable root who can grant/revoke admin itself and is the fallback if the role table is ever wrong. The "Founder" label in the sidebar already reflects this.
  - **lead_developer** = like admin for technical/content routes but should be defined explicitly (today it's half-wired). Decide: keep it (engineering access, no billing) or fold into admin.
  - Document the ladder in `docs/` and a short in-app "what these roles mean" note on the Roles page.

### C. #26 — Full QA sweep + modern-app design benchmarking (HIGH)

Walk every member + admin screen on staging in **light and dark**, both desktop and mobile widths. For each, capture a screenshot and note:
1. **Bugs:** overflow, dead controls, mismatched colors, stray copy, broken empty/loading states.
2. **Design benchmark:** how would a best-in-class modern devotional/reading app present this screen? Apply the `premium-tonal-design` skill and the web design-quality rules (hierarchy via scale, intentional rhythm, depth/layering, designed hover/focus states, no template feel). Produce a per-screen "keep / improve / redesign" list.
Deliver the flagged list, then fix bugs inline and queue the larger redesigns.

### D. Landing page — benefit-driven copy + Remotion motion (MEDIUM-HIGH)

- **Copywriting:** deploy the writing skills (`brand-voice`/`provost-zinsser-pastoral-writer`/`reader-emotion-resonance`) to rewrite the landing so a visitor sees the **benefit to them** (a steady daily rhythm with God, not features) and finds a genuine reason to sign up — **warm and devotional, never salesy**. Edit through the anti-slop pipeline already built (`scrubSlop`/`findSlop` in `services/geminiService.ts`).
- **Remotion videos:** use the `remotion-video-creation` skill to produce short ambient motion pieces that conceptualize the devotional idea (e.g. dawn light over Scripture, the flame, a day's rhythm) for the hero / section breaks. Keep them lightweight (lazy-load, `prefers-reduced-motion` respected) and on-brand ember.

### E. Book & audiobook reviews (MEDIUM)

- **In-app reviews:** let a reader write a review on a book/audiobook. Store in D1 (`book_reviews`: id, book_id, user_id, rating, body, status `pending|approved|rejected`, created_at). Reviews appear in the book section **only when approved** (admin moderation reuses the existing Comment Moderation pattern).
- **External marketplace reviews:** a pronounced "Loved it? Review it on…" affordance with **admin-settable links** per book (Amazon, Goodreads, Apple Books, etc.) — store the links on the book record; render buttons when present. This drives social proof off-platform.

### F0. Responsive / mobile rendering pass (HIGH — pre-launch)

The founder noticed several screens render poorly and awkwardly on mobile. Treat this as a first-class pass folded into the #26 QA sweep (do both desktop AND mobile widths for every screen):
- **Test breakpoints:** 320, 375, 390 (common phones), 768 (tablet), 1024, 1440. Use `preview_resize` / browser device emulation; check both themes.
- **Likely offenders to check first:** the giving/donation grids and tier cards; the admin dashboard tab rail + dense tables (tables overflow on phones — wrap in horizontal scroll or switch to stacked cards under `sm`); the challenge cards grid; the family/leader dashboard two-column layouts (`lg:grid-cols-*` that don't collapse cleanly); the hero `lg:grid-cols-[1.05fr_0.95fr]`; modals/drawers (UpgradeModal, VoiceCompanionDrawer) on small screens; long headings in Cormorant wrapping awkwardly.
- **Root-cause notes:** `index.css` bumps root font-size to 118% (tablet) / 125% (mobile) — generous, but it can overflow fixed-width elements. Audit for fixed `px` widths, `max-w-*` without `w-full`, `whitespace-nowrap`, flex rows that should wrap (`flex-wrap`), and grids missing a single-column base. Ensure tap targets ≥44px.
- **Deliverable:** per-screen mobile pass list (keep/fix), then fix overflow + awkward stacks inline. Verify no horizontal scroll at 320px on any screen.

### F. SEO + GEO (new search/AI landscape) — organic traffic (MEDIUM)

Use the `seo` / `searchfit-seo` skills. The app is a hash-routed SPA (`/#/...`) which is weak for crawlers — **biggest SEO lever is making key public pages server-renderable/prerendered** (landing, blog posts, podcast, pricing, give). On Cloudflare Pages, consider prerendering public routes or moving them to real paths with SSR/Functions.
- **Classic SEO:** per-route `<title>`/meta/canonical (currently global in `index.html`), JSON-LD per page (Article schema on blog posts, Organization/WebSite already present), sitemap.xml + robots.txt, fast LCP (hero image sizing), internal linking.
- **GEO / answer-engine optimization** (so ChatGPT/Perplexity/Google AI surface CCN): clear entity definition, FAQ/Q&A structured content, `llms.txt` already exists — keep it rich and current; publish genuinely useful Scripture/devotional content that answer-engines cite.
- **Measure:** Cloudflare Web Analytics (privacy-friendly, no cookie banner) — verify it's enabled.

### G. Cloudflare AI-bot controls — balance protection vs discoverability (MEDIUM)

Founder received Cloudflare's "Prevent AI Bots" + "AI Labyrinth" announcement (one-click AI-bot blocking, free tier; Labyrinth feeds decoy content to bots that ignore `robots.txt`). Ref: https://blog.cloudflare.com/ai-labyrinth/

**Important tension:** blocking *all* AI bots conflicts with goal F (we WANT answer engines to read and cite CCN for discoverability). The intelligent policy:
- **Allow** the crawlers that drive traffic/citations: Googlebot, Google-Extended (Gemini), OAI-SearchBot/ChatGPT-User (live retrieval), PerplexityBot, Bingbot.
- **Block / Labyrinth** the pure training-scrapers that take content and give nothing back (e.g. GPTBot training crawler, CCBot, bytespider) — via the Cloudflare dashboard one-click control set to *block AI scrapers* but NOT search/answer crawlers, or a custom WAF rule per user-agent.
- Enable **AI Labyrinth** only for bots that ignore `robots.txt` — it's a no-rules-needed honeypot that protects server resources.
- This is a **dashboard configuration task** (Cloudflare → the zone → Bots / AI Audit), executable through the founder's signed-in browser like the Turnstile setup. Decide the allowlist with the founder, since it's a strategic content-policy call (it directly trades off F).

---

## 3. Operational notes for the next session

- **Two agents on one branch:** if the reading-plan worktree session is still active, coordinate — pull first, and prefer working on different files. Once it's merged, this is moot.
- **Deploy quirks seen this session:** wrangler deploys sometimes get backgrounded and a `Select-String` filter returns exit 1 even on success — read the raw output file to confirm `Deployment complete`, don't trust the exit code. A transient DNS blip on `theccndaily.com` also caused one false failure; re-run and verify.
- **Secrets gotcha:** never set Cloudflare secrets via PowerShell `utf8` (adds a BOM that breaks auth headers) — pipe ASCII. See the Resend BOM fix (`2aa0a08`).
- **Staging:** `staging.project-phoenix-ccn-daily.pages.dev` (branch `staging`). **Production:** `theccndaily.com` (branch `main`). Both deploy via `npx wrangler pages deploy dist --branch <staging|main> --commit-dirty=true`.
- **Founder visual QA** still owed: sign in on staging and eyeball the signed-in screens (pastoral taste pass) — the half only you can do.

---

## 4. Priority order for the fresh session

1. **B (roles)** + **A (admin/Strategy boundary)** — correctness/security, quick, pre-launch blockers.
2. **C (#26 QA sweep + benchmarking)** combined with **F0 (responsive/mobile pass)** — do desktop + mobile together; surfaces everything else.
3. **D (landing copy + Remotion)** — conversion.
4. **E (reviews)**, **F (SEO/GEO)**, **G (AI-bot policy)** — growth, can follow launch.
