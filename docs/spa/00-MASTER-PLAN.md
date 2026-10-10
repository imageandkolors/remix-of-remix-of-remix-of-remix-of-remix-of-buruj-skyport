# SPA Conversion — Master Plan

Convert Buruj Skyport from a TanStack Start SSR app into a **static SPA** deployable on Namecheap shared hosting (`public_html`), keeping the design, routes, and flows identical. Backend stays in Supabase. No Node server anywhere in production.

## Why this doc exists

Each phase has its own detailed file in `docs/spa/`. After every phase is finished, this master plan is **updated** with the completion date and outcome. Work is done in order — Phase N+1 never starts before Phase N is green.

## Status board

| Phase | Doc | Status | Notes |
|---|---|---|---|
| 0 — Baseline & safety | `00-phase-0-baseline.md` | NOT STARTED | snapshot, env audit |
| 1 — Build config | `01-phase-1-build-config.md` | NOT STARTED | SPA preset, npm lockfile |
| 2 — RLS security pass | `02-phase-2-rls.md` | NOT STARTED | ~12 policies + public player view |
| 3 — Edge Functions | `03-phase-3-edge-functions.md` | NOT STARTED | 4 functions |
| 4 — Client data layer | `04-phase-4-client-layer.md` | NOT STARTED | ~19 functions |
| 5 — SEO & prerender | `05-phase-5-seo-prerender.md` | NOT STARTED | meta, OG, prerendered public routes |
| 6 — Deploy & verify | `06-phase-6-deploy.md` | NOT STARTED | .htaccess, end-to-end tests |

## Ground rules

1. `main` is never touched — all work lands on `spa-static-build`.
2. Security before features: Phase 2 (RLS) is reviewed **before** any client code ships in Phase 4.
3. Secrets (`LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) live only in Supabase Edge Function secrets — never in the client bundle.
4. Minors' privacy is a hard constraint: full DOB never reaches the browser on public routes (DB view returns `age` + `birth_year` only).
5. Every phase ends with: docs updated, status flipped to DONE, commit pushed.

## Function classification (audit result, 2026-10-10)

**Category 1 — client-side Supabase calls + RLS (~19):** public programmes/players/settings reads; squad CRUD + uploads (staff); staff dashboard + application review (admin-gated); CV requests (public insert, staff list/status); application submit (public insert); parent portal reads/updates (RLS subquery policy, fallback to Edge Function if unreadable).

**Category 2 — Supabase Edge Functions (4):**
- `requestApplicationUpload` / `completeApplicationUpload` (reference-keyed, no auth)
- `requestParentAccess` (throttled public write, needs admin client)
- `decideAccessRequest` (uses `auth.signInWithOtp` — admin-only API)
- `analyzeApplication` (Lovable AI gateway key — secret)

## Target architecture

```
Browser (static SPA on Namecheap)
  ├─ public pages ─────────── Supabase Postgres via anon key + RLS (read)
  ├─ application form ──────── anon insert (RLS) + Edge Functions (uploads)
  ├─ staff dashboard ───────── Supabase Auth (coach/admin/owner) + RLS-gated queries
  └─ parent portal ─────────── magic link (Edge Function) + RLS subquery policy
```

Deployment: build output → `public_html`, with `.htaccess` SPA fallback. Rebuilds triggered on content publish.
