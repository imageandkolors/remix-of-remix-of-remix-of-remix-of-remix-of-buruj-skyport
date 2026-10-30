-- Supabase's performance advisor identified repeated per-row auth.uid() calls
-- in RLS expressions. Move those calls into scalar subqueries so PostgreSQL
-- can plan them once per statement. The guard keeps reapplication idempotent.
DO $migration$
DECLARE
  policy_row record;
  using_expression text;
  check_expression text;
  alter_statement text;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname IN ('public', 'storage')
      AND (
        (position('auth.uid()' IN COALESCE(qual, '')) > 0
          AND position('(select auth.uid())' IN COALESCE(qual, '')) = 0)
        OR
        (position('auth.uid()' IN COALESCE(with_check, '')) > 0
          AND position('(select auth.uid())' IN COALESCE(with_check, '')) = 0)
      )
  LOOP
    using_expression := CASE
      WHEN policy_row.qual IS NULL THEN NULL
      ELSE replace(policy_row.qual, 'auth.uid()', '(select auth.uid())')
    END;
    check_expression := CASE
      WHEN policy_row.with_check IS NULL THEN NULL
      ELSE replace(policy_row.with_check, 'auth.uid()', '(select auth.uid())')
    END;

    alter_statement := format(
      'ALTER POLICY %I ON %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
    IF using_expression IS NOT NULL THEN
      alter_statement := alter_statement || format(' USING (%s)', using_expression);
    END IF;
    IF check_expression IS NOT NULL THEN
      alter_statement := alter_statement || format(' WITH CHECK (%s)', check_expression);
    END IF;
    EXECUTE alter_statement;
  END LOOP;
END;
$migration$;

-- Index child-side foreign keys used in the application's joins, RLS checks,
-- and parent-row deletion/update checks. CREATE INDEX IF NOT EXISTS is safe to
-- rerun; existing primary/unique indexes already cover the other FK columns.
CREATE INDEX IF NOT EXISTS application_documents_application_id_idx
  ON public.application_documents (application_id);
CREATE INDEX IF NOT EXISTS applications_reviewer_id_idx
  ON public.applications (reviewer_id);
CREATE INDEX IF NOT EXISTS applications_user_id_idx
  ON public.applications (user_id);
CREATE INDEX IF NOT EXISTS player_cv_requests_player_id_idx
  ON public.player_cv_requests (player_id);
CREATE INDEX IF NOT EXISTS player_documents_created_by_idx
  ON public.player_documents (created_by);
CREATE INDEX IF NOT EXISTS player_documents_player_id_idx
  ON public.player_documents (player_id);
CREATE INDEX IF NOT EXISTS player_media_player_id_idx
  ON public.player_media (player_id);
CREATE INDEX IF NOT EXISTS player_milestones_player_id_idx
  ON public.player_milestones (player_id);
CREATE INDEX IF NOT EXISTS player_profiles_user_id_idx
  ON public.player_profiles (user_id);
CREATE INDEX IF NOT EXISTS player_registration_history_player_id_idx
  ON public.player_registration_history (player_id);
