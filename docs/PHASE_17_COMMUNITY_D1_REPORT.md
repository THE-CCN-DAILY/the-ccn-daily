# Phase 17 Community D1 Report

Date: 2026-05-20
Branch: `codex/project-phoenix-cloudflare-thoughtstream`
Preview: `http://127.0.0.1:8788`

## Lost Chat Reference

This slice continues the recovered register in `docs/LOST_CHAT_ACTION_REGISTER.md`.

Actionable guidance applied:

- Replace Firestore `onSnapshot` flows with a deliberate Cloudflare pattern.
- Use polling for simple community lists instead of treating real-time as mandatory.
- Preserve community posts/prayer counts and room messages.
- Add useful loading and error states.
- Keep preview proof attached to the phase.

## Changed Files

- `schema/d1-schema.sql`
  - Added `prayer_requests`.
  - Added `prayer_request_prayers`.
  - Added `community_messages`.
  - Added created/user indexes for prayer and message lists.
- `functions/api/[[path]].ts`
  - Added `GET /api/community/prayer-requests`.
  - Added `POST /api/community/prayer-requests`.
  - Added `POST /api/community/prayer-requests/:id/pray`.
  - Added `GET /api/community/rooms/messages`.
  - Added `POST /api/community/rooms/messages`.
  - Added admin cleanup routes for prayer requests and messages.
- `services/communityService.ts`
  - Added shared Cloudflare API client helpers for prayer wall and room messages.
- `pages/TheCommunity.tsx`
  - Removed direct Firestore listener and writes.
  - Polls D1-backed prayer requests every 15 seconds.
  - Preserves prayer posting, grounded-topic posting, and "I Am Praying" count behavior.
- `pages/CommunityRoomsPage.tsx`
  - Removed direct Firestore listener and writes.
  - Polls D1-backed room messages every 5 seconds.
  - Preserves message send and newest-message scroll behavior.

## Verification

Commands completed:

- `npm run cf:typecheck`
- `npm run lint`
- `npm run db:apply:local`
- `npm run build`

Live Cloudflare Pages preview:

- `GET http://127.0.0.1:8788/api/health`
  - Returned `status: ok`, `runtime: cloudflare-pages`.
- `POST http://127.0.0.1:8788/api/community/prayer-requests`
  - Created `phase17-prayer-smoke` in D1.
- `GET http://127.0.0.1:8788/api/community/prayer-requests`
  - Returned the created prayer request from D1.
- `POST http://127.0.0.1:8788/api/community/prayer-requests/phase17-prayer-smoke/pray`
  - Returned `prayerCount: 2` after a second distinct user prayed.
- `POST http://127.0.0.1:8788/api/community/rooms/messages`
  - Created `phase17-message-smoke` in D1.
- `GET http://127.0.0.1:8788/api/community/rooms/messages`
  - Returned the created room message from D1.
- Admin cleanup routes returned `{ "ok": true }`.
- Final list checks returned empty prayer and message lists after cleanup.

## Preview Checklist

Inspect at `http://127.0.0.1:8788`:

- Sign in, then open `/#/app/the-community`.
  - Lumina stats should load without Firestore.
  - Prayer Wall should show an empty state when no requests exist.
  - Post Prayer should add a request without page refresh.
  - I Am Praying should update the prayer count.
  - Grounded Insights should still be able to post a Strategic Sentinel prayer item.
- Sign in, then open `/#/app/community-rooms`.
  - Empty room state should appear cleanly when no messages exist.
  - Sending a message should append it immediately.
  - Messages should refresh through polling.
- Unauthenticated app routes still pass through the existing app auth/pricing gate.
  - This is current route behavior and not part of this D1 migration slice.

## Remaining Gaps

- `pages/LiveStreamPage.tsx` still uses Firebase/Firestore for live stream status/chat behavior.
- `pages/GivingPage.tsx`, `pages/PricingPage.tsx`, and `pages/Roles.tsx` still contain payment/entitlement-related Firebase usage.
- `pages/AdminDashboard.tsx` still contains Firestore usage for inbox, payments, discounts, resources, and live stream metadata.
- Firebase Auth is still active. Replace it only after a Cloudflare-native session/token design is explicit.

## Next Slice

Continue with live stream status/chat, then move to giving/pricing/entitlements with stricter audit logging and payment-state verification.
