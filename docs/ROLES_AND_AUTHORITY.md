# Roles & Authority

_How permission works in THE CCN DAILY, and who can do what._

## Single source of truth

Authority lives in **one place: the D1 `users.role` column**. When you promote someone on
the in-app **Roles & Permissions** page (`/studio/roles`), the worker writes that column and
every authority check reads from it. There is no second place to keep in sync.

- The frontend hydrates `user.role` from D1 on sign-in (`AuthContext` → `POST /api/auth/profile`,
  which upserts the user row and returns the stored role).
- The worker authorizes admin actions in `isAdminRequest` (`functions/api/[[path]].ts`): a request
  is admin if it carries a **verified** Firebase ID token **and** either the email is on the
  bootstrap allowlist **or** the stored D1 role is `admin`.

> Legacy note: roles used to be written to Firestore (which gated nothing) and admin was decided
> purely by a hardcoded email list (which ignored promotions). Both are retired. Firestore is now
> only a fallback read if D1 is unreachable.

## The bootstrap super-admin (Founder)

`ADMIN_EMAILS = ['pastor.eryeza@gmail.com', 'ccndaily@gmail.com']` are the **un-removable root**.
They are always admin in the UI and on the server regardless of the D1 table, and the role API
**refuses to demote them**. This is the permanent fallback so the founder can never be locked out
— even if the role table is ever wrong.

## The ladder

| Role | What they can do | What they cannot do |
|---|---|---|
| **User** | Full sanctuary: devotionals, Bible, books, courses, community, giving. | Any admin / Strategy surface. |
| **Family Lead** | User + the **Family Dashboard** (invite & encourage a household). | Other admin tools. |
| **Group Lead** | User + the **Leader Dashboard** (assign & track a small group). | Other admin tools. |
| **Lead Developer** | Technical/content tooling — Content Manager, Release Ops, challenge/course module managers. | Billing, secrets, and admin-only consoles (roles, growth, diagnostics, scholarships…). |
| **Admin** | Ministry operator: content (blog/books/courses/challenges/announcements), scholarship review, comment moderation, giving reports, role management, diagnostics, growth. | Change billing or secrets (those are Cloudflare-dashboard / env concerns, not in-app). |
| **Founder (super-admin)** | Everything an admin can, **plus** is the un-removable owner who can always grant/revoke admin and is the fallback if the role table is wrong. | — |

## Surfaces & boundaries

- The **Strategy / Command Center** toggle in the sidebar only renders for `admin` and
  `lead_developer`. A stale `phoenix_mode=strategy` in localStorage cannot drop a member into the
  admin nav — the UI forces sanctuary mode for non-privileged users.
- All admin pages live under `/studio/*`, which is wrapped in a single `RequireRole` group guard
  (admin or lead_developer). Each page also keeps its own stricter guard. A non-privileged user who
  types a `/studio/...` URL is redirected to the sanctuary before any admin page mounts.

## Promoting someone

1. Sign in as an admin (or founder).
2. Go to **Strategy → Systems → Roles & Permissions**.
3. Change the dropdown next to the member. The change is saved to D1 immediately and takes effect
   the next time that member's session reads its role (their next sign-in or refresh).

API (admin-guarded): `POST /api/admin/users/:id/role` with `{ "role": "admin" | "lead_developer" |
"group_lead" | "family_lead" | "user" }`.
