-- Keep privileged role-table reads outside the exposed public API schema.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT _user_id IS NOT NULL
     AND _user_id = auth.uid()
     AND EXISTS (
       SELECT 1
         FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
     );
$function$;

CREATE OR REPLACE FUNCTION private.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
  SELECT _user_id IS NOT NULL
     AND _user_id = auth.uid()
     AND (
       private.has_role(_user_id, 'admin'::public.app_role)
       OR private.has_role(_user_id, 'owner'::public.app_role)
     );
$function$;

CREATE OR REPLACE FUNCTION private.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
  SELECT _user_id IS NOT NULL
     AND _user_id = auth.uid()
     AND (
       private.is_admin(_user_id)
       OR private.has_role(_user_id, 'coach'::public.app_role)
     );
$function$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO service_role;
GRANT EXECUTE ON FUNCTION private.is_admin(uuid), private.is_staff(uuid)
  TO anon, authenticated, service_role;

-- Preserve the existing public RPC names for RLS policies and authenticated
-- server functions, but make them invoker-security wrappers around the
-- caller-bound private helpers. The private schema is not an exposed API schema.
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
  SELECT private.is_admin(_user_id);
$function$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
  SELECT private.is_staff(_user_id);
$function$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid), public.is_staff(uuid)
  TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role)
  FROM PUBLIC, anon, authenticated;
