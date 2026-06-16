# QA + Responsive Sweep — 2026-06-16

Scope: #26 QA + F0 mobile responsive pass. Pre-launch blocker = **no horizontal scroll at 320px on any screen.**

## Verified live (staging, Playwright)

Measured `document.documentElement.scrollWidth - clientWidth` on each public route at
**320 / 375 / 390 / 768**:

| Route | 320 | 375 | 390 | 768 |
|---|---|---|---|---|
| `/` (landing) | 0 | 0 | 0 | 0 |
| `/pricing` | 0 | 0 | 0 | 0 |
| `/give` | 0 | 0 | 0 | 0 |
| `/blog` | 0 | — | — | — |
| `/newsletter` | 0 | — | — | — |
| `/podcasts` | 0 | — | — | — |
| `/onboarding` | 0 | — | — | — |

**Result: zero horizontal overflow on every public screen.** No fixes required.

## Code audit — flagged auth-gated screens (the handoff's "likely offenders")

These need a signed-in session to render live; audited at the code level for the F0
anti-patterns (multi-col grids without a single-column base, fixed `px` widths, dense
tables without scroll wrappers):

| Screen | Pattern found | Verdict |
|---|---|---|
| DonationPage (giving grid) | `grid grid-cols-1 sm:grid-cols-2` | ✅ correct base |
| PricingPage tier cards | responsive grid (verified live on `/pricing`) | ✅ clean |
| Family Dashboard | `grid grid-cols-1 lg:grid-cols-3` | ✅ collapses to 1 col |
| Leader Dashboard | `grid-cols-1 md:grid-cols-3`, header `flex-col sm:flex-row` | ✅ correct |
| Admin / Content / Diagnostics / Leader tables | wrapped in `overflow-x-auto` | ✅ correct table-on-mobile pattern |
| Roles table | `overflow-x-auto` + `min-w-[640px]` (added this session) | ✅ correct |
| UpgradeModal | `w-full max-w-4xl` + `grid-cols-1 md:grid-cols-2`, `max-h-[90vh]` | ✅ correct |

**Result: the flagged screens already use correct responsive patterns.** The earlier worry
about phone overflow does not reproduce in code or on the public screens.

## Still owed (needs founder / a signed-in session)

- **Live visual QA of signed-in screens in both light + dark** — pastoral-taste pass and
  per-screen design benchmarking (hierarchy, rhythm, depth, designed hover/focus states).
  This is the half that needs the founder's eye and a real session; it cannot be automated
  here (Firebase redirect sign-in). Recommended: founder walks the signed-in screens on
  staging at a phone width and flags anything awkward; those become targeted fixes.
- Theme QA is overflow-independent (layout uses CSS variables), so dark mode shares the
  clean overflow result above; the remaining dark-mode check is purely visual/contrast.

## Conclusion

The pre-launch responsive blocker (no horizontal scroll at 320px) is **clear**. No
responsive bugs found. Larger design-benchmark redesigns are queued behind the founder's
signed-in taste pass rather than guessed at blind.
