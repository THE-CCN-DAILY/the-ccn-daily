# Original User Request

## Initial Request — 2026-06-27T08:13:03Z

Revamp the visual design of all application screens and cards to apply premium tonal variations and distinct shades (inspired by the Stitch "Celestial Editorial" design system); update the user dashboard to show the latest newsletter below the latest podcast episode, and expand the "Explore" menu to cover key in-app features; and verify that social share card canvas features are implemented across all major reading interfaces.

Working directory: d:\THE CCN DAILY\Project-Phoenix-github-source
Integrity mode: development

## Requirements

### R1. App-Wide Premium Tonal Design (Stitch Inspiration)
- **Tonal Color Palette:** Apply semantic visual tokens from the Stitch "Celestial Editorial" design system to every main interface of the app (Dashboard, Books Library, Bible Reader, Courses, Challenges, Announcements, etc.). 
- **The "No-Line" Rule:** Replace harsh 1px solid dividers or border lines with background color shifts (e.g., nesting `surface-container` cards inside `surface-container-low` sections) or 15% opacity ghost borders (`outline-variant`) to convey structure.
- **Card-Level Variations:** Carefully design cards on each screen with related shades and soft gradients to establish clear visual depth and breathing room, avoiding generic black-on-white or flat SaaS styles.
- **Typography & Atmosphere:** Elevate all screens with the brand serif-display font for headlines and sans-serif for UI labels, incorporating subtle micro-animations/transitions for state changes.

### R2. User Dashboard Updates
- **Continue Section - Newsletters:** In the "Continue" area of the User Dashboard (DashboardPage.tsx), add a slot for the latest newsletter article directly below the latest podcast episode card. Include a prominent "Read Now" CTA button.
- **Explore Section - Features Menu:** Expand the "Explore" section to display a curated grid of the app's key features, allowing users to jump directly to:
  - Guided Daily Journey (/guided-journey)
  - Scripture Study Companion (/bible)
  - Prayer Circle Feed (/prayer-circle)
  - Books & Audiobooks Library (/books)
  - Private Journal Log (/journaling)
  - Course Modules (/courses)
  - Community Rooms (/community-rooms)

### R3. Shareable Card Verification
- Verify that the HTML5 Canvas sharing feature (ShareCardModal.tsx) is fully integrated and accessible in:
  - **Bible Reader** floating text-selection bar.
  - **EPUB Book Reader** text-selection popovers (enforcing the 1,500-character copyright sharing limit).
  - **Guided Journey** final completion step.

## Verification Mechanisms

- **Static Verification:** Execute `npm run lint` (`tsc --noEmit`) to verify that the entire codebase compiles cleanly with no typecheck or import errors.
- **Production Build:** Execute `npm run build` to verify that Vite compiles the production bundle and sitemap prerendering succeeds.

## Acceptance Criteria

### Visual Styling & Colors
- [ ] Every major page (Dashboard, Library, Bible, Courses, Challenges, Settings) uses semantic color shades (Stitch) instead of basic white/black backgrounds or harsh borders.
- [ ] Cards have related color tones, soft inner glows, and hover micro-animations.
- [ ] Typography conforms to display serif for headings and clean sans-serif for labels.

### User Dashboard Updates
- [ ] The latest newsletter card is rendered below the podcast card in the dashboard's "Continue" section, displaying the newsletter title, excerpt, and a functional "Read Now" button linking to `/newsletters`.
- [ ] The "Explore" grid provides links to all 7 key features with matching icons.

### Sharing Integration
- [ ] Selecting text in the Bible reader or EPUB reader triggers a sharing menu options bar.
- [ ] The sharing canvas successfully generates cards with the brand gradient background, double border, and website watermark.
- [ ] Sharing text is restricted to a maximum of 1,500 characters when selecting text inside EPUB books.

## Follow-up — 2026-07-17T09:36:15Z

Generate a comprehensive, production-grade technical handover package and migration blueprint for the CCN Daily (Project Phoenix) React/Vite app to enable a smooth transition to the incoming developer.

Working directory: d:\THE CCN DAILY\Project-Phoenix-github-source
Integrity mode: development

## Requirements

### R1. Codebase Architecture & Aspect Audit
Analyze and document the full application structure, including page routing, components, hooks, contexts, services, utilities, styling patterns (Tailwind v4), and video assets (Remotion).

### R2. Multi-Platform Integration Blueprint
Map all cloud platforms used (Cloudflare Pages, D1 Database, R2 Bucket, Firebase Auth, Firestore, Firebase Storage) and detail their configuration, credentials, and access rules. Explicitly note that the app should remain on the current platforms for launch.

### R3. Handover Setup & Development Guide
Write step-by-step instructions for the incoming developer to run the app locally, configure environment variables, deploy to staging/production via Wrangler/Firebase, and perform verification.

### R4. Pending Features Implementation Roadmap
Detail the specification, logic flows, and implementation steps for remaining tasks:
- Backend integration for invites (SendGrid/Firebase Extensions)
- Payment Gateway Integration (Stripe or Flutterwave)
- Storage cleanup (Firestore to Firebase Storage auto-deletion)

## Acceptance Criteria

### Documentation Delivery
- [ ] Deliver a complete, detailed `HANDOVER_GUIDE.md` in the project root covering all requirements.
- [ ] Ensure `HANDOVER_GUIDE.md` contains the exact local environment setup steps (`npm install`, `wrangler`, D1 migrations).
- [ ] Ensure all required environment variables (`VITE_FIREBASE_*`, `FLUTTERWAVE_PUBLIC_KEY`, etc.) are cataloged with instructions on where to find/generate them.
- [ ] Provide schema DDL files and security rules configuration guides for D1 and Firestore.
- [ ] Provide a verification test plan for local, staging, and production deployments.

