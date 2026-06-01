# Master Launch Plan — THE CCN DAILY (GOAL)

The single sequenced, dependency-aware path to a launch-ready app that stands out. Merges:
`live-walkthrough-findings.md` (functional audit), `feature-benchmark-upgrade-plan.md` (per-feature
benchmarks + AI upgrades), and `positioning-and-differentiation.md` (the stand-out thesis).

## The GOAL
**Ship a launch-ready CCN DAILY that the founder can publish with pride and say "I built this in
Claude" — real on every promise, premium in feel, found by Google and AI engines, and clearly the only
app owning the lane of teaching depth + guided formation + a theologically-disciplined AI companion.**

## Definition of "launch-ready / stand-out"
- Every feature in primary navigation is real (no demo/placeholder/Coming-Soon surfaces).
- The founder can publish content from the UI and it reliably appears to users.
- Sign-in works on all devices with the brand's own domain (no `firebaseapp.com`).
- The app is crawlable and AI-discoverable (schema, sitemap, llms.txt, real URLs).
- Visual polish meets the premium tonal bar already set by the design system.
- At least one **above-standard AI moment** is live (the differentiator made tangible).

---

## Execution sequence (by leverage + dependency)

### Phase A — Make content real (the unlock) 🔴
*Why first: nothing else matters if published content can't reach users.*
- **A1. Real admin auth.** Replace the `x-admin-email` header scheme with server-side verification of
  the Firebase ID token in `functions/api`, deriving admin from the ministry-email allowlist
  (`pastor.eryeza@`, `ccndaily@`). Drop the client token requirement.
- **A2. Unify content storage.** Choose ONE source of truth per type (recommend D1 for
  catalog/devotionals; Firestore only for user-generated data). Align collection/endpoint names
  (`admin_podcasts` vs `podcastEpisodes`, devotionals Firestore vs D1). Route publish + display through it.
- **A3. Email-verification path** so admin writes pass Firestore rules (or move those writes behind the
  verified server session from A1).
- **DoD:** Founder signs in, publishes a devotional/podcast from the Content Manager, and it appears in
  the guided journey + dashboard within seconds. Verified on staging, then prod.

### Phase B — Seed & verify content 🔴
- Seed a real starter set: today's devotional, a few podcasts, one reading plan, one flagship course.
- Walk every surface; confirm none is empty.
- **DoD:** No empty primary surface; the daily journey shows real content.

### Phase C — Streamlining inventory (finish / hide / retire) 🟠
Every page gets a decision so nothing half-built ships in nav.

**Retire / hide (novelty or redundant — don't serve the formation mission):**
- **VisualSanctuary** — AI scene images; no formation value. Hide.
- **VisionaryLab** — AI demo/prototype playground. Hide (internal only).
- Catalog **"Devotionals" tab** (D1) + `/api/devotionals/today` — redundant with the Firestore
  Daily Devotionals source. Retire.
- Stale **Blog Studio admin-token copy** — remove (false after Bearer auth).
- Admin-only prototype pages (MasterPlan, RoadmapEvolution, DataArchitecture, MultiTenancy,
  DynamicTheming, AtmosphericMusic, MediaPlayerPlan, DesignSystem, Team, NextSteps, ChatWithTeam) —
  keep out of member nav; group under a clearly-internal "Lab" or remove.

**Evaluate (keep only if it earns its place, premium + on-brand):**
- **Quote Graphics / Quote Generator** — *legitimate* if it produces premium, on-brand shareable
  quote cards for social distribution (ties to content engine). Keep & polish if so; otherwise retire.
  Decision: keep, but it must pass the premium-tonal bar (Phase E) before launch.
- **VoiceCompanion / "Pray Aloud"** — strong concept; either make it a real free TTS "pray this aloud"
  moment (Phase G) or hide until it works. No half-built premium gate at launch.
- **GrowthConsole** — demo analytics; wire to real data or hide.

**Finish (real feature, just incomplete):**
- **Testimonies** — wire to Firestore (feeds the reviews feature, Phase D); remove placeholder data.
- **Audiobooks** — replace "Coming Soon" with the real `/api/audiobooks` catalog, or hide until seeded.
- **GraceLink** — wire gifting to real data or hide.

- **DoD:** Nothing demo/placeholder/Coming-Soon is reachable in primary (member) navigation; internal
  tools are clearly separated; every visible feature is real.

### Phase D — Reviews feature ✨
- Build per spec: low-friction prompt ("why it matters") + ghost-text starter; round avatar (initials
  fallback); dynamic populate; scroll/rotate that scales with count; light moderation; remove the 3
  hardcoded landing testimonials.
- **DoD:** A signed-in user leaves a review; it appears live; the section scales gracefully.

### Phase E — Visual polish pass (premium-tonal) 🟡
- Hero: strengthen headline contrast (`--fg-1`), fix murky image, add header wordmark lockup.
- Dashboard/home: editorial/bento layout with one focal action; standardize cards on existing tonal
  surfaces/shadows; designed hover/focus/active states.
- Guided-journey timeline spacing; verify sign-in modal backdrop.
- **DoD:** Landing + home + journey read as a believable premium product screenshot in both themes.

### Phase F — SEO / GEO + performance 🟠
- Migrate HashRouter → BrowserRouter (SPA fallback already in `_redirects`).
- Add JSON-LD (Organization, WebSite, Article/Devotional), per-route meta/OG + og:image, `robots.txt`,
  `sitemap.xml`, `llms.txt`; dynamic canonical.
- Performance: route-based `React.lazy`/`Suspense` code-splitting; lazy-load Firebase/Mux/Flutterwave/
  remotion; self-host + subset fonts with `font-display: swap`.
- **DoD:** Lighthouse CWV in target; pages crawlable; structured data validates; AI engines can parse
  a clear entity description (from the positioning doc).

### Phase G — The above-standard AI moment ✨ (the differentiator, made tangible)
- Ship at least one: (a) one-tap **AI audio narration** of the daily devotional, (b) **personalized**
  daily reflection grounded in the reader's journey (under theological guardrails), or (c) surface the
  **Scripture Study Companion** contextually in the Bible reader.
- **DoD:** A first-time user can experience one clearly above-category AI moment that serves the text.

### Phase H — Google custom-domain auth 🟠
- authDomain → `theccndaily.com` via a Cloudflare proxy for `/__/auth/*`; Google Cloud OAuth + Firebase
  authorized-domains config (founder console steps). Kills the loop and the `firebaseapp.com` branding.
- **DoD:** Google sign-in works on desktop + mobile; users only ever see `theccndaily.com`.

---

## Ownership
- **Claude (code):** A1–A2, C wiring, D, E, F, G; H proxy code.
- **Founder (console):** A3 email verify, B content seeding (or approve AI drafts), H Google Cloud +
  Firebase steps, payment-key confirmation.

## Accessibility & a11y (woven through E–G)
- Fix contrast (E), honor `prefers-reduced-motion` globally, modal focus-trap + keyboard nav, ARIA.

## Working method
- Every change: build → verify on staging → promote to production (per `DEPLOY.md`). Code stored in
  GitHub. Nothing untested reaches live users.

## Decision log
- **Podcasts = RSS source of truth** (Anchor.fm). Dashboard card now reads the RSS feed (matching the
  public library); the orphaned `admin_podcasts` Firestore CRUD and the empty `podcastEpisodes` read are
  abandoned. Phase C: retire/hide the Content Manager "Podcasts" tab. Newsletters likely follow the same
  pattern (Substack RSS via `NewsletterPage`) — retire the `admin_newsletters` CRUD unless self-hosting.

## Decision log (cont.)
- **Blog ≠ Devotional (kept separate, per founder).**
  - **Devotional** = the journey's core content (optionally public). Source of truth = Firestore
    `devotionals` (Content Manager → Daily Devotionals tab). The guided journey reads this. Only
    **published** (not draft) devotionals appear.
  - **Blog** = public-facing essays. Source = D1 `blog_posts` (Blog Studio) → public Blog page.
  - **Redundancy to retire (Phase C):** the catalog "Devotionals" tab (D1 `devotionals` table) +
    `/api/devotionals/today` — duplicates the Firestore devotional source. Keep ONE devotional
    authoring surface (the Daily Devotionals tab).
- **Blog Studio stale copy:** the "PRODUCTION ADMIN TOKEN" field + "Admin gate" note are no longer true
  after the Bearer-token auth migration. Remove/replace (quick Phase C cleanup).
- **VisualSanctuary: retire** (Phase C). AI scene-image generation is a novelty that doesn't serve the
  formation mission; not launch-worthy. Hide from nav.

## Content Manager authoring gaps (Phase B/C — must fix before seeding is sane)
- **Two competing Book surfaces:** the catalog "Books (EPUB/PDF)" tab has real file upload
  (cover + EPUB/PDF via `uploadCatalogMedia`), but the separate "Books Library" tab is **URL-only**
  (no upload). → Consolidate to ONE book authoring surface with file upload **and** an optional URL
  field (for externally-hosted files/covers). Retire the duplicate.
- **Covers:** several forms (Books Library, Reading Plans, Podcasts, Newsletters) accept **cover URL
  only** — add image **upload** (with URL as the alternative) consistently across all forms.
- **Reading Plans authoring is unclear:** a plan is a **structured schedule** (ordered day/items),
  not a file upload. Clarify the form (it builds items; cover optional via upload/URL); remove any
  implication that a file is uploaded.
- **Per-item audio/video upload** (founder request) — same `uploadCatalogMedia` plumbing already
  exists for the catalog tabs; extend it to the surfaces that still only take URLs.
- **DoD:** one clear path per content type to add a cover (upload or URL) and a file where relevant;
  no URL-only dead-ends; reading-plan authoring is self-explanatory.

## Autonomous execution goal (founder away — finish on staging)

**Goal:** complete the Phase E visual + authoring polish to a premium, benchmarked bar, all verified on
**staging**. Production promotion stays with the founder (their standing rule: never risk live users).

Autonomous task list (in order, deploy+screenshot-verify each on staging):
1. ✅ Logo lockup (flame+wordmark as one) — done & verified.
2. ✅ Theme-flash (FOUC) eliminated; deprecated meta fixed — done.
3. ✅ MediaUpload component + author photo + book/reading-plan covers; R2 live — done.
4. Guided-journey timeline — fix crowded/overlapping step labels.
5. Dashboard + cards — editorial hierarchy, designed hover/focus/active states (premium-tonal).
6. Sign-in modal — backdrop/contrast polish.
7. Catalog editor — upgrade raw file inputs to `<MediaUpload>` (drag/drop, preview, format hints).
8. Empty states — every list (catalog, community, journal) gets a premium empty state, not a blank.

**New tracks (see `services-and-features-roadmap.md`):** Media On Demand (audio+video, with a/v
version selection), podcast audio/video toggle, **support system** (live chat + tickets + AI-drafted
human-reviewed replies, in-app/Firestore for security), **Cloudflare Stream** migration for video
(substitute Mux; founder-approved direction), **keep Resend** (revisit Cloudflare Email at GA).

**GOAL until founder returns (autonomous):** finish the Phase E visual + authoring polish on staging
(dashboard/cards, catalog editor → MediaUpload, empty states), verify catalog *display* across all
content types (audiobook confirmed working), and produce ready-to-build **design specs** for the new
tracks above. Build polish + write specs; do NOT autonomously build large new features or migrate video
without review. Everything on staging; production promotion stays with the founder.

**Deferred for founder (NOT autonomous):**
- Production promotion of the verified staging build.
- Large new builds: support system, Media On Demand, Stream migration, Course/Challenge rich attachments.
- Email-verification, Google custom-domain (Phase H); Phase F (SEO/GEO+perf) & Phase G (AI moves).

Rule: stay on staging; commit each step; checkpoint via save-session before context runs out.

## Backlog — founder requests (slot into Phase E/G)
- **Rich-text editor** in the devotional/content generator (formatting commands, not raw markdown).
- **Standardize design-system fonts/styles across all screens** — some screens don't use the
  Cormorant/EB Garamond/Inter Tight tokens; audit and normalize against `index.css`.
- **Content Manager: per-item audio/video upload** to the library (individual media assets), not just
  catalog records.
- **Fix Roles-page admin promotion** (writing a user's role to admin currently fails) — reconcile with
  the rules' role-change path; not blocking since ministry emails are admin via the allowlist.

## Status
- [x] Audit complete (functional, visual/tonal, a11y, perf, SEO-file-level)
- [x] Positioning thesis captured
- [ ] Phase A …→ H (this plan)
- [ ] Expert SEO/GEO/security synthesis layered in when the Workflow tool re-enables (additive)
