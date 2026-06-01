# Services & New-Features Roadmap

Founder requests + infrastructure evaluations. Each item: decision/recommendation, then how it works.
Benchmarked-then-superseded standard applies (per master plan).

---

## A. Video infra — Cloudflare Stream vs Mux (evaluated June 2026)
- **Stream:** $1/1k min stored + $5/1k min delivered, **free encoding**, simple; Cloudflare-native
  (integrates with Pages/Workers/R2/Access), signed playback URLs. **Caps at 1080p, no DRM**, lighter
  QoE analytics, no per-title encoding.
- **Mux:** richer — 4K, DRM, per-title encoding, fast live starts, deep analytics, strong SDKs; pay per
  encode + delivery.
- **Decision:** For CCN's teaching/devotional VOD + live (no 4K/DRM need), **migrate video to Cloudflare
  Stream** for stack consistency + cost. Keep Mux only if 4K/DRM/advanced-live becomes a requirement.
  *Migration is non-trivial (replace `/api/mux/upload` + player); plan as its own task, not a quick swap.*

## B. Email — Cloudflare Email Service vs Resend (evaluated June 2026)
- **Cloudflare Email Service:** Workers-native transactional, ~$0.35/1k after 3k/mo free on Workers Paid.
  **Public beta — APIs may change before GA.**
- **Resend:** GA since 2023, stable, 3k/mo free, React Email support (already integrated).
- **Decision:** **Keep Resend** (stability matters for transactional/support email). Re-evaluate
  Cloudflare Email Service after it reaches GA; it's the natural future substitute given the stack.

## C. On-demand Audio & Video library (NEW — beyond audiobooks/podcasts)
A general **Media On Demand** surface for teachings/sessions/messages that aren't audiobooks or podcasts.
- **Each item:** title, description, cover, **type (audio | video | both)**, audio file (R2) and/or video
  (Stream/Mux), tags, premium flag, publish date. Reuses `<MediaUpload>` + the catalog pattern (D1).
- **Player:** unified player that plays audio or video; if an item has **both**, the user **chooses
  audio or video** (toggle). Background audio playback, resume, speed.
- **Above standard (Phase G):** auto-transcript + chapters + "key takeaways"; AI on-brand cover.

## D. Podcast audio/video version selection (NEW)
- Podcasts stay **RSS-sourced**. If a referenced RSS feed carries **both audio and video** enclosures for
  an episode, surface a **"Listen / Watch" toggle** so the user picks the version. Parse both enclosure
  types in `rssService`; default to audio, offer video when present.

## E. Support: live chat + tickets + AI-drafted replies (NEW, security-first)
Goal: live chat, a support inbox with instant auto-acknowledgement, and an **AI-drafted reply the support
team reviews before sending** — without compromising security.
- **Build in-app (Firestore-backed), NOT a third-party widget.** Rationale: third-party live-chat widgets
  inject external scripts (CSP/XSS surface), and route user data off-platform. In-app keeps data under
  your Firestore rules + CSP. (If a full helpdesk is later wanted, self-host **Chatwoot** rather than a
  hosted widget.)
- **Foundations already exist:** `HelpPage` → Firestore `helpMessages`; `AdminDashboard` reads an `inbox`.
  Build on these.
- **Flow:**
  1. User submits a concern (or opens live chat) → stored in Firestore (owner-readable; admin-readable).
  2. **Instant auto-reply** ("We've received your message and will respond soon") — automated, safe.
  3. **AI draft (human-in-the-loop):** Workers AI/Gemini drafts a reply in the pastoral brand voice,
     shown to the support team in the admin inbox. The team **edits and approves** — nothing auto-sends.
  4. Approved reply is sent via **Resend** (email) and/or posted to the in-app chat thread.
- **Security:** auth required to open a ticket (or hardened anonymous + rate-limit + honeypot); strict
  Firestore rules (user sees only their threads; admins see all); no external scripts; AI never
  auto-sends; sanitize all rendered user text.
- **Live chat:** real-time via Firestore listeners (reuse the `liveChat` pattern already in the app),
  scoped per support thread, with presence/typing optional.

---

## Priority order (slots into the master plan)
1. Finish Phase E visual + authoring polish (in progress).
2. Support system (C-tier value for trust at launch) — design ready above.
3. Media On Demand + podcast a/v selection.
4. Cloudflare Stream migration (video) — own task.
5. Cloudflare Email — defer to GA.

**Sources (Stream/Mux + Cloudflare Email/Resend):** mux.com/compare/cloudflare-stream,
buildmvpfast.com/api-costs/video, developers.cloudflare.com/email-service, sequenzy.com (CF Email vs Resend).
