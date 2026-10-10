# Phase 1 — Build Config: SPA Mode (STEP 2 of 7)

**Goal:** the project builds to a static bundle with zero server runtime.
**Status:** NOT STARTED

## Steps

1. **Switch package manager output for build parity**
   - Delete `bun.lock`, run `npm install` to generate `package-lock.json` (CI + shared hosting paths use npm).
   - Keep `bunfig.toml` only if still building locally with Bun; document both.
2. **Eject from the Lovable vite wrapper**
   - `vite.config.ts` currently comes from `@lovable.dev/vite-tanstack-config` (hardwires Nitro/Cloudflare).
   - Replace with vanilla `@tanstack/react-start` Vite plugin config:
     - plugins: `tanstackStart({ spa: { enabled: true } })` (or nitro preset `static`/`spa`), `viteReact`, `tailwindcss`, `tsConfigPaths`
     - keep: `@` alias, VITE_* env injection, React dedupe
   - Verify `src/styles.css`, fonts, and `public/` assets all bundle identically.
3. **Handle server-only entry points**
   - `src/server.ts` (SSR error wrapper) and `src/start.ts` (CSRF + auth middleware) become dead files — move to `docs/spa/removed/` for reference, delete from build.
   - `vite.config.ts` no longer references `server.entry`.
4. **First static build smoke test**
   - `npm run build` → output dir with `index.html` + assets.
   - `npm run preview` → home, /about, /programmes render client-side.
   - Confirm zero `process.env.SUPABASE_URL` server lookups in client bundle (search dist for service-role patterns).

## Exit criteria

- Static build produced from vanilla TanStack Start config.
- Local preview renders home + one dynamic route (e.g. /programmes).
- No server-entry references remain in build config.

## Result

_(updated when done)_
