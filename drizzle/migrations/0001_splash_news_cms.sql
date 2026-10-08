CREATE TABLE public.splash_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort integer NOT NULL DEFAULT 0,
  kind text NOT NULL DEFAULT 'image',
  title text,
  subtitle text,
  image_path text,
  bg_color text NOT NULL DEFAULT '#0b1f3a',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.splash_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.splash_slides TO authenticated;
GRANT ALL ON public.splash_slides TO service_role;
ALTER TABLE public.splash_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active slides" ON public.splash_slides FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage slides" ON public.splash_slides FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

ALTER TABLE public.news_posts ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.news_posts ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Academy';
ALTER TABLE public.news_posts ADD COLUMN IF NOT EXISTS cover_path text;
ALTER TABLE public.news_posts ADD COLUMN IF NOT EXISTS author text;
ALTER TABLE public.news_posts ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
UPDATE public.news_posts SET slug = trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) || '-' || substr(id::text,1,6) WHERE slug IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS news_posts_slug_key ON public.news_posts(slug);

CREATE POLICY "Staff read site media" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'site-media' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff upload site media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'site-media' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff update site media" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'site-media' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff delete site media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'site-media' AND public.is_staff(auth.uid()));