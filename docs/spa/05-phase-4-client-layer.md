# Phase 4 — Client Data Layer (STEP 5 of 7)

**Goal:** replace all `createServerFn` calls with browser Supabase calls guarded by the Phase 2 RLS policies. ~19 functions across 8 files.
**Status:** NOT STARTED

## Page-by-page conversion order (public → private)

| Step | Page / flow | Files touched | Notes |
|---|---|---|---|
| 1 | Home (`/`) | `index.tsx` → `src/lib/client/public.ts` | programmes + settings reads |
| 2 | Programmes (`/programmes`, `/programmes/$slug`) | two route files | public reads via view |
| 3 | Squad public (`/players`, `/players/$slug`) | two route files | **must use `public_squad_view`/`public_players_view`** — never `player_profiles` raw |
| 4 | News (`/news`, `/news/$slug`) | two route files | content functions → client reads |
| 5 | About/Contact/Gallery | 3 route files | settings-driven |
| 6 | Apply flow (`/apply`) | `apply.tsx`, `DocumentUploader.tsx` | submit → RLS insert; uploads → Edge Function `application-uploads`; save-and-continue → localStorage |
| 7 | Parent portal (`/portal`) | `portal.tsx` | magic link (Edge Function `parent-access`) + portal RLS reads |
| 8 | Staff auth (`/auth`) | `auth.tsx` | Supabase client auth only |
| 9 | Staff dashboard (`/dashboard`) | `dashboard.tsx`, `StaffPanels.tsx` | reads via staff RLS; AI analyze → Edge Function; review updates → admin RLS |
| 10 | Squad editor (`/squad`) | `squad.tsx`, `PlayerFilePicker.tsx` | staff CRUD + storage via RLS |
| 11 | Manage programmes + Content + Settings | 3 route files | staff/admin RLS |

## Steps per page

1. Create `src/lib/client/<domain>.ts` mirroring each old server function's signature and return shape (call sites keep working).
2. Replace `createServerFn` import with the browser Supabase client from `src/integrations/supabase/client.ts`.
3. Keep zod validation where it was (client-side now — unchanged code).
4. Verify error messages match the old ones (they're user-facing strings).
5. Delete the old `*.functions.ts` only when its last call site is migrated.
6. Per-step commit message: `refactor(page): <page> to client calls`.

## Exit criteria

- No `createServerFn` imports remain in `src/` (grep clean).
- Every public page renders from live data client-side.
- Staff + parent flows pass manual test on the preview build.

## Result

_(updated when done)_
