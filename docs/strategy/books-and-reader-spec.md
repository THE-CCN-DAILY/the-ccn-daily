# Books & In-App Reader — Feature Spec (founder-requested 2026-06-01)

Benchmarked-then-superseded standard applies (per master plan). This is the headline reading
experience: **in-app ebook purchase + reading is a prominent feature**, with external buy options
as a parallel convenience.

---

## 1. Two purchase paths, side by side

### A. External purchase links (all formats: print, ebook, audiobook)
- Every book can carry external links for **print**, **ebook**, and **audiobook** on popular
  platforms (Amazon/KDP, Apple Books, Google Play Books, Kobo, Barnes & Noble, etc. — already modeled
  as `PodPlatformId` + `BookPurchaseLink` with logos).
- **Each platform option shows its logo and activates only when a link is added** (no dead buttons).
  An option with no URL stays hidden/disabled until the founder pastes a link in the Content Manager.
- Content Manager: per-book editor to add/remove platform links per format, with the platform logo
  shown next to each. (Today: `purchaseLinks[]` + `purchaseUrl` exist; needs an authoring UI that
  groups by format and surfaces logos + an "activate when link added" toggle.)

### B. In-app purchase + in-app reading (the prominent feature)
- Users can **buy an ebook in the app and read it in the app** (EPUB), without leaving for a third
  party. This is the headline path; external links are the secondary "buy elsewhere" convenience.
- Requires the **Flutterwave purchase loop + entitlement writes** (currently stubbed —
  `purchaseService`, `useEffectiveAccess` fetchers). **Dependency: founder-gated payment build.**

---

## 2. Ebook ↔ Audiobook bundling & cross-format upsell
- A book may have **both** an ebook and an audiobook variant.
- If a user **buys both**, the audiobook is **attached to the ebook** they own (one entitlement record
  links both formats; the reader exposes a "Listen" toggle alongside "Read").
- If a user buys **only one** format of a book that has both, **encourage them to get the other**
  (in-reader upsell card: "Also available as an audiobook — add it for $X" / vice versa).
- Entitlement model: extend `UserEntitlement`/`UserPurchase` to record `formats: ('ebook'|'audiobook')[]`
  per book so ownership is per-format and bundles are expressible.

---

## 3. The in-app EPUB reader — premium, benchmarked, superseding

### Current state
- `components/reader/EpubReader.tsx` is a **16-line stub** (renders `ContentDisplay` with a fixed id).
- **No EPUB engine** in `package.json` (no `epubjs`/Readium). Real EPUB parsing/rendering must be added.
- Rich reader scaffolding already exists and should be reused: `ReaderEngine`, `ReaderHost`,
  `ReaderToolbar`, `ReaderSidebar`, `ReaderSettingsModal`, `HighlightActionPopover`, `ContentDisplay`,
  `VoiceSelectionPopover` (TTS).

### Benchmark targets (match, then exceed)
Kindle, Apple Books, Google Play Books, Kobo. Table-stakes the reader MUST have:
- EPUB rendering (reflowable) via a real engine (`epub.js` or Readium Web) reading files from R2.
- Paginated **and** scroll modes; remembers last position (progress sync per user/book).
- Typography controls (font family/size/line-height/margins/justification) — partly via
  `ReaderSettingsModal`; align to the reading tokens.
- Themes (light/sepia/dark) — already in the app theme system.
- Highlights + notes (reuse `HighlightActionPopover`), bookmarks, table of contents, in-book search.
- Dictionary/lookup, and **read-aloud (TTS)** for the ebook (we already have `ttsService` +
  `VoiceSelectionPopover`) — ties to the cross-format audiobook story.

### Where we supersede (the CCN edge — formation, not just reading)
- **Scripture-aware:** detect Bible references in the text and let the reader open them inline in the
  Bible reader (we already have `ScriptureStudyCompanion`).
- **Pastoral AI margin companion** (Phase G guardrails): ask a question about the passage; get an
  on-brand, theologically-disciplined reflection — never auto-doctrine, always text-anchored.
- **Formation continuity:** highlights/notes flow into Journaling; reading streak feeds the dashboard.
- **One-tap "Listen instead":** if the audiobook format is owned/bundled, switch Read↔Listen seamlessly
  at the same position.

---

## 4. Security & integrity
- Paid in-app ebooks MUST be protected **server-side**: the EPUB/audio file endpoint requires a valid
  entitlement (same hardening the audiobook paywall needs). Client-side gating alone is not enough.
- Interim (until the purchase loop ships): paid ebook in-app reading is gated by `usePremiumGate`
  (admin bypass) the same way audiobooks/courses now are — no free reads of paid books.

---

## 5. Build order (slots into master plan; payment parts founder-gated)
1. **Authoring:** Content Manager book editor — per-format external links with logos + activate-on-link;
   mark ebook/audiobook variants, prices, and free/premium. (Buildable now; no payment dependency.)
2. **EPUB engine:** add a real engine, render from R2, position/progress, TOC, search, highlights,
   themes/typography. Premium, benchmarked. (Buildable now for FREE ebooks; gate paid via interim.)
3. **Cross-format upsell UI** in the reader (needs entitlement format-awareness). 
4. **In-app purchase + per-format entitlements + bundling** — Flutterwave loop. **Founder-gated.**
5. **Server-side file protection** for paid ebooks/audiobooks. **Founder-gated (security review).**

**Dependency note:** items 4–5 are the same payment/entitlement + media-protection track flagged for
the audiobook paywall. Build them once; both books and audiobooks consume them.
