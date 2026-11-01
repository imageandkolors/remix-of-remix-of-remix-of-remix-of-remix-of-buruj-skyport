-- Cover the additional foreign keys introduced by admin user management and
-- notifications; these indexes improve joins and parent-row delete checks.
CREATE INDEX IF NOT EXISTS user_management_audit_actor_user_id_idx
  ON private.user_management_audit (actor_user_id);

CREATE INDEX IF NOT EXISTS user_suspensions_suspended_by_idx
  ON private.user_suspensions (suspended_by);

CREATE INDEX IF NOT EXISTS notification_reads_user_id_idx
  ON public.notification_reads (user_id);

CREATE INDEX IF NOT EXISTS notifications_created_by_idx
  ON public.notifications (created_by);
