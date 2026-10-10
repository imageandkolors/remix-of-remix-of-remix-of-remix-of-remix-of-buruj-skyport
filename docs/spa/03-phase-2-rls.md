# Phase 2 — RLS Security Pass (STEP 3 of 7)

**Goal:** the database itself becomes the security boundary — every rule the old server code enforced becomes a Postgres policy. Nothing in Phase 4 ships before this is green.
**Status:** NOT STARTED

## Steps

1. **Public player view (minors' DOB protection)** 🔴 — create `public_players_view` returning published players with only `age` + `birth_year` (replaces server-side `safeDob()`). Full SQL in `supabase/policies/spa-rls.sql`. Client code may NEVER select `date_of_birth` from `player_profiles` on public routes.
2. **Helper security** — audit `is_staff()` / `is_admin()` functions: `security definer`, `search_path = ''`.
3. **Table policies** (~12) — full list in `supabase/policies/spa-rls.sql`. Summary:
   - anon: select published `programmes`, public player views, `site_settings` row 1; insert `applications` and `player_cv_requests`.
   - staff (`is_staff()`): full CRUD on `player_*` tables; select `applications`, `application_documents`, `user_roles`, `profiles`, cv requests.
   - admin (`is_admin()`): update `applications` review fields; update `site_settings`.
   - parent portal: select/update own application contact fields via "admin-approved email" subquery policy. **Fallback:** if this policy proves unmaintainable, move `getMyPortal`/`updateMyContact` to Edge Functions (documented decision).
4. **Storage policies** — staff write/remove on `player-profile-media` (under `playerId/purpose/`) and `player-documents`; public reads via signed URLs only. `application-documents`: NO anon storage access — uploads flow through Edge Functions only.
5. **Reference-number generation** — verify it is a DB trigger on `applications` insert; if it was server code, move it to a trigger now.
6. **Test adversarially** — from an anon key scratch client: try reading `player_profiles.date_of_birth`, `applications`, `user_roles` (must all fail). Try coach-token hitting admin-only updates (must fail).

## Exit criteria

- RLS enabled + policies in place on every table in scope.
- Anon-key penetration checks all fail closed.
- Policy SQL committed to `supabase/policies/spa-rls.sql`.

## Result

_(updated when done)_
