# Phase 6 — Deploy to Namecheap & End-to-End Verification (STEP 7 of 7)

**Goal:** static bundle live on shared hosting, every flow verified on the real domain.
**Status:** NOT STARTED

## Steps

1. **Build artifacts** — `npm run build` → copy the output to `public_html` (via cPanel File Manager, or FTP, or a GitHub Action using FTP deploy).
2. **`.htaccess`** — SPA fallback so all routes resolve to `index.html`:
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^ index.html [L]
   ```
   Plus: gzip/brotli hints, cache headers (`assets/` immutable 1y; `index.html` no-cache), HTTPS redirect.
3. **DNS/domain** — confirm the domain points at the hosting; SSL active (Namecheap PositiveSSL).
4. **Supabase config updates**
   - Auth → URL configuration: add production domain to redirect allow-list.
   - CORS allow-list on Edge Functions → production domain only.
   - Email templates (magic link) → point at production `/portal`.
5. **End-to-end verification checklist**
   - [ ] Public: home, programmes list + detail, squad list + a player profile, news list + article, about, contact form, gallery
   - [ ] Apply: full form submit → reference number shown → document upload (each type) → success state; save-and-continue works after refresh
   - [ ] Parent portal: request access → admin approves → magic link arrives → portal shows application + outstanding docs
   - [ ] Staff: login (coach) → squad editor CRUD + uploads → dashboard reads; admin: reviewer assignment, status update, settings save; AI analyze returns assessment
   - [ ] CV request: public form → appears in staff list
   - [ ] Auth edge: coach blocked from admin actions; anon blocked from staff pages
   - [ ] SEO: prerendered pages return real HTML; sitemap reachable
   - [ ] Performance: Lighthouse mobile ≥ 85 on home
6. **Post-deploy monitoring** — keep Lovable-hosted preview alive (rollback path) until 2 weeks of clean production traffic.

## Exit criteria

- All checklist items green on the production domain.
- Rollback documented (restore `main` Lovable deployment or previous `public_html` backup).

## Result

_(updated when done)_
