# CCN Daily — Complete Feature Upgrade (Final Run)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade every user-facing feature across both Sanctuary and Strategy sections to industry-benchmark quality — fixing broken functionality, removing developer copy, making content readable in-app, unifying visual language, and ensuring every page earns its place.

**Architecture:** The sidebar has two modes: **Sanctuary** (user-facing, 22 features in Read/Pray/Community/Live/Account groups) and **Strategy** (admin command center, 10 tools). Both need auditing. Each phase is independent and produces a shippable improvement. Build must pass (`npx tsc --noEmit && npm run build`) before every commit.

**Project root:** `D:\THE CCN DAILY\Project-Phoenix-github-source`

---

## Design System Tokens (use these everywhere — never hardcode)

```
Fonts:  var(--font-display) = Libre Baskerville  |  var(--font-ui) = Inter
Colors: brand-accent (#F27D26 orange)  |  primary-blue (#42638C)  |  accent-gold (#B4913C)
Themes: :root (light)  |  .dark  |  .sepia
Motion: import { motion, AnimatePresence } from 'motion/react'
        const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number]
        const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }
        const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } }
```

---

## Full Feature Map

### SANCTUARY — READ
| # | Feature | File | Current State |
|---|---------|------|---------------|
| 1 | Bible Reader | `pages/BibleReaderPage.tsx` | Settings modal clips on overflow; no reading mode; 3 stacked `<select>` elements look outdated |
| 2 | The CCN Daily News | `pages/NewsletterPage.tsx` | Links OUT to Substack — content exits the app |
| 3 | Podcast Library | `pages/PodcastPage.tsx` | Episode cards are word walls; no artwork thumbnails in list; `brand-gold` class may not resolve |
| 4 | Courses | `pages/CoursesPage.tsx` | Motion done; no progress indicators on cards |
| 5 | Audiobook Library | `pages/AudiobookLibraryPage.tsx` | Basic grid; no active playing indicator; empty state is defeatist |

### SANCTUARY — PRAY
| # | Feature | File | Current State |
|---|---------|------|---------------|
| 6 | Guided Daily Journey | `pages/GuidedJourneyPage.tsx` | Mostly good; raw `<audio controls>` element in step 2 (devotional audio); raw browser default looks broken |
| 7 | Journaling | `pages/JournalingPage.tsx` | Motion done; good |
| 8 | Sentient Guide (Kai) | `pages/VoiceCompanion.tsx` | Transcript overlay `opacity-60 pointer-events-none`; cramped at bottom |
| 9 | Visual Sanctuary | `pages/VisualSanctuary.tsx` | Button hardcoded `disabled={true}`; prototype language throughout; "Veo Cinematic Engine" developer copy |

### SANCTUARY — COMMUNITY
| # | Feature | File | Current State |
|---|---------|------|---------------|
| 10 | Challenges | `pages/ChallengesPage.tsx` | Motion done; good |
| 11 | Community Rooms | `pages/CommunityRoomsPage.tsx` | Functional chat; lacks visual identity; basic avatar rendering |
| 12 | The Community | `pages/TheCommunity.tsx` | "professionals and seekers" copy; hardcoded "+12% from yesterday" stat; Lumina stats not from real data |
| 13 | Expert Council | `pages/ExpertCouncilPage.tsx` | AI chat with experts; no motion; no visual distinction between experts |
| 14 | Testimonies | `pages/TestimoniesPage.tsx` | Mock data only; no Firebase integration; no motion |
| 15 | Grace Links | `pages/GraceLinkPage.tsx` | Mock link generation (`Math.random()`); no real sending mechanism shown |

### SANCTUARY — LIVE
| # | Feature | File | Current State |
|---|---------|------|---------------|
| 16 | Live Events | `pages/EventsPage.tsx` | Motion done; good |
| 17 | Live Broadcast | `pages/LiveStreamPage.tsx` | Developer copy in subtitle ("Mux/Agora"); offline state is generic |

### SANCTUARY — ACCOUNT
| # | Feature | File | Current State |
|---|---------|------|---------------|
| 18 | Family Dashboard | `pages/FamilyDashboardPage.tsx` | Needs audit |
| 19 | Leader Dashboard | `pages/LeaderDashboardPage.tsx` | Needs audit |
| 20 | Your Journey | `pages/GamificationPage.tsx` | Mock achievement data; no real XP progression from Firebase |
| 21 | Inbox & Updates | `pages/InboxPage.tsx` | Needs audit |
| 22 | Giving & Support | `pages/GivingPage.tsx` | Motion done; good |

### PUBLIC ROUTES
| # | Feature | File | Current State |
|---|---------|------|---------------|
| 23 | Landing Page | `pages/LandingPage.tsx` | "busy professionals" copy (banned) |
| 24 | Blog | `pages/BlogPage.tsx` | Motion done; good |
| 25 | Blog Post Reader | `pages/BlogPostPage.tsx` | Audio link opens external URL, should use in-app `AudioPlayerContext` |
| 26 | Pricing | `pages/PricingPage.tsx` | Motion done; good |

### STRATEGY — COMMAND CENTER
| # | Feature | File | Current State |
|---|---------|------|---------------|
| 27 | Devotional Generator | `pages/DevotionalGeneratorPage.tsx` | Subhead is developer copy: "This page now uses the unified reader…" |
| 28 | Atmospheric Music | `pages/AtmosphericMusicPage.tsx` | "This prototype demonstrates…" and "The Vision: Google Lyria" cards are developer copy |
| 29 | All other Strategy pages | multiple | Needs audit for developer copy and UX polish |

### GLOBAL
| # | Concern | Scope |
|---|---------|-------|
| 30 | Duplicate nav icons | `components/Layout.tsx` — Headphones used twice (Podcast + Audiobook); MessagesSquare used twice; Trophy used twice |
| 31 | Copy: banned words | All pages — "professionals", "users", "the app", "platform", "prototype", "Mux/Agora", "Genkit", "Veo Cinematic Engine" |
| 32 | Responsiveness | All pages — 375px, 768px, 1440px |
| 33 | Theme parity | All pages — dark / light / sepia |
| 34 | White space + depth | All pages — gradient hero bands, tighter spacing, layered surfaces |

---

## Phase 0 — Critical Fixes (Broken / Developer Copy)

These are the highest-priority issues. Fix first, commit first.

### Task 0.1 — Remove developer copy from DevotionalGeneratorPage

- [ ] **Step 1: Fix the page header copy**

In `pages/DevotionalGeneratorPage.tsx`, replace:
```tsx
<h1 className="text-4xl font-bold text-brand-text-primary mb-2">Personalized Devotional</h1>
<p className="text-lg text-brand-text-secondary mb-8">
  This page now uses the unified reader. It has themes, font controls, and a Smart Library, just like the ePub prototype.
</p>
```
With:
```tsx
<div className="mb-8">
  <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-3">Daily Formation</p>
  <h1 className="text-4xl font-black text-brand-text-primary mb-3" style={{ fontFamily: 'var(--font-display)' }}>
    Your Devotional
  </h1>
  <p className="text-lg text-brand-text-secondary">
    A reflection written for you, from Scripture, shaped around your spiritual journey today.
  </p>
</div>
```

- [ ] **Step 2: Verify build, commit**
```bash
npx tsc --noEmit && npm run build
git add pages/DevotionalGeneratorPage.tsx
git commit -m "copy: remove developer copy from DevotionalGeneratorPage header"
```

### Task 0.2 — Remove prototype language from AtmosphericMusicPage

- [ ] **Step 1: Fix header and remove "The Vision: Google Lyria" card**

In `pages/AtmosphericMusicPage.tsx`, replace:
```tsx
<h1 className="text-4xl font-bold text-brand-text-primary mb-2">Atmospheric AI Music</h1>
<p className="text-lg text-brand-text-secondary mb-8">
  This prototype demonstrates how AI-generated music (from Google's Lyria) can create an immersive spiritual atmosphere.
</p>
```
With:
```tsx
<div className="mb-8">
  <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-3">Sanctuary</p>
  <h1 className="text-4xl font-black text-brand-text-primary mb-3" style={{ fontFamily: 'var(--font-display)' }}>
    Atmospheric Prayer Music
  </h1>
  <p className="text-lg text-brand-text-secondary">
    Choose a mood and let the music create a space for focus, reflection, or quiet prayer.
  </p>
</div>
```

Delete the entire second Card block (the "The Vision: Google Lyria" card starting at `<Card className="mt-8">`).

Also fix the inner Card header:
```tsx
// Change:
<h2 className="...">Simulate a Devotional Mood</h2>
<p>Select a mood below to hear the corresponding ambient music track.</p>
// To:
<h2 className="...">Set Your Mood</h2>
<p>Select a mood — the music will carry you into a space of quiet focus.</p>
```

- [ ] **Step 2: Verify build, commit**
```bash
npx tsc --noEmit && npm run build
git add pages/AtmosphericMusicPage.tsx
git commit -m "copy: remove prototype language from AtmosphericMusicPage"
```

### Task 0.3 — Fix LiveStreamPage developer copy

In `pages/LiveStreamPage.tsx`, replace the subtitle:
```tsx
<p className="text-brand-text-secondary mt-2">Low-latency audio/video streaming via Mux/Agora.</p>
```
With:
```tsx
<p className="text-brand-text-secondary mt-2">
  Join us live — worship, teaching, and community broadcast in real time.
</p>
```

Also fix the offline state copy (more forward-looking):
```tsx
// Change:
<p className="text-brand-text-secondary">We are not currently live. Please check back later.</p>
// To:
<p className="text-brand-text-secondary">No broadcast is live right now. Come back for the next gathering.</p>
```

And fix the broadcast description below the player:
```tsx
// Change:
<h3>The Power of Community</h3>
<p>Join us as we explore the depths of faith and connection in today's digital age. This broadcast is streamed globally with real-time translation available.</p>
// To:
<h3>Gathering Together</h3>
<p>A global moment of worship and teaching, live from our community. Watch here, pray alongside thousands, and join the chat below.</p>
```

- [ ] **Commit**
```bash
git add pages/LiveStreamPage.tsx
git commit -m "copy: remove developer references from LiveStreamPage"
```

### Task 0.4 — Fix LandingPage "busy professionals" copy

In `pages/LandingPage.tsx`, search for and replace:
```
"busy professionals" → "those who carry much"
"helps busy professionals begin again with God" → "helps you begin again with God"
```

Run: `grep -n "professionals\|users\|platform" pages/LandingPage.tsx`
Fix every match.

- [ ] **Commit**
```bash
git add pages/LandingPage.tsx
git commit -m "copy: remove 'busy professionals' from LandingPage"
```

**Phase 0 Definition of Done:**
- Zero instances of "prototype", "Mux/Agora", "Genkit", "Veo Cinematic Engine", "busy professionals" in any page shown to users
- `npx tsc --noEmit` passes

---

## Phase 1 — AudiobookLibraryPage (Spotify Benchmark)

**File:** `pages/AudiobookLibraryPage.tsx`

- [ ] **Step 1: Add motion imports and constants**
```tsx
import { motion } from 'motion/react';
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
```

- [ ] **Step 2: Replace header with eyebrow + display title + user-centered subhead**
```tsx
<div className="mb-10">
  <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-3">Audio Library</p>
  <motion.h1
    className="text-4xl md:text-5xl font-black text-brand-text-primary mb-4"
    style={{ fontFamily: 'var(--font-display)' }}
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: EASE }}
  >
    Listen &amp; Grow
  </motion.h1>
  <motion.p className="text-lg text-brand-text-secondary max-w-xl"
    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
  >
    Carry wisdom wherever you go. Press play and let the words work on you.
  </motion.p>
</div>
```

- [ ] **Step 3: Wrap card grid in stagger motion div**
```tsx
<motion.div
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
  variants={stagger} initial="hidden" animate="visible"
>
```

- [ ] **Step 4: Upgrade each card** — wrap in `motion.div variants={fadeUp}`, add playing indicator chip, upgrade play button, update "Listen Now" button to show active state, replace empty placeholder cover with themed gradient

- [ ] **Step 5: Upgrade empty state**
```tsx
<motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ duration: 0.5, ease: EASE }}>
  <Card className="text-center py-24 border-dashed border-brand-border bg-transparent">
    <HeadphonesIcon className="w-14 h-14 text-brand-text-tertiary mx-auto mb-5" />
    <h3 className="text-2xl font-bold text-brand-text-primary mb-2" style={{ fontFamily: 'var(--font-display)' }}>
      Coming Soon
    </h3>
    <p className="text-brand-text-secondary max-w-sm mx-auto">
      We're adding titles every week. Follow along — your next listen is almost here.
    </p>
  </Card>
</motion.div>
```

- [ ] **Step 6: Verify + commit**
```bash
npx tsc --noEmit && npm run build
git add pages/AudiobookLibraryPage.tsx
git commit -m "feat: AudiobookLibraryPage — Spotify-benchmark design with motion and active track indicator"
```

**Phase 1 Definition of Done:** Cards stagger in, active track shows "Playing" chip, hover reveals centered play button, empty state is encouraging.

---

## Phase 2 — PodcastPage (Spotify Compact List)

**Problem:** Episode cards show full description text — a wall of words. Benchmark: Spotify shows artwork thumbnail + title + duration in a compact row.

**File:** `pages/PodcastPage.tsx`

- [ ] **Step 1: Rebuild `EpisodeListItem` as a compact row (not a card)**

Replace the `EpisodeListItem` component:
```tsx
const EpisodeListItem: React.FC<{ episode: PodcastEpisode }> = ({ episode }) => {
  const isCurrentlyPlaying = currentTrack?.id === episode.id && isPlaying;
  const isFavorited = favorites.includes(episode.id);

  return (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-colors group ${
      isCurrentlyPlaying ? 'bg-brand-accent/10 border border-brand-accent/20' : 'hover:bg-brand-secondary'
    }`}>
      {/* Artwork thumbnail */}
      <div className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-brand-secondary">
        <img src={episode.coverArt} alt="" className="w-full h-full object-cover" />
        <button
          onClick={() => playEpisode(episode)}
          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={isCurrentlyPlaying ? 'Pause' : `Play ${episode.title}`}
        >
          {isCurrentlyPlaying
            ? <PauseIcon className="w-5 h-5 text-white" />
            : <PlayIcon className="w-5 h-5 text-white" />}
        </button>
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isCurrentlyPlaying ? 'text-brand-accent' : 'text-brand-text-primary'}`}>
          {episode.title}
        </p>
        <p className="text-xs text-brand-text-secondary mt-0.5">
          {episode.releaseDate} · {formatMinutes(episode.duration)}
        </p>
      </div>
      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => toggleFavorite(episode.id)}
          className="p-1.5 rounded-full text-brand-text-secondary hover:text-red-400 transition-colors"
          aria-label={isFavorited ? 'Remove from favorites' : 'Save episode'}
        >
          <HeartIcon className={`h-4 w-4 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
        </button>
        <button
          onClick={() => playEpisode(episode)}
          className="px-3 py-1.5 text-xs font-bold rounded-full bg-brand-secondary border border-brand-border text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent transition-colors"
        >
          {isCurrentlyPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Change the episode grid from `grid-cols-2` to a single column list**
```tsx
// Replace: className="grid grid-cols-1 gap-6 md:grid-cols-2"
// With:    className="flex flex-col divide-y divide-brand-border"
```

- [ ] **Step 3: Fix `brand-gold` class references** — replace `bg-brand-gold` and `text-brand-gold` with `bg-brand-accent` and `text-brand-accent` throughout the file (brand-gold is not in the design system).

- [ ] **Step 4: Verify + commit**
```bash
npx tsc --noEmit && npm run build
git add pages/PodcastPage.tsx
git commit -m "feat: PodcastPage — compact Spotify-style episode rows with artwork thumbnails"
```

**Phase 2 Definition of Done:** Episode list shows compact rows with artwork, title, duration — no word walls. No `brand-gold` class. Featured episode card at top is preserved.

---

## Phase 3 — NewsletterPage In-App Reader

**Problem:** "Read Full Story on Substack" sends users OUT of the app.

**File:** `pages/NewsletterPage.tsx`

- [ ] **Step 1: Add in-app expanded reader state**

Add state at top of component:
```tsx
const [expandedPost, setExpandedPost] = useState<FeedItem | null>(null);
```

- [ ] **Step 2: Build an in-app reader panel (AnimatePresence drawer)**

Add after the main content:
```tsx
<AnimatePresence>
  {expandedPost && (
    <motion.div
      key="post-reader"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <button
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setExpandedPost(null)}
        aria-label="Close"
      />
      {/* Reader panel */}
      <motion.div
        className="relative bg-brand-secondary border border-brand-border rounded-t-2xl md:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        <div className="sticky top-0 bg-brand-secondary border-b border-brand-border px-6 py-4 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">The CCN Daily</span>
          <button onClick={() => setExpandedPost(null)} className="p-2 rounded-full hover:bg-brand-border transition-colors text-brand-text-secondary">✕</button>
        </div>
        <div className="p-6 md:p-8">
          <p className="text-xs text-brand-text-secondary mb-4">
            {expandedPost.pubDate ? new Date(expandedPost.pubDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </p>
          <h2 className="text-2xl font-bold text-brand-text-primary mb-4 leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
            {expandedPost.title}
          </h2>
          <div className="prose prose-sm text-brand-text-primary max-w-none">
            <p className="text-brand-text-secondary leading-relaxed whitespace-pre-wrap">
              {cleanFeedText(expandedPost.contentSnippet || expandedPost.content || '')}
            </p>
          </div>
          {expandedPost.link && (
            <a href={expandedPost.link} target="_blank" rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm text-brand-text-secondary hover:text-brand-accent transition-colors"
            >
              Read on Substack ↗
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 3: Update `PostCard` to open drawer instead of linking out**

Replace the `<a href={post.link}>Read Full Story on Substack</a>` with:
```tsx
<button
  onClick={() => setExpandedPost(post)}
  className="inline-flex items-center gap-2 text-sm font-bold text-brand-accent hover:underline"
>
  Read this issue <SparklesIcon className="h-4 w-4" />
</button>
```

- [ ] **Step 4: Verify + commit**
```bash
npx tsc --noEmit && npm run build
git add pages/NewsletterPage.tsx
git commit -m "feat: NewsletterPage — in-app reader drawer replaces Substack redirect"
```

**Phase 3 Definition of Done:** Tapping a newsletter issue opens a full-width drawer with the content readable in-app. External link still available but subordinate.

---

## Phase 4 — BibleReaderPage (YouVersion Benchmark)

**File:** `pages/BibleReaderPage.tsx`

- [ ] **Step 1: Add motion imports + reading mode state**
```tsx
import { motion, AnimatePresence } from 'motion/react';
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
// Inside component:
const [readingMode, setReadingMode] = useState(false);
```

- [ ] **Step 2: Fix settings modal overflow** — The `ReaderSettingsModal` uses `absolute inset-0` positioning inside its parent. If the parent has `overflow-hidden`, the modal clips. Find where `ContentDisplay` is rendered and ensure its parent container does NOT have `overflow-hidden`:
```tsx
// Change: className="lg:col-span-3 min-h-[50rem]"
// To:     className="lg:col-span-3 min-h-[50rem] relative"
// (Remove any overflow-hidden from this container)
```

- [ ] **Step 3: Upgrade page header with dynamic title + reading mode toggle**
```tsx
<div className="flex items-center justify-between mb-6 flex-wrap gap-4">
  <div>
    <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-2">Scripture</p>
    <motion.h1
      className="text-3xl md:text-4xl font-black text-brand-text-primary"
      style={{ fontFamily: 'var(--font-display)' }}
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      {selectedBook?.name} {selectedChapter}
    </motion.h1>
    <p className="text-brand-text-secondary text-sm mt-1">{translation.toUpperCase()}</p>
  </div>
  <button
    onClick={() => setReadingMode(r => !r)}
    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border text-sm font-semibold text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-accent transition-colors"
  >
    {readingMode ? 'Show Navigation' : 'Focus Mode'}
  </button>
</div>
```

- [ ] **Step 4: Wrap sidebar with AnimatePresence for reading mode**
```tsx
<AnimatePresence>
  {!readingMode && (
    <motion.div
      key="sidebar"
      className="lg:col-span-1"
      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      {/* existing Card with Navigation + Search */}
    </motion.div>
  )}
</AnimatePresence>
```

Update content area: `className={readingMode ? 'col-span-full' : 'lg:col-span-3'}`

- [ ] **Step 5: Animate chapter content transitions**
```tsx
<AnimatePresence mode="wait">
  {!isSearching && !searchResults && !isLoading && (
    <motion.div key={currentChapterKey}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}
    >
      <ContentDisplay ... />
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 6: Animate search results**

Wrap `searchResults.map()` in a stagger container.

- [ ] **Step 7: Verify + commit**
```bash
npx tsc --noEmit && npm run build
git add pages/BibleReaderPage.tsx
git commit -m "feat: BibleReaderPage — focus mode, animated transitions, settings overflow fix"
```

**Phase 4 Definition of Done:** Settings modal displays without clipping; "Focus Mode" hides sidebar and expands content; changing chapters fades in/out; search results stagger in.

---

## Phase 5 — GuidedJourneyPage Audio Fix

**Problem:** Step 2 (Daily Devotional) uses raw `<audio controls>` HTML — browser-default ugly audio player.

**File:** `pages/GuidedJourneyPage.tsx`

- [ ] **Step 1: Replace raw audio element with in-app player trigger**

In `case 2:` inside `renderContent()`, replace:
```tsx
{devotional.audioUrl && (
  <div className="mb-6">
    <audio controls className="w-full h-10 rounded-full bg-brand-secondary">
      <source src={devotional.audioUrl} type="audio/mpeg" />
    </audio>
  </div>
)}
```

With (using AudioPlayerContext):
```tsx
{devotional.audioUrl && (
  <button
    onClick={() => playTrack({
      id: `devotional-${devotional.id}`,
      title: devotional.title,
      description: 'Daily Devotional',
      author: 'THE CCN DAILY',
      coverArt: '',
      audioUrl: devotional.audioUrl!,
      duration: 0,
      releaseDate: devotional.date,
    })}
    className="w-full mb-6 flex items-center gap-4 p-4 bg-brand-secondary border border-brand-border rounded-2xl hover:border-brand-accent transition-colors group"
  >
    <div className="w-12 h-12 rounded-full bg-brand-accent flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
      <PlayIcon className="w-6 h-6 text-white ml-0.5" />
    </div>
    <div className="text-left">
      <p className="font-semibold text-brand-text-primary text-sm">Listen to today's reflection</p>
      <p className="text-xs text-brand-text-secondary">Audio devotional · Opens in player</p>
    </div>
  </button>
)}
```

Add `useAudioPlayer` import and hook at top of component.

- [ ] **Step 2: Verify + commit**
```bash
npx tsc --noEmit && npm run build
git add pages/GuidedJourneyPage.tsx
git commit -m "feat: GuidedJourneyPage — replace raw audio element with in-app player trigger"
```

---

## Phase 6 — BlogPostPage In-App Audio

**Problem:** `post.audioUrl` renders as `<a href="..." >Listen</a>` — opens external URL.

**File:** `pages/BlogPostPage.tsx`

- [ ] **Step 1: Replace the external audio link with in-app player button**

Import `useAudioPlayer` and replace:
```tsx
{post.audioUrl && (
  <a href={post.audioUrl} className="inline-flex items-center gap-2 text-brand-accent hover:underline">
    <Headphones className="h-4 w-4" /> Listen
  </a>
)}
```
With:
```tsx
{post.audioUrl && (
  <button
    onClick={() => playTrack({
      id: `blog-${post.slug}`,
      title: post.title,
      description: post.excerpt || '',
      author: post.authorName || 'THE CCN DAILY',
      coverArt: '',
      audioUrl: post.audioUrl!,
      duration: 0,
      releaseDate: post.publishedAt || '',
    })}
    className="inline-flex items-center gap-2 text-brand-accent hover:underline text-sm font-semibold"
  >
    <Headphones className="h-4 w-4" /> Listen in app
  </button>
)}
```

- [ ] **Step 2: Verify + commit**
```bash
npx tsc --noEmit && npm run build
git add pages/BlogPostPage.tsx
git commit -m "feat: BlogPostPage — audio uses in-app player instead of external link"
```

---

## Phase 7 — TheCommunity Copy + Motion

**File:** `pages/TheCommunity.tsx`

- [ ] **Step 1: Fix copy in header**
```tsx
// Change:
"A global network of professionals and seekers, united in faith and purpose."
// To:
"A global gathering — pray together, hear from God, and carry one another forward."
```

- [ ] **Step 2: Remove hardcoded Lumina stat**
```tsx
// Change:
<p className="text-xs text-status-success mt-1">+12% from yesterday</p>
// To:
<p className="text-xs text-brand-text-secondary mt-1">Growing daily</p>
```

- [ ] **Step 3: Remove "Admin Only" label from community-visible UI**

The "Support Alerts (Admin Only)" section is visible to all users on the Lumina tab. Either:
- Add a role check: `{user?.role === 'admin' && ( ... )}`
- Or remove the section from the Lumina digest entirely (the appropriate fix)

- [ ] **Step 4: Add motion to prayer wall cards**
```tsx
import { motion, AnimatePresence } from 'motion/react';
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
```

Wrap `requests.map()` in `<motion.div variants={stagger} initial="hidden" animate="visible">`, each card in `<motion.div key={req.id} variants={fadeUp}>`.

- [ ] **Step 5: Verify + commit**
```bash
npx tsc --noEmit && npm run build
git add pages/TheCommunity.tsx
git commit -m "feat: TheCommunity — copy fix, hide admin section, motion on prayer wall"
```

---

## Phase 8 — VoiceCompanion (Kai) Upgrade

**File:** `pages/VoiceCompanion.tsx`

- [ ] **Step 1: Add motion + upgrade header**
```tsx
import { motion, AnimatePresence } from 'motion/react';
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
```

Replace header:
```tsx
<div className="mb-8">
  <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-3">Sanctuary</p>
  <motion.h1 className="text-4xl font-black text-brand-text-primary flex items-center gap-4 mb-2"
    style={{ fontFamily: 'var(--font-display)' }}
    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: EASE }}
  >
    Kai — Your Guide
  </motion.h1>
  <p className="text-brand-text-secondary">A calm voice for prayerful reflection and spiritual conversation. Speak freely.</p>
</div>
```

- [ ] **Step 2: Move transcript above the orb, fix readability**

Move the transcript div out of `absolute bottom-8` and into a proper scrollable area above the orb:
```tsx
{/* Transcript — above the orb */}
{transcript.length > 0 && (
  <div className="w-full max-w-md mb-6 max-h-32 overflow-y-auto space-y-2 px-4">
    {transcript.map((t, i) => (
      <p key={i} className={`text-sm ${t.isUser ? 'text-right text-brand-text-secondary' : 'text-brand-accent font-semibold'}`}>
        {t.isUser ? 'You: ' : 'Kai: '}{t.text}
      </p>
    ))}
  </div>
)}
```

- [ ] **Step 3: Add motion to the feature cards at bottom**
```tsx
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } };
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
// Wrap the 3-card grid:
<motion.div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
  variants={stagger} initial="hidden" animate="visible"
>
  {[...cards].map(...)} // each in motion.div variants={fadeUp}
</motion.div>
```

- [ ] **Step 4: Verify + commit**
```bash
npx tsc --noEmit && npm run build
git add pages/VoiceCompanion.tsx
git commit -m "feat: VoiceCompanion — transcript above orb, motion on feature cards, copy polish"
```

---

## Phase 9 — TestimoniesPage (Real Data + Motion)

**File:** `pages/TestimoniesPage.tsx`

- [ ] **Step 1: Add motion imports + constants**

- [ ] **Step 2: Replace mock-only data display with Firebase-aware empty state**

The page currently uses `mockAnsweredPrayers` and `mockStandaloneTestimonies`. Keep the mock data as fallback but add this note as a comment:

```tsx
// TODO: Replace mockAnsweredPrayers with real data from Firestore prayerRequests collection (filter where testimony != null)
// TODO: Replace mockStandaloneTestimonies with real data from Firestore testimonies collection
```

For now, upgrade the display quality:

- [ ] **Step 3: Add motion to header and CTA button**
```tsx
import { motion, AnimatePresence } from 'motion/react';
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
// Header h1 → motion.h1, button → motion.button whileHover={{ scale: 1.03 }}
```

Replace header eyebrow:
```tsx
<p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-3">Community</p>
<h1 className="text-4xl font-black text-brand-text-primary mb-3" style={{ fontFamily: 'var(--font-display)' }}>
  Wall of Testimony
</h1>
<p className="text-lg text-brand-text-secondary max-w-2xl">
  Stories of God's faithfulness — answered prayers, unexpected grace, and everyday miracles.
</p>
```

- [ ] **Step 4: Add stagger motion to testimony grid**
```tsx
<motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  variants={stagger} initial="hidden" animate="visible"
>
  {unifiedTestimonies.map(item => (
    <motion.div key={item.id} variants={fadeUp} transition={{ duration: 0.45, ease: EASE }}>
      <TestimonyCard testimony={item} />
    </motion.div>
  ))}
</motion.div>
```

- [ ] **Step 5: Fix `brand-gold` reference** in TestimonyCard (SparklesIcon uses `text-brand-gold` — replace with `text-brand-accent`).

- [ ] **Step 6: Verify + commit**
```bash
npx tsc --noEmit && npm run build
git add pages/TestimoniesPage.tsx
git commit -m "feat: TestimoniesPage — motion, copy polish, remove brand-gold reference"
```

---

## Phase 10 — ExpertCouncilPage Upgrade

**File:** `pages/ExpertCouncilPage.tsx`

- [ ] **Step 1: Add motion + header**
```tsx
import { motion, AnimatePresence } from 'motion/react';
const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
```

Add header before the expert selection:
```tsx
<div className="mb-8">
  <p className="text-xs font-bold uppercase tracking-widest text-brand-accent mb-3">Community</p>
  <motion.h1 className="text-4xl font-black text-brand-text-primary mb-3"
    style={{ fontFamily: 'var(--font-display)' }}
    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: EASE }}
  >
    Expert Council
  </motion.h1>
  <p className="text-brand-text-secondary">Ask a scholar, counselor, or theologian. Each brings a distinct perspective grounded in faith.</p>
</div>
```

- [ ] **Step 2: Upgrade expert selection cards**

Give each expert card a visual identity (color accent based on specialty) and add motion stagger:
```tsx
const expertColors = ['border-primary-blue', 'border-secondary-purple', 'border-accent-gold', 'border-brand-accent'];
```

Each expert card gets its border color, a rounded avatar with initials, and a clear specialty badge.

- [ ] **Step 3: Animate expert selection + chat appearance with AnimatePresence**

- [ ] **Step 4: Verify + commit**
```bash
npx tsc --noEmit && npm run build
git add pages/ExpertCouncilPage.tsx
git commit -m "feat: ExpertCouncilPage — motion, expert cards with visual identity, user-centered copy"
```

---

## Phase 11 — CommunityRoomsPage Visual Polish

**File:** `pages/CommunityRoomsPage.tsx`

- [ ] **Step 1: Add motion + upgrade header**

- [ ] **Step 2: Add avatar initials instead of generic UserCircleIcon**

In each message, replace `<UserCircleIcon>` with a colored initial avatar:
```tsx
const getInitialColor = (name: string) => {
  const colors = ['bg-primary-blue', 'bg-secondary-purple', 'bg-accent-gold', 'bg-brand-accent'];
  return colors[name.charCodeAt(0) % colors.length];
};

// Replace the icon:
<div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${getInitialColor(msg.user)}`}>
  {msg.user.charAt(0).toUpperCase()}
</div>
```

- [ ] **Step 3: Animate messages coming in with motion**

Wrap each message in `motion.div` with `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}`.

- [ ] **Step 4: Verify + commit**
```bash
npx tsc --noEmit && npm run build
git add pages/CommunityRoomsPage.tsx
git commit -m "feat: CommunityRoomsPage — colored initial avatars, message motion"
```

---

## Phase 12 — Fix Duplicate Nav Icons

**Problem:** Podcast Library and Audiobook Library both use `Headphones`. Community Rooms and The Community both use `MessagesSquare`. Challenges and Your Journey both use `Trophy`.

**File:** `components/Layout.tsx`

- [ ] **Step 1: Update imports at top of Layout.tsx**

Add: `Podcast, Library, BarChart2, Heart` (or similar distinct icons)

- [ ] **Step 2: Apply unique icons per feature**

```tsx
// Change these in sanctuaryItems:
{ to: '/app/podcasts', icon: Mic }             // Podcast Library → Mic (microphone)
{ to: '/app/audiobook-library', icon: Headphones } // Audiobook Library → Headphones (keep)
{ to: '/app/community-rooms', icon: MessagesSquare } // Community Rooms → MessagesSquare (chat)
{ to: '/app/the-community', icon: Users }      // The Community → Users (group)
{ to: '/app/challenges', icon: Trophy }        // Challenges → Trophy (keep)
{ to: '/app/gamification', icon: BarChart2 }   // Your Journey → BarChart2 (progress)
{ to: '/app/visual-sanctuary', icon: Sparkles }  // Visual Sanctuary → Sparkles
{ to: '/app/sentient-guide', icon: AudioLines } // Sentient Guide → AudioLines
```

Also fix:
```tsx
// Currently both use Headphones:
{ to: '/app/podcasts', text: 'Podcast Library', icon: Headphones } // Change to: Mic
```

- [ ] **Step 3: Verify build + commit**
```bash
npx tsc --noEmit && npm run build
git add components/Layout.tsx
git commit -m "fix: replace duplicate nav icons with unique feature-specific icons"
```

---

## Phase 13 — Family & Leader Dashboards + Inbox + Gamification Audit

### Task 13.1 — FamilyDashboardPage
- [ ] Read file, audit for developer copy, add motion header, add eyebrow label

### Task 13.2 — LeaderDashboardPage
- [ ] Read file, audit for developer copy, add motion header

### Task 13.3 — InboxPage
- [ ] Read file, verify notifications display correctly, add motion

### Task 13.4 — GamificationPage
- [ ] Add motion to achievements list and rewards grid
- [ ] Replace `animate-fade-in-up` CSS animation on card with `motion.div variants={fadeUp}`
- [ ] Upgrade tab buttons with AnimatePresence between tabs

For each:
```bash
npx tsc --noEmit && npm run build
git add pages/<PageName>.tsx
git commit -m "feat: <PageName> — motion, copy polish, header upgrade"
```

---

## Phase 14 — Strategy Section Audit

### Task 14.1 — DevotionalGenerator (already done in Phase 0)

### Task 14.2 — BlogStudioPage, QuoteGeneratorPage, GrowthConsole
- [ ] Read each file
- [ ] Remove any developer copy or prototype language
- [ ] Add eyebrow + motion header
- [ ] Commit each separately

### Task 14.3 — AdminDashboard, ContentManagerPage
- [ ] Verify no user-visible developer copy
- [ ] These are admin tools — function over aesthetics, but no broken UI

### Task 14.4 — DiagnosticsPage, ReleaseOpsConsole, Roles
- [ ] These are internal — verify they work, remove any embarrassing developer notes visible to admins

---

## Phase 15 — Global Copy Audit

- [ ] **Step 1: Run grep across all pages**
```bash
grep -rn "professionals\|platform\|the app\|users\|prototype\|Mux\|Agora\|Genkit\|Veo\|Lyria\|demo\|coming soon\|check back later\|not available yet" pages/ --include="*.tsx"
```

- [ ] **Step 2: Fix every match in context**

| Found | Replace with |
|-------|-------------|
| "professionals" | "those who lead" / "you" / remove |
| "the app" | "here" / "the sanctuary" |
| "platform" | "space" / "community" |
| "check back later" | forward-looking alternative |
| "not available yet" | "coming soon — we're building this for you" |
| "No results found." | "Nothing matched — try different words." |

- [ ] **Step 3: Commit**
```bash
git add pages/
git commit -m "copy: global audit — user-centered language across all pages"
```

---

## Phase 16 — Visual Depth, Responsiveness & Theme Parity

### Task 16.1 — Gradient hero bands on key pages

For `AudiobookLibraryPage`, `BibleReaderPage`, `TheCommunity`, `VoiceCompanion`, `VisualSanctuary`, `ExpertCouncilPage`, `CommunityRoomsPage`:

Add above each page header:
```tsx
<div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-br from-brand-accent/5 via-transparent to-transparent pointer-events-none rounded-2xl" />
```

### Task 16.2 — Responsiveness (375px mobile)

Test each page at 375px. Common fixes:
- `grid-cols-3` → `grid-cols-1 sm:grid-cols-3` where content overflows
- Add `min-w-0 overflow-hidden` to flex children that overflow
- Bible Reader sidebar: already stacks at mobile (grid-cols-1 lg:grid-cols-4 ✓)
- Community Rooms chat: verify input bar doesn't overflow

### Task 16.3 — Theme parity (dark/light/sepia)

Search for hardcoded colors in all upgraded pages:
```bash
grep -rn "text-white\|bg-gray\|bg-zinc\|text-gray" pages/ --include="*.tsx"
```

Replace every match with design token equivalents (`text-brand-text-primary`, `bg-brand-dark`, `text-brand-text-secondary`).

- [ ] **Commit**
```bash
git add pages/ components/
git commit -m "fix: visual depth, responsive fixes, theme parity across all pages"
```

---

## Phase 17 — Final Build Verification

- [ ] **Run full build**
```bash
npx tsc --noEmit && npm run build
```
Expected: zero TypeScript errors, build succeeds

- [ ] **Check for console.log statements**
```bash
grep -rn "console\.log" pages/ components/ services/ --include="*.tsx" --include="*.ts"
```
Remove any found (except intentional error handlers — those use `console.error`).

- [ ] **Final commit**
```bash
git add .
git commit -m "chore: final build verification — zero errors, zero console.log"
```

---

## Overall Definition of Done

This is the last run. It is complete when:

**Broken features fixed:**
- [ ] NewsletterPage reads in-app (no Substack redirect)
- [ ] BibleReaderPage settings modal displays without clipping
- [ ] GuidedJourney devotional uses in-app player (no `<audio controls>`)
- [ ] BlogPostPage audio uses in-app player
- [ ] TheCommunity "Admin Only" section hidden from non-admins
- [ ] VisualSanctuary button disabled state is handled gracefully (not just a grey "Premium Feature" dead end)

**Developer copy removed:**
- [ ] Zero "prototype", "Mux/Agora", "Genkit", "Veo Cinematic Engine", "ePub prototype" visible to users
- [ ] DevotionalGeneratorPage has production-quality copy
- [ ] AtmosphericMusicPage has production-quality copy
- [ ] LiveStreamPage has production-quality copy

**Design benchmarks met:**
- [ ] PodcastPage: compact Spotify-style row list (no word walls)
- [ ] AudiobookLibraryPage: Spotify-level card grid with active track indicator
- [ ] BibleReaderPage: Focus Mode toggle, animated chapter transitions
- [ ] All pages use motion (stagger, fadeUp, AnimatePresence) consistently

**Copy:**
- [ ] Zero "professionals", "users", "the app", "platform" in any user-facing page
- [ ] All empty states are forward-looking, not apologetic

**Icons:**
- [ ] No two features share the same icon in the sidebar navigation

**Quality:**
- [ ] All three themes (light/dark/sepia) render legibly on every page
- [ ] No horizontal overflow at 375px viewport on any page
- [ ] `npx tsc --noEmit && npm run build` passes with zero errors
- [ ] Zero `console.log` in pages/

---

## Claude Terminal Goal (paste this to start)

```
Execute the CCN Daily Complete Feature Upgrade plan at:
docs/superpowers/plans/2026-05-21-ccn-full-depth-upgrade.md

Work through each phase in order. Read the relevant file before editing.
Verify the TypeScript build after each phase: npx tsc --noEmit && npm run build
Commit each phase separately before moving on.

Phase order:
0. Critical fixes — developer copy removal (DevotionalGenerator, AtmosphericMusic, LiveStream, LandingPage)
1. AudiobookLibraryPage — Spotify-benchmark with motion
2. PodcastPage — compact Spotify-style episode rows
3. NewsletterPage — in-app reader drawer (no Substack redirect)
4. BibleReaderPage — settings fix, focus mode, animated transitions
5. GuidedJourneyPage — in-app audio player trigger
6. BlogPostPage — in-app audio
7. TheCommunity — copy, admin section guard, motion
8. VoiceCompanion (Kai) — transcript layout, motion
9. TestimoniesPage — motion, copy
10. ExpertCouncilPage — motion, expert card identity
11. CommunityRoomsPage — colored avatars, motion
12. Layout.tsx — fix duplicate nav icons
13. Family/Leader Dashboards, Inbox, Gamification — motion + audit
14. Strategy section — dev copy removal
15. Global copy audit — grep and replace banned words
16. Visual depth + responsiveness + theme parity
17. Final build — zero errors, zero console.log

Overall definition of done: zero TypeScript errors, zero console.log, zero developer copy in user-facing pages, all features benchmarked to industry standards, all three themes render correctly, no horizontal overflow at 375px.
```
