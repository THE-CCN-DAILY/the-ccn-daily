# Content Manager — Media & Upload Spec (per content type)

Goal: every media field is an **upload** with the **accepted formats shown** in the UI, plus an
**optional URL field** only for externally-hosted assets. No URL-only dead-ends. Uploads go through the
existing `uploadCatalogMedia` / R2 plumbing (and `/api/mux/upload` for video).

> **Scope note — "benchmark then supersede" is app-wide, not just here.** This document covers the
> Content Manager's media authoring. The benchmark→supersede standard applies to the WHOLE product:
> visual/UX of every member screen (Phase E), SEO/GEO + performance (Phase F), and the AI trend-setting
> layer (Phase G). Per-feature benchmarks + above-standard moves live in
> `feature-benchmark-upgrade-plan.md`. The Content Manager is one slice of a whole-app standard.

## Supported formats (standardize across the app)
- **Images** (covers, author photos): `JPG, PNG, WEBP` (≤ 5 MB). Show preview after upload.
- **Books / documents**: `EPUB, PDF` (≤ 50 MB).
- **Audio**: `MP3, M4A` (≤ 100 MB).
- **Video**: `MP4` via **Mux** (`/api/mux/upload`) — never store large video in R2 directly.

## Per content type

| Content type | Cover image | Primary file | Audio | Video | Author photo | Notes |
|---|---|---|---|---|---|---|
| **Devotional** (Daily Devotionals) | optional (upload) | — | optional (MP3 upload) | — | **upload** (currently URL — fix) | rich-text body (backlog) |
| **Blog** (Blog Studio) | optional (upload) | — | optional (MP3) | — | **upload** | rich-text body (backlog) |
| **Book** | **required (upload)** | **EPUB/PDF (upload)** + optional URL | — | — | — | consolidate the two book surfaces; variants keep format select |
| **Audiobook** | required (upload) | — | **required (MP3 upload)** | — | — | |
| **Course** | required (upload) | per-module docs (PDF) | per-module audio (MP3) | per-module **video (Mux)** | — | **rich per-module media — see below** |
| **Challenge** | optional (upload) | per-module docs (PDF) | per-module audio (MP3) | per-module video (Mux) | — | **rich per-module/day media — see below** |
| **Reading Plan** | optional (upload) | — | — | — | — | **structured schedule, NOT a file** — clarify UI; build day/items |
| **Podcast** | — | — | — | — | — | RSS source of truth → no manual upload (CRUD retired) |
| **Newsletter** | — | — | — | — | — | RSS/Substack → no manual upload (verify, then retire CRUD) |

## Course & Challenge modules — wide media range (each module/day)

A course module or challenge day is a **rich lesson**, not a single field. Each should support
**multiple attachments of mixed types**, added/reordered freely:
- **Video** — MP4 via Mux (adaptive streaming, thumbnails, captions).
- **Audio** — MP3/M4A (teaching, guided prayer) with player + waveform.
- **Document / slides / handout** — PDF (downloadable; inline viewer where possible).
- **Image** — JPG/PNG/WEBP (diagrams, scripture art).
- **Downloadable resource** — PDF/ZIP (workbooks, study guides).
- **Rich text** — the lesson body (headings, lists, scripture blocks).
- **Scripture reference** — structured (book/chapter/verse) that deep-links the Bible reader.
- **External embed / link** — optional (YouTube, external worksheet) with safety review.

Data model: a module has an ordered `attachments[]` (type + url + meta), not fixed single fields, so
courses/challenges can mix video + PDF + audio + image in one lesson. The `<MediaUpload>` component is
reused per attachment with the right `accept` for its type.

**Supersede (Phase G):** auto-captions/transcript for module video & audio; AI-generated lesson summary
+ reflection questions from the attachments; auto-thumbnail from video; on-brand tonal cover if none.

## Current-state gaps (to fix)
- **Devotional author photo** = URL input (`authorPhotoUrl`) → change to image **upload** + format hint.
- **Books Library / Reading Plans / Podcasts / Newsletters covers** = URL-only → add upload.
- **Books**: two surfaces (catalog `books` has upload; `books-library` is URL-only) → consolidate to one.
- **Courses**: module video/audio need upload (Mux for video).
- No content type currently **shows accepted formats / size limits** in the UI → add helper text +
  `accept="…"` on every file input + a preview for images.

## Benchmark → supersede (the bar the build must hit)

**Industry standard** (Sanity, Contentful, Ghost, Notion, Mux, Cloudinary):
- Drag-and-drop *and* click-to-pick; paste-from-clipboard.
- Instant preview — image thumbnail, audio player, doc icon + filename.
- Upload progress + cancel; client-side format/size validation with friendly errors.
- Server-side image optimization (resize, compress, auto-WebP/AVIF).
- Alt text on images (accessibility + SEO).
- Adaptive video via a dedicated service (Mux).

**Above standard — CCN trend-setting** (uses Gemini / Workers AI + the tonal design system; Phase G):
- **AI cover generation, on-brand:** one click generates a premium cover from the title/excerpt using
  the brand tonal palette (ties to Quote Graphics / `premium-tonal-design`) — no stock images, no random
  AI blobs. Default to brand-tonal art rather than empty covers.
- **AI alt text + image description** auto-written from the image (Workers AI vision) — accessibility and
  SEO done for the founder, not as a chore.
- **Audio → show notes + chapters + transcript** auto-generated on upload (ties to the audio/podcast
  story); a "key takeaways" card from the transcript.
- **Smart format coaching:** inline guidance ("we'll optimize and convert to WebP", "MP3 recommended,
  we'll generate a waveform") instead of bare format codes.
- **Instant on-brand crop/framing** for covers to the app's card aspect ratios.

These supersede the category: most faith/CMS tools make the author do the grunt work (find a cover,
write alt text, cut show notes). CCN's authoring should do that *for* the founder, in the brand voice.

## Implementation plan (one shared component, applied everywhere)
1. Build a reusable **`<MediaUpload>`** component: drag/drop or pick, `accept` per role, progress,
   preview (image) / filename (doc/audio), and an "or paste a URL" fallback. Returns the stored URL.
2. Replace every URL-only media field above with `<MediaUpload>` configured for its formats.
3. Clarify the **Reading Plan** form: it composes a schedule (ordered items); cover optional.
4. Verify each type's display surface renders the uploaded asset.
- **DoD:** every form states its accepted formats, supports upload (+ optional URL), shows a preview,
  and the asset displays on the user-facing surface.
