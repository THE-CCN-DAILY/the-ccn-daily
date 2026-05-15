# Phase 3 Reader Highlights + D1 Checkpoint

Date: 2026-05-16
Branch: `codex/project-phoenix-cloudflare-thoughtstream`

## What changed

- Added a D1 `highlights` table for reader notes and highlights.
- Added Cloudflare Pages Functions endpoints:
  - `GET /api/users/:userId/highlights?contentId=...`
  - `POST /api/users/:userId/highlights`
  - `PATCH /api/users/:userId/highlights/:id`
  - `DELETE /api/users/:userId/highlights/:id`
- Reworked `services/firestoreService.ts` to preserve its public API while using `fetch()` against Cloudflare endpoints instead of Firestore.
- Removed direct `firebase/firestore` and `db` imports from `components/reader/ContentDisplay.tsx`.
- Changed `Highlight.createdAt` from a Firebase `Timestamp` type to an ISO/string timestamp so reader highlights are no longer tied to Firestore types.

## Verification

Passed:

- `npm run lint`
- `npm run cf:typecheck`
- `npm run build`
- `npm run db:apply:local`
- `GET http://127.0.0.1:8788/api/health`
- `POST http://127.0.0.1:8788/api/users/phase3-reader-test/highlights`
- `GET http://127.0.0.1:8788/api/users/phase3-reader-test/highlights?contentId=devotional-test`
- `PATCH http://127.0.0.1:8788/api/users/phase3-reader-test/highlights/highlight-phase3-test`
- `DELETE http://127.0.0.1:8788/api/users/phase3-reader-test/highlights/highlight-phase3-test`

## Firebase reduction

Removed from the reader highlight path:

- `components/reader/ContentDisplay.tsx` no longer imports `firebase/firestore`.
- `components/reader/ContentDisplay.tsx` no longer imports `db` from `firebase.ts`.
- `services/firestoreService.ts` no longer imports Firestore SDK helpers.

Still remaining elsewhere:

- Auth shell still uses Firebase Auth and Firestore role lookup.
- Admin/content manager/course/challenge pages still use Firestore and Firebase Storage.
- Community/live/event/notification pages still use Firestore realtime listeners.
- Payment, budget, audit, and AI usage services still include Firebase or Firebase Admin paths.

## Next phase

Phase 4 should migrate the user/session/profile layer carefully:

- Keep Google sign-in behavior or replace it deliberately with Cloudflare Access/Auth.js-style sessions.
- Move user roles and tiers to D1.
- Ensure `pastor.eryeza@gmail.com` remains the default admin.
- Update `RequireAuth` and `RequireRole` only after the new session/profile source is proven in preview.
