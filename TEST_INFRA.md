# E2E Test Infra: Project Phoenix Revamp

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Premium Tonal Design | ORIGINAL_REQUEST §1 | 5      | 5      | ✓      |
| 2 | Dashboard Revamp | ORIGINAL_REQUEST §2 | 5      | 5      | ✓      |
| 3 | Shareable Canvas Cards | ORIGINAL_REQUEST §3 | 5      | 5      | ✓      |

## Test Architecture
- **Verification Environment**: Vite development server (`npm run dev`) and production preview (`npm run build && npm run preview`).
- **Commands**:
  - Code Quality check: `npm run lint` (runs `tsc --noEmit` and ESLint checks).
  - Production build: `npm run build`.

## Test Cases Tiers

### Tier 1: Feature Coverage (>=5 per feature)
- **F1.1: Tonal Classes Audit**: Verify that main components (Dashboard, Books, Bible Reader, Courses, Challenges, Announcements) use variables like `--bg-paper`, `--bg-card`, `--bg-sunk`, `--bg-deep`, `--fg-1`, `--fg-2`, `--fg-3`, `--crimson`, `--ember`, `--gold-ds`.
- **F1.2: No-Line Rule Audit**: Ensure that solid borders in Dashboard, Books, Bible Reader, Courses, Challenges are replaced by `border-brand-border/15` or color-mixes instead of harsh solid `border-brand-border`.
- **F1.3: Typography Pairing**: Verify headings use serif display fonts (e.g. `font-display` or `ds-display`) and UI labels use sans-serif (e.g. `font-ui` or `font-sans`).
- **F2.1: Podcast & Newsletter Placement**: Verify the newsletter card is stacked vertically *below* the podcast card in the layout flow.
- **F2.2: Newsletter Excerpt**: Verify the newsletter card renders the title, clean excerpt (purged of HTML/styled markers via `excerptFeedText`), and a "Read Now" CTA button.
- **F2.3: Explore Grid 7-Features**: Verify that the Explore grid displays exactly 7 features with appropriate routes and Lucide icons.
- **F3.1: Bible Reader Share Card Trigger**: Verify that selecting a verse in the Bible Reader displays the action bar and allows opening the Share Card modal.
- **F3.2: EPUB Reader Copyright Limit**: Verify that selecting a text longer than 1500 characters in the EPUB Reader shows a copyright warning toast and truncates the quote to 1500 characters in the ShareCardModal.
- **F3.3: Guided Journey Completion Share**: Verify that clicking the "Share Completion Card" button at the final step of the Guided Journey successfully launches the ShareCardModal with correct text details.

### Tier 2: Boundary & Corner Cases (>=5 per feature)
- **B1.1: Theme Mode Transitions**: Verify that transitioning between light, dark, and sepia modes updates all CSS variables correctly without visual glitches.
- **B1.2: Overflowing Text in Display Headers**: Ensure long header titles wrapping to multiple lines do not break layout spacing.
- **B2.1: Missing RSS Feed podcast/newsletter**: Ensure that if the RSS feed is empty or fails to load, appropriate fallback states (skeletons or friendly placeholder messages) are displayed on the dashboard instead of crashing.
- **B2.2: Extreme Length Newsletter Title**: Verify that very long newsletter titles are clamped elegantly and do not overflow cards.
- **B3.1: Empty Text Selection Share**: Verify that triggering share when no text is selected is prevented or gracefully ignored.
- **B3.2: Text Selection Exactly at 1500 Characters**: Verify that selection of exactly 1500 characters does not trigger the limit toast or slice the text.
- **B3.3: Special Characters in Scripture Share**: Verify that scripture references with special formatting characters or HTML tags are sanitized properly before rendering on the Canvas.

### Tier 3: Cross-Feature Combinations
- **C1.1: Share Card modal styled with Tonal Tokens**: Verify that the ShareCardModal matches the visual design system tokens (e.g., using dark backgrounds, gold double borders, EB Garamond serif font).
- **C1.2: Dashboard visual theme update**: Verify that changing theme modes updates the dashboard cards and explore grid tonal background-mixes correctly.

### Tier 4: Real-World Application Scenarios
- **S1.1: Complete Devotional Journey**: A user logs in, performs the daily journey, reaches the completion step, clicks "Share Completion Card", copies the card image, and returns to the dashboard.
- **S1.2: Study & Share Scripture**: A user navigates to the Bible Reader, searches for a passage, selects a verse, highlights it, opens the study companion, then launches the share card to download the quote image.
