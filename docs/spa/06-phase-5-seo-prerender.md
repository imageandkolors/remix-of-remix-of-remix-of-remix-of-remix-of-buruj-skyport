# Phase 5 — SEO & Prerender (STEP 6 of 7)

**Goal:** keep search visibility despite being a SPA. Public pages get real HTML at build time.
**Status:** NOT STARTED

## Steps

1. **Route meta** — every public route gets `head()` with title/description/Open Graph (home, programmes list/detail, players list/detail, news list/detail, about, contact, admissions, apply, privacy).
2. **Prerender public routes at build** — configure prerendering for `/`, `/about`, `/programmes`, `/news`, `/admissions`, `/contact`, `/privacy-policy`. Dynamic player/programme slugs prerender from a build-time sitemap query (Supabase read with publishable key at build time).
3. **Sitemap + robots** — `public/sitemap.xml` generated at build; `public/robots.txt` pointing to it; canonical URLs per page.
4. **Structured data** — `Organization` + `SportsActivityLocation` JSON-LD on home; `Article` on news detail.
5. **Stale-content policy** — document rebuild triggers (on content publish via dashboard, or scheduled nightly rebuild in CI) so prerendered HTML never drifts far behind.

## Exit criteria

- `curl` of the deployed site shows real HTML (not empty root div) for each prerendered route.
- Lighthouse SEO score ≥ 95 on home and one detail page.

## Result

_(updated when done)_
