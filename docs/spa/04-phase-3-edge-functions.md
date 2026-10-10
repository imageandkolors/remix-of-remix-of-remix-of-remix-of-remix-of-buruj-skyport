# Phase 3 — Supabase Edge Functions (STEP 4 of 7)

**Goal:** relocate the 4 functions that can never run in a browser into Supabase Edge Functions (Deno/TypeScript), keeping zod validation identical.
**Status:** NOT STARTED

## Functions to port

| # | Function | Why server-only | New name |
|---|---|---|---|
| 1 | `requestApplicationUpload` + `completeApplicationUpload` | reference-keyed validation, derived storage path, service-role client | `application-uploads` (two actions in one function) |
| 2 | `requestParentAccess` | throttled public write, needs admin client | `parent-access` (action: request) |
| 3 | `decideAccessRequest` | `auth.signInWithOtp` is admin-only API | `parent-access` (action: decide) |
| 4 | `analyzeApplication` | `LOVABLE_API_KEY` secret + AI gateway call | `analyze-application` |

## Steps

1. **Scaffold** `supabase/functions/application-uploads/`, `supabase/functions/parent-access/`, `supabase/functions/analyze-application/` — each an `index.ts` Deno entry with:
   - CORS headers (GET/OPTIONS from the production domain)
   - shared `errorJson(message, status)` helper
   - zod schemas copied verbatim from the existing `*.functions.ts` (single source: consider a shared `schemas.ts` module imported by all three).
2. **Port logic 1:1** — no behavior changes. The admin client becomes `supabase-admin` created from `SUPABASE_SERVICE_ROLE_KEY` env secret.
3. **Secrets** — `supabase secrets set LOVABLE_API_KEY=...`, `SUPABASE_SERVICE_ROLE_KEY` is provided automatically by the platform.
4. **Path ownership** — `application-uploads` keeps the `path.startsWith(applicationId)` guard; storage bucket `application-documents` has no anon policy (Phase 2) so uploads only happen through this function.
5. **Deploy + test each function**
   - `supabase functions deploy application-uploads`
   - curl each with valid and invalid payloads (wrong reference → generic error; oversized mime → rejected).
6. **Client adapter** — thin typed wrappers in `src/lib/edge/` mirroring the old server-fn signatures so Phase 4 call sites barely change.

## Exit criteria

- 3 Edge Functions deployed; secrets set; no secrets in client code.
- Each function's happy path + 2 failure paths verified by curl.
- Client adapters committed.

## Result

_(updated when done)_
