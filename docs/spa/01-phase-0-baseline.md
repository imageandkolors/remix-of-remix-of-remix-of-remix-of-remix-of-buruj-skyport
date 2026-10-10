# Phase 0 — Baseline & Safety (STEP 1 of 7)

**Goal:** freeze the current state so every later change is measurable and reversible.
**Status:** NOT STARTED

## Steps

1. **Record the baseline**
   - `main` HEAD: `124341e` (as of branch creation, 2026-10-10)
   - Confirm `bun.lock`, `src/server.ts`, `src/start.ts`, all 8 `*.functions.ts` present on `spa-static-build`.
2. **Secrets audit** 🔴
   - `.env` (413B) is committed to the repo. Read it, then:
   - Rotate any real keys found (Supabase service-role, Lovable API key).
   - Replace with `.env.example` + move real values to Lovable/Supabase dashboards.
   - Add `.env` to `.gitignore`.
3. **Confirm DB safety net**
   - In Supabase dashboard, confirm RLS is enabled on: `applications`, `application_documents`, `parent_access_requests`, `player_profiles`, `player_*`, `programmes`, `site_settings`, `player_cv_requests`, `user_roles`, `profiles`.
   - Export current schema + policies (SQL editor → dump) as `supabase/backup/pre-spa-schema.sql`.
4. **Tag the starting point**
   - `git tag pre-spa-conversion` on `main`.

## Exit criteria

- No real secret left in repo history going forward (rotate to invalidate old copies).
- Schema + policy dump stored.
- Baseline commit recorded in this file.

## Result

_(updated when done)_
