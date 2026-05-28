# THE CCN DAILY — Application Documentation

> A living document covering the architecture, feature logic, infrastructure, and development context of THE CCN DAILY progressive web app.

---

## 1. What This App Is

THE CCN DAILY is a Scripture-anchored daily formation platform — a digital home for believers who want to walk closely with God, think biblically, and live faithfully wherever He has placed them.

It began in 2017 as Bible-based encouragement distributed to a small group of friends. It has grown into a full-stack progressive web app that serves devotionals, community, Bible study, prayer, podcasts, books, and more — all under one roof, available on any device.

**Live URL:** https://theccndaily.com  
**Repository:** https://github.com/preryezak/the-ccn-daily  
**Founder:** Eryeza Kalalu (Uganda)

---

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 5 with esbuild minification |
| Styling | Tailwind CSS v4 (CSS-first config) |
| Routing | React Router v7 (HashRouter — `/#/path`) |
| Animation | motion/react (Framer Motion v12+) |
| Authentication | Firebase Auth (Google OAuth + Email/Password) |
| Database | Firebase Firestore (NoSQL document store) |
| File Storage | Firebase Storage |
| Edge Database | Cloudflare D1 (SQLite at the edge — schema in `/schema/d1-schema.sql`) |
| AI Engine | Cloudflare Workers AI (routed via `/api/ai/generate`) |
| Video | Mux (stream) + `@mux/mux-player-react` |
| Payments | Flutterwave v3 (`flutterwave-react-v3`) |
| Email | Resend |
| Podcast/RSS | `rss-parser` |
| Video Generation | Remotion (`remotion`, `@remotion/player`) |
| State | React Context (AuthContext, ThemeContext, GamificationContext, AudioPlayerContext, etc.) |
| Icons | Lucide React |
| Notifications | `sonner` toast system |
| Hosting | Cloudflare Pages |
| CI/CD | GitHub Actions → Cloudflare Pages |

---

## 3. Infrastructure: GitHub → Cloudflare → Firebase

### How the three systems connect

```
Developer (local)
     │
     │  git push main
     ▼
GitHub (preryezak/the-ccn-daily)
     │
     │  Triggers GitHub Actions workflow (.github/workflows/deploy.yml)
     ▼
GitHub Actions (ubuntu-latest runner)
     │  1. npm ci — install dependencies
     │  2. npm run build — Vite bundles app, injects Firebase env vars
     │  3. wrangler d1 execute — applies D1 schema to Cloudflare edge DB
     │  4. wrangler pages deploy dist — pushes built files to Cloudflare Pages
     ▼
Cloudflare Pages (project-phoenix-ccn-daily)
     │  Static files served globally via Cloudflare CDN
     │  Edge functions (Cloudflare Workers) handle /api/* routes
     │  D1 database available at edge for fast structured queries
     ▼
User's Browser
     │  React app bootstraps from /index.html
     │  Firebase SDK initializes → connects to Firebase Auth + Firestore
     │  All auth state managed by Firebase
     │  All user data (journals, progress, roles) stored in Firestore
```

### Key configuration files

| File | Purpose |
|------|---------|
| `.github/workflows/deploy.yml` | CI/CD pipeline — build → D1 schema → deploy |
| `vite.config.ts` | Build config, vendor chunk splitting, console.log stripping |
| `wrangler.toml` | Cloudflare Pages + D1 binding config |
| `public/_redirects` | `/* /index.html 200` — SPA fallback for Cloudflare Pages |
| `.env.example` | Documents all required environment variables |
| `firebase.ts` | Firebase SDK initialization (uses `VITE_FIREBASE_*` env vars) |
| `schema/d1-schema.sql` | Edge database schema (applied on every deploy) |

### Environment variables (set in GitHub Secrets)

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_VAPID_KEY        ← Web push notifications
VITE_FLUTTERWAVE_PUBLIC_KEY    ← Payment processing
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

### URL routing

The app uses `HashRouter`. All in-app URLs follow the pattern `https://theccndaily.com/#/app/dashboard`. This avoids server-side routing configuration on Cloudflare Pages while keeping the SPA intact.

Public routes (no auth required): `/`, `/pricing`, `/give`, `/blog/*`  
App routes (auth required): `/#/app/*`  
Studio routes (admin/content team): `/#/studio/*`

---

## 4. Authentication System

### How it works

Authentication is managed entirely by Firebase Auth with two sign-in methods:

**Google OAuth (via redirect):**
1. User clicks "Continue with Google"
2. `signInWithRedirect()` navigates to Google's consent screen
3. Google redirects back to the app with a credential
4. `getRedirectResult()` catches the credential on page load
5. `onAuthStateChanged` fires → user object is set in `AuthContext`

**Email + Password:**
1. User enters email/password in `SignInModal`
2. `signInWithEmailAndPassword()` or `createUserWithEmailAndPassword()` is called
3. On success, `onAuthStateChanged` fires → user is set

**Password reset:**
1. User enters email on the reset tab
2. `sendPasswordResetEmail()` sends a Firebase reset link
3. User clicks the link in their email → Firebase handles the reset flow

### Role system

On every auth state change, the app reads the user's Firestore document (`users/{uid}`) to resolve their role:

| Role | Access |
|------|--------|
| `guest` | Public pages only |
| `user` | All app features at free tier |
| `pro` | Pro-tier AI features |
| `max` | Max-tier features (deep AI, cinematic video) |
| `partner` | Partner-level access |
| `admin` | Full studio access (content manager, admin dashboard, etc.) |

The `RequireAuth` component redirects unauthenticated users to the sign-in modal. The `RequireRole` component gates routes by minimum role.

### Sign-in modal

`components/auth/SignInModal.tsx` — a full-page overlay triggered globally via `AuthContext.openSignIn()`. It supports:
- Email/password sign-in
- Email sign-up (with confirm password)
- Password reset flow
- Google sign-in tab
- Animated error messages
- Responsive layout (slides up from bottom on mobile, centered dialog on desktop)

---

## 5. AI Design: Not Tied to One Provider

The app is deliberately designed so that the AI engine can be swapped without touching the React codebase.

### How it works

All AI calls go through a single internal endpoint:

```
POST /api/ai/generate
Body: { feature, prompt, systemInstruction, history, model, userId, units }
```

This endpoint lives in a Cloudflare Worker (or Hono server). The Worker calls whatever AI backend is configured. Currently it routes to **Cloudflare Workers AI** using Meta's Llama 3.1 models.

The AI routing layer in `services/geminiService.ts` defines three model tiers:

```ts
LITE_MODEL  = '@cf/meta/llama-3.1-8b-instruct'  // Default free-plan
FLASH_MODEL = '@cf/meta/llama-3.1-8b-instruct'  // Richer reasoning
PRO_MODEL   = '@cf/meta/llama-3.1-8b-instruct'  // Reserved for max/admin
```

### To swap AI providers

**Switch to Google Gemini (Gemini API):**
1. Update the Worker (`/api/ai/generate`) to call `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`
2. Add `GEMINI_API_KEY` as a Cloudflare secret
3. Map LITE/FLASH/PRO model names to `gemini-1.5-flash`, `gemini-1.5-pro`, etc.
4. No changes to any React component

**Switch to OpenAI:**
1. Update the Worker to call `https://api.openai.com/v1/chat/completions`
2. Add `OPENAI_API_KEY` as a Cloudflare secret
3. Map model names to `gpt-4o-mini`, `gpt-4o`, etc.

**Switch to Anthropic Claude:**
1. Update the Worker to call `https://api.anthropic.com/v1/messages`
2. Add `ANTHROPIC_API_KEY` as a Cloudflare secret
3. Map model names to `claude-haiku-3-5`, `claude-sonnet-4-5`, etc.

The React app never knows which AI backend is used. The `generateCloudflareText()` function is the only integration point.

### Capability gating

Each AI feature has a minimum user tier and model assignment:

| Feature | Min Tier | Model |
|---------|---------|-------|
| AI Spiritual Coach | free | LITE |
| Personalized Devotional | pro | LITE |
| Deep Theological Study | max | PRO |
| Grounded Prayer Topics | pro | FLASH |
| Quote Image Generation | pro | FLASH |
| AI Cinematic Video | max | PRO |

---

## 6. Feature Inventory

Every feature listed below is built and present in the codebase. Implementation maturity varies — some are fully wired to Firestore, others use placeholder/mock data awaiting backend connection.

### Pray (Daily Formation)

**Guided Daily Journey** (`/app/guided-journey`)  
A step-by-step daily formation sequence. Each step can include Scripture reading, reflection prompts, audio prayer, and journaling prompts. Steps animate in sequence with motion transitions. A "Pray Aloud" mic button in each step opens the Voice Prayer drawer.

**Daily Planner** (`/app/planner`)  
Personal daily planning integrated with the spiritual formation rhythm. Users can set intentions, schedule time with God, and track completion.

**Journaling** (`/app/journaling`)  
Rich-text journaling with `RichTextJournal`. Journal entries are saved to Firestore. Prompts can be pulled from the devotional or entered freely.

**Prayer Circle** (`/app/prayer-circle`)  
A daily-rotating prayer companion. Each day a different member name is drawn from the community roster using a deterministic seed (date-based), ensuring every user prays for the same person on the same day without requiring a server call. Uses `usePrayerCircle` hook backed by localStorage.

**Visual Sanctuary** (`/app/visual-sanctuary`)  
A contemplative visual experience — ambient visuals and Scripture displayed for focused prayer or reflection time.

**Voice Prayer** (embedded in Guided Journey)  
A mic-activated voice prayer session. Built as `VoiceCompanionDrawer` — a spring-animated slide-up panel containing an orb animation, start/stop recording, and live transcript. Connects to `liveService.ts`. Also accessible as a standalone page at `/app/sentient-guide`.

### Read (Scripture & Formation Content)

**Bible Reader** (`/app/bible`)  
Full Bible reading with book/chapter selection. Collapsible sidebar on mobile. Study with a Guide panel (`BibleStudyGuide`) provides contextual AI-assisted study questions based on the passage being read. Highlights, bookmarks, and notes save to Firestore.

**Books Library** (`/app/books`)  
A catalog of Christian books. Users browse and open books in the built-in reader (`BookReaderPage`).

**Audiobook Library** (`/app/audiobook-library`)  
Spotify-style audiobook browsing with an audio player (`AudioPlayerContext`). Supports play/pause, scrubbing, and background playback.

**Reading Plans** (`/app/reading-plans`)  
Structured multi-day Scripture reading plans. Progress tracked per user in Firestore.

**Podcast Library** (`/app/podcasts`)  
Browse and play podcast episodes. RSS feed parsed via `rssService.ts`. Multiple podcast series supported.

**News / Newsletters** (`/app/newsletters`)  
CCN Daily newsletters delivered inside the app. Browsable archive.

**Courses** (`/app/courses`)  
Multi-module faith formation courses. Each course has a module manager (`CourseModuleManagerPage`) and a player (`CoursePlayerPage`).

**Seek Counsel** (`/app/expert-council`)  
Four AI counselor personas (Scripture, Pastoral, Practical, Prophetic) available for typed conversation. Each persona has a distinct system instruction. The Bible Study Guide panel reuses this feature inside the Bible Reader.

### Community

**Challenges** (`/app/challenges`)  
Community-wide spiritual challenges (prayer, fasting, reading). Users join, track progress, and complete modules. Challenge detail and module viewer pages included.

**Community Rooms** (`/app/community-rooms`)  
Live discussion rooms with colored avatar indicators for presence. Threaded messages, reactions.

**The Community** (`/app/the-community`)  
The main community hub. Admin-guarded content sections. Posts, announcements, community feed.

**Testimonies** (`/app/testimonies`)  
Members share written testimonies. Spring-modal detail view. Moderated feed.

**Grace Links** (`/app/grace-link`)  
A gifting/blessing feature — members can send digital gifts or encouragements to one another. Connected to Firestore gifting data (placeholder data currently present).

**Partner With Us** (`/app/sponsor`)  
Sponsorship page for ministry partners and donors.

### Live

**Live Events** (`/app/events`)  
Event listings with registration. Upcoming and past events. Calendar integration.

**Live Broadcast** (`/app/live`)  
Real-time live stream viewer powered by Mux. Displays live video when a broadcast is active.

### Account & Growth

**Dashboard** (`/app/dashboard`)  
Personal home screen showing today's devotional, reading streak, prayer stats, and quick-access links.

**Your Journey — Gamification** (`/app/gamification`)  
Points, streaks, badges, and level progression to encourage daily formation habits. `GamificationContext` tracks state. Firestore-backed progress.

**Inbox & Updates** (`/app/inbox`)  
In-app notifications, ministry updates, and system messages.

**Family Dashboard** (`/app/family-dashboard`)  
A family formation hub — assign devotionals to family members, track group progress.

**Leader Dashboard** (`/app/leader-dashboard`)  
For cell group leaders and ministry leaders — manage a group, track member engagement, send messages.

**Giving & Support** (`/app/giving`)  
In-app giving to CCN ministry. Flutterwave v3 payment processing. Public shareable giving page at `/give` (no auth required).

**Upgrade Plan / Pricing** (`/pricing`)  
Tier comparison (Free / Pro / Max). Flutterwave payment flow. Auth-gated upgrade triggers the sign-in modal.

**Help & Contact** (`/app/help`)  
Support resources and contact form.

**Atmospheric Music** (`/app/atmospheric-music`)  
Background worship/atmospheric music for prayer and study sessions.

**Onboarding** (`/app/onboarding`)  
New user onboarding flow — sets preferences, selects interests, creates initial profile.

### Studio (Content Team & Admin)

**Admin Dashboard** (`/studio/admin`)  
Full platform overview — user stats, content metrics, system health indicators. Admin-role only.

**Content Manager** (`/studio/content-manager`)  
Create and publish devotionals, podcasts, and newsletters. Fields include: title, body, Scripture reference, author name, author photo URL, author bio, author social handles. Rich tabbed interface with Devotionals / Podcasts / Newsletters tabs.

**Blog Studio** (`/studio/blog`)  
Write, edit, and publish blog posts. Markdown editor with preview.

**Devotional Generator** (`/studio/devotional-generator`)  
AI-assisted devotional generation. Prompts the AI to produce a Scripture-anchored devotional for a given text. Output can be edited and published directly to the app.

**Quote Graphics** (`/studio/quote-generator`)  
Generate shareable quote images from Scripture or devotional text. Remotion-powered video/image rendering.

**Growth Console** (`/studio/growth`)  
Analytics and engagement metrics. User acquisition, retention, feature usage. Demo data currently; connects to analytics service when ready.

**Roles & Permissions** (`/studio/roles`)  
Manage user roles (user / pro / max / partner / admin). Assign and revoke access.

**Release Ops** (`/studio/release-ops`)  
Release management console. Feature flag toggles, staged rollouts, deployment tracking.

**System Diagnostics** (`/studio/diagnostics`)  
Health checks — Firebase connectivity, API response times, D1 query latency.

**Team Chat** (`/studio/chat`)  
Internal team communication with an embedded AI Team Coach for content and ministry guidance.

---

## 7. Brand & Design System

### Color tokens (Tailwind CSS custom classes)

| Token | Meaning |
|-------|---------|
| `bg-brand-dark` | Page background (deep near-black) |
| `bg-brand-secondary` | Card / input backgrounds |
| `text-brand-text-primary` | Primary text |
| `text-brand-text-secondary` | Secondary / muted text |
| `text-brand-accent` | CCN orange (#F27D26) |
| `border-brand-border` | Subtle border color |
| `font-display` | Heading font (display/brand font) |
| `font-serif` | Body/reading font |

### Animation system

All animations use `motion/react` (Framer Motion v12+). Standard easing curve across the app:

```ts
const ease = [0.22, 1, 0.36, 1] as const; // custom ease-out
```

Common patterns:
- Page sections: `initial={{ opacity: 0, y: 32 }}` → `animate={{ opacity: 1, y: 0 }}`
- Modals: slide up on mobile, scale in on desktop
- Cards: staggered reveal with `transition={{ delay: index * 0.05 }}`
- Drawers: spring physics for natural feel

---

## 8. Features Requested in This Development Session

The following features were designed, built, or significantly improved during the Project Phoenix development sprint:

| Feature | Status | Notes |
|---------|--------|-------|
| Prayer Circle | Built | `usePrayerCircle` hook, localStorage, daily-rotating member |
| SignInModal (full rewrite) | Built | Brand tokens, responsive, email + Google + reset |
| Email/password auth in AuthContext | Built | signInEmail, signUpEmail, sendPasswordReset |
| `public/_redirects` SPA routing | Built | Cloudflare Pages SPA support |
| DonationPage at `/give` (public) | Built | No auth required, shareable URL |
| Flame brand logo in `/public/brand/` | Built | `flame-color.png` copied from brand assets |
| LandingPage — morning language removed | Done | "Every morning" → "Every day", time-neutral copy |
| LandingPage — founder name corrected | Done | "Eryeza Kalalu" throughout |
| LandingPage — book quotes → Scripture | Done | `formationVerses` with Bible references |
| LandingPage — feature card CTAs | Done | Hover-reveal CTAs on each feature card |
| LandingPage — welcome message | Done | 3-paragraph welcome, heading, "Welcome to the journey." closing |
| LandingPage — editorial photo treatment | Done | Dark gradient overlay, no text on photo |
| LandingPage — "The Word That Grounds Us" | Done | Scripture carousel replacing book section |
| LandingPage — "From the Author" → "From the Founder" (then removed) | Done | Section replaced with scripture |
| Content Manager — podcasts/newsletters tabs | Already existed | Confirmed present, no changes needed |
| Content Manager — devotional author fields | Already existed | authorName, bio, photo, social handles |
| Content Manager — author name corrected | Done | "Eryeza Kalalu" |
| Flutterwave logo URL fix | Done | Updated to correct brand PNG |
| Font consistency pass | Done | Fixed `font-body` (invalid) → `font-serif` in PrayerCirclePage |
| VoiceCompanionDrawer component | Built | Reusable drawer for voice prayer |
| BibleStudyGuide component | Built | "Study with a Guide" panel in Bible Reader |
| Guided Journey — Voice Prayer integration | Built | Mic button → VoiceCompanionDrawer |
| Motion animations system-wide | Done | Consistent spring/ease throughout |
| Header copy pass | Done | Eyebrow labels, section headings |
| Console.log cleanup | Done | All production console.logs stripped |
| Build optimization | Done | Chunk splitting, esbuild console.log strip |
| Nav label — "News" | Done | Corrected from "The CCN Daily News" |

---

## 9. Migrating to Antigravity or Google AI Studio

### What "migration" means in this context

The CCN DAILY app is not coupled to any specific AI platform for its development environment. The code lives in a GitHub repository and builds to a static site deployable anywhere. "Migration" here means either:

**A) Moving the development workflow** (where you write code and prompt AI) to a different AI coding assistant

**B) Switching the runtime AI engine** (what powers features inside the app)

These are independent.

---

### A. Moving development to Google AI Studio (Gemini)

Google AI Studio is a prompt-and-test environment, not a code editor. For full development, use **Gemini in a code editor with the Gemini API** or **Firebase Studio** (formerly Project IDX).

**Steps:**
1. Open Firebase Studio at https://studio.firebase.google.com
2. Connect your GitHub repository (`preryezak/the-ccn-daily`)
3. Firebase Studio will clone the repo into a cloud workspace
4. All the same files, same Vite dev server, same `npm run dev`
5. Firebase is already configured — your `.env` variables carry over
6. Commit and push to GitHub → same Cloudflare Pages deployment triggers

**Caveat:** Firebase Studio is optimized for Firebase-first projects. This app is already Firebase-first (Auth + Firestore). It should work well.

---

### B. Moving development to Antigravity

Antigravity (if referring to an agentic coding platform) follows the same pattern:

1. Connect your GitHub repository
2. The platform clones the repo
3. Run `npm install` and `npm run dev` to start the Vite dev server
4. Copy your `.env` variables to the platform's environment configuration
5. Push changes to GitHub → Cloudflare Pages deployment triggers automatically

**The codebase is portable.** It has no lock-in to any specific IDE or AI assistant. Everything runs on Node.js 20+.

---

### C. Switching the runtime AI engine to Google AI / Gemini API

This is the most impactful migration — it changes what AI the app's users interact with.

**Current engine:** Cloudflare Workers AI (Llama 3.1 via `/api/ai/generate`)

**To switch to Gemini API:**

1. **Update the Cloudflare Worker** at `functions/api/ai/generate.ts` (or equivalent Hono route):

```ts
// Replace the Workers AI call with:
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: payload.prompt }] }],
      systemInstruction: { parts: [{ text: payload.systemInstruction }] },
    }),
  }
);
const data = await response.json();
return data.candidates[0].content.parts[0].text;
```

2. **Add `GEMINI_API_KEY`** as a Cloudflare Pages secret (in the Cloudflare dashboard → Pages → Settings → Environment Variables)

3. **No changes to any React component.** The `generateCloudflareText()` function in `services/geminiService.ts` stays the same.

4. **Update model names** in `geminiService.ts` if you want tier-specific models:

```ts
export const LITE_MODEL = 'gemini-1.5-flash';
export const FLASH_MODEL = 'gemini-1.5-flash';
export const PRO_MODEL = 'gemini-1.5-pro';
```

---

### D. What you cannot easily migrate

| Component | Reason |
|-----------|--------|
| Firebase Auth | Deeply integrated — UIDs, roles, session management all use Firebase |
| Firestore | All user data (journals, progress, bookmarks) lives here |
| Cloudflare Pages | Hosting + edge functions are Cloudflare-specific (but the `/dist` folder can be deployed anywhere static files are served) |

If you ever need to move away from Firebase entirely, the main work is replacing `AuthContext.tsx` with a new auth provider and rewriting the Firestore service layer to call a different database. The React components themselves would not need to change — they only consume the context.

---

## 10. Development Quick Reference

```bash
# Install dependencies
npm install

# Start development server (localhost:3000)
npm run dev

# Type check
npx tsc --noEmit

# Production build
npm run build

# Preview production build locally
npm run preview

# Apply D1 schema locally
npm run db:apply:local

# Deploy manually to Cloudflare (bypasses GitHub Actions)
npm run cf:deploy
```

**Push to `main` on GitHub triggers automatic deployment via GitHub Actions.**

---

*Last updated: May 2026 — Eryeza Kalalu / THE CCN DAILY*
