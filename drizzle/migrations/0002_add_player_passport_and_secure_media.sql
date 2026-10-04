CREATE OR REPLACE FUNCTION public.can_access_player(_player uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.player_profiles
    WHERE id = _player
      AND (is_published OR user_id = auth.uid() OR public.is_staff(auth.uid()))
  )
$$;

CREATE TABLE public.player_registration_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  organisation text NOT NULL,
  registration_body text,
  registration_number text,
  start_date date NOT NULL,
  end_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_registration_dates_valid CHECK (end_date IS NULL OR end_date >= start_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_registration_history TO authenticated;
GRANT ALL ON public.player_registration_history TO service_role;
ALTER TABLE public.player_registration_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players and staff read registration history" ON public.player_registration_history
  FOR SELECT TO authenticated
  USING (public.can_access_player(player_id));
CREATE POLICY "Staff manage registration history" ON public.player_registration_history
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.player_compliance (
  player_id uuid PRIMARY KEY REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  nff_registration_id text,
  fifa_connect_id text,
  passport_status text NOT NULL DEFAULT 'not_recorded' CHECK (passport_status IN ('not_recorded','valid','expired','in_progress')),
  passport_expiry date,
  medical_clearance_expiry date,
  yellow_fever_expiry date,
  travel_consent_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_compliance TO authenticated;
GRANT ALL ON public.player_compliance TO service_role;
ALTER TABLE public.player_compliance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players and staff read compliance" ON public.player_compliance
  FOR SELECT TO authenticated
  USING (public.can_access_player(player_id));
CREATE POLICY "Staff manage compliance" ON public.player_compliance
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER player_compliance_touch BEFORE UPDATE ON public.player_compliance
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.player_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('birth_certificate','passport','medical_clearance','travel_consent','school_record','registration','other')),
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 20971520),
  expires_on date,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_documents TO authenticated;
GRANT ALL ON public.player_documents TO service_role;
ALTER TABLE public.player_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Players and staff read documents" ON public.player_documents
  FOR SELECT TO authenticated
  USING (public.can_access_player(player_id));
CREATE POLICY "Staff manage documents" ON public.player_documents
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Published media or staff can read player media files" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'player-profile-media'
    AND public.can_access_player(((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "Staff upload player media files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'player-profile-media'
    AND public.is_staff(auth.uid())
    AND public.can_access_player(((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "Staff update player media files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'player-profile-media' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'player-profile-media' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff remove player media files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'player-profile-media' AND public.is_staff(auth.uid()));

CREATE POLICY "Players and staff read player documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'player-documents'
    AND public.can_access_player(((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "Staff upload player documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'player-documents'
    AND public.is_staff(auth.uid())
    AND public.can_access_player(((storage.foldername(name))[1])::uuid)
  );
CREATE POLICY "Staff update player documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'player-documents' AND public.is_staff(auth.uid()))
  WITH CHECK (bucket_id = 'player-documents' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff remove player documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'player-documents' AND public.is_staff(auth.uid()));