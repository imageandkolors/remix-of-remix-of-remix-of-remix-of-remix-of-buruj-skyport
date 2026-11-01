-- Admin user lifecycle state is private to the database. A suspended account
-- remains in Auth, but can no longer pass any role-based check even when an
-- already-issued access token is still cryptographically valid.
CREATE TABLE IF NOT EXISTS private.user_suspensions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  suspended_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  suspended_at timestamptz NOT NULL DEFAULT now(),
  reason text CHECK (reason IS NULL OR length(reason) <= 500)
);
ALTER TABLE private.user_suspensions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.user_suspensions FROM PUBLIC, anon, authenticated, service_role;

-- Append-only audit metadata; target IDs intentionally survive Auth deletion.
CREATE TABLE IF NOT EXISTS private.user_management_audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('invite', 'roles_changed', 'suspended', 'reactivated', 'deleted')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.user_management_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.user_management_audit FROM PUBLIC, anon, authenticated, service_role;
CREATE INDEX IF NOT EXISTS user_management_audit_target_created_idx
  ON private.user_management_audit (target_user_id, created_at DESC);

-- This helper is deliberately bound to the caller. It may be used by RLS and
-- authenticated requests but cannot reveal another user's suspension state.
CREATE OR REPLACE FUNCTION private.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
  SELECT _user_id IS NOT NULL
     AND _user_id = auth.uid()
     AND NOT EXISTS (
       SELECT 1 FROM private.user_suspensions AS s WHERE s.user_id = _user_id
     );
$function$;
REVOKE ALL ON FUNCTION private.is_user_active(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_user_active(uuid) TO anon, authenticated, service_role;

-- All staff/admin helper paths now fail closed for suspended identities.
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
  SELECT _user_id IS NOT NULL
     AND _user_id = auth.uid()
     AND private.is_user_active(_user_id)
     AND EXISTS (
       SELECT 1
         FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
     );
$function$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO service_role;

-- Safe caller-bound wrapper for server functions which read private data via
-- the service-role client (notably the parent portal).
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
  SELECT private.is_user_active(_user_id);
$function$;
GRANT EXECUTE ON FUNCTION public.is_user_active(uuid) TO anon, authenticated, service_role;

-- Deny even self-profile/role reads when the account is suspended. All other
-- staff/admin policies already flow through is_staff()/is_admin().
DROP POLICY IF EXISTS profiles_self_read ON public.profiles;
CREATE POLICY profiles_self_read ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (id = (SELECT auth.uid()) AND private.is_user_active((SELECT auth.uid())))
    OR public.is_admin((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS roles_self_read ON public.user_roles;
CREATE POLICY roles_self_read ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    (user_id = (SELECT auth.uid()) AND private.is_user_active((SELECT auth.uid())))
    OR public.is_admin((SELECT auth.uid()))
  );

-- Narrow service-role-only roster access to private suspension metadata.
CREATE OR REPLACE FUNCTION public.admin_get_user_suspensions(p_user_ids uuid[])
RETURNS TABLE(user_id uuid, suspended_at timestamptz, suspended_by uuid, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
BEGIN
  IF p_user_ids IS NULL OR cardinality(p_user_ids) > 100 THEN
    RAISE EXCEPTION 'Invalid user ID batch' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
    SELECT s.user_id, s.suspended_at, s.suspended_by, s.reason
      FROM private.user_suspensions AS s
     WHERE s.user_id = ANY (p_user_ids);
END;
$function$;
REVOKE ALL ON FUNCTION public.admin_get_user_suspensions(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_user_suspensions(uuid[]) TO service_role;

-- Serialize role changes and suspension transitions so concurrent requests
-- cannot remove the final active administrator or owner.
CREATE OR REPLACE FUNCTION public.admin_set_user_roles(
  p_actor_id uuid,
  p_target_id uuid,
  p_roles public.app_role[],
  p_action text DEFAULT 'roles_changed'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
DECLARE
  v_actor_is_owner boolean;
  v_target_has_owner boolean;
  v_target_is_elevated boolean;
  v_target_is_suspended boolean;
  v_active_owner_count integer;
  v_other_owner_count integer;
  v_other_elevated_count integer;
  v_roles_before text[];
BEGIN
  PERFORM pg_advisory_xact_lock(75233019);

  IF p_actor_id IS NULL OR p_target_id IS NULL OR p_actor_id = p_target_id THEN
    RAISE EXCEPTION 'Self-management and invalid targets are not allowed' USING ERRCODE = '42501';
  END IF;
  IF p_roles IS NULL OR cardinality(p_roles) > 5 OR array_position(p_roles, NULL) IS NOT NULL
     OR (SELECT count(*) FROM unnest(p_roles)) <>
        (SELECT count(DISTINCT role) FROM unnest(p_roles) AS u(role)) THEN
    RAISE EXCEPTION 'Invalid role selection' USING ERRCODE = '22023';
  END IF;
  IF p_action IS NULL OR p_action NOT IN ('invite', 'roles_changed') THEN
    RAISE EXCEPTION 'Invalid user-management action' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users AS u WHERE u.id = p_target_id) THEN
    RAISE EXCEPTION 'Target user not found' USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (SELECT 1 FROM private.user_suspensions AS s WHERE s.user_id = p_actor_id)
     OR NOT EXISTS (
       SELECT 1 FROM public.user_roles AS ur
        WHERE ur.user_id = p_actor_id AND ur.role IN ('admin'::public.app_role, 'owner'::public.app_role)
     ) THEN
    RAISE EXCEPTION 'Active administrator access required' USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles AS ur
     WHERE ur.user_id = p_actor_id AND ur.role = 'owner'::public.app_role
  ) INTO v_actor_is_owner;
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles AS ur
     WHERE ur.user_id = p_target_id AND ur.role = 'owner'::public.app_role
  ) INTO v_target_has_owner;
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles AS ur
     WHERE ur.user_id = p_target_id
       AND ur.role IN ('admin'::public.app_role, 'owner'::public.app_role)
  ) INTO v_target_is_elevated;
  SELECT EXISTS (
    SELECT 1 FROM private.user_suspensions AS s WHERE s.user_id = p_target_id
  ) INTO v_target_is_suspended;
  SELECT count(DISTINCT ur.user_id)::integer INTO v_active_owner_count
    FROM public.user_roles AS ur
   WHERE ur.role = 'owner'::public.app_role
     AND NOT EXISTS (SELECT 1 FROM private.user_suspensions AS s WHERE s.user_id = ur.user_id);

  IF v_target_has_owner AND NOT v_actor_is_owner THEN
    RAISE EXCEPTION 'Only an owner may manage an owner account' USING ERRCODE = '42501';
  END IF;
  IF 'owner'::public.app_role = ANY (p_roles)
     AND NOT v_actor_is_owner AND v_active_owner_count > 0 THEN
    RAISE EXCEPTION 'Only an owner may assign another owner' USING ERRCODE = '42501';
  END IF;

  IF v_target_has_owner AND NOT ('owner'::public.app_role = ANY (p_roles)) THEN
    SELECT count(DISTINCT ur.user_id)::integer INTO v_other_owner_count
      FROM public.user_roles AS ur
     WHERE ur.role = 'owner'::public.app_role
       AND ur.user_id <> p_target_id
       AND NOT EXISTS (SELECT 1 FROM private.user_suspensions AS s WHERE s.user_id = ur.user_id);
    IF v_other_owner_count = 0 THEN
      RAISE EXCEPTION 'The final active owner cannot be removed' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF v_target_is_elevated AND NOT v_target_is_suspended
     AND NOT (p_roles && ARRAY['admin'::public.app_role, 'owner'::public.app_role]) THEN
    SELECT count(DISTINCT ur.user_id)::integer INTO v_other_elevated_count
      FROM public.user_roles AS ur
     WHERE ur.role IN ('admin'::public.app_role, 'owner'::public.app_role)
       AND ur.user_id <> p_target_id
       AND NOT EXISTS (SELECT 1 FROM private.user_suspensions AS s WHERE s.user_id = ur.user_id);
    IF v_other_elevated_count = 0 THEN
      RAISE EXCEPTION 'The final active administrator cannot be removed' USING ERRCODE = '23514';
    END IF;
  END IF;

  SELECT COALESCE(array_agg(ur.role::text ORDER BY ur.role::text), ARRAY[]::text[])
    INTO v_roles_before FROM public.user_roles AS ur WHERE ur.user_id = p_target_id;

  DELETE FROM public.user_roles WHERE user_id = p_target_id;
  INSERT INTO public.user_roles (user_id, role)
    SELECT p_target_id, u.role FROM unnest(p_roles) AS u(role);

  INSERT INTO private.user_management_audit (actor_user_id, target_user_id, action, details)
  VALUES (
    p_actor_id,
    p_target_id,
    p_action,
    jsonb_build_object('roles_before', to_jsonb(v_roles_before), 'roles_after', to_jsonb(p_roles))
  );
END;
$function$;
REVOKE ALL ON FUNCTION public.admin_set_user_roles(uuid, uuid, public.app_role[], text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_roles(uuid, uuid, public.app_role[], text)
  TO service_role;

CREATE OR REPLACE FUNCTION public.admin_set_user_suspension(
  p_actor_id uuid,
  p_target_id uuid,
  p_suspended boolean,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
DECLARE
  v_actor_is_owner boolean;
  v_target_has_owner boolean;
  v_target_is_elevated boolean;
  v_target_is_suspended boolean;
  v_other_owner_count integer;
  v_other_elevated_count integer;
BEGIN
  PERFORM pg_advisory_xact_lock(75233019);

  IF p_actor_id IS NULL OR p_target_id IS NULL OR p_actor_id = p_target_id THEN
    RAISE EXCEPTION 'Self-suspension and invalid targets are not allowed' USING ERRCODE = '42501';
  END IF;
  IF p_suspended IS NULL THEN
    RAISE EXCEPTION 'Suspension state is required' USING ERRCODE = '22023';
  END IF;
  IF p_reason IS NOT NULL AND length(p_reason) > 500 THEN
    RAISE EXCEPTION 'Reason is too long' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users AS u WHERE u.id = p_target_id) THEN
    RAISE EXCEPTION 'Target user not found' USING ERRCODE = 'P0002';
  END IF;
  IF EXISTS (SELECT 1 FROM private.user_suspensions AS s WHERE s.user_id = p_actor_id)
     OR NOT EXISTS (
       SELECT 1 FROM public.user_roles AS ur
        WHERE ur.user_id = p_actor_id AND ur.role IN ('admin'::public.app_role, 'owner'::public.app_role)
     ) THEN
    RAISE EXCEPTION 'Active administrator access required' USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles AS ur
     WHERE ur.user_id = p_actor_id AND ur.role = 'owner'::public.app_role
  ) INTO v_actor_is_owner;
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles AS ur
     WHERE ur.user_id = p_target_id AND ur.role = 'owner'::public.app_role
  ) INTO v_target_has_owner;
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles AS ur
     WHERE ur.user_id = p_target_id
       AND ur.role IN ('admin'::public.app_role, 'owner'::public.app_role)
  ) INTO v_target_is_elevated;
  SELECT EXISTS (
    SELECT 1 FROM private.user_suspensions AS s WHERE s.user_id = p_target_id
  ) INTO v_target_is_suspended;

  IF v_target_has_owner AND NOT v_actor_is_owner THEN
    RAISE EXCEPTION 'Only an owner may manage an owner account' USING ERRCODE = '42501';
  END IF;

  IF p_suspended AND NOT v_target_is_suspended AND v_target_has_owner THEN
    SELECT count(DISTINCT ur.user_id)::integer INTO v_other_owner_count
      FROM public.user_roles AS ur
     WHERE ur.role = 'owner'::public.app_role
       AND ur.user_id <> p_target_id
       AND NOT EXISTS (SELECT 1 FROM private.user_suspensions AS s WHERE s.user_id = ur.user_id);
    IF v_other_owner_count = 0 THEN
      RAISE EXCEPTION 'The final active owner cannot be suspended' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF p_suspended AND NOT v_target_is_suspended AND v_target_is_elevated THEN
    SELECT count(DISTINCT ur.user_id)::integer INTO v_other_elevated_count
      FROM public.user_roles AS ur
     WHERE ur.role IN ('admin'::public.app_role, 'owner'::public.app_role)
       AND ur.user_id <> p_target_id
       AND NOT EXISTS (SELECT 1 FROM private.user_suspensions AS s WHERE s.user_id = ur.user_id);
    IF v_other_elevated_count = 0 THEN
      RAISE EXCEPTION 'The final active administrator cannot be suspended' USING ERRCODE = '23514';
    END IF;
  END IF;

  IF p_suspended THEN
    INSERT INTO private.user_suspensions (user_id, suspended_by, reason)
    VALUES (p_target_id, p_actor_id, nullif(btrim(p_reason), ''))
    ON CONFLICT (user_id) DO UPDATE
      SET suspended_by = EXCLUDED.suspended_by,
          suspended_at = now(),
          reason = EXCLUDED.reason;
  ELSE
    DELETE FROM private.user_suspensions WHERE user_id = p_target_id;
  END IF;

  INSERT INTO private.user_management_audit (actor_user_id, target_user_id, action, details)
  VALUES (
    p_actor_id,
    p_target_id,
    CASE WHEN p_suspended THEN 'suspended' ELSE 'reactivated' END,
    jsonb_build_object('previously_suspended', v_target_is_suspended, 'suspended', p_suspended)
  );
END;
$function$;
REVOKE ALL ON FUNCTION public.admin_set_user_suspension(uuid, uuid, boolean, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_suspension(uuid, uuid, boolean, text)
  TO service_role;

-- Auth Admin invite/delete calls are separate HTTP requests, so record their
-- outcome in a small service-role-only audit RPC after successful completion.
CREATE OR REPLACE FUNCTION public.admin_log_user_action(
  p_actor_id uuid,
  p_target_id uuid,
  p_action text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
BEGIN
  IF p_action IS NULL OR p_action NOT IN ('invite', 'deleted') OR p_target_id IS NULL THEN
    RAISE EXCEPTION 'Invalid audit action' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM private.user_suspensions AS s WHERE s.user_id = p_actor_id)
     OR NOT EXISTS (
       SELECT 1 FROM public.user_roles AS ur
        WHERE ur.user_id = p_actor_id AND ur.role IN ('admin'::public.app_role, 'owner'::public.app_role)
     ) THEN
    RAISE EXCEPTION 'Active administrator access required' USING ERRCODE = '42501';
  END IF;
  INSERT INTO private.user_management_audit (actor_user_id, target_user_id, action, details)
  VALUES (p_actor_id, p_target_id, p_action, COALESCE(p_details, '{}'::jsonb));
END;
$function$;
REVOKE ALL ON FUNCTION public.admin_log_user_action(uuid, uuid, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_log_user_action(uuid, uuid, text, jsonb)
  TO service_role;
