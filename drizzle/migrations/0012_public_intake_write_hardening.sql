-- Public intake is handled by server functions using the service-role client,
-- which validates the complete payload. Do not allow callers with the public
-- Supabase key to bypass that validation through direct PostgREST INSERTs.
DROP POLICY IF EXISTS applications_public_insert ON public.applications;
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;
DROP POLICY IF EXISTS cv_requests_public_insert ON public.player_cv_requests;
DROP POLICY IF EXISTS "CV requests public insert" ON public.player_cv_requests;

REVOKE INSERT ON TABLE public.applications FROM PUBLIC, anon, authenticated;
REVOKE INSERT (
  id, reference_number, programme, player_name, date_of_birth, gender, position,
  current_school, current_class, guardian_name, guardian_relationship,
  guardian_phone, guardian_email, address, medical_notes, motivation, consent,
  status, status_changed_at, admin_notes, reviewer_id, user_id, ai_assessment,
  ai_assessed_at, created_at, updated_at
) ON TABLE public.applications FROM PUBLIC, anon, authenticated;

REVOKE INSERT ON TABLE public.player_cv_requests FROM PUBLIC, anon, authenticated;
REVOKE INSERT (
  id, player_id, requester_name, organisation, role, email, country, purpose,
  message, status, created_at
) ON TABLE public.player_cv_requests FROM PUBLIC, anon, authenticated;

-- Serialize parent-access submissions by normalized email so concurrent
-- requests cannot race past the existing cap of three pending requests.
CREATE INDEX IF NOT EXISTS parent_access_requests_pending_email_idx
  ON public.parent_access_requests (lower(email))
  WHERE status = 'pending';

CREATE OR REPLACE FUNCTION public.create_parent_access_request_limited(
  p_email text,
  p_reference_number text,
  p_guardian_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  normalized_email text;
  pending_count integer;
BEGIN
  normalized_email := lower(trim(p_email));
  IF normalized_email IS NULL OR normalized_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(normalized_email, 0));

  SELECT count(*)
    INTO pending_count
    FROM public.parent_access_requests AS request
   WHERE lower(request.email) = normalized_email
     AND request.status = 'pending';

  IF pending_count >= 3 THEN
    RETURN false;
  END IF;

  INSERT INTO public.parent_access_requests (email, reference_number, guardian_name)
  VALUES (normalized_email, p_reference_number, p_guardian_name);

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_parent_access_request_limited(text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_parent_access_request_limited(text, text, text)
  TO service_role;
