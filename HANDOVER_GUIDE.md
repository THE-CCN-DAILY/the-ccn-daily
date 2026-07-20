# Developer Handover Guide & Migration Blueprint — Project Phoenix (THE CCN DAILY)

Welcome to **THE CCN DAILY (Project Phoenix)**. This guide provides a comprehensive technical blueprint of the application architecture, deployment pipelines, configuration parameters, database schemas, and a detailed implementation roadmap for pending launch features.

---

## 1. Codebase Architecture & Aspect Audit (R1)

Project Phoenix is a full-stack media, devotional, and community platform. It utilizes a highly responsive, cost-optimized edge compute gateway connected to real-time client databases.

```
                      ┌─────────────────────────────────┐
                      │          Vite + React           │
                      │  (Tailwind v4 / Remotion Video) │
                      └────────────────┬────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
     ┌─────────────────────────────┐       ┌─────────────────────────────┐
     │ Cloudflare Pages Functions  │       │      Firebase Services      │
     │    (Hono Edge API Gateway)  │       │   (Real-time Sync & Auth)   │
     └──────┬──────────┬─────────┬─┘       └──────┬──────────────────────┘
            │          │         │                │
            ▼          ▼         ▼                ▼
        ┌───────┐  ┌───────┐  ┌──────┐        ┌───────────────┐
        │  D1   │  │  R2   │  │  CF  │        │   Firestore   │
        │  SQL  │  │ Media │  │  AI  │        │ (Custom DB ID)│
        └───────┘  └───────┘  └──────┘        └───────────────┘
```

### 1.1 Complete Page Routing Map (`App.tsx`)
The application uses React Router v7 (`react-router-dom`) with a `BrowserRouter` for clean, modern URLs (migrating away from legacy HashRouting).

*   **Public Landing & Marketing Surface:**
    *   `/` ➔ [LandingPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/LandingPage.tsx) — Landing hero, benefits copy, and interactive steppers.
    *   `/blog` ➔ [BlogPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/BlogPage.tsx) — Main blog/newsletter roll.
    *   `/blog/:slug` ➔ [BlogPostPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/BlogPostPage.tsx) — Editorial post reading panel.
    *   `/newsletter` ➔ [NewsletterPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/NewsletterPage.tsx) — Public newsletter signup.
    *   `/pricing` ➔ [PricingPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/PricingPage.tsx) — Tier plans and in-app upgrade entry points.
    *   `/give` ➔ [DonationPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/DonationPage.tsx) — Ministry giving page.
    *   `/onboarding` ➔ [OnboardingPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/OnboardingPage.tsx) — First-time member preferences setup.
    *   `/join` ➔ [JoinPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/JoinPage.tsx) — Redirect gate that pops open the signup modal.
    *   `/privacy` & `/terms` ➔ Legal pages.

*   **Member Sanctuary (Authenticated via `RequireAuth`):**
    *   `/dashboard` ➔ [DashboardPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/DashboardPage.tsx) — Core feed displaying devotional cards, podcasts, and features.
    *   `/guided-journey` ➔ [GuidedJourneyPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/GuidedJourneyPage.tsx) — Step-by-step spiritual formation cycles.
    *   `/devotional` ➔ [DevotionalGeneratorPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/DevotionalGeneratorPage.tsx) — Generative Devotional engine via Cloudflare AI.
    *   `/bible` ➔ [BibleReaderPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/BibleReaderPage.tsx) — Scripture Study Companion with selection share overlays.
    *   `/books` ➔ [BooksLibraryPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/BooksLibraryPage.tsx) — Digital EPUB Library.
    *   `/book/:bookId` ➔ [BookReaderPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/BookReaderPage.tsx) — Interactive book reader.
    *   `/courses` ➔ [CoursesPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/CoursesPage.tsx) — Lists video/audio course modules.
    *   `/courses/:courseId` ➔ [CoursePlayerPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/CoursePlayerPage.tsx) — Interactive video course playback workspace.
    *   `/challenges` ➔ [ChallengesPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/ChallengesPage.tsx) — Community challenges portal.
    *   `/journaling` ➔ [JournalingPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/JournalingPage.tsx) — Private journal logs.
    *   `/prayer-circle` ➔ [PrayerCirclePage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/PrayerCirclePage.tsx) — Shared prayer request circles.
    *   `/family-dashboard` ➔ [FamilyDashboardPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/FamilyDashboardPage.tsx) — Seat provisioning (Family Leads only).
    *   `/leader-dashboard` ➔ [LeaderDashboardPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/LeaderDashboardPage.tsx) — Seat provisioning and assignments (Group Leads only).

*   **Founder Command Center (Admin Only via `RequireRole` under `/studio/*`):**
    *   `/studio/admin` ➔ [AdminDashboard.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/AdminDashboard.tsx) — Core analytics, audits, and health console.
    *   `/studio/content-manager` ➔ [ContentManagerPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/ContentManagerPage.tsx) — CRUD console for all media (devotionals, books, audiobooks).
    *   `/studio/comments` ➔ [CommentModerationPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/CommentModerationPage.tsx) — Moderation queue for blog comments.
    *   `/studio/reviews` ➔ [ReviewModerationPage.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/ReviewModerationPage.tsx) — Moderation queue for book reviews.
    *   `/studio/roles` ➔ [Roles.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/pages/Roles.tsx) — Role management console mapping authority levels.

### 1.2 Reusable Shared UI Components (`components/`)
The core user experience is supported by a set of shared, responsive UI components:
*   **[Layout.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/components/Layout.tsx):** Root layout component managing the main sidebar/navigation, responsive toggles, and the ambient radial background glow (`--color-dynamic-accent`).
*   **[ScriptureStudyCompanion.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/components/ScriptureStudyCompanion.tsx):** Side-by-side Scripture reader workspace with highlight markers, tags, and note-taking interfaces.
*   **[ShareCardModal.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/components/ShareCardModal.tsx):** HTML5 Canvas renderer that generates custom branded sharing cards (double border, watermark, gradient background) when sharing selected Scripture or completion steps.
*   **[ProductReviews.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/components/ProductReviews.tsx):** Handles book rating, review forms, moderation statuses, and links to external book marketplaces (Amazon, Goodreads, Apple Books).
*   **[VoiceCompanionDrawer.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/components/VoiceCompanionDrawer.tsx):** Interface for real-time generative audio devotions and prayers.
*   **[UpgradeModal.tsx](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/components/UpgradeModal.tsx):** Triggers pricing comparison and upgrade workflows.

### 1.3 State & Global Contexts (`contexts/`)
-   **[AuthContext](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/contexts/AuthContext.tsx):** Syncs Firebase Authentication state (OAuth & email logins) into the Cloudflare D1 SQL `users` table via `/api/auth/profile`, hydrating the user's role and billing tier.
-   **[ThemeContext](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/contexts/ThemeContext.tsx):** Stores the active aesthetic theme mode (`light`, `dark`, or `sepia`) and syncs class modifiers to the HTML root node.
-   **[AudioPlayerContext](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/contexts/AudioPlayerContext.tsx):** Manages the global audio player state, timeline seeking, track queues, and playlists for podcasts, devotionals, and audiobooks.
-   **[GamificationContext](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/contexts/GamificationContext.tsx):** Handles point accruals, daily reading streaks, and achievement badges, writing updates back to D1.

### 1.4 Custom Hooks (`hooks/`)
-   **[usePremiumGate](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/hooks/usePremiumGate.ts):** Evaluates if a member has access to a premium resource based on their active subscription tier.
-   **[useEffectiveAccess](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/hooks/useEffectiveAccess.ts):** Queries active entitlements, trials, and perpetual licenses in the `user_entitlements` table.
-   **[usePageMeta](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/hooks/usePageMeta.ts):** Injects dynamic title, description, and canonical URL elements into the DOM for optimal SEO indexability.

### 1.5 Styling System & Tokens (Tailwind CSS v4)
Project Phoenix employs Tailwind CSS v4. Config tokens are declared directly in [index.css](file:///d:/THE%20CCN%20DAILY/Project-Phoenix-github-source/index.css) inside a `@theme` block.

*   **Font Stack:**
    *   `--font-display` / `--serif-display`: Cormorant Garamond (large optical sizing, tall ascenders).
    *   `--font-body` / `--serif-body`: EB Garamond (1.1875rem with 1.5 line-height for readability).
    *   `--font-ui` / `--sans-ui`: Inter Tight (used for buttons, form inputs, navigation, and badges).
*   **The "No-Line" Rule:**
    Instead of solid 1px borders, layout structure is conveyed using shifts in background shade (e.g. nesting `bg-ds-card` inside a `bg-ds-paper` container) or 15% opacity ghost borders (`border-brand-border`).
*   **Dynamic Theme Map:**
    *   Light mode Paper background: `#F6EFE1` | Dark mode Paper background: `#1A1210`.
    *   Light mode Card background: `#FBF6EA` | Dark mode Card background: `#221915`.
    *   Primary Action/Highlight Orange (Ember): `#C23B1E` / `#E87A2C`.

### 1.6 Video Rendering System (Remotion)
Programs and renders video cards dynamically.
-   **Compositions (`remotion/Root.tsx`):**
    -   `VerseCard` (9:16 portrait, 1080x1920, 30fps) — Social sharing cards for mobile.
    -   `VerseCardSquare` (1:1 square, 1080x1080) — Feed sharing cards.
    -   `VerseCardLandscape` (16:9 landscape, 1920x1080).
    -   `DawnAmbient` (1920x550, 240 frames) — Loopable animated devotional hero element.
    -   `FeaturesAmbient` (1920x800, 450 frames) — App showcase slideshow.
-   **CLI Operations:**
    -   *Preview Studio:* `npm run remotion:studio`
    -   *Render MP4:* `npx remotion render remotion/index.ts VerseCard out/verse-card.mp4`

---

## 2. Multi-Platform Integration Blueprint (R2)

Project Phoenix operates on a dual-cloud serverless pipeline. **Crucial Launch Requirement: Do NOT migrate off these platforms. Keep the architecture intact.**

### 2.1 Cloudflare Stack
*   **Cloudflare Pages:** Distributes static UI assets from `/dist` and runs Hono Edge API routes in `functions/api/[[path]].ts`.
*   **Cloudflare D1 SQL:** Primary transactional SQL store.
    *   `database_name = "project_phoenix_ccn_daily"`
    *   `database_id = "ade8eb7e-04e8-4c79-8501-13d8c568409d"`
*   **Cloudflare R2 Bucket:** Bound as `MEDIA_BUCKET` (`ccn-daily-media`). Holds PDF/EPUB books and audio files, served securely via `/api/media/<key>`.
*   **Workers AI:** Bound as `AI`. Resolves 70B/8B Llama models for personal devotionals and voice synthesis.

### 2.2 Firebase Stack
*   **Firebase Authentication:** Client-side Google and Email Auth. Deployed environments override `authDomain` to use the app's own origin (`theccndaily.com`), ensuring redirect sign-ins bypass third-party cookie restrictions.
*   **Firestore Database:** Non-default instance used for real-time collaboration (liveChat, prayerRequests).
    *   `Database ID: "ai-studio-99552f04-30cb-4061-a5c7-62e531885ebf"`
*   **Firebase Storage:** `ccn-daily.appspot.com` bucket (historical media uploads).

---

## 3. Database Schema & Security Rules (R3)

### 3.1 D1 Database SQL Schema (`schema/d1-schema.sql`)
The complete D1 database structure is detailed below:

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  photo_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  tier TEXT NOT NULL DEFAULT 'free',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_active_at TEXT
);

CREATE TABLE IF NOT EXISTS blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Devotional life',
  status TEXT NOT NULL DEFAULT 'draft',
  author_name TEXT NOT NULL DEFAULT 'THE CCN DAILY',
  audio_url TEXT,
  seo_title TEXT,
  seo_description TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS highlights (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  text TEXT NOT NULL,
  note TEXT,
  voice_note_url TEXT,
  tags TEXT,
  color TEXT NOT NULL DEFAULT 'yellow',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, id)
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  prompt TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, id)
);

CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration TEXT,
  source_type TEXT,
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  start_date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  participants_count INTEGER NOT NULL DEFAULT 0,
  challenge_type TEXT NOT NULL DEFAULT 'open',
  end_date TEXT,
  live_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS challenge_modules (
  id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  day_number INTEGER NOT NULL DEFAULT 1,
  video_url TEXT,
  audio_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (challenge_id, id),
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  challenge_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  completed_modules TEXT NOT NULL DEFAULT '[]',
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (challenge_id, user_id),
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  instructor TEXT NOT NULL DEFAULT 'THE CCN DAILY',
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  is_premium INTEGER NOT NULL DEFAULT 0,
  module_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devotionals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  devotional_date TEXT NOT NULL,
  audio_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  author_id TEXT,
  is_premium INTEGER NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audiobooks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT 'THE CCN DAILY',
  audio_url TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  is_premium INTEGER NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  review_links TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT 'THE CCN DAILY',
  file_url TEXT NOT NULL DEFAULT '',
  cover_url TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  is_premium INTEGER NOT NULL DEFAULT 0,
  price REAL NOT NULL DEFAULT 0,
  print_enabled INTEGER NOT NULL DEFAULT 0,
  print_countries TEXT,
  print_price_usd REAL NOT NULL DEFAULT 0,
  review_links TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS book_reviews (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL DEFAULT 'book',
  book_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT '',
  rating INTEGER NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS book_print_requests (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  book_title TEXT NOT NULL DEFAULT '',
  user_id TEXT,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  role TEXT NOT NULL,
  file_name TEXT NOT NULL,
  object_key TEXT NOT NULL,
  public_url TEXT NOT NULL,
  content_type_header TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  event_date TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'online',
  attendee_count INTEGER NOT NULL DEFAULT 0,
  streaming_platform TEXT,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS event_registrations (
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS prayer_requests (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  author TEXT NOT NULL DEFAULT 'Anonymous',
  author_uid TEXT,
  prayer_count INTEGER NOT NULL DEFAULT 0,
  testimony TEXT,
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prayer_request_prayers (
  request_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (request_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS live_stream_settings (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'offline',
  playback_id TEXT,
  stream_id TEXT,
  title TEXT NOT NULL DEFAULT 'Global Broadcast',
  viewer_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS live_stream_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'broadcast',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'in-app',
  read INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_gamification (
  user_id TEXT PRIMARY KEY,
  current_streak INTEGER NOT NULL DEFAULT 7,
  longest_streak INTEGER NOT NULL DEFAULT 21,
  points INTEGER NOT NULL DEFAULT 1250,
  unlocked_achievements TEXT NOT NULL DEFAULT '["a1","a2","a3","a4"]',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_modules (
  id TEXT NOT NULL,
  course_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  module_order INTEGER NOT NULL DEFAULT 1,
  video_url TEXT,
  audio_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (course_id, id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_progress (
  course_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  completed_modules TEXT NOT NULL DEFAULT '[]',
  last_accessed TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (course_id, user_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_usage_events (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  feature TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'cloudflare-workers-ai',
  model TEXT,
  units INTEGER NOT NULL DEFAULT 0,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id TEXT PRIMARY KEY,
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'none',
  started_at TEXT,
  ends_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_entitlements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  access_type TEXT NOT NULL DEFAULT 'subscription_included',
  source TEXT NOT NULL DEFAULT 'subscription',
  starts_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ends_at TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS user_purchases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  tx_ref TEXT NOT NULL UNIQUE,
  amount REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending',
  purchased_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS household_members (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TEXT,
  invited_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_members (
  id TEXT PRIMARY KEY,
  leader_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  engagement_score INTEGER NOT NULL DEFAULT 0,
  last_active_at TEXT,
  invited_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_assignments (
  id TEXT PRIMARY KEY,
  leader_id TEXT NOT NULL,
  title TEXT NOT NULL,
  assignment_type TEXT NOT NULL DEFAULT 'practice',
  progress INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rate_limit_hits (
  scope TEXT NOT NULL,
  bucket_key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (scope, bucket_key, window_start)
);

CREATE TABLE IF NOT EXISTS fx_rates (
  currency TEXT PRIMARY KEY,
  usd_rate REAL NOT NULL,
  fetched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS help_messages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  ip_hint TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 3.2 Firestore Security Rules Overview (`firestore.rules`)
All reads and writes are denied by default. Specific collection rules are outlined below:
*   **Testimonies (`/testimonies/{id}`):** Public reads allowed only for documents with `status == 'published'`. Users can create new testimonies with a pending status. Admins can update/delete any.
*   **Comments (`/comments/{id}`):** Mapped same as testimonies; public read for published, authenticated creation for pending comments, admin-moderated.
*   **Users (`/users/{userId}`):** Restricts read/write exclusively to the matching authenticated account (owner) or admins. Modifying the `role` attribute is blocked unless the user is already authenticated as an admin.
*   **Devotionals, Books, Audiobooks, Courses, Challenges:** Publicly readable by authenticated members. Write/Delete strictly guarded by `isAdmin()` helper check.
*   **Live Chat (`/liveChat/{id}`):** Authenticated users can write messages (which are validated for length and author matching). Admins moderate.

> [!IMPORTANT]
> **Firestore Admin Email Configuration Dependencies:** 
> The `isAdmin()` validation helper inside `firestore.rules` checks for hardcoded verified emails: `pastor.eryeza@gmail.com` and `ccndaily@gmail.com`. If you onboard new ministry operators or admins, their emails **MUST** be manually added to the array in `firestore.rules` and redeployed to Firebase, in addition to modifying their role in the D1 SQL `users` table.

---

## 4. Setup & Development Guide (R3)

### 4.1 Local Setup
1.  **Clone Repository and Install:**
    ```bash
    npm install
    ```
2.  **Initialize Local D1 DB Schema:**
    ```bash
    npm run db:apply:local
    ```
3.  **Local Secrets Setup:**
    Create a `.dev.vars` file in the project root to store Cloudflare Page secrets:
    ```env
    MUX_TOKEN_ID=your_mux_token
    MUX_TOKEN_SECRET=your_mux_secret
    FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxxxx
    FLUTTERWAVE_ENCRYPTION_KEY=your_encryption_key
    RESEND_API_KEY=re_xxxxxx
    TURNSTILE_SECRET_KEY=0x4AAAAAA...
    ```
    *(Note: `RESEND_API_KEY` is the current operational mail API key; SendGrid is targeted as a roadmap provider for seat invites).*

### 4.2 Environment Variables Reference
Ensure the build pipeline or `.env.local` contains the following:
*   `VITE_FIREBASE_API_KEY`: Web API key from Firebase Console Settings.
*   `VITE_FIREBASE_AUTH_DOMAIN`: Auth domain (e.g. `ccn-daily.firebaseapp.com`).
*   `VITE_FIREBASE_PROJECT_ID`: ID of the project (`ccn-daily`).
*   `VITE_FIREBASE_APP_ID`: App identifier for client SDK.
*   `VITE_FIREBASE_STORAGE_BUCKET`: Storage bucket URL.
*   `VITE_FIREBASE_MESSAGING_SENDER_ID`: FCM sender ID.
*   `VITE_FIREBASE_FIRESTORE_DATABASE_ID`: Custom Firestore DB ID (`ai-studio-99552f04-30cb-4061-a5c7-62e531885ebf`).
*   `VITE_FLUTTERWAVE_PUBLIC_KEY`: API Public Key from Flutterwave Dashboard.
*   `VITE_TURNSTILE_SITE_KEY`: Cloudflare Turnstile bot protection widget key.

> [!TIP]
> **Auth Domain Tunnel Testing Fallback:**
> The `resolveAuthDomain()` helper in `firebase.ts` dynamically resolves the current hostname to handle redirect authentication. When testing via remote tunnels (e.g., ngrok, localtunnel), make sure you whitelist the tunnel hostname in the **Firebase Console ➔ Authentication ➔ Settings ➔ Authorized Domains** list.

### 4.3 Running Dev Modes
*   **UI/Visual Dev Server (Vite Hot-Reload):**
    ```bash
    npm run dev
    ```
    *Host:* `http://localhost:3000`. Note: API calls are stubbed to a dummy server. Use this for styling/copy changes.
*   **Full-Stack Dev Server (Wrangler Pages Dev):**
    ```bash
    npm run cf:dev
    ```
    *Host:* `http://localhost:8788`. Runs the actual Hono backend against your local D1 SQL database.

### 4.4 Deploy Commands
*   **Staging deployment:**
    ```bash
    wrangler pages deploy dist --project-name project-phoenix-ccn-daily --branch staging --commit-dirty=true
    ```
*   **Production deployment:**
    ```bash
    wrangler pages deploy dist --project-name project-phoenix-ccn-daily --branch main --commit-dirty=true
    ```
*   **Deploy Database Updates (D1 Remote Migrations):**
    To apply SQL DDL schema updates to the production/remote D1 database instance:
    ```bash
    npm run db:apply
    ```
    *This executes: `wrangler d1 execute project_phoenix_ccn_daily --remote --file=schema/d1-schema.sql`.*

### 4.5 Verification Test Plan
Perform the following checks on every deployment:
1.  **Smoke Tests (Client):**
    *   Navigate to landing (`/`) and verify typography hierarchy and background shades.
    *   Trigger sign-in modal and authenticate using a test Google/Email account.
    *   Ensure dashboard `/dashboard` loads recent devotionals and podcasts without console errors.
2.  **Edge Compute Tests (API):**
    *   Inspect `/api/health` ➔ should return `{ status: "ok" }`.
    *   Verify user registration creates/updates rows in D1 `users` table via network panel.
3.  **Payment Gates (Staging Sandbox):**
    *   Navigate to `/pricing`, select Upgrade, complete a sandbox checkout, and verify that active entitlement flags (`is_active = 1` in `user_entitlements`) are written correctly on webhook return.

---

## 5. Pending Features Roadmap (R4)

This roadmap details specifications, flows, and code references to finalize the remaining launch backlog.

### 5.1 Backend Integration for Invites (SendGrid & Firebase Extensions)

Currently, the app uses Resend via Hono backend. If you migrate to SendGrid or Firebase trigger-email extensions:

#### SendGrid Mail Flow Blueprint
```
[User Dashboard Invite Form]
            │
            ▼ (POST /api/users/:id/household/invites)
[Hono API endpoint in Functions]
            │
            ▼ (Write D1 record status: 'pending')
[SendGrid v3 POST /mail/send] ➔ SendGrid SMTP ➔ [Invitee Inbox]
```

*   **Implementation Steps:**
    1.  Provision a SendGrid API Key and add it as a Cloudflare Pages Secret: `SENDGRID_API_KEY`.
    2.  Update the `sendSeatInviteEmail` function inside `functions/api/[[path]].ts`:
        ```typescript
        const sendSeatInviteEmailSendGrid = async (c: any, email: string, name: string, context: 'household' | 'group') => {
          const body = {
            personalizations: [{
              to: [{ email }],
              subject: "You're invited to THE CCN DAILY"
            }],
            from: { email: "gifts@updates.theccndaily.com", name: "THE CCN DAILY" },
            content: [{
              type: "text/html",
              value: `<p>Hello ${name}, you've been invited...</p>`
            }]
          };
          const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${c.env.SENDGRID_API_KEY}`
            },
            body: JSON.stringify(body)
          });
          return response.ok;
        };
        ```

#### Firebase Extensions Flow Blueprint
```
[Hono API in Cloudflare Pages]
            │
            ▼ (Write 'pending' D1 record)
[Firestore db.collection('mail').add()]
            │
            ▼ (Firestore Triggers)
[Firebase Extension: Trigger Email] ➔ SMTP Server ➔ [Invitee Inbox]
```

*   **Implementation Steps:**
    1.  Install the **Trigger Email** extension (`firestore-send-email`) in your Firebase Console. Set it to monitor the `mail` collection in your custom Firestore DB (`ai-studio-99552f04-30cb-4061-a5c7-62e531885ebf`).
    2.  Inside Pages Functions, import/initialize the Firebase Admin or Client SDK and push documents:
        ```typescript
        import { addDoc, collection } from 'firebase/firestore';
        // Inside Hono API route:
        await addDoc(collection(firestoreDb, 'mail'), {
          to: email,
          message: {
            subject: 'Invitation to THE CCN DAILY',
            html: '...',
          }
        });
        ```

---

### 5.2 Stripe Payment Integration

#### Stripe Transaction Flow Blueprint
```
[UI Pricing Page upgrade] ➔ POST /api/payments/intent ➔ [Stripe Checkout Session Created]
                                                                    │
                                                                    ▼
[Client Redirects to stripe.com Checkout] ◄─────────────────────────┘
            │
            ▼ (Payment success)
[Stripe Redirects to /dashboard?session_id=...]
            │
[Stripe Webhook (Async)] ➔ POST /api/payments/stripe/webhook
                                    │
                                    ▼ (Verify Signature)
                             [Provision D1]
```

*   **Implementation Steps:**
    1.  Install the Stripe package: `npm install stripe`.
    2.  Define Pages secrets: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
    3.  Create `/api/payments/intent` endpoint inside `functions/api/[[path]].ts`:
        ```typescript
        app.post('/api/payments/intent', async (c) => {
          const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
          const body = await c.req.json();
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: body.priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/pricing`,
            metadata: { userId: body.userId, tier: body.tier }
          });
          return c.json({ id: session.id, url: session.url });
        });
        ```
    4.  Create Webhook listener `/api/payments/stripe/webhook`:
        ```typescript
        app.post('/api/payments/stripe/webhook', async (c) => {
          const stripe = new Stripe(c.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
          const sig = c.req.header('stripe-signature') || '';
          const body = await c.req.text();
          let event;
          try {
            event = stripe.webhooks.constructEvent(body, sig, c.env.STRIPE_WEBHOOK_SECRET);
          } catch (err: any) {
            return c.json({ error: `Signature verification failed: ${err.message}` }, 400);
          }
          if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const { userId, tier } = session.metadata;
            // Execute SQL update in D1:
            await c.env.DB.prepare(
              `INSERT INTO user_subscriptions (user_id, tier, status, started_at)
               VALUES (?, ?, 'active', CURRENT_TIMESTAMP)
               ON CONFLICT(user_id) DO UPDATE SET tier = excluded.tier, status = 'active'`
            ).bind(userId, tier).run();
          }
          return c.json({ received: true });
        });
        ```

---

### 5.3 Storage Cleanup (Firestore to Firebase Storage Auto-Deletion)

Automatically deletes heavy assets from Firebase Storage when content metadata is removed from Firestore.

#### Storage Cleanup Flow Blueprint
```
[Admin Deletes Content Doc in Firestore]
                  │
                  ▼ (Triggers v2 Cloud Function)
[Cloud Function: cleanupStorage (onDocumentDeleted)]
                  │
                  ▼ (Regex parses fileUrl/coverUrl)
[Deletes matching files from ccn-daily.appspot.com Storage Bucket]
```

*   **Implementation Steps:**
    Create a Google Cloud Function inside your Firebase backend project directory:

```typescript
import { onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

export const cleanupStorageOnDelete = onDocumentDeleted('books/{bookId}', async (event) => {
  const deletedData = event.data?.data();
  if (!deletedData) return;

  const urlsToDelete = [deletedData.fileUrl, deletedData.coverUrl].filter(Boolean);

  const bucket = getStorage().bucket('ccn-daily.appspot.com');

  for (const url of urlsToDelete) {
    if (url.includes('firebasestorage.googleapis.com')) {
      try {
        // Parse the file path out of the standard Firebase Storage URL
        const matches = url.match(/\/o\/(.+?)\?/);
        if (matches && matches[1]) {
          const filePath = decodeURIComponent(matches[1]);
          const file = bucket.file(filePath);
          
          const [exists] = await file.exists();
          if (exists) {
            await file.delete();
            console.log(`Successfully deleted orphaned asset: ${filePath}`);
          }
        }
      } catch (error) {
        console.error(`Failed to clean up storage asset: ${url}`, error);
      }
    }
  }
});
```
