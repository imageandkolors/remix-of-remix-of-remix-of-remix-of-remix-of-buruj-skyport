-- A JWT may remain cryptographically valid briefly after its Auth account is
-- deleted. Treat a missing auth.users row as inactive so stale public.user_roles
-- records cannot authorize requests during or after that deletion.
CREATE OR REPLACE FUNCTION private.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, private
AS $function$
  SELECT _user_id IS NOT NULL
     AND _user_id = auth.uid()
     AND EXISTS (
       SELECT 1 FROM auth.users AS u WHERE u.id = _user_id
     )
     AND NOT EXISTS (
       SELECT 1 FROM private.user_suspensions AS s WHERE s.user_id = _user_id
     );
$function$;

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
         FROM public.user_roles AS ur
        WHERE ur.user_id = _user_id
          AND ur.role = _role
     );
$function$;
