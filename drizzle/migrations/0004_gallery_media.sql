CREATE TABLE IF NOT EXISTS public.gallery_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  caption text,
  category text NOT NULL DEFAULT 'Academy',
  kind text NOT NULL CHECK (kind IN ('image','video','youtube')),
  storage_path text,
  external_url text,
  mime_type text,
  sort integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT gallery_media_source_check CHECK (
    (kind = 'youtube' AND external_url IS NOT NULL AND storage_path IS NULL)
    OR (kind IN ('image','video') AND storage_path IS NOT NULL AND external_url IS NULL)
  )
);
GRANT SELECT ON public.gallery_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_media TO authenticated;
GRANT ALL ON public.gallery_media TO service_role;
ALTER TABLE public.gallery_media ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gallery_media' AND policyname='Anyone reads active gallery media') THEN CREATE POLICY "Anyone reads active gallery media" ON public.gallery_media FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin(auth.uid())); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gallery_media' AND policyname='Admins manage gallery media') THEN CREATE POLICY "Admins manage gallery media" ON public.gallery_media FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid())); END IF;
END $$;
