# Phase 18 Live Stream D1 Report

Date: 2026-05-20
Branch: `codex/project-phoenix-cloudflare-thoughtstream`
Preview: `http://127.0.0.1:8788`

## Lost Chat Reference

This slice continues the recovered `docs/LOST_CHAT_ACTION_REGISTER.md` guidance for Community, Events, and Live:

- Replace Firestore `onSnapshot` flows with deliberate Cloudflare patterns.
- Use polling for simple lists/status checks unless true real-time behavior is essential.
- Preserve live stream status and chat behavior.
- Make external service blockers explicit instead of hiding them behind broken UI paths.
- End with preview proof and a checklist.

## Changed Files

- `schema/d1-schema.sql`
  - Added `live_stream_settings`.
  - Added `live_stream_messages`.
  - Added live message created-date index.
- `functions/api/[[path]].ts`
  - Added `GET /api/live/status`.
  - Added `PUT /api/admin/live/status`.
  - Added `GET /api/live/chat/messages`.
  - Added `POST /api/live/chat/messages`.
  - Added `DELETE /api/admin/live/chat/messages/:id`.
  - Added `POST /api/mux/live`.
  - Added `POST /api/mux/upload`.
- `services/liveStreamService.ts`
  - Added shared Cloudflare API client helpers for live status, Mux stream generation, and live chat.
- `pages/LiveStreamPage.tsx`
  - Removed direct Firestore `settings/livestream` and `liveChat` listeners.
  - Polls live status every 10 seconds.
  - Polls live chat every 5 seconds.
  - Preserves Mux player rendering when a playback ID exists.
  - Adds loading, empty, and error states for live chat/status.
- `pages/AdminDashboard.tsx`
  - Mux stream generation no longer writes `settings/livestream` to Firestore.
  - Mux stream generation now goes through the Cloudflare API.

## Verification

Commands completed:

- `npm run cf:typecheck`
- `npm run lint`
- `npm run db:apply:local`
- `npm run build`

Live Cloudflare Pages preview:

- `GET http://127.0.0.1:8788/api/live/status`
  - Returned D1-backed offline status.
- `PUT http://127.0.0.1:8788/api/admin/live/status`
  - Set `phase18-playback`, `phase18-stream`, title, and viewer count.
- `POST http://127.0.0.1:8788/api/live/chat/messages`
  - Created `phase18-live-message-smoke`.
- `GET http://127.0.0.1:8788/api/live/chat/messages`
  - Returned the created live chat message from D1.
- `DELETE http://127.0.0.1:8788/api/admin/live/chat/messages/phase18-live-message-smoke`
  - Returned `{ "ok": true }`.
- `PUT http://127.0.0.1:8788/api/admin/live/status`
  - Reset live status back to offline.
- Final `GET http://127.0.0.1:8788/api/live/chat/messages`
  - Returned an empty message list after cleanup.
- `POST http://127.0.0.1:8788/api/mux/live`
  - Returned `501 MUX_NOT_CONFIGURED` because `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` are not configured locally.

## Preview Checklist

Inspect at `http://127.0.0.1:8788`:

- Sign in, then open `/#/app/live`.
  - Offline broadcast state should render cleanly when no playback ID exists.
  - Live Chat should show an empty state when no messages exist.
  - Sending a message should append it immediately.
  - Chat should refresh through polling.
- In Admin Dashboard, open Events / Mux Live Stream Configuration.
  - Generate Mux Stream Key should now fail with a clear Mux configuration message until secrets are configured.
  - It should not write live stream settings to Firestore.

## Remaining Gaps

- Mux live stream generation is blocked until `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` are configured.
- Mux direct upload still returns `MUX_NOT_CONFIGURED` in Cloudflare preview.
- `pages/AdminDashboard.tsx` still contains Firestore usage for inbox, payments, discounts, and resources.
- `pages/GivingPage.tsx`, `pages/PricingPage.tsx`, and `pages/Roles.tsx` still contain payment/entitlement-related Firebase usage.
- Firebase Auth remains active and should be replaced only after the Cloudflare-native session/token design is explicit.

## Next Slice

Move carefully into giving, pricing, roles, payments, and entitlements. Those slices should add audit logs and stronger correctness checks because they affect money and access.
