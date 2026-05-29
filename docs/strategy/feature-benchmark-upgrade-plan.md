# Feature Benchmark & Upgrade Plan — "Launch-Ready, Trend-Setting"

For each feature: **Current state** → **Industry benchmark** (best-in-class) → **Above-standard / AI trend-setting** (what CCN's Gemini + Workers AI + a pastoral voice can do that others don't) → **Upgrade plan** (concrete, launch-ready).

> Benchmarks below are from category knowledge of YouVersion, Hallow, Glorify, Pray.com, Abide, Dwell,
> Lectio 365, plus modern product/dashboard UX. The expert research pass (pending Workflow re-enable)
> will add live-cited specifics; the upgrade plan stands on its own.

---

## Cross-cutting: the trend-setting thesis
Competitors are either **Bible utility** (YouVersion) or **calm/audio wellness** (Hallow, Abide). None
combine **(a) pastoral, text-anchored teaching depth**, **(b) a guided daily *formation* journey**, and
**(c) an AI study/prayer companion that stays theologically disciplined**. That triangulation is CCN's
stand-out lane. Every feature below should ladder up to: *"formation over consumption, depth without
coldness, AI that serves the text — not replaces it."*

---

## 1. Daily Devotional / Guided Journey (the core)
- **Current:** Real, well-structured journey (Prepare → Prayer → Devotional → Journaling → Declaration → Study → Finish). Reads from D1.
- **Benchmark:** Lectio 365 (structured morning/evening liturgy), Hallow (session framing, progress), YouVersion (verse-of-day + plans).
- **Above-standard (AI):** A devotional that *adapts to the reader* — references their journey stage and past reflections — while every theological claim is generated under guardrails (tie to `biblical-interpreter-master` / `theological-guardrails-writer`). Optional one-tap **AI audio narration** of the day in a warm voice. A closing **"declaration"** spoken aloud (voice) — almost nobody does spoken declaration well.
- **Upgrade:** (1) Fix the publish→display store so today's devotional reliably appears. (2) Add progress persistence + streak tie-in. (3) Add AI narration (TTS) + personalized reflection prompts. (4) Smooth the step timeline (spacing/responsive).

## 2. Bible Reader
- **Current:** API.Bible-backed, highlights saved to Firestore.
- **Benchmark:** YouVersion is the gold standard — versions, audio, plans, verse images, social highlights.
- **Above-standard (AI):** Inline **AI Scripture Study Companion** (already exists) — tap a verse for pastoral, text-anchored exposition (genre-aware, not proof-texting). Cross-reference and "what's the redemptive-historical thread here?" on demand.
- **Upgrade:** Surface the study companion contextually; add verse-share images (tonal templates); ensure audio Bible; offline cache for reading.

## 3. Audio Devotionals / Podcasts
- **Current:** Podcast pages exist; publish→display collection mismatch (`admin_podcasts` vs `podcastEpisodes`).
- **Benchmark:** Hallow/Pray.com/Abide — premium audio, sleep/calm framing, background play, episodes with chapters.
- **Above-standard (AI):** Auto-generate episode show notes, chapter markers, and a "key takeaways" card from the transcript (Otter/Workers AI). AI-narrated text devotionals as audio for consistency.
- **Upgrade:** Fix the collection mismatch; add a proper audio player (background, speed, resume — `player.style` is already a dep); episode artwork from the tonal system.

## 4. Journaling
- **Current:** Notes to Firestore; journaling step in the journey.
- **Benchmark:** Dwell/Glorify — guided prompts, gratitude, prayer lists.
- **Above-standard (AI):** AI reflection prompts grounded in the day's passage; optional "pray this back" that turns a journal entry into a short prayer; private by default, never used to train.
- **Upgrade:** Add prompt scaffolding (ghost-text), tagging, and a gentle weekly "look back" summary.

## 5. Reading Plans
- **Current:** Page exists.
- **Benchmark:** YouVersion plans (huge library, with-friends, catch-up logic).
- **Above-standard (AI):** Generate a **personalized plan** from a goal ("rebuild trust after burnout," "study the Psalms of ascent") in CCN's voice; adaptive pacing.
- **Upgrade:** Seed a starter set of real plans; add progress + catch-up; AI plan generator for the founder to publish.

## 6. Courses / Discipleship
- **Current:** Catalog via D1; module managers exist.
- **Benchmark:** RightNow Media, Hallow courses — structured, video, completion.
- **Above-standard (AI):** Cohort-style discipleship with AI check-ins; auto-quiz/reflection from lesson content.
- **Upgrade:** Confirm enrolment + progress; seed one flagship course; clear premium gating.

## 7. Community / Prayer
- **Current:** Prayer requests (Firestore), community rooms, testimonies (placeholder data).
- **Benchmark:** YouVersion Prayer (lists, "I prayed" counts), Hallow community.
- **Above-standard:** "Pray with one tap" + private/anonymous options; a **moderated** wall (you flagged moderation matters). AI never speaks *as* God here — strictly human + Scripture.
- **Upgrade:** Wire testimonies to Firestore (remove placeholder); add prayer counts + reporting/moderation; gentle empty states.

## 8. Gamification / Streaks
- **Current:** Mock data (`gamificationData.ts`).
- **Benchmark:** YouVersion streaks; Duolingo-style habit loops (streak freeze, milestones).
- **Above-standard:** Frame as **faithfulness, not addiction** — "consistency in His presence," not dopamine grind. Streak-freeze grace. Milestones tied to formation, not points-farming.
- **Upgrade:** Replace mock with real stats from actual activity; design a tasteful, on-brand progress system (avoid the loud game look).

## 9. Giving
- **Current:** Real Flutterwave + Firestore; sandbox-key fallback risk.
- **Benchmark:** Tithe.ly, Pushpay — recurring, designated funds, receipts.
- **Above-standard:** Transparent "what your gift does" storytelling; frictionless recurring; instant receipt.
- **Upgrade:** Guarantee live key in all envs; add recurring + designation + email receipt; premium giving UI.

## 10. Reviews / Testimonials (NEW — to build)
- **Current:** 3 hardcoded placeholders, no submission.
- **Benchmark:** App Store rating cards, modern SaaS testimonial walls (rotating, avatars, verified).
- **Above-standard:** Low-friction prompt ("why it matters") + ghost-text starter; round avatar (initials fallback); dynamic populate with a graceful scroll/marquee that scales with count; light moderation.
- **Upgrade:** Full build per the agreed spec (data model, submission UX, display, anti-abuse).

## 11. Onboarding
- **Current:** 4-step, now saving correctly; phone copy fixed.
- **Benchmark:** Hallow's personalization onboarding (sets intentions, tailors content) is best-in-class.
- **Above-standard:** Use onboarding answers to *actually* tailor the first week (AI-curated). Make step 1 feel like a warm welcome, not a form.
- **Upgrade:** Wire interests/faith-stage into first content surfaced; tighten copy to pastoral voice.

## 12. Admin / Content Command Center
- **Current:** Powerful but blocked by auth in prod; split storage.
- **Benchmark:** Modern CMS dashboards (Notion, Sanity Studio, Linear) — fast, clear, keyboard-friendly.
- **Above-standard:** **AI-assisted authoring** — draft a devotional in the founder's pastoral voice (writing-pipeline skills), then edit. One-click publish that lands in the *right* store and surfaces to users.
- **Upgrade:** Real session auth (unblock publishing); unify storage; add AI draft + voice-check; clean dashboard cards/metrics (real data, not demo).

## 13. Landing / Marketing
- **Current:** Strong tonal foundation; hero under-contrast; placeholder testimonials; SEO-invisible.
- **Benchmark:** Premium SaaS landing (Linear, Stripe, Superhuman) — crisp hierarchy, proof, motion with purpose.
- **Above-standard:** Editorial, Scripture-anchored hero with real motion restraint; live reviews; structured data so Google/Gemini feature it.
- **Upgrade:** Strengthen hero contrast + wordmark lockup; fix image treatment; add SEO/GEO (schema, robots, sitemap, llms.txt, BrowserRouter).

## 14. Home Dashboard & Cards (design-system level)
- **Benchmark:** Modern dashboards (Linear, Arc, Things) — bento layouts, clear card hierarchy, restrained depth, purposeful motion.
- **Above-standard:** A "today" home that feels editorial, not a generic card grid — one focal action (continue your journey), supporting cards in the tonal mid-ramp, gentle motion.
- **Upgrade:** Audit each card for hierarchy/rhythm (avoid uniform grid); standardize on the tonal surfaces/shadows already in `index.css`; add tasteful hover/active states.

---

## Sequencing note
This benchmark plan feeds the master launch-readiness sequence. Recommended order by leverage:
**A.** Content pipeline + admin auth (unblocks the whole product) →
**B.** Seed/verify content so surfaces aren't empty →
**C.** Decide finish/hide on unfinished pages →
**D.** Reviews feature →
**E.** Visual polish pass (hero, cards, dashboard, wordmark) →
**F.** SEO/GEO + performance (code-split, fonts, schema, BrowserRouter) →
**G.** AI trend-setting layer (narration, personalized devotional, study companion surfacing) →
**H.** Google custom-domain auth.
