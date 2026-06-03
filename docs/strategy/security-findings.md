# Security Findings & Remediation (audit 2026-06-02)

From the security-reviewer expert pass. Status: ✅ fixed · 🔶 deferred (needs coordinated/payment work)
· 🔴 FOUNDER ACTION. Bar: correct anything that poses a risk (founder directive).

## CRITICAL
| ID | Issue | Status |
|----|-------|--------|
| C-1 | `/api/media/*` streams any R2 object with no auth/entitlement; catalog leaks premium `audioUrl`/`fileUrl`. Anyone with a URL downloads paid content. | 🔶 Needs server-side entitlement + signed URLs (ties to payment/entitlement loop, founder-gated). Interim client gate only. |
| C-2 | All `POST /api/users/:userId/*` (gamification, highlights, journal, notifications) + some community writes accept arbitrary `userId` with no token check — write as anyone. | ✅ FIXED (commit b671f3c, live) — `requireSelf(c,userId)` gates all per-user read+write routes + challenge/course progress; all client services now send the Bearer ID token. |
| C-3 | `/api/auth/profile` sets admin role from **request-body email** (unverified) — privilege escalation. | ✅ FIXED (commit 83ea4b8, live) — requires verified token; role from verified email only. No client depended on it. |
| C-4 | **Real Mux + Flutterwave production secrets in `.dev.vars`** (plaintext on disk). Not in git history (gitignored ✅) but live keys exposed. | 🔴 FOUNDER: rotate all 4 keys (Mux token id/secret; Flutterwave secret/encryption) + re-add via `wrangler pages secret put`. |
| C-5 | Hardcoded `LOCAL_AUTH_SECRET` JWT fallback — anyone could forge an admin session JWT if `AUTH_SECRET` ever unset. | ✅ Fixed (commit 2fdb89f) — fails closed now. |
| C-6 | `isLocalPreviewRequest` trusted spoofable `Host` + `CF_PAGES` (set in prod) → forge admin session via preview-session / OAuth-localhost on production. | ✅ Fixed (2fdb89f) — now requires `PREVIEW_AUTH=enabled` (local-only env). |

## HIGH
| ID | Issue | Status |
|----|-------|--------|
| H-1 | XSS: `dangerouslySetInnerHTML` with unsanitized RSS HTML (`NewsletterPage`) + Bible search snippet. | 🔶 Add DOMPurify on those render paths. (frontend wave — do after icon agent) |
| H-2 | No rate-limit/auth on `/api/ai/generate` + `/api/ai/usage` → AI cost-abuse; chat/prayer spam. | ✅ AUTH FIXED (commit b671f3c, live) — `/api/ai/generate` now requires a verified token. Still TODO: per-user quota + Turnstile (defense-in-depth) and `/api/ai/usage` write auth. |
| H-3 | `?includeDrafts=true` on public `/api/challenges` + `/api/courses` exposes drafts. | 🔶 Quick worker fix (ignore param on public routes); verify admin uses admin routes first. |
| H-4 | `purchaseService` would grant entitlements client-side with no verification. | 🔶 Founder-gated — entitlements must be written only via the Flutterwave webhook (HMAC-verified). |
| H-5 | No security headers anywhere. | ✅ Fixed (2fdb89f) `public/_headers` (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS). CSP deferred (needs origin testing). |
| H-6 | Testimonies force `status=published` on create — no pre-moderation gate. | ⚖️ Founder decision: current design is intentional low-friction + reactive admin delete. Switch to pending-approval? (see below) |

## MEDIUM / LOW (summary)
- M-1 client admin gate trusts mutable `role` (fixed once C-3 lands) · M-2 mock data in prod (TTS stock songs, fake streak 7/1250 — also a cohesion item) · M-3 `/api/ai/diagnostics` leaks infra (gate behind admin) · M-4 unauth notification write · M-5 `_system_health` world-readable · M-6 contact form no rate-limit · M-7 admin email in committed vars.
- L-1 latent scripture XSS pattern · L-2 SSRF filter misses RFC1918 · L-3 `.env.example` misleads on secret storage · L-4 admin blog DELETE no existence check.

## Immediate next (security wave 2, mostly autonomous)
1. H-3 (drafts) — worker quick fix. 2. H-1 (DOMPurify) — frontend. 3. M-3 (gate diagnostics). 4. H-2 (auth+Turnstile on AI generate). Then the coordinated C-2/C-3 (auth on per-user routes + client token) and the founder-gated C-1/H-4 with the payment loop.

## Founder actions
- 🔴 **Rotate Mux + Flutterwave keys now** (C-4) and set `PREVIEW_AUTH` is NOT set in prod (it isn't).
- Decide H-6: keep reactive moderation (current) or switch testimonies to admin-approval-before-publish.
