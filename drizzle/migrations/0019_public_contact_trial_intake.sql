-- Route public contact and trial submissions through server functions and
-- give both operations the same atomic abuse protection as applications.
ALTER TABLE public.public_intake_rate_limits
  DROP CONSTRAINT IF EXISTS public_intake_rate_limits_operation_check;

ALTER TABLE public.public_intake_rate_limits
  ADD CONSTRAINT public_intake_rate_limits_operation_check
  CHECK (operation IN (
    'application', 'cv', 'parent_access', 'application_upload', 'enquiry', 'trial'
  ));

CREATE OR REPLACE FUNCTION public.consume_public_intake_rate_limit(
  p_operation text,
  p_identifier_hash text,
  p_max_requests integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  bucket_start timestamptz;
  updated_count integer;
BEGIN
  IF p_operation NOT IN (
    'application', 'cv', 'parent_access', 'application_upload', 'enquiry', 'trial'
  ) THEN
    RAISE EXCEPTION 'Unsupported rate-limit operation';
  END IF;
  IF p_identifier_hash !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invalid rate-limit identifier';
  END IF;
  IF p_max_requests < 1 OR p_max_requests > 100 THEN
    RAISE EXCEPTION 'Invalid rate limit';
  END IF;
  IF p_window_seconds < 60 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate-limit window';
  END IF;

  WITH stale AS (
    SELECT ctid
      FROM public.public_intake_rate_limits
     WHERE window_start < now() - interval '48 hours'
     ORDER BY window_start
     LIMIT 100
  )
  DELETE FROM public.public_intake_rate_limits AS limits
   USING stale
   WHERE limits.ctid = stale.ctid;

  bucket_start := to_timestamp(
    floor(extract(epoch FROM clock_timestamp()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.public_intake_rate_limits AS current_limit (
    operation, identifier_hash, window_start, request_count
  ) VALUES (
    p_operation, p_identifier_hash, bucket_start, 1
  )
  ON CONFLICT (operation, identifier_hash, window_start)
  DO UPDATE SET
    request_count = current_limit.request_count + 1,
    updated_at = clock_timestamp()
  WHERE current_limit.request_count < p_max_requests
  RETURNING request_count INTO updated_count;

  RETURN updated_count IS NOT NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_public_intake_rate_limit(text, text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_public_intake_rate_limit(text, text, integer, integer)
  TO service_role;
