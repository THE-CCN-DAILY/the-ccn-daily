# Phase 16 Events D1 Report

Date: 2026-05-20
Branch: `codex/project-phoenix-cloudflare-thoughtstream`
Preview: `http://127.0.0.1:8788`

## Lost Chat Reference

This slice follows the recovered hidden-chat register in `docs/LOST_CHAT_ACTION_REGISTER.md`.

Actionable guidance applied:

- Move community/events/live surfaces away from Firestore snapshots with a deliberate Cloudflare pattern.
- Use D1 for durable event records and attendance registration state.
- Preserve event registration and Grace Link sharing behavior.
- Add useful loading, empty, and error states.
- End the phase with a Cloudflare Pages preview URL and a clear inspection checklist.

## Changed Files

- `schema/d1-schema.sql`
  - Added `events`.
  - Added `event_registrations`.
  - Added event status/date and registration user indexes.
- `functions/api/[[path]].ts`
  - Added `GET /api/events`.
  - Added `POST /api/events/:id/register`.
  - Added `POST /api/admin/events`.
  - Added `DELETE /api/admin/events/:id` for local/admin cleanup.
- `services/eventService.ts`
  - Added Cloudflare API client helpers for listing, registering, and admin event creation.
- `pages/EventsPage.tsx`
  - Removed direct Firestore reads/writes.
  - Loads events through `/api/events`.
  - Registers attendance through `/api/events/:id/register`.
  - Preserves Grace Link sharing.
  - Keeps loading, error, and empty states.
- `pages/AdminDashboard.tsx`
  - Event creation now writes through the Cloudflare admin API instead of `collection(db, 'events')`.

## Verification

Commands completed:

- `npm run lint`
- `npm run cf:typecheck`
- `npm run db:apply:local`
- `npm run build`

Live Cloudflare Pages preview:

- `GET http://127.0.0.1:8788/api/health`
  - Returned `status: ok`, `runtime: cloudflare-pages`.
- `POST http://127.0.0.1:8788/api/admin/events`
  - Created `phase16-event-smoke` in D1.
- `GET http://127.0.0.1:8788/api/events`
  - Returned the created event from D1.
- `POST http://127.0.0.1:8788/api/events/phase16-event-smoke/register`
  - Returned the event with `attendeeCount: 1`.
- `DELETE http://127.0.0.1:8788/api/admin/events/phase16-event-smoke`
  - Returned `{ "ok": true }`.
- Final `GET http://127.0.0.1:8788/api/events`
  - Returned an empty event list after cleanup.

## Preview Checklist

Inspect at `http://127.0.0.1:8788`:

- Sign in, then open `/#/app/events`.
  - Events should load from D1 through `/api/events`.
  - Empty state should appear cleanly when no events exist.
  - Register button should update the attendee count after registration.
  - Share Grace Link should copy a `/#/app/events?event=...` URL.
- Open the admin dashboard Events tab.
  - Create Event should persist through `/api/admin/events`.
  - Newly created events should appear on the Events page after reload.
- Confirm unauthenticated `/#/app/events` still redirects through the existing app auth/pricing gate.
  - This is current route behavior, not a D1 migration regression.

## Remaining Gaps

- `pages/AdminDashboard.tsx` still contains Firebase/Firestore usage for other admin surfaces:
  - inbox
  - payments
  - discounts
  - resources
  - Mux/live stream metadata
- Community rooms and live stream are still separate Firebase-backed slices.
- Giving, pricing, payments, and entitlements remain correctness-sensitive and should be migrated conservatively with audit logs.
- Firebase Auth is still the active sign-in layer. Replacing it should wait until the Cloudflare-native session/token design is explicit.

## Next Slice

Continue with the remaining Firebase-backed community/live surfaces:

1. Community rooms/posts/messages.
2. Live stream status/chat.
3. Giving/pricing/payment entitlement flows after the interaction and audit requirements are explicit.
