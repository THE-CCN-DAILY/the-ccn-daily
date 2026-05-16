# Phase 5 Auth Profile + D1 Checkpoint

Date: 2026-05-16
Branch: `codex/project-phoenix-cloudflare-thoughtstream`

## What changed

- Added `POST /api/auth/profile` in Cloudflare Pages Functions.
- The endpoint creates or updates a D1 `users` profile row from the signed-in user payload.
- Preserved the founder/admin rule:
  - `pastor.eryeza@gmail.com` becomes `role: admin`, `tier: max`.
  - Other users default to `role: user`, `tier: free`.
- Added `services/userProfileService.ts`.
- Updated `contexts/AuthContext.tsx`:
  - Firebase Google sign-in remains in place for now.
  - Firestore role/tier lookup has been removed.
  - Role/tier profile sync now goes through `/api/auth/profile`.

## Verification

Passed:

- `npm run lint`
- `npm run cf:typecheck`
- `npm run build`
- `npm run db:apply:local`
- Cloudflare preview health check:
  - `GET http://127.0.0.1:8788/api/health`
- Admin profile probe:
  - `POST /api/auth/profile`
  - Payload email: `pastor.eryeza@gmail.com`
  - Returned `role: admin`, `tier: max`, `source: d1`
- Reader profile probe:
  - `POST /api/auth/profile`
  - Payload email: `reader@example.com`
  - Returned `role: user`, `tier: free`, `source: d1`

## Firebase reduction

Removed from the auth role/profile path:

- `contexts/AuthContext.tsx` no longer imports Firestore helpers.
- `contexts/AuthContext.tsx` no longer imports `db` from `firebase.ts`.
- Auth role/tier lookup no longer reads or writes Firestore user documents.

Still remaining:

- Firebase Auth is still used for Google sign-in.
- `firebase.ts` still initializes Firebase SDK because other older feature pages still import `db`, `auth`, or `storage`.
- A production-grade Cloudflare auth layer still needs token/session verification before Firebase Auth can be removed.

## Next phase

Migrate one of these domains next:

- Notifications and gamification, because they are app-wide but bounded contexts.
- Journaling, because it is user-facing and D1-friendly.
- Content/course/challenge catalog, because it removes large chunks of Firestore and Firebase Storage dependency but needs more careful media/R2 work.
