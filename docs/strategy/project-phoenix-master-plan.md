# THE CCN DAILY — Project Phoenix Master Plan
*Built from Africa, for the world*

**Brand positioning:** "Your church in your pocket — built from Africa, for the world."  
**Core differentiation:** The only full ministry stack (devotional + podcast + newsletter + books + Bible + courses + events + community) with an authentic African pastoral voice.

---

## Phase 0 — Completed ✅

All foundational cleanup done in previous sessions:
- Firebase Auth (signInWithRedirect, never popup)
- Brand logo everywhere (SVG gradient flame + transparent PNG wordmark)
- Console.log/error scrubbed from all pages
- Eyebrow headers on all sanctuary pages
- Motion animations (whileInView, AnimatePresence)
- Build optimizations, .env.example

---

## Phase 1 — First Impression (IN PROGRESS)

### 1.1 Landing Page Redesign
**Agent:** Running in background  
**Files:** `pages/LandingPage.tsx`, `public/pr-eryeza.jpg`

Sections:
- Hero: "Scripture. Community. One daily encounter."
- Origin Story: 2017 SMS → WhatsApp → books → podcast → web app, with pastor photo
- Feature Grid: 6 bento cards (Devotionals, Bible, Podcasts, Books, Community, Courses)
- Testimonials: 3 from believers across East Africa
- Scripture ticker: Auto-scrolling CSS animation with key verses
- Final CTA: "Your daily encounter starts here."

### 1.2 4-Screen Onboarding Flow
**Agent:** Running in background  
**Files:** `pages/OnboardingPage.tsx`, `components/auth/RequireAuth.tsx`

Steps:
1. Welcome + preferred name
2. Faith journey stage (4 cards: Beginning / Growing / Established / Leading)
3. What you're looking for (6 multi-select chips)
4. SMS subscription + phone number (optional)

Saves to Firestore: `users/{uid}` with `onboardingComplete: true`  
Gate: RequireAuth checks `onboardingComplete` before allowing `/app/*` access (skips for admin roles)

---

## Phase 2 — Revenue & Generosity (IN PROGRESS)

### 2.1 Donation Page — Stewards of Hope
**Agent:** Running in background  
**Files:** `pages/DonationPage.tsx`, `App.tsx`, `components/Layout.tsx`

Public route: `/#/give` (shareable)

Tiers:
| Tier | Amount | Name |
|---|---|---|
| Seed | $5/mo | "Sow a seed" |
| Branch | $25/mo | "Grow with us" |
| Root | $50/mo | "Go deep" |
| Cornerstone | $100/mo | "Build with us" |

- Flutterwave integration (reuse GivingPage pattern)
- Post-donation thank-you overlay with social share
- External links: Gumroad + theccndaily.com/give
- Saves to `donations/{tx_ref}` in Firestore

### 2.2 University Student Tier
**Agent:** Running in background  
**Files:** `pages/StudentVerificationPage.tsx`, `pages/PricingPage.tsx`

- Route: `/app/student-verify`
- Validates university email domains (.edu, .ac.ug, .ac.ke, etc.)
- Manual verification queue: saves to `studentVerifications/{uid}`
- 6 months free Premium on approval
- Link from Pricing page

---

## Phase 3 — AI & Study Features (IN PROGRESS)

### 3.1 Scripture Study Companion
**Agent:** Running in background  
**Files:** `components/ScriptureStudyCompanion.tsx`, `pages/GuidedJourneyPage.tsx`

- Slide-up panel on journey steps with "Study this passage" button
- Source-anchored: every AI response references the specific passage being studied
- System instruction enforces: pastoral tone, 150-word limit, reflection question
- Saves Q&A to `users/{uid}/study_sessions/{auto-id}`
- Uses `generateCloudflareText` from existing `services/geminiService.ts`
- AI stays invisible — no branding, just a study tool

### 3.2 AI Strategy Principles
- **Source-anchored:** AI always references specific Scripture, never answers in the abstract
- **Device voice typing only:** No expensive voice AI API — native browser `webkitSpeechRecognition`
- **Routing:** Gemini for long-context study / OpenAI for pastoral tone / Cloudflare Workers AI for utility
- **Cloudflare AI Gateway:** All AI calls routed through gateway for cost control, caching, rate limiting
- **AI inside tiers:** Premium feature, not headlined — "deeper study tools" not "AI-powered"
- **Never chatbot-branded:** The AI is called "Study Companion" or "Prayer Companion", never "AI" prominently

---

## Phase 4 — Formation & Discipleship (IN PROGRESS)

### 4.1 Daily/Weekly/Monthly Planner
**Agent:** Running in background  
**Files:** `pages/PlannerPage.tsx`, `components/Layout.tsx`

Theme: Proverbs 3:5-6 — prayerful intention-setting, not productivity tool

- **Daily:** Morning Intention + Three Faithful Steps + Evening Reflection
- **Weekly:** Weekly intention + Scripture anchor + day summary chips
- **Monthly:** Calendar grid + monthly goal + key watch dates
- Saves to `users/{uid}/planner/daily/{YYYY-MM-DD}` etc.
- Route: `/app/planner` · Nav: "Daily Planner" in Pray group

### 4.2 Expert Council → "Seek Counsel"
**Agent:** Running in background  
**Files:** `pages/ExpertCouncilPage.tsx`, `components/Layout.tsx`

- Rename: "Expert Council" → "Seek Counsel"
- Add disclaimer banner: "AI-generated reflections grounded in Scripture. Not real people."
- Add "AI reflection · [Lens] Perspective" label under each persona name
- Update system instructions for all 4 personas to include uncertainty acknowledgement
- Nav label: "Seek Counsel"

---

## Phase 5 — Community & Mission (IN PROGRESS)

### 5.1 In-App Sponsorship Page
**Agent:** Running in background  
**Files:** `pages/SponsorshipPage.tsx`, `App.tsx`, `components/Layout.tsx`

- Route: `/app/sponsor`
- 3 tiers: Newsletter Mention / App Presence / Podcast Sponsorship
- Inquiry form → Firestore `sponsorshipInquiries/{auto-id}`
- Nav: "Partner With Us" in Community group

---

## Phase 6 — Notifications & Connections (NEXT)

### 6.1 Push Notifications
**Implementation approach:**
- Firebase Cloud Messaging (FCM) — already available in Firebase project
- `services/notificationService.ts` — request permission, save FCM token to `users/{uid}/fcmTokens`
- Cloudflare Worker sends triggered pushes (new devotional published, event reminder)
- User preference: `users/{uid}/notificationPrefs` with granular toggles

**What triggers a push:**
- Daily devotional published (7am local — use Cloudflare Cron Triggers)
- Event reminder (24h and 1h before registered events)
- New blog post
- New podcast episode
- Journey completion celebration

### 6.2 Email System (Transactional)
- Platform: Resend or SendGrid (both integrate cleanly with Cloudflare Workers)
- Triggers via Firebase Functions or Cloudflare Workers:
  - Welcome email after onboarding complete
  - Donation thank-you email
  - Student verification confirmation
  - Weekly summary email (digest of devotionals, podcast, events this week)
- Template engine: React Email (produces HTML emails from React components)

### 6.3 SMS Integration (Twilio)
- Already connected via MCP (Twilio MCP configured)
- Morning devotional SMS for users who opt-in during onboarding
- Cloudflare Worker as SMS webhook handler
- Store delivery status in `users/{uid}/smsDeliveries`

---

## Phase 7 — Reading & Listening Experience (NEXT)

### 7.1 Enhanced Bible Reader
**Current state:** Exists, has sidebar, works  
**Improvements needed:**
- Add "Study with this passage" button → opens ScriptureStudyCompanion in-line panel
- Cross-reference panel: when user long-presses/selects a verse, show related verses
- Reading progress bar (tracks book/chapter progress over time)
- Night mode optimization (already has theme support, but Bible text contrast needs review)

### 7.2 Improved Podcast Experience
**Current state:** Spotify-style rows exist  
**Improvements:**
- Episode bookmark/timestamp save (resume where you left off)
- Playback speed control (0.75x, 1x, 1.25x, 1.5x, 2x)
- Episode transcript (if available via show notes)
- "Related devotional" link — episode linked to a devotional on same passage

### 7.3 Reading Plans
**Current state:** Page exists (ReadingPlansPage)  
**Improvements:**
- Pre-loaded plans: 7-day Psalm series, 30-day Proverbs, 21-day Gospel of Mark
- Daily reminder notification tied to plan progress
- Streak counter with grace (miss one day, streak doesn't reset — "grace mode")
- Completion certificate (downloadable/shareable)

---

## Phase 8 — Dashboards (NEXT)

### 8.1 User Dashboard
**Redesign goals:** Benchmark — Linear, Notion, YouVersion home screen  
**Sections:**
- Today's devotional (featured, full card at top)
- Streak counter + "Continue where you left off" for planner
- Quick links: Bible, Podcasts, Planner, Community
- Recent activity: last 3 things touched in the app
- Featured event (next upcoming)
- Prayer prompt of the day (rotating from manuscript content)

### 8.2 Admin Dashboard
**Improvements:**
- Real analytics tiles: Total users, DAU/MAU ratio, top content consumed, donations received
- Content pipeline: devotionals scheduled vs. published
- Growth chart (users over time)
- Notification sender (compose + send push from dashboard)
- Student verification queue (approve/reject pending student applications)
- Sponsorship inquiries queue

---

## Phase 9 — App Flow Logic Audit (NEXT)

### 9.1 Universal Navigation Principles
- Every page that has a "back" semantic (detail views, modals, drawers) must work with browser back button
- Deep links must work: `/#/app/bible` opens Bible Reader signed in; if not signed in → sign-in → redirects to original destination
- Onboarding gate must not catch users who are already onboarded on second device login
- Audio player must persist across navigation (global AudioPlayerContext already exists — verify it doesn't unmount)

### 9.2 Specific Flow Fixes Needed
- After donation success → don't hard-redirect; show thank-you overlay → user chooses next action
- After student verification submit → don't navigate away; show success state in-place
- Prayer planner: autosave must not interrupt typing (debounce 2 seconds)
- Community rooms: deep link to a specific room from a notification

---

## Phase 10 — Polish & Thematic Copy (ONGOING)

### 10.1 Inspirational Quotes from Manuscripts
The manuscripts in `D:\THE CCN DAILY\App upgrade\All final manuscripts` should be mined for:
- Short pullable quotes (1-2 sentences, standalone)
- Used across: dashboard prayer prompt, loading states, empty states, onboarding screens, planner headers

**Quote categories needed:**
- On faithfulness (daily return)
- On community
- On Scripture
- On waiting/endurance
- On Africa and the gospel

### 10.2 Devotional Copy Across All Features
Every feature should feel pastoral, not corporate. Audit needed for:
- Empty states: "No podcasts found" → "Nothing playing yet — start with the latest episode"
- Error states: "Something went wrong" → "We hit an obstacle — try again in a moment"
- Loading states: Animate with a Scripture phrase, not a spinner alone
- Success states: Celebrate with a Scripture reference, not just "Success!"

### 10.3 Banned Phrase Audit
Run final grep before any public release:
```bash
grep -rn "rapidly evolving\|leverage\|seamlessly\|unlock your potential\|professionals\|journey.*marketing\|I'd be happy to\|Certainly!\|Of course!" pages/ components/
```

---

## Technical Debt & Infrastructure (PARALLEL)

### Cloudflare AI Gateway
- All calls to Gemini, OpenAI, and Cloudflare Workers AI routed through AI Gateway
- Environment: `CLOUDFLARE_AI_GATEWAY_URL` in `.env`
- Benefits: cost logging, rate limiting, caching identical queries, single billing dashboard

### Voice Typing (Device-Native Only)
```typescript
// No API calls — native browser
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.onresult = (event) => setTranscript(event.results[0][0].transcript);
recognition.start();
```
Add to: Journaling page, Planner (morning intention), Prayer Companion

### Firebase Rules Tightening
Current rules likely too permissive. Before public launch:
- Users can only read/write their own `users/{uid}/*` documents
- Donations: write-once from client, read only by uid
- Admin reads: scoped to `admin` and `lead_developer` roles
- `studentVerifications` and `sponsorshipInquiries`: create-only from client, admin-read

---

## Launch Checklist

- [ ] Phase 1: Landing page + Onboarding complete
- [ ] Phase 2: Donation page + Student tier complete
- [ ] Phase 3: Scripture Study Companion complete
- [ ] Phase 4: Planner + Expert Council safety labels
- [ ] Phase 5: Sponsorship page
- [ ] Phase 6: Push notifications + Email + SMS
- [ ] Phase 7: Enhanced reading/listening
- [ ] Phase 8: Dashboard redesigns
- [ ] Phase 9: Flow logic audit
- [ ] Phase 10: Copy polish + banned phrase audit
- [ ] Firebase security rules tightened
- [ ] `npx tsc --noEmit` → zero errors
- [ ] `npm run build` → clean build
- [ ] Firebase Hosting domain configured
- [ ] Flutterwave keys (live) set in production env
- [ ] Google OAuth domain authorized in Firebase console
- [ ] Custom domain (theccndaily.com) pointed to Cloudflare Pages

---

*Produced: May 2026 | Project Phoenix | THE CCN DAILY*
