# Phase 2 Program Plan — "Done & Good" (founder directive 2026-06-02)

Consolidates the founder's full directive into coordinated workstreams. Standing bar (unchanged):
**benchmark every feature → then supersede it with latest capabilities; the whole app must operate in
unison (coordinated, cross-communicating), never a collection of disjointed features.** Stay on
staging; founder promotes. Payment/infra/prod-access changes are founder-gated.

Orchestration: a team of expert sub-agents reviews + brainstorms (security, design/theme/icons,
cohesion+benchmark coverage, Cloudflare untapped potential). Findings feed the execution waves below.

---

## Status snapshot
- ✅ Live in prod: Phase E visual, interim paywall, Phase A auth cleanup, Phase D Reviews, Phase C1
  (single devotional tab), deploy guard, Firestore rules.
- 🔬 In progress: 4 expert sub-agent reviews (this directive).

---

## Workstreams

### W1 — Premium reading experience (supersede Kindle) 🟡 partly specced
- **Goal:** an in-app EPUB reader so good users don't miss Kindle; AND every reading surface in the app
  (Bible, devotionals, books, courses, challenges, blog) feels one premium, consistent reading system.
- Benchmark: Kindle/Apple Books/Kobo. Supersede: Scripture-aware inline refs, pastoral AI margin
  companion (guardrails), Read↔Listen at same position, highlights→journaling, progress→streak/dashboard.
- Current: `EpubReader` is a stub; no EPUB engine. Rich reader scaffolding exists (ReaderEngine, etc.).
- See `books-and-reader-spec.md`. **Autonomous:** engine + reader UX for FREE content; **founder-gated:**
  paid in-app purchase + server-side file protection.

### W2 — Audio + Video on Demand (supersede; Netflix-feel) 🔴 new
- **Goal:** premium audiobook player AND a Media-on-Demand video surface that feels like Netflix
  (cinematic browse, continue-watching, autoplay previews, resume, chapters).
- **Mux → Cloudflare Stream migration** (founder-confirmed): replace `/api/mux/*` + player with Stream
  (signed playback, adaptive, free encoding). Live streaming via Stream too.
- See roadmap §A,C,D. **Founder-gated** (infra migration + payment for premium).

### W3 — App cohesion ("operates in unison") 🟠
- **Goal:** features cross-communicate, shared state via context (useAppData/AppContext), coherent nav,
  one design language. Kill island features.
- Cross-links to wire: highlights→journaling, reading progress→streak/dashboard, devotional→journey,
  courses/challenges→gamification, testimonies↔prayer. (Cohesion agent is mapping the gaps.)

### W4 — Design system & UI/UX premium pass 🟠
- **Theme:** dark = default; light + sepia selectable under Settings; audit contrast across all three.
- **Typography:** enforce Cormorant Garamond (display) / EB Garamond (body) / Inter Tight (UI) tokens
  everywhere; remove inconsistencies.
- **"No interface as mere text":** redesign flat/text-only screens; premium USER dashboard + ADMIN
  dashboards (/studio/*). (Design agent is cataloguing offenders.)

### W5 — Remove the AI "star" icon app-wide 🟢 quick win
- Replace every SparklesIcon / lucide `Sparkles` usage with context-appropriate icons (it reads as
  generic AI cliché). Design agent is producing the full file:line occurrence list. **Autonomous.**

### W6 — Pricing: purchasing-power-parity (USD base) 🔴 new
- **Goal:** show locally-fair prices by country while billing base in USD. Use Cloudflare
  `request.cf.country` for geo; map to a PPP tier multiplier; display localized price, charge USD equiv.
- Depends on the payment loop. **Founder-gated** (payment + pricing policy is the founder's call).

### W7 — In-app chat + support tickets 🔴 specced
- Per roadmap §E: Firestore-backed live chat + ticket inbox; instant auto-ack; **AI-drafted reply the
  team reviews before sending (never auto-send)**; in-app (no third-party widget) for security/CSP.
  Consider Cloudflare Durable Objects/realtime (architect agent assessing). **Partly autonomous**
  (UI + Firestore), AI-draft + send founder-reviewed.

### W8 — Security hardening 🔴 (security plugin installed)
- Security agent is auditing. Known top risk: **paywall is client-side only — paid media URLs are
  unprotected server-side.** Fix = server-side entitlement enforcement on media delivery. Plus rules,
  headers/CSP, XSS, secrets. Correct anything risky. **Some autonomous; prod-access changes founder-gated.**

### W9 — Untapped Cloudflare potential 🔵 brainstorm
- Architect agent ranking: Stream, Images, Durable Objects/realtime, Vectorize (semantic Bible+devotional
  search / RAG = a real "supersede" AI moment), Turnstile, Access, Queues, KV, `request.cf` geo (PPP).
- Output: the single highest-leverage addition + a ranked list.

### W10 — Benchmark coverage completion 🟠
- Cohesion/benchmark agent produces a coverage matrix (which of the ~14 features actually got
  benchmark→supersede). Close the gaps feature by feature.

---

## Sequencing
1. Consolidate the 4 expert reports → finalize prioritized backlog.
2. Autonomous quick wins first (W5 icons; W4 theme/typography fixes; W3 cohesion cross-links; W8
   autonomous-safe security fixes) — staging, verify, founder promotes.
3. Larger autonomous builds (W1 free-reader engine; W7 chat/ticket UI).
4. Founder-gated track (greenlight needed): payment+entitlement loop → unlocks real paywall + W1 paid
   reading + W6 PPP; Mux→Stream (W2); server-side media protection (W8).

## Founder decisions pending
- Promotions to prod (pre-launch: autonomous OK; POST-LAUNCH: staging + founder/dev test first).
- Delete `ADMIN_API_TOKEN` Cloudflare secret (post Phase A cleanup).

---

# Round 2 — founder decisions & additions (2026-06-02)

## Decisions locked
- **Testimonies → admin-approval before publish** (was reactive). Declined items must tell the user WHY.
  This becomes the template for the public-comments approval flow below.
- **Founder-gated track: GREENLIT.** Build order (my rec): (1) payment + entitlement loop →
  (2) server-side media protection → (3) Mux→Stream → (4) Durable Objects realtime chat/support →
  (5) Vectorize semantic AI. Each verified on staging.
- **AI must be AMBIENT, not pronounced.** AI blends into the background to support value delivery —
  never surfaced "look, AI!" for its own sake. No AI-branding/sparkle theatrics (icon already removed).
- **Mux dropped.** Don't provision Mux in prod; revoke the leaked Mux key. Rotate Flutterwave + add as
  prod secrets (currently MUX_* and FLUTTERWAVE_SECRET/ENCRYPTION are NOT set in prod — provisioning gap).

## New features to fold into cohesion (W3) — "leave no stone unturned"
- **User Library** (new hub): the user's saved items + ALL their notes in one place.
  - **Notes everywhere**: any product (devotional, Bible passage, book, audiobook, course, challenge,
    podcast, blog) supports notes. Free users: text notes. **Paid users: voice notes** too.
  - **Personal notes/comments** on any product are private → stored in the user's Library.
  - **Public comments**: on products that benefit from them, a user may post a PUBLIC comment →
    requires **admin approval**; if **declined, the user is told why** (decline reason surfaced to them).
- **Daily devotional scroll-back**: paid users can browse PAST devotionals up to a sensible window
  (benchmark first, then pick what suits this app — e.g. last 30–90 days for paid; today + few for free).
- **Cohesion wiring (from expert audit)**: Journey → fire streak + save journal step; unify the single
  streak source; `AppContext`/`useAppData()`; highlights→Library/Journaling; persist reading progress →
  real "Continue"; onboarding answers → first-week content. Map every feature to how it feeds others.

## Platform / settings / launch process (new)
- **Light theme contrast (founder note):** the light (and sepia) themes must have crisp, confident
  contrast like Flutterwave's light UI (deep ink text on clean surfaces, strong CTAs) — not washed out.
  Apply in the W4 theme/typography pass; verify contrast in all three themes.
- **User Settings**: build it (currently lacking) — theme (dark default; light/sepia), notification prefs,
  account, voice-note/playback prefs, language later. **Admin Settings** also lacking — add admin prefs.
- **In-app Notifications for updates**: ensure a notifications system exists; POST-LAUNCH every major
  update sends users an in-app notification (what's changing / changed / any action needed) — changelog.
- **Post-launch deploy discipline**: pre-launch (now) autonomous push-to-prod is fine (no public users).
  After public launch: NO direct-to-prod; staging + founder/designated-dev verification first, then
  promote. `.dev`/staging is the real-time test surface. (Document in DEPLOY.md too.)

## Standing rule
- **Keep THIS plan current.** Every new idea (founder's or discovered during execution) gets added here.
  This is the living plan docket.
