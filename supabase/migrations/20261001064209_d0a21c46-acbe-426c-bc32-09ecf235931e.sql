CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  programme text NOT NULL,
  player_name text NOT NULL,
  date_of_birth date,
  gender text,
  position text,
  current_school text,
  current_class text,
  guardian_name text NOT NULL,
  guardian_relationship text,
  guardian_phone text NOT NULL,
  guardian_email text,
  address text,
  medical_notes text,
  motivation text,
  consent boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'submitted',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.applications TO anon;
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit applications" ON public.applications FOR INSERT TO anon, authenticated
WITH CHECK (consent = true AND status = 'submitted' AND admin_notes IS NULL
  AND length(player_name) BETWEEN 2 AND 120 AND length(guardian_name) BETWEEN 2 AND 120
  AND length(guardian_phone) BETWEEN 7 AND 30 AND programme IN ('Play & Study','Football Camping')
  AND (user_id IS NULL OR user_id = auth.uid()));
CREATE POLICY "Applicants read own, staff read all" ON public.applications FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Staff update applications" ON public.applications FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER applications_touch BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();