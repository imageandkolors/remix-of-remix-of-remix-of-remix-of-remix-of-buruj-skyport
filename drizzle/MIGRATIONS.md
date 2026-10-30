# Database migrations

This repository currently contains two kinds of migration files in `drizzle/migrations`:

- `0000` and `0001` are recorded in `drizzle/migrations/meta/_journal.json`.
- `0002` onward are hand-maintained Supabase/PostgreSQL SQL scripts and are not in the Drizzle journal.

Do not add the hand-maintained scripts to the Drizzle journal or run them blindly through a second migration runner until the target database’s migration history has been checked. The remote Supabase project may already have some of these scripts applied outside Drizzle’s migration table.

## Applying changes

1. Back up the target Supabase project and inspect its existing schema/policies.
2. Compare the database with the numbered SQL files and identify which scripts have not been applied.
3. Apply only outstanding SQL files, in filename order, using the project’s established Supabase migration process (or the Supabase SQL Editor if that is how the project is managed).
4. Record the applied files and verification result in the deployment record. Never paste secrets into committed files.

`0009_published_news_media_policy.sql` is a required corrective migration for article-media read access. `0010`–`0013` contain the applicants-view security correction, RLS/index improvements, public-write and parent-request hardening, and atomic CMS gallery replacement. `0014` adds server-issued document upload tickets, a unique document path, and bucket size/MIME restrictions; `0015` makes the campus seed idempotent; `0016` installs the service-role-only shared rate-limit counter used by public intake handlers; `0017` binds role checks to the caller's `auth.uid()` and indexes upload-ticket application lookups; `0018` moves privileged role-check helpers into the non-exposed `private` schema and leaves safe invoker wrappers for existing RLS policies; `0019` extends the shared rate limiter for contact enquiries and trial registrations. Apply only outstanding scripts in numeric order and verify the resulting policies, functions, indexes, and bucket settings in the target Supabase project.

The checked-in `src/integrations/supabase/types.ts` is generated from the target Supabase schema and must be refreshed after database migrations, then type-checked before release. Drizzle's journal does not track the hand-maintained SQL scripts.

Before applying `0014` to another database, check for duplicate `application_documents.storage_path` values; before `0015`, check for duplicate normalized contact-location names (`lower(btrim(name))`). Resolve any duplicates deliberately before adding the unique indexes. The migrations do not delete or rewrite existing records to force uniqueness.

The application, CV, parent-access, and document-upload endpoints also require trusted-proxy IP rate limits at the production edge/CDN/WAF. The shared database counter in `0016` limits repeated normalized identities but does not stop distributed requests or spoofed email addresses; do not expose the endpoints until edge rate limiting is configured. Do not trust client-supplied forwarding headers unless the origin only accepts traffic from the configured proxy.

There is currently no in-app cron route or cleanup task. The `LOVABLE_CRON_SECRET*` sample variables and cron-auth helper are not used by a shipped job; expired upload-ticket and rate-limit rows are pruned opportunistically by requests.
