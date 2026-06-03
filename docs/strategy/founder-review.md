# Founder Review Packet — running log

Everything done autonomously while you were away, what's deployed where, decisions I made,
and items that need your eyes or action. Newest sections appended as work proceeds.

## 🔴 ACTION REQUIRED — dashboard steps (Google sign-in won't work until these are done)
Live-site corrections shipped to prod 2026-06-03 (commit 6e1631f). The branded Google
redirect proxy is deployed and verified (the proxied `/__/auth/handler` returns 200), but
Google will reject the sign-in until you complete these one-time console steps:
1. **Firebase Console** → Authentication → Settings → **Authorized domains** → add `theccndaily.com`.
2. **Google Cloud Console** (project ccn-daily) → APIs & Services → Credentials → your OAuth 2.0
   Web client → **Authorized redirect URIs** → add `https://theccndaily.com/__/auth/handler`
   (and `https://theccndaily.com` under Authorized JavaScript origins).
3. **Google Cloud Console** → OAuth consent screen → set the **app name** to "THE CCN DAILY",
   add the logo + homepage `https://theccndaily.com`, so the consent screen is branded.
4. **Flutterwave** → confirm the account is **activated for LIVE** transactions and that
   `FLWPUBK-…-X` is the correct live public key. (A `PBFPubKey` error also means the
   account/key isn't live-activated.) The publishable key now lives in `wrangler.toml [vars]`;
   the SECRET key + webhook hash remain wrangler secrets.
5. If Cloudflare **Git auto-build** is enabled (separate from my `wrangler pages deploy`),
   set `VITE_FIREBASE_AUTH_DOMAIN` and `VITE_FLUTTERWAVE_PUBLIC_KEY` in the Pages dashboard
   env too, so CI builds match.

After 1–3, test Google sign-in on theccndaily.com (mobile + desktop). After 4, retry a real
small subscription → confirm content unlocks → refund.

## ✅ Live-site corrections (2026-06-03, commit 6e1631f) — deployed prod
- **Payments PBFPubKey:** server intent is the single source of the Flutterwave public key
  (committed publishable key in wrangler.toml); removed the sandbox demo-key fallback so a
  bad/unset key fails loudly instead of shipping a key Flutterwave rejects.
- **Google sign-in:** `functions/_middleware.ts` proxies `/__/auth/*` + `/__/firebase/*` to
  Firebase; authDomain = app host; switched popup→`signInWithRedirect` (mobile-safe + branded).
  Proxy verified live (handler/iframe 200). **Blocked on the dashboard steps above.**
- **Mobile "starts at bottom":** `ScrollToTop` resets window + the `<main>` scroller per route;
  `scrollRestoration='manual'`; removed modal autoFocus jump.
- **Text/icons too small:** global root font-size bump (106.25% desktop / 115% mobile).
- **PPP everywhere + local currency:** ~80-country PPP map; prices display in the visitor's
  local currency at standard rates with a "billed in USD" note (billing stays USD).

### Known follow-ups (flagged, not yet fixed)
- Promo discounts shown client-side are NOT applied to the server charge (server charges
  base×PPP only). And yearly prices aren't PPP-adjusted client-side. Pricing-accuracy items
  to reconcile so the displayed price always equals the charged USD.
- Local exchange rates are a static standard table (label says "standard rates") — refresh
  periodically or wire a rates API later.

## ✅ Done & deployed (this program)
| Item | Commit | Where |
|---|---|---|
| Phase E visual polish, empty states | — | prod |
| Interim premium paywall (audiobooks/courses; admin bypass) | — | prod |
| Phase A auth cleanup (verified-token-only admin) | — | prod |
| Phase C1 (single devotional tab) | — | prod |
| Phase D Reviews → **admin-approval** moderation | 17dd2c4 | prod |
| Deploy guard (CI manual-only) | 30213f3 | repo |
| Invisible status-text fix (theme-aware tokens) | 0f6493b | prod |
| Security wave 1 (C-5 JWT fallback, C-6 preview bypass, H-5 headers) | 2fdb89f | prod |
| AI star icon removed app-wide | 6300db8 | prod |
| Cohesion 2a: unified streak + Journey→streak/journal + removed fake gamification data | cf5abf4 | prod |
| AdminDashboard design pass (serif, tonal cards, themed pills) | 9622d22 | prod |
| Security wave 2: DOMPurify XSS sanitize + public-route draft leak + diagnostics leak + blog DELETE 404 | 629f964 | prod |
| User Library hub (/app/library): aggregates notes/journal; highlights section (read-all endpoint pending) | 05f4300 | prod |
| User + Admin Settings (/app/settings): theme (mobile too), notification prefs, account, admin links | 096a92a | prod |

**Verification note:** type-checks + builds pass and changes are deployed. Authed/visual screens
(AdminDashboard, Journey streak flow) not yet eyeballed unattended — worth a quick look on your return,
though logic is type-checked and low-risk.

## ✅ Resolved (founder actions done 2026-06-02)
- **Flutterwave secrets set** — verified present in Cloudflare prod: `FLUTTERWAVE_SECRET_KEY`,
  `FLUTTERWAVE_ENCRYPTION_KEY`, `FLUTTERWAVE_WEBHOOK_HASH`. Public key
  `FLWPUBK-2d4211f1a8007f2f64cbdf9e26194a23-X` set in local `.env.local` (baked into builds).
  Payment loop is now UNBLOCKED to build.
- **`ADMIN_API_TOKEN` deleted** from Cloudflare prod. ✅
- **Gamification reset:** your two rows (the only ones, pre-launch) reset to 0/0/0. New users already start at 0. ✅
- **Cloudflare dashboard error popups** (GET/PATCH .../pages/projects/...): transient — a race between
  your settings-save (PATCH) and my concurrent `wrangler` deploys (also PATCH the project), or normal
  CF dashboard flakiness. Confirmed harmless: your secret saves all landed. Not an app/code issue.

## 🔴 Still needs YOUR action
- **Mux** — ✅ you deleted the environment. (Code migration to Stream in progress.)
- **Cloudflare dashboard actions** (from the enable-now audit):
  - 🔴 **CRITICAL — Workers AI:** the `AI` binding is missing, so AI generation is running on STUB text.
    I'll add `[ai] binding = "AI"` to wrangler.toml (during Stream consolidation); also add the binding in
    the dashboard (Pages → Settings → Functions → Bindings → Workers AI → var `AI`, Prod+Preview). Free.
  - 🔴 **Enable Cloudflare Stream** (paid add-on) + create an Account-scoped **Stream:Edit** API token;
    set `CF_ACCOUNT_ID` + `CF_STREAM_TOKEN` as Pages secrets. Without this, the Stream video won't function.
  - 🟠 **Turnstile** (free) — widget + `TURNSTILE_SECRET`; protects the unauthenticated `/api/ai/generate`
    (real $ per call) + anonymous forms from bot abuse.
  - 🟢 Free zone toggles: **Web Analytics** (auto-inject), **Tiered Cache**, **Bot Fight Mode**,
    **Always-HTTPS + HSTS**.
  - 🟢 Later: **Cloudflare Images** (transform R2 originals → right-sized card images), **Email Routing**
    (`support@` → ticket). Full step-by-step is in the agent report; I'll fold key ones into the build.

## ❓ Decisions (FYI — locked unless you say otherwise)
- **Testimonies/comments moderation:** admin-approval before publish; decline shows the author a reason.

## Decisions I made (FYI)
- AI stays **ambient** (no AI-branding/sparkle); sparkle icon deleted everywhere.
- Mux **dropped** (not re-provisioned) in favor of Cloudflare Stream.
- Post-launch deploy discipline: no direct-to-prod once public; staging + your sign-off first; major updates fire in-app notifications. (Pre-launch now: autonomous prod promotion per your instruction.)

## ▶️ RESUME HERE — payment loop LIVE; founder real-transaction test pending
Backend payment loop DONE + committed (9dcc603). **Client gate read-back DONE + committed (3c356b0) + DEPLOYED
to prod (2026-06-03).** Both type-checks pass; build green.
- `hooks/useEffectiveAccess.ts` → real `getUserSubscription()` D1 readback (stub fetchers removed).
- `hooks/usePremiumGate.ts` → non-admins unlock from an ACTIVE paid subscription (pro/max/partner), fail-closed
  until readback resolves; admin bypass kept.
- `pages/PricingPage.tsx` → checkout creates `/api/payments/intent` and launches Flutterwave with the server
  amount/currency/tx_ref; client Firestore tier grant removed in favour of a post-webhook D1 readback poll +
  refresh; real geo via Cloudflare `/cdn-cgi/trace` (was hardcoded US).
- `services/entitlementService.ts` → `resolveAccess` now includes `partner` in subscription-included access.
- D1 schema applied to **remote** (62 queries, 28 tables, idempotent). Staging + prod deployed. Prod routes
  verified live: `GET /api/users/:id/subscription` → 401 without token (auth enforced), `POST /api/payments/intent`
  → 400 on empty body (validation runs). theccndaily.com propagated.

**NEXT — founder action:** subscribe to the lowest tier with a real card → confirm a `user_entitlements` row is
written + premium content unlocks → refund from the Flutterwave dashboard. (Webhook may take a few seconds; the
PricingPage poll waits ~10s then refreshes.) If content does NOT unlock, check: Flutterwave webhook URL/hash set
in prod env, `FLUTTERWAVE_SECRET_KEY` present, and the webhook event reaching `/api/payments/flutterwave/webhook`.

**THEN — C-1 media protection** (last critical): gate `/api/media/*` + content GETs by entitlement (signed R2
URLs) — the real paywall. Until this lands, premium *gating* is enforced in the UI but media bytes are not yet
entitlement-protected at the edge.

## ▶️ In progress / next (sequential core + isolated agents)
- AppContext (`useAppData`) → User Library (+ notes, voice notes for paid) → public comments → user/admin Settings → update notifications → premium readers (EPUB engine, devotional scroll-back) → light/sepia contrast + typography pass → founder-gated builds (payment, Stream, Durable Objects chat/support, Vectorize).

(See `phase-2-program-plan.md` for the full living plan.)
