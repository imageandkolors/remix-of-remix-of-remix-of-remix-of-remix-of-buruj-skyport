CREATE TABLE IF NOT EXISTS public.content_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content_tags TO authenticated;
GRANT ALL ON public.content_tags TO service_role;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='content_tags' AND policyname='Anyone reads tags') THEN CREATE POLICY "Anyone reads tags" ON public.content_tags FOR SELECT TO anon, authenticated USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='content_tags' AND policyname='Admins manage tags') THEN CREATE POLICY "Admins manage tags" ON public.content_tags FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid())); END IF;
END $$;
