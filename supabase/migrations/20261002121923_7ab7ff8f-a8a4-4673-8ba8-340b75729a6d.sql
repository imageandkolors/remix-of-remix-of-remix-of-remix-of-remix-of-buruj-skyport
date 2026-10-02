ALTER TABLE public.applications
  ADD COLUMN reference_number text,
  ADD COLUMN reviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN status_changed_at timestamptz NOT NULL DEFAULT now();

UPDATE public.applications
SET reference_number = 'BSA-' || to_char(created_at, 'YYYY') || '-' || upper(substr(replace(id::text, '-', ''), 1, 8))
WHERE reference_number IS NULL;

ALTER TABLE public.applications
  ALTER COLUMN reference_number SET NOT NULL,
  ALTER COLUMN reference_number SET DEFAULT ('BSA-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  ADD CONSTRAINT applications_reference_number_key UNIQUE (reference_number),
  ADD CONSTRAINT applications_status_check CHECK (status IN ('submitted', 'under_review', 'shortlisted', 'accepted', 'declined'));

CREATE INDEX applications_reviewer_id_idx ON public.applications(reviewer_id);
CREATE INDEX applications_status_created_at_idx ON public.applications(status, created_at DESC);

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('coach', 'admin', 'owner')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'owner')
  )
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Applicants read own, staff read all" ON public.applications;
DROP POLICY IF EXISTS "Staff update applications" ON public.applications;
CREATE POLICY "Applicants and reviewers read applications"
ON public.applications FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin(auth.uid())
  OR reviewer_id = auth.uid()
);
CREATE POLICY "Admins update applications"
ON public.applications FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.set_application_status_changed_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER applications_status_changed_at
BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.set_application_status_changed_at();