# Project Phoenix Publisher-Ready Rebuild Plan

Date: 2026-05-15
Source of truth: `D:\THE CCN DAILY\Project-Phoenix-github-source`
Reference rescue repo: `D:\THE CCN DAILY\the-ccn-daily_-project-phoenix - new`
Original app link: https://ai.studio/apps/99552f04-30cb-4061-a5c7-62e531885ebf

## Executive Decision

The original GitHub app is the product source of truth. It contains the breadth of the vision: member sanctuary, founder studio, guided journey, Bible reader, podcast/newsletter feeds, courses, audiobooks, challenges, community, live/events/giving, family and leader dashboards, pricing, AI companions, and admin operations.

The rescue app is not the foundation. It is a parts library. We will selectively import its Cloudflare migration work, RSS/blog work, visual-check tooling, and documentation discipline, while rejecting its broad visual layer because it did not reach the required product-quality bar.

The rebuild principle is: preserve every capability unless an explicit replacement is implemented, verified, and documented.

## Team Meeting Decision

### Product Architect

Keep the dual namespace:

- `/app/*` remains the Member Sanctuary.
- `/studio/*` remains the Founder Command Center.
- Public marketing/editorial pages must be added without collapsing the app into a shallow landing page.

The app should become immediately useful by opening into a daily spiritual rhythm for members and an operations dashboard for admins.

### Platform Architect

Migrate Firebase and Gemini runtime dependencies to Cloudflare services in phases, not in a destructive rewrite.

Target Cloudflare stack:

- Cloudflare Pages for hosting.
- Pages Functions or Workers/Hono for APIs.
- D1 for relational app data.
- R2 for books, audiobooks, covers, devotional audio, uploads, exports, and media files.
- KV for low-risk cached configuration, RSS cache, feature flags, and public settings.
- Queues/Cron for ingestion, RSS refresh, digest creation, email jobs, and AI batch jobs.
- Workers AI for free-plan AI features, with strict quotas and graceful fallbacks.
- Turnstile for abuse protection on signup, newsletter, prayer, comments, and public forms.

### UX and Design Lead

Adopt ThoughtStream as the governing design system:

- Minimal, zen, distraction-free.
- Warm light theme: `#FAFAF9`, `#F5F5F4`, `#EFEDEB`, `#1C1917`, `#57534E`, `#78716C`, `#A8A29E`.
- Dark theme must be warm black/brown, not blue/slate.
- Sepia theme must prioritize long-form reading comfort.
- Libre Baskerville for titles, article headings, Scripture headings, and devotional emphasis.
- Inter for UI, controls, navigation, forms, tables, admin surfaces.
- Source Code Pro for diagnostics and logs.
- Zero-radius containers and controls except avatars, radio dots, scrubber handles, and necessary native controls.
- No shadows as a layout crutch. Use borders, measure, spacing, and typographic hierarchy.
- Feature icons must be practical and instantly identifiable. Use simple functional icons from the app icon library or lucide-style equivalents for actions and sections: Bible/book, headphones/podcast, pen/journal, calendar/events, users/community, chart/admin growth, shield/security, credit card/payments, upload/content, radio/live, mail/newsletter, settings/ops. Do not use vague AI-generated illustrations, abstract blobs, decorative pseudo-spiritual symbols, or icon art that requires explanation.

### Admin and Strategy Lead

The studio must become a calm command surface, not a decorative dashboard. `pastor.eryeza@gmail.com` remains the default super-admin identity.

The admin home should answer:

- What needs attention today?
- Are RSS/API/AI/payment/media/email systems healthy?
- What content is scheduled, stuck, draft, failed, or ready?
- What are users doing?
- What changed in production?
- What action should the founder take next?

### Content and Formation Lead

THE CCN DAILY is a formation product, not an AI toy. AI should support devotionals, reflection, search, summaries, moderation, and personalization, but the app identity is content, Scripture, prayer, habit, reading, community, and leadership.

## Current Source App Inventory

### Core Shell

- App shell and routes: `App.tsx`
- Dual sanctuary/strategy navigation: `components/Layout.tsx`
- Theme provider: `contexts/ThemeContext.tsx`
- Auth provider: `contexts/AuthContext.tsx`
- Audio provider: `contexts/AudioPlayerContext.tsx`
- Notifications: `contexts/NotificationContext.tsx`
- Gamification: `contexts/GamificationContext.tsx`
- Upgrade modal: `contexts/UpgradeModalContext.tsx`

### Public and Entry Surfaces

- `/` currently redirects to `/app/guided-journey`.
- `/pricing` exists.
- Missing publisher-ready public website pages:
  - Landing page.
  - Blog.
  - Public newsletter archive.
  - Public podcast page.
  - Public books/resources preview.
  - About/ministry page.
  - Signup and newsletter capture.

### Member Sanctuary

Existing routes to preserve:

- `/app/guided-journey`
- `/app/bible`
- `/app/podcasts`
- `/app/the-community`
- `/app/expert-council`
- `/app/testimonies`
- `/app/gamification`
- `/app/grace-link`
- `/app/sentient-guide`
- `/app/visual-sanctuary`
- `/app/inbox`
- `/app/newsletters`
- `/app/events`
- `/app/live`
- `/app/giving`
- `/app/courses`
- `/app/courses/:courseId`
- `/app/audiobook-library`
- `/app/challenges`
- `/app/challenges/:challengeId`
- `/app/challenges/:challengeId/modules/:moduleId`
- `/app/journaling`
- `/app/community-rooms`
- `/app/family-dashboard`
- `/app/leader-dashboard`

### Founder Studio

Existing routes to preserve:

- `/studio/admin`
- `/studio/plan`
- `/studio/roadmap-evolution`
- `/studio/visionary-lab`
- `/studio/data`
- `/studio/roles`
- `/studio/multi-tenancy`
- `/studio/devotional-generator`
- `/studio/quote-generator`
- `/studio/dynamic-theming`
- `/studio/atmospheric-music`
- `/studio/media-plan`
- `/studio/design-system`
- `/studio/diagnostics`
- `/studio/content-manager`
- `/studio/challenges/:challengeId/modules`
- `/studio/courses/:courseId/modules`
- `/studio/growth`
- `/studio/release-ops`
- `/studio/team`
- `/studio/next-steps`
- `/studio/chat`

## What Must Be Carried From The Rescue App

### Platform

- `wrangler.toml`: Cloudflare project scaffold, after replacing placeholder IDs.
- `functions/api/[[path]].ts`: Hono API patterns for health, RSS, blog CRUD, users, notes, onboarding, newsletter signup, purchases, Flutterwave webhook, admin users/audit, email, Mux, and Workers AI.
- `functions/lib/auth.ts`: Cloudflare-compatible auth/JWT verification patterns.
- `functions/lib/db.ts`: D1 helper patterns.
- `functions/lib/ai.ts`: Workers AI wrapper patterns.
- `schema/d1-schema.sql`: D1 baseline.
- `CLOUDFLARE_SETUP.md`: deployment checklist, after revision.

### Product Features

- `services/rssService.ts`: API-base behavior for Cloudflare local and preview stacks.
- `services/blogService.ts`: D1-backed blog client.
- `services/apiClient.ts`: authenticated API client and error handling.
- `pages/BlogStudioPage.tsx`: blog editing workflow ideas, not final UX.
- Newsletter/podcast RSS integration logic, not visual styling.

### QA

- `scripts/visual-check.mjs`: route screenshot capture for desktop/mobile.
- `docs/product-doctrine.md`: principle that AI is not the product identity.
- Brand/design reference docs as inputs, not as final UI.

## What Must Not Be Carried As-Is

- The rescue repo `index.css` wholesale. It is a large rescue patch layer and carries visual debt.
- The rescue landing page as final UI. It improved structure but still felt template-like.
- Rounded-card, gradient, shadow-heavy, crimson/parchment route-specific patches.
- Static fallback content being treated as success when live RSS/API data is expected.
- Any completion claim without live preview evidence.

## Cloudflare Migration Plan

### Phase 0: Preserve and Baseline

Definition of done:

- Original GitHub app is cloned locally.
- A working branch is created.
- Baseline `npm install`, `npm run lint`, and `npm run build` results are captured.
- Route inventory is saved.
- Screenshots of current original app are captured where auth permits.
- Invalid Windows checkout path under `migrated_prompt_history` is documented and excluded.

### Phase 1: Cloudflare Foundation

Implement:

- Add `wrangler.toml`.
- Add `functions/api/[[path]].ts`.
- Add `schema/d1-schema.sql`.
- Add D1 local and remote scripts.
- Add R2 bucket plan for uploaded content.
- Add KV namespace plan for feature flags and RSS cache.
- Add API health route.

Definition of done:

- `npm run build` passes.
- `npm run cf:dev` or the chosen local Cloudflare stack serves the app.
- `/api/health` returns JSON.
- D1 local migrations run.
- No public route breaks.

### Phase 2: Auth and Roles Without Firebase

Recommended approach:

- Use a Cloudflare-compatible auth layer rather than Firebase Auth.
- Use Auth.js or a small first-party auth/session layer backed by D1.
- Keep Google sign-in as a provider if desired.
- Store users, roles, tiers, and profile data in D1.
- Use secure httpOnly session cookies.
- Assign `pastor.eryeza@gmail.com` as super admin on first login or seed.

Definition of done:

- `AuthContext.tsx` no longer imports Firebase.
- `RequireAuth` and `RequireRole` work with the new session endpoint.
- New users default to role `user`, tier `free`.
- `pastor.eryeza@gmail.com` receives role `admin`, tier `max`.
- Logout clears server session.
- Protected routes redirect correctly.
- Admin routes cannot be opened by non-admin users.

### Phase 3: Firestore to D1 Data Migration

Replace Firestore usage by domain:

- Users, roles, tiers, profiles.
- Notes, highlights, journals.
- Devotionals.
- Books and audiobooks metadata.
- Courses, modules, progress.
- Challenges, modules, participants.
- Events and live streams.
- Notifications and inbox.
- Prayer requests, testimonies, community rooms, live chat.
- Purchases, entitlements, discounts, donations.
- Settings, feature flags, audit logs.
- AI usage and quotas.

Definition of done:

- `rg "firebase|firestore|firebase-admin|firebase/storage"` returns only migration docs or deleted legacy files.
- Every replaced service has a Cloudflare API route.
- Every user-owned write is scoped to the authenticated user unless admin.
- Every admin write produces an audit log.
- D1 schema has indexes for common queries.
- Existing UI behavior is preserved.

### Phase 4: Storage to R2

Move Firebase Storage features to R2:

- Book files.
- EPUB/PDF uploads.
- Audiobooks.
- Cover art.
- Devotional audio.
- Course/challenge media.
- Exported quote images.

Definition of done:

- Uploads use signed or direct R2 upload flows.
- Files are private by default unless intended public.
- Public assets are served through safe read routes or public bucket rules.
- Deleting content also deletes or marks unused files.
- Admin can see upload status, file size, and media type.

### Phase 5: Gemini to Workers AI

Replace Gemini runtime dependency with Workers AI:

- AI coach: Workers AI text model, quota-limited.
- Devotional generator: Workers AI with theological guardrails.
- Tags and summaries: small/cheap model.
- Expert council: structured prompts with strict disclaimers and pastoral boundaries.
- Sentinel/diagnostics: rule-first checks, AI only for summarization.
- Quote image/video features: disable gracefully or defer until a Cloudflare-compatible generation route is selected.
- Voice companion: treat as future/premium unless Workers AI speech/live capabilities are confirmed viable.

Definition of done:

- `rg "@google/genai|GoogleGenAI|GEMINI|Gemini"` returns only migration docs or removed legacy notes.
- AI calls originate server-side only.
- Free-plan quota is enforced before inference.
- AI errors show useful fallbacks, not broken screens.
- Admin can see daily AI usage and feature-level costs.

Cloudflare limits to design around:

- Workers AI includes 10,000 free Neurons per day and paid usage requires Workers Paid.
- Pages Functions count toward Workers request quotas; static assets are free/unlimited.
- R2 free tier includes 10 GB-month storage, 1M Class A operations, and 10M Class B operations per month on Standard storage.
- D1 has a free tier but queries must be designed with indexes and row-read discipline.

Sources:

- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/pages/functions/pricing/
- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/

## Product Feature Plan

### 1. Landing Page

Purpose:

Public first impression, not a login wall.

Build:

- Quiet editorial hero.
- Today preview: scripture, devotional excerpt, audio/podcast cue.
- Public latest podcast from real RSS.
- Public latest newsletter from real RSS.
- Blog preview.
- Books/resources preview.
- Clear signup path.
- Subtle ministry/about section.

Definition of done:

- Opens without login.
- Looks excellent on desktop and mobile.
- Uses ThoughtStream tokens.
- Shows real RSS where configured.
- Has no giant rounded SaaS cards.

### 2. Blog

Purpose:

Give the ministry a serious publishing surface beyond newsletters.

Build:

- Public `/blog`.
- Public `/blog/:slug`.
- Admin `/studio/blog`.
- Draft, publish, archive.
- Tags, topics, SEO title/description, canonical slug.
- Optional audio URL.
- Featured image optional, not required.
- Reading measure and typography optimized.

Definition of done:

- Admin can create, edit, publish, unpublish, delete.
- Public readers see only published posts.
- Blog appears on landing page.
- Empty state helps admin create first post.

### 3. Guided Daily Journey

Purpose:

The member home. This is where the app proves usefulness immediately.

Preserve:

- Opening prayer.
- Devotional.
- Journaling.
- Guided prayer.
- Declaration.
- Further study.
- Scripture modal.
- Audio devotional support.

Upgrade:

- Reading-first layout.
- Progress as a quiet rule, not a loud pill.
- Save progress to D1.
- Continue where you left off.
- Today card on dashboard.

Definition of done:

- A signed-in user can complete the whole journey.
- Progress persists.
- Journal saves.
- Scripture links open Bible reader correctly.

### 4. Bible Reader

Preserve:

- Bible book/chapter navigation.
- Translation support.
- Search.
- Highlights and notes.
- Audio URL hooks.

Upgrade:

- Sepia reader mode.
- 64-70ch measure.
- Sticky quiet controls.
- D1-backed highlights.
- Keyboard and mobile controls.

Definition of done:

- User can read, search, highlight, annotate, and return later.
- Highlights are private to user unless intentionally shared.
- Mobile reader is comfortable.

### 5. Podcasts

Preserve:

- RSS-backed podcast list.
- Audio player context.
- Mini player.
- Detailed player modal.

Upgrade:

- Server-side RSS parser/cache.
- Real feed verification.
- Playback progress.
- Save/favorite episodes.
- Show notes and transcript field if available.

Definition of done:

- Real Anchor/Spotify RSS appears in local preview and production.
- Episode playback works.
- Feed failure has a useful retry/error state.

### 6. Newsletter

Preserve:

- Substack RSS ingestion.
- Newsletter route.

Upgrade:

- Public archive.
- Member saved reading.
- Admin sync status.
- Email signup connected.
- Newsletter-to-devotional queue optional.

Definition of done:

- Real Substack feed appears.
- User can open a newsletter.
- Admin can see last sync time and failure reason.

### 7. Books and Audiobooks

Preserve:

- Audiobook library.
- Books in content manager.
- Reader system.
- Audio player.

Upgrade:

- R2 uploads.
- Metadata editing.
- Access lane: free, pro, max, owned, hybrid.
- EPUB/PDF reader route.
- Audiobook progress.

Definition of done:

- Admin uploads a book/audiobook.
- User can open or play it based on access.
- Purchase/subscription gates work.

### 8. Courses

Preserve:

- Course listing.
- Course player.
- Module manager.
- Progress concepts.

Upgrade:

- D1 courses/modules schema.
- R2 media.
- Completion tracking.
- Free and premium lanes.
- Admin publish workflow.

Definition of done:

- Admin creates course/modules.
- User enrolls or opens eligible course.
- Progress persists.

### 9. Challenges

Preserve:

- Challenge listing.
- Challenge detail.
- Module viewer.
- Challenge module manager.
- AI challenge creator.

Upgrade:

- D1 challenge schema.
- Participant progress.
- Start dates and cohorts.
- Moderated comments/reflections if needed.
- Workers AI generation with admin review before publish.

Definition of done:

- Admin creates a challenge with modules.
- User joins and completes modules.
- Progress persists.

### 10. Journaling

Preserve:

- Rich text journal.
- AI tag generation idea.

Upgrade:

- D1 private entries.
- Search, tags, export.
- Optional prompt from today devotional.
- No AI call unless user asks.

Definition of done:

- User can write, save, edit, delete, search.
- Entries are private and scoped.

### 11. Community

Preserve:

- Prayer wall.
- Testimonies.
- Community rooms.
- Live chat.
- Grace Links.

Upgrade:

- Moderation queue.
- Turnstile on public submissions.
- Abuse/report controls.
- D1-backed messages.
- Optional AI digest for admins.

Definition of done:

- Users can post where allowed.
- Admin can moderate.
- No unauthenticated spam path remains.

### 12. Family and Leader Dashboards

Preserve:

- Role-gated dashboards.
- Member/activity concepts.

Upgrade:

- D1 role membership.
- Invite workflow.
- Group/family activity summaries.
- Privacy-preserving insights.

Definition of done:

- `family_lead` and `group_lead` roles see only their scope.
- Admin sees all.
- Invites are real or clearly staged.

### 13. Pricing, Giving, Entitlements

Preserve:

- Pricing tiers.
- Flutterwave concept.
- Donations.
- A-la-carte resource purchase.
- Entitlement types.

Upgrade:

- Server-verified payments.
- Webhook-first tier updates.
- D1 purchases and entitlements.
- Admin discount manager.
- PPP strategy retained as policy.

Definition of done:

- Client callback cannot grant access by itself.
- Webhook verifies payment before entitlement.
- Admin can see payment failures.

### 14. Live Stream and Events

Preserve:

- Live stream page.
- Events page.
- Mux player integration.

Upgrade:

- Mux API routes or feature-gated disabled state.
- Event creation and registration.
- Live chat moderation.
- Admin health panel.

Definition of done:

- Missing Mux secrets show a feature notice, not a broken action.
- Events can be created and displayed.

### 15. Admin Dashboard

Rebuild as operations command center:

- Status rail: API, RSS, D1, R2, Workers AI, email, payments, Mux, DNS.
- Work queue: draft content, failed syncs, pending moderation, failed uploads.
- Content operations: devotionals, blog, newsletter sync, podcasts, books, courses, challenges.
- User operations: users, roles, tiers, family/group leads.
- Revenue operations: payments, gifts, discounts, purchases, donations.
- Growth operations: signups, retention, referrals, Grace Links, newsletter subscribers.
- Release operations: feature flags, deployments, rollback notes.
- Audit logs.

Definition of done:

- Admin dashboard is useful within 60 seconds of opening.
- It has real data or clear setup states.
- It does not use fake success numbers.
- It works for `pastor.eryeza@gmail.com`.

## Design System Implementation Plan

### Phase A: Token Foundation

Replace current blue/purple token layer with ThoughtStream semantic tokens:

- `--bg`
- `--surface`
- `--surface-raised`
- `--text-primary`
- `--text-secondary`
- `--text-tertiary`
- `--border-subtle`
- `--border-medium`
- `--border-strong`
- `--primary`
- `--secondary`
- `--success`
- `--warning`
- `--error`
- `--info`

Support themes:

- Light.
- Dark warm.
- Sepia.

Acceptance:

- `index.css`, token exports, and ThemeContext agree.
- Existing `brand-*` class names map to the new tokens during transition.
- Feature icons are audited and mapped to practical, recognizable symbols; no feature depends on decorative AI-slop imagery to communicate meaning.

### Phase B: Shell

Upgrade `components/Layout.tsx`:

- Sidebar becomes quieter and square.
- Remove shadows, gradient background, rounded pills.
- Fix internal link mismatches.
- Mobile navigation must be deliberate, not an afterthought.

Acceptance:

- Sanctuary and Strategy modes both work.
- No route disappears.
- Admin-only items stay role-gated.

### Phase C: Route Archetypes

Convert by archetype, not random files:

1. Public editorial pages.
2. Member daily path.
3. Reader pages.
4. Media libraries.
5. Content catalogs.
6. Community pages.
7. Admin operations pages.
8. Forms/modals.

Acceptance:

- Each archetype gets desktop and mobile screenshots before moving to the next.
- Search for `rounded-`, `shadow`, `gradient`, `blur`, `glass`, `tracking-wider`, `uppercase` leaves only approved exceptions.

## Release Gates

No phase is complete until:

- `npm run lint` passes.
- `npm run build` passes.
- API health works.
- Real RSS works.
- Critical route screenshots are captured at desktop and mobile.
- Auth gates are tested.
- Admin gate is tested with `pastor.eryeza@gmail.com`.
- Feature parity checklist is updated.
- Any unavailable external dependency is shown as a setup blocker, not a broken screen.

## First Implementation Sprint

### Sprint Goal

Make the GitHub source app runnable, visually governed, and ready for Cloudflare migration without losing features.

### Tasks

1. Create branch `codex/project-phoenix-cloudflare-thoughtstream`.
2. Install dependencies.
3. Fix baseline build/lint issues.
4. Add Cloudflare scaffold from rescue repo.
5. Add D1 schema draft covering existing Firestore collections.
6. Add `apiClient.ts` and first D1-backed auth/session plan.
7. Add public landing/blog/newsletter/podcast route skeletons.
8. Implement ThoughtStream token layer without rewriting every screen.
9. Add visual-check script.
10. Produce baseline screenshot report.

### Stop Condition

Stop only when the app has:

- A working local preview.
- A route inventory.
- A migration matrix.
- A screenshot baseline.
- A build/lint status.
- A clear list of blocked external services.

## Long-Term Definition of Done

The app is publisher-ready only when:

- Original feature breadth is preserved.
- Firebase runtime dependency is removed.
- Gemini runtime dependency is removed.
- Cloudflare local and production stacks work.
- Blog exists and is admin-manageable.
- Real podcast RSS works.
- Real newsletter RSS works.
- Books/audiobooks/courses/challenges can be managed by admin.
- Bible reader, journaling, highlights, and audio continue working.
- Member sanctuary is useful on first login.
- Founder studio is useful on first admin login.
- `pastor.eryeza@gmail.com` is super admin.
- Light, dark, and sepia themes are coherent and ThoughtStream-aligned.
- Desktop and mobile route screenshots pass visual review.
- Payment, email, Mux, R2, Workers AI, and DNS are either connected or represented by explicit setup blockers.
- The final route-by-route report says what is safe to share and what is still private/staged.
