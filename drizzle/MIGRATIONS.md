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

The new `0009_published_news_media_policy.sql` is an idempotent corrective migration for article-media read access. Apply it to Supabase before publishing code that assumes the corrected public policy.

Public application and parent-access endpoints also need rate limiting at the production edge/CDN/WAF. These server processes may be replicated or restarted, so an in-memory limiter would not be a reliable substitute for shared rate limiting.
