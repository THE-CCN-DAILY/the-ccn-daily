# Project Phoenix Revamp

## Architecture
This project is built using React, Vite, Tailwind CSS v4, and Firebase (Firestore & Auth). The UI is styled with premium typography:
- Display Serif headings: `ds-display`, `font-display` (using Cormorant Garamond / EB Garamond)
- Sans-serif labels and UI chrome: `font-sans`, `font-ui` (using Inter Tight)
- Base styling and theme variables are defined in `index.css`.
- Theme context (`contexts/ThemeContext.tsx`) controls the active theme: `light`, `dark`, or `sepia` by appending class names to the document root.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Global Tokens & Theme | Audit/Verify `index.css` design system variables. Check v4 compatibility and add Stitch-inspired semantic tokens if needed. | None | PLANNED |
| 2 | Main Interfaces Visual Revamp | Apply the "No-Line" Rule and card-level tonal variations to: Dashboard, Books Library, Bible Reader, Courses, Challenges, Announcements. | M1 | PLANNED |
| 3 | User Dashboard Updates | Stack the Latest Newsletter slot below the Latest Podcast in the dashboard's Continue/Community flow. Expand the Explore grid to 7 features. | M2 | PLANNED |
| 4 | Shareable Cards Verification | Verify/integrate `ShareCardModal` in Bible Reader selection, EPUB Reader selection (1,500-char limit), and Guided Journey finish step. | None | PLANNED |
| 5 | Validation & Build | Run typechecks, linting, and Vite build to verify production-readiness. | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
- **Latest Newsletter RSS Feed**: RSS feed URL: `https://theccndaily.substack.com/feed`. RSS service function: `fetchRSSFeed(feedUrl)`. Excerpt formatting uses `excerptFeedText(content, maxChars)`.
- **ShareCardModalProps**:
  ```typescript
  interface ShareCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    text: string;
    author?: string;
    type: 'scripture' | 'devotional' | 'completion';
  }
  ```

## Code Layout
- `.agents/` — agent metadata, plans, progress, and handoffs (no source code).
- `components/` — shared components (e.g. `Card.tsx`, `ShareCardModal.tsx`).
- `pages/` — main application page views.
- `services/` — external services (e.g. RSS fetching, Firebase services).
- `utils/` — utilities (e.g. text/date helpers).
- `index.css` — global design system styles and Tailwind configuration.
