CREATE TABLE public.site_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  whatsapp text NOT NULL DEFAULT '2348000000000',
  email text NOT NULL DEFAULT 'info@burujsportsacademy.com',
  phone text,
  facebook text,
  instagram text,
  tiktok text,
  x_url text,
  youtube text,
  header_bg text NOT NULL DEFAULT '#0b1f3a',
  header_fg text NOT NULL DEFAULT '#ffffff',
  footer_bg text NOT NULL DEFAULT '#0b1f3a',
  footer_fg text NOT NULL DEFAULT '#ffffff',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT UPDATE, INSERT ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins write settings" ON public.site_settings FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
INSERT INTO public.site_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS ai_assessment jsonb;
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS ai_assessed_at timestamptz;

DROP POLICY IF EXISTS "Anyone can submit applications" ON public.applications;
CREATE POLICY "Anyone can submit applications" ON public.applications FOR INSERT TO anon, authenticated
WITH CHECK (consent = true AND status = 'submitted' AND admin_notes IS NULL
  AND length(player_name) BETWEEN 2 AND 120 AND length(guardian_name) BETWEEN 2 AND 120
  AND length(guardian_phone) BETWEEN 7 AND 30
  AND (programme IN ('Play & Study','Football Camping') OR EXISTS (SELECT 1 FROM public.programmes p WHERE p.name = programme AND p.is_published))
  AND (user_id IS NULL OR user_id = auth.uid()));

CREATE TABLE public.application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  storage_path text NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.application_documents TO authenticated;
GRANT ALL ON public.application_documents TO service_role;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read application documents" ON public.application_documents FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.applications a WHERE a.id = application_id AND a.reviewer_id = auth.uid()));

CREATE TABLE public.parent_access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  reference_number text NOT NULL,
  guardian_name text,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.parent_access_requests TO authenticated;
GRANT ALL ON public.parent_access_requests TO service_role;
ALTER TABLE public.parent_access_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read access requests" ON public.parent_access_requests FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins update access requests" ON public.parent_access_requests FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.player_cv_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  requester_name text NOT NULL,
  organisation text NOT NULL,
  role text,
  email text NOT NULL,
  country text,
  purpose text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.player_cv_requests TO authenticated;
GRANT ALL ON public.player_cv_requests TO service_role;
ALTER TABLE public.player_cv_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read cv requests" ON public.player_cv_requests FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "Staff update cv requests" ON public.player_cv_requests FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff read application files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'application-documents' AND public.is_staff(auth.uid()));