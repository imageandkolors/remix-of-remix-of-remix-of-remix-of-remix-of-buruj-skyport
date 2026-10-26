ALTER TABLE public.news_posts
  ADD COLUMN IF NOT EXISTS body_html text,
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS canonical_url text,
  ADD COLUMN IF NOT EXISTS social_image_path text,
  ADD COLUMN IF NOT EXISTS seo_author text,
  ADD COLUMN IF NOT EXISTS article_section text,
  ADD COLUMN IF NOT EXISTS schema_publisher text;

ALTER TABLE public.splash_slides
  ADD COLUMN IF NOT EXISTS media_kind text NOT NULL DEFAULT 'image' CHECK (media_kind IN ('image','video','youtube','none')),
  ADD COLUMN IF NOT EXISTS video_path text,
  ADD COLUMN IF NOT EXISTS youtube_url text,
  ADD COLUMN IF NOT EXISTS alt_text text,
  ADD COLUMN IF NOT EXISTS link_url text;

CREATE TABLE IF NOT EXISTS public.news_post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.news_posts(id) ON DELETE CASCADE,
  sort integer NOT NULL DEFAULT 0,
  kind text NOT NULL CHECK (kind IN ('image','video','youtube')),
  storage_path text,
  external_url text,
  alt_text text,
  caption text,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT news_post_media_source_check CHECK (
    (kind = 'youtube' AND external_url IS NOT NULL AND storage_path IS NULL)
    OR (kind IN ('image','video') AND storage_path IS NOT NULL AND external_url IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.content_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  sort integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.social_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('youtube','instagram','facebook')),
  label text NOT NULL,
  source_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  display_limit integer NOT NULL DEFAULT 6 CHECK (display_limit BETWEEN 1 AND 24),
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.content_categories (name, slug, sort)
VALUES ('Academy News', 'academy-news', 1), ('Admissions', 'admissions', 2), ('Matchday', 'matchday', 3), ('Community', 'community', 4)
ON CONFLICT (slug) DO NOTHING;

GRANT SELECT ON public.news_post_media, public.content_categories, public.social_feeds TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.news_post_media, public.content_categories, public.social_feeds TO authenticated;
GRANT ALL ON public.news_post_media, public.content_categories, public.social_feeds TO service_role;

ALTER TABLE public.news_post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_feeds ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'news_post_media' AND policyname = 'Anyone reads article media') THEN CREATE POLICY "Anyone reads article media" ON public.news_post_media FOR SELECT TO anon, authenticated USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'news_post_media' AND policyname = 'Admins manage article media') THEN CREATE POLICY "Admins manage article media" ON public.news_post_media FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid())); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'content_categories' AND policyname = 'Anyone reads active categories') THEN CREATE POLICY "Anyone reads active categories" ON public.content_categories FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin(auth.uid())); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'content_categories' AND policyname = 'Admins manage categories') THEN CREATE POLICY "Admins manage categories" ON public.content_categories FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid())); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'social_feeds' AND policyname = 'Anyone reads active social feeds') THEN CREATE POLICY "Anyone reads active social feeds" ON public.social_feeds FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin(auth.uid())); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'social_feeds' AND policyname = 'Admins manage social feeds') THEN CREATE POLICY "Admins manage social feeds" ON public.social_feeds FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid())); END IF;
END $$;
