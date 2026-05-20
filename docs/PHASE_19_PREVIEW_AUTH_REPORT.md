# Phase 19 Preview Auth Report

Date: 2026-05-20
Branch: `codex/project-phoenix-cloudflare-thoughtstream`
Preview: `http://127.0.0.1:8788`

## Purpose

The user could not inspect most inside-app features because the current app shell still depends on Firebase auth state. In local Cloudflare preview, Firebase is not configured, so `RequireAuth` and `RequireRole` redirected inside routes to pricing/free-plan surfaces.

This phase adds a local-preview-only session fallback so inside routes can be inspected while the proper Cloudflare-native auth replacement remains a later production phase.

## Changed Files

- `functions/api/[[path]].ts`
  - Added `GET /api/auth/preview-session`.
  - The endpoint only works when `CF_PAGES` is present and the request host is `localhost` or `127.0.0.1`.
  - The endpoint seeds/returns a D1-backed preview admin user with:
    - email: `pastor.eryeza@gmail.com`
    - role: `admin`
    - tier: `max`
- `services/userProfileService.ts`
  - Added `getPreviewSessionUser()`.
- `contexts/AuthContext.tsx`
  - When Firebase reports no current user, local preview tries `/api/auth/preview-session` before leaving `user` null.

## Verification

Commands completed:

- `npm run cf:typecheck`
- `npm run lint`
- `npm run build`

Browser route checks against `http://127.0.0.1:8788`:

- `/#/app/events`
  - Stayed on the inside route.
  - Rendered `Live Events` and the empty-events state.
- `/#/app/the-community`
  - Stayed on the inside route.
  - Rendered `The Community`, `Lumina Daily Digest`, and `Prayer Wall`.
- `/#/app/community-rooms`
  - Stayed on the inside route.
  - Rendered `The Sanctuary Room` and the empty room state.
- `/#/app/live`
  - Stayed on the inside route.
  - Rendered `Global Broadcast`, `Broadcast Offline`, and `Live Chat`.
- `/#/studio/admin`
  - Stayed on the admin route.
  - Rendered the admin users surface.

## Notes

- This is not the production auth replacement.
- The proper auth replacement still needs a Cloudflare-native session/token design.
- In local preview, sign-out is not a durable logout because the preview session is intentionally always available on localhost.
