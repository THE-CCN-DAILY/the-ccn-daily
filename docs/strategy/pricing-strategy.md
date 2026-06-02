# Pricing & Plans Strategy (expert review 2026-06-03)

Decision-ready. Source: pricing-strategy expert agent. Ministry context: Uganda-founded, global +
partly low-income audience. Benchmarks: YouVersion+, Hallow, Glorify, Abide, Logos.

## Headline problem
Two pricing systems exist; the **live paywall is a single `isPremium` boolean** (`hooks/usePremiumGate.ts`,
admin-bypass). The designed tier engine (`types/pricing.ts` TIER_CONFIGS, `services/entitlementService.ts`,
`hooks/useEffectiveAccess.ts`, `quotaService.ts`) is **inert** — fetchers are stubbed (`fetchSubscription`
returns free, purchases/entitlements `[]`). Result:
- **P1** Paid tiers don't price-discriminate — Plus/Family/Group unlock the same once enforced.
- **P2** Family/Group **seats don't exist** — `FamilyDashboardPage`/`LeaderDashboardPage` are `useState`
  placeholders; invites vanish on refresh. Charging for them today delivers nothing extra.
- **P3** Premium media **world-readable** — `/api/media/*` + content GETs serve `audioUrl`/`fileUrl` with no
  auth/entitlement (= security C-1). Server-side protection IS the real paywall; it's absent.
- **P4** Purchase writes `users/{uid}.tier` but nothing reads it back → paid users stay locked (refund risk).
- **P6** Price mismatch across `types/pricing.ts` vs `utils/ppp.ts` vs `PricingPage.tsx`; PPP geo hardcoded
  to `'US'` (never triggers); **Uganda `UG` missing** from the country map.

## Recommended tiers (rename IDs to concepts: free / plus / family / church)
- **FREE — "Daily formation, free forever."** Daily devotional+reflection, full Bible reader, weekly
  newsletter+podcast, free audiobook shelf, journaling/prayer/streaks, 1 challenge + 1 course, basic AI
  (10/day). Top-of-funnel; mission floor.
- **PLUS (individual) — "Go deeper every day."** Everything free + full premium course & audiobook
  libraries (5 concurrent), personalized devotionals (31/mo), unlimited AI, premium narration, 3 challenges.
- **FAMILY — "One subscription, your whole household."** Plus for **up to 5 profiles**, each own
  progress/journal; masterclasses; voice companion / cinematic; shared family board.
- **CHURCH/GROUP — "Lead a group."** Plus for the leader + cohort console (≤30, tiered 30/100/300),
  assignments, analytics, invite link + discount. Decision: tools+member-discount (cheaper) vs seat license
  (congregation pays for N seats — higher value; recommend offering as a quote-based annual SKU).

## Pricing (single source of truth = types/pricing.ts)
| Tier | Monthly USD | Annual USD |
|---|---|---|
| Free | $0 | $0 |
| Plus | $7.99 | $59.99 |
| Family | $12.99 | $99.99 |
| Church (self-serve ≤30) | $29.99 | $249.99 |
| Church seat license (≥50) | quote | quote |
- Add a **7-day trial** on Plus & Family annual (biggest conversion lever).
- **PPP:** USD base × country multiplier (existing `utils/ppp.ts`: T1 1.0 / T2 0.7 / T3 0.5 / T4 0.3). Plus in
  Uganda ≈ $2.40. Fix geo via Cloudflare `request.cf.country` (server), add `UG`, apply to annual too, and
  bind PPP price to billing country server-side at checkout (never trust client amount).
- Keep Mission-Access/scholarship + student 6-months-free lanes. Keep Logos-style "Own It Forever"
  perpetual add-on (`owned_perpetual`) as a differentiator — ships after the entitlement loop.

## Build/enforce order (DO NOT enable live payments until 1–3 done)
1. **Read subscription back + converge on ONE gate** (`resolveAccess`); delete the boolean path; wire real
   `fetchSubscription/Entitlements/Purchases`.
2. **Server-side media protection** — gate `/api/media/*` + content GETs by session+entitlement; serve
   premium via short-lived signed R2 URLs; strip `audioUrl`/`fileUrl` from JSON for non-entitled users.
3. **Payment→entitlement loop** — Flutterwave webhook (verify hash) → write subscription/entitlement in D1
   (mirror to Firestore); server computes charged amount.
4. **Family seats** — `maxHouseholdSeats` in TierFeatures + `households`/`household_members` D1 tables; real
   invite backend; member tier resolves via household.
5. **Church/Group** — `groups`/`group_members` tables; persistent group + invite link/discount; wire
   Leader dashboard analytics to real data.
6. Cleanup: one price source; rename tier IDs; real geo + `UG`.
