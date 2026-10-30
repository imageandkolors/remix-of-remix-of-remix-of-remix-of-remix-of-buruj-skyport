-- SECURITY DEFINER helpers are used in RLS policies and authenticated server
-- functions. Bind each supplied user ID to the caller's JWT subject so callers
-- cannot probe another user's role by choosing an arbitrary UUID.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
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

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT _user_id IS NOT NULL
     AND _user_id = auth.uid()
     AND (
       public.has_role(_user_id, 'admin'::public.app_role)
       OR public.has_role(_user_id, 'owner'::public.app_role)
     );
$function$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT _user_id IS NOT NULL
     AND _user_id = auth.uid()
     AND (
       public.is_admin(_user_id)
       OR public.has_role(_user_id, 'coach'::public.app_role)
     );
$function$;

-- RLS calls the wrappers above as the function owner. The generic helper is not
-- intended to be directly callable by browser roles.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)
  TO service_role;

-- Support ticket expiry/deletion cascades and the application-scoped lookup.
CREATE INDEX IF NOT EXISTS application_upload_tickets_application_id_idx
  ON public.application_upload_tickets (application_id);
