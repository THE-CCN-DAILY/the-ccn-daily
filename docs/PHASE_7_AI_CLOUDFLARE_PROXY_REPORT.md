# Phase 7 — AI Service Cloudflare Proxy Report

Date: 2026-05-16
Branch: `codex/project-phoenix-cloudflare-thoughtstream`

## What Changed

- Removed direct `@google/genai` usage from `services/geminiService.ts`.
- Removed direct Firestore note fetching from personalized devotional generation.
- Personalized devotional context now reads recent D1 journal entries through `services/journalService.ts`.
- Removed Firestore usage from `services/budgetService.ts`.
- Added Cloudflare Pages API routes:
  - `POST /api/ai/generate`
  - `POST /api/ai/usage`
  - `GET /api/ai/usage`
- AI usage now writes to the existing D1 `ai_usage_events` table.
- Local preview gracefully returns responsible fallback AI output when a Workers AI binding is not available.

## Verification

Commands passed:

```powershell
npm run lint
npm run cf:typecheck
npm run build
```

Live API proof against local Cloudflare Pages dev at `http://127.0.0.1:8788`:

```http
POST /api/ai/generate -> 200
POST /api/ai/usage -> 200
GET /api/ai/usage?days=1 -> 200
```

Observed local fallback response:

```json
{
  "text": "[\"Reflection\",\"Prayer\",\"Growth\"]",
  "model": "@cf/meta/llama-3.1-8b-instruct",
  "provider": "cloudflare-workers-ai-fallback",
  "fallback": true
}
```

Observed D1 usage readback:

```json
{
  "featureBreakdown": {
    "probe": 0.0000615,
    "tags": 0.000011
  },
  "source": "d1"
}
```

## Honest Remaining Gaps

- Other screens and services still import `@google/genai` directly:
  - `components/admin/ChallengeCreator.tsx`
  - `pages/ExpertCouncilPage.tsx`
  - `pages/DiagnosticsPage.tsx`
  - `services/liveService.ts`
  - `services/sentinelService.ts`
- Several older app surfaces still import Firestore directly, so Firebase is not fully removed from the bundle yet.
- The Cloudflare Workers AI binding is optional in local preview. Production still needs the binding configured before AI features can produce real model output.
- `generateSanctuaryVideo` remains intentionally gated because video generation needs a provider and budget decision.

## Next Recommended Slice

Replace the remaining direct `@google/genai` page/service imports with the new `/api/ai/generate` contract, then migrate the admin/content/challenge Firestore surfaces to D1.
