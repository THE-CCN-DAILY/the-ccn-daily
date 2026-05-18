# Phase 15 - Admin Users D1 Report

Date: 2026-05-18
Branch: `codex/project-phoenix-cloudflare-thoughtstream`

## What Was Finished

- Added `GET /api/admin/users` to the Cloudflare Pages API.
- Added `services/adminService.ts` for admin-facing user reads.
- Moved the Admin Dashboard `Users` tab away from the old Firestore `users` subscription.
- Updated the dashboard top stats to use D1 profile data:
  - total members
  - admin operators
  - active users in the last 30 days
- Changed the remaining legacy Firestore listeners in `AdminDashboard.tsx` so they only subscribe when their specific tab is opened:
  - inbox
  - payments/settings
  - discounts
  - resources

## Why This Matters

The dashboard's default landing view used to open Firestore immediately. The lost-chat action register identified the admin/founder command center as a major visible and architectural cleanup area. This phase moves the safest part first: user/profile visibility, which already had a D1 source from the auth profile migration.

## Verification

Passed:

```powershell
npm run lint
npm run cf:typecheck
npm run build
```

Targeted code scan:

```powershell
rg -n "collection\(db, 'users'|onSnapshot\(q|listAdminUsers|/api/admin/users" pages/AdminDashboard.tsx services/adminService.ts functions/api/[[path]].ts
```

Confirmed:

- No `collection(db, 'users')` remains in `AdminDashboard.tsx`.
- `AdminDashboard.tsx` now calls `listAdminUsers()`.
- `services/adminService.ts` calls `/api/admin/users`.
- `functions/api/[[path]].ts` exposes `/api/admin/users`.

Live local API proof on `http://127.0.0.1:8788`:

```text
GET /api/admin/users -> 200
source: d1
stats.total: 2
stats.admins: 1
stats.active30d: 2
```

## Preview Checklist

Open `http://127.0.0.1:8788` and sign in as admin.

- Go to Strategy mode.
- Open `Admin Dashboard`.
- The default `Users` tab should load members from D1.
- Top stats should show member/admin counts from D1.
- Switching into Inbox, Payments, Discounts, or Resources may still touch legacy Firestore; those are remaining slices.

## Remaining Gap

`AdminDashboard.tsx` still imports Firebase because these tabs/actions remain legacy:

- inbox
- events
- payment settings
- discounts
- resources
- Mux livestream metadata
- Firebase Storage resource upload

The next admin slice should migrate one of those domains at a time instead of rewriting the whole dashboard in one pass.
