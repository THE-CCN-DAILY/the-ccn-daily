# Phase 10 - Courses D1 Migration Report

Date: 2026-05-16
Branch: `codex/project-phoenix-cloudflare-thoughtstream`

## What Was Finished

- Added Cloudflare D1-backed course tables:
  - `courses`
  - `course_modules`
  - `course_progress`
- Seeded one practical course, `seed-formed-for-work`, with two modules.
- Added Cloudflare Pages Functions routes for:
  - public/member course catalog reads
  - course detail reads with modules and member progress
  - marking course modules complete
  - admin course create/update
  - admin module create/update
  - admin module delete
- Added `services/courseService.ts` as the client contract for the course API.
- Migrated these screens away from Firestore:
  - `pages/CoursesPage.tsx`
  - `pages/CoursePlayerPage.tsx`
  - `pages/CourseModuleManagerPage.tsx`
- Preserved media capability without Firebase Storage by accepting hosted video/audio URLs.

## Verification

Commands passed:

```powershell
npm run lint
npm run cf:typecheck
npm run db:apply:local
npm run build
```

Live local Cloudflare preview:

```text
GET http://127.0.0.1:8788/api/health -> 200
```

Course API proof:

```text
GET /api/courses -> 200
GET /api/courses/seed-formed-for-work?userId=phase10-course-user -> 200
POST /api/courses/seed-formed-for-work/modules/seed-formed-for-work-1/complete -> 200
POST /api/admin/courses -> 200
POST /api/admin/courses/phase10-api-proof-course/modules -> 200
DELETE /api/admin/courses/phase10-api-proof-course/modules/phase10-api-proof-course-module-3 -> 200
```

## Blogging Capability Check

Blogging capability is present and D1-backed:

- Public blog route: `/#/blog`
- Public post route: `/#/blog/:slug`
- Admin studio route: `/#/studio/blog`
- Service: `services/blogService.ts`
- API:
  - `GET /api/blog/posts`
  - `GET /api/blog/posts/:slug`
  - `GET /api/admin/blog/posts`
  - `POST /api/admin/blog/posts`
  - `DELETE /api/admin/blog/posts/:id`
- Schema table: `blog_posts`

This means the app has both a user-facing blog and an admin publishing surface.

## Honest Remaining Gaps

- The app is not globally Firebase-free yet. The production build still reports Firestore imports from older surfaces such as `AdminDashboard`, `ContentManagerPage`, `NotificationContext`, `GamificationContext`, community, events, giving, pricing, live stream, roles, guided journey, and audiobook pages.
- `ContentManagerPage` still has older Firebase content-creation code paths. Course list/player/module management now use D1, but the broader content manager needs its own cleanup slice.
- Direct file uploads for course media are no longer Firebase Storage-backed. This is intentional for this phase. The correct Cloudflare replacement is a dedicated R2 upload/signing slice.
- Auth is still Firebase Auth. That is separate from Firestore/Gemini migration and should be handled deliberately so login and admin gates do not break.

## Next Slice

Recommended next phase: migrate `ContentManagerPage` and the shared notification/gamification contexts away from Firestore, then add Cloudflare R2 signed upload support for course/challenge/audio/video assets.
