# Founder Review Packet — running log

Everything done autonomously while you were away, what's deployed where, decisions I made,
and items that need your eyes or action. Newest sections appended as work proceeds.

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

**Verification note:** type-checks + builds pass and changes are deployed. Authed/visual screens
(AdminDashboard, Journey streak flow) not yet eyeballed unattended — worth a quick look on your return,
though logic is type-checked and low-risk.

## 🔴 Needs YOUR action
1. **Rotate Flutterwave keys** + set as Cloudflare secrets (`FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_ENCRYPTION_KEY`, `FLUTTERWAVE_WEBHOOK_HASH`); revoke the leaked **Mux** key (we're dropping Mux). Webhook URL + secret hash given earlier. Then tell me the **public key**. This unblocks the payment loop.
2. **Delete `ADMIN_API_TOKEN`** Cloudflare secret (now dead).

## ❓ Decisions awaiting your confirm (I picked a safe default; change anytime)
- **D1 streak reset:** existing accounts (incl. yours) still show the OLD fake streak (7/1250) because the seed fix only affects NEW users. Want me to reset existing gamification rows to 0? (Default: left as-is.)
- **Testimonies/comments moderation:** set to **admin-approval before publish** (your call), decline shows the author a reason. Same pattern will apply to public product comments.

## Decisions I made (FYI)
- AI stays **ambient** (no AI-branding/sparkle); sparkle icon deleted everywhere.
- Mux **dropped** (not re-provisioned) in favor of Cloudflare Stream.
- Post-launch deploy discipline: no direct-to-prod once public; staging + your sign-off first; major updates fire in-app notifications. (Pre-launch now: autonomous prod promotion per your instruction.)

## ▶️ In progress / next (sequential core + isolated agents)
- AppContext (`useAppData`) → User Library (+ notes, voice notes for paid) → public comments → user/admin Settings → update notifications → premium readers (EPUB engine, devotional scroll-back) → light/sepia contrast + typography pass → founder-gated builds (payment, Stream, Durable Objects chat/support, Vectorize).

(See `phase-2-program-plan.md` for the full living plan.)
