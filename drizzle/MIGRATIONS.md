# Database migrations

This repository contains two kinds of migration files in `drizzle/migrations`:

- `0000` and `0001` are recorded in `drizzle/migrations/meta/_journal.json`.
- `0002` onward are hand-maintained Supabase/PostgreSQL SQL scripts and are not in the Drizzle journal.

Do not add the hand-maintained scripts to the Drizzle journal or run them blindly through a second migration runner. The Supabase migration ledger may already contain scripts applied outside Drizzle. Compare the applied migration names with the numbered files; do not infer that a migration is outstanding merely because its filename changed during conflict resolution.

## Applying changes

1. Back up the target Supabase project and inspect its schema, policies, and migration ledger.
2. Compare the database with the numbered SQL files and identify which scripts have not been applied.
3. Apply only outstanding SQL files in filename order, using the project's established Supabase migration process (or the SQL Editor if that is how the project is managed).
4. Record the applied filenames and verification result in the deployment record. Never paste secrets into committed files.

`0009_published_news_media_policy.sql` is a required corrective migration for article-media read access. `0010`–`0013` contain the applicants-view security correction, RLS/index improvements, public-write and parent-request hardening, and atomic CMS gallery replacement. `0014` adds server-issued document upload tickets, a unique document path, and bucket size/MIME restrictions; `0015` makes the campus seed idempotent; `0016` installs the service-role-only shared rate-limit counter; `0017` binds role checks to the caller's `auth.uid()` and indexes upload-ticket application lookups; and `0018` moves privileged role-check helpers into the non-exposed `private` schema. The final unique sequence is `0019_admin_user_management.sql`, `0020_public_contact_trial_intake.sql`, `0021_push_notifications.sql`, `0022_deleted_user_role_revocation.sql`, and `0023_notification_user_fk_indexes.sql`. These cover admin user lifecycle controls, contact/trial rate limits, service-role-only Web Push storage, deleted-user fail-closed checks, and advisor-recommended foreign-key indexes.

The `buruj-skyport-staging` Supabase ledger has recorded these five migration names: `admin_user_management`, `public_contact_trial_intake`, `push_notifications`, `deleted_user_role_revocation`, and `notification_user_fk_indexes`. Staging applied them before the repository filenames were reconciled; the schema changes are already present there. For production, apply the final numbered files only after comparing the target ledger and pre-deployment checks. Do not replay these scripts blindly.

The checked-in `src/integrations/supabase/types.ts` is generated from the target Supabase schema and must be refreshed after database migrations, then type-checked before release. Drizzle's journal does not track the hand-maintained SQL scripts.

Before applying `0014` to another database, check for duplicate `application_documents.storage_path` values; before `0015`, check for duplicate normalized contact-location names (`lower(btrim(name))`). Resolve any duplicates deliberately before adding the unique indexes. The migrations do not delete or rewrite existing records to force uniqueness.

The application, CV, parent-access, document-upload, contact-enquiry, and trial-registration endpoints also require trusted-proxy IP rate limits at the production edge/CDN/WAF. The shared database counter limits repeated normalized identities but does not stop distributed requests or spoofed email addresses; do not expose these endpoints until edge rate limiting is configured. Do not trust client-supplied forwarding headers unless the origin only accepts traffic from the configured proxy.

There is currently no in-app cron route or cleanup task; expired upload-ticket and rate-limit rows are pruned opportunistically by requests. Admin user deletion removes the target's application roles before deleting the Supabase Auth account, while migration `0022` makes role and active-account helpers fail closed if the Auth row no longer exists.

The staging `site-media` bucket is public for public-facing website imagery; do not place private documents there. The `application-documents` and `player-documents` buckets must remain private. Confirm the same visibility and size/MIME restrictions explicitly for any production project.

Notification history, reads, and push-subscription tables have RLS enabled and no client-facing policies. The application accesses them through server functions using the server-only service-role client; preserve the `PUBLIC`/`anon`/`authenticated` revocations in `0021_push_notifications.sql`.
