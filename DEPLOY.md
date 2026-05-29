# Deploy & Preview Workflow — THE CCN DAILY

Canonical pipeline: **edit → preview locally → test on staging → promote to production.**
Nothing reaches live users (`theccndaily.com`) until it has been verified on staging.

GitHub remains the source of truth for code (storage + history). Deployment is a
separate, deliberate `wrangler` step — a push stores code, it does not auto-ship it.

---

## 1. Instant local preview (hot reload) — fast UI/visual/auth iteration

```bash
npm run dev          # Vite + hot reload at http://localhost:3000
```

Changes appear the instant you save. NOTE: `/api` here is a minimal stub
(`server.ts`) — the real Cloudflare backend is NOT running, so API-backed
content won't fully load. Use this for layout, copy, styling, and auth UI.

## 2. Full-stack local test — production-accurate

```bash
npm run cf:dev       # builds, then runs real Functions + local D1 at http://localhost:8788
```

Runs the actual `functions/api/[[path]].ts` backend against a local D1 database.
No hot reload — re-run to refresh. Use this to test end-to-end before deploying.

## 3. Build + verify the bundle

```bash
npm run build        # vite build -> dist/
npm run lint         # tsc --noEmit (type check; separate from build)
```

## 4. Deploy to STAGING (isolated, safe)

```bash
wrangler pages deploy dist --project-name project-phoenix-ccn-daily --branch staging --commit-dirty=true
```

- URL: https://staging.project-phoenix-ccn-daily.pages.dev
- Completely isolated from `theccndaily.com`. Live users are unaffected.
- Verify the deployed build is the one you intend:

```bash
# Confirm staging serves your local build's bundle hash
grep -o 'index-[A-Za-z0-9_-]*\.js' dist/index.html | head -1
curl -s https://staging.project-phoenix-ccn-daily.pages.dev/ | grep -o 'index-[A-Za-z0-9_-]*\.js' | head -1
```

## 5. Promote to PRODUCTION (only after staging passes)

```bash
wrangler pages deploy dist --project-name project-phoenix-ccn-daily --branch main --commit-dirty=true
```

- This is the production branch → serves `theccndaily.com`.
- Deploy the SAME verified `dist/` you tested on staging — do not rebuild between.

## 6. Store code in GitHub (always)

```bash
git add -A && git commit -m "..." && git push origin main
```

Version history lives in GitHub regardless of how you deploy.

---

## Notes

- **Env vars:** `VITE_*` variables are inlined at BUILD time from `.env.local`, so a
  local build already contains Firebase/Bible/Flutterwave config. Cloudflare dashboard
  vars are for the Functions runtime (server-side), set per environment (Production /
  Preview) via `wrangler pages secret`.
- **Node version:** pinned to 22 via `.nvmrc` so the Git-connected build (backup path)
  matches local. Primary deploy path is `wrangler` (no Cloudflare build step → no
  build-environment surprises).
- **Rollback:** every deploy is retained. Roll back from the Cloudflare dashboard
  (Workers & Pages → project → Deployments → "Rollback to this deployment").
