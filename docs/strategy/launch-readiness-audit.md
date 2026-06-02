# Launch-Readiness Audit (expert review 2026-06-03)

Read-only audit. Branch `phase-e-visual-authoring`. Source: launch-readiness expert agent.

## Launch-ready ✅ (genuinely solid)
Auth & onboarding; Guided Journey; Bible reader; Podcasts; Newsletters; Testimonies (admin-approval);
Settings; Prayer Circle; Journaling; The Community; Help/Contact; one-time **Giving** (real Flutterwave,
sandbox-key fallback if env unset); error boundary + empty states; mobile nav.

## Launch BLOCKERS 🔴
1. **Security — 3 CRITICAL + 1 HIGH still open** (server-side):
   - **C-1** `/api/media/*` streams any R2 object, no auth/entitlement → paid media world-readable.
   - **C-2** all `POST/PATCH /api/users/:userId/*` trust body `userId`, no Bearer/`uid===param`
     (and clients except `adminAuth.ts` send no token) → write as anyone.
   - **C-3** `/api/auth/profile` derives admin role from body email, no token → privilege escalation.
   - **H-2** `/api/ai/generate` unauthenticated, no rate-limit/Turnstile → AI cost-abuse (now real $ since
     the AI binding is live).
2. **SEO/GEO — entirely missing:** still `HashRouter` (uncrawlable `/#/`); no robots.txt / sitemap.xml /
   llms.txt; no JSON-LD; no og:image. App invisible to Google + AI engines. (SPA fallback already in
   `_redirects`, so BrowserRouter migration is unblocked.)
3. **Payments loop unbuilt:** `purchaseService` is a client stub; PricingPage shows tiers with no checkout.
4. **Performance:** no route code-splitting (all ~70 pages static-imported); fonts not subset.

## Unfinished / stub features in member nav (build-to-finish)
| Feature | Status | Evidence |
|---|---|---|
| Books "Read" (EPUB reader) | **STUB** | `BookReaderPage.tsx:116` "EPUB rendering integration pending"; `EpubReader.tsx` lorem-ipsum |
| Your Journey (gamification) | **MOCK** | `GamificationPage` renders `mockAchievements/mockRewards/mockEarningActions` |
| Grace Links (gifting) | **MOCK** | `GraceLinkPage` mock items + fake `setTimeout`/`Math.random` link |
| TTS "Pray Aloud" voices | **MOCK** | `ttsService.ts` returns SoundHelix music as "AI voices" |
| Your Library — Highlights tab | **PARTIAL** | aggregation endpoint missing (Notes tab works) |
| Leader Dashboard | **PARTIAL** | 3× "Coming Soon" sections |
| Live Broadcast | **PARTIAL** | offline placeholder; awaits Stream enablement |
| Family/Group seats | **PLACEHOLDER** | `useState` only, no backend (also a pricing blocker) |
| Audiobooks / Events / Courses | **DATA-EMPTY** | shells real; need seeded content |

## Prioritized build-to-finish (highest impact/risk first)
1. **Server-side auth/entitlement** (C-1/C-2/C-3/H-2) + send ID tokens from `services/*`. **Launch blocker.**
2. **SEO/GEO**: HashRouter→BrowserRouter; robots/sitemap/llms.txt; JSON-LD; og:image.
3. **Payment + entitlement loop** (then PricingPage checkout) — pairs with pricing-strategy.md.
4. **EPUB reader engine** (real book rendering; beat Kindle).
5. **Gamification real data** (drop mock fixtures).
6. **Library highlights aggregation** endpoint.
7. **GraceLink** real gifting backend (or hide for launch).
8. **TTS** real Workers AI/Gemini narration (or remove voice picker).
9. **Finish/hide "Coming Soon"** panels (Leader dashboard, dashboard latest-episode, ChatWithTeam mock).
10. **Live Broadcast/Stream**: enable Stream or hide Live nav until functional.

**Net:** core daily-formation surfaces are launch-ready; blockers are server-side security, the missing
SEO/GEO layer, the unbuilt payment loop, and a cluster of stub/mock nav surfaces.
