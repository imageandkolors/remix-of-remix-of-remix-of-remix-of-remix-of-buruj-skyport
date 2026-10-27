CREATE TABLE IF NOT EXISTS public.about_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  sort integer NOT NULL DEFAULT 0,
  layout text NOT NULL DEFAULT 'content' CHECK (layout IN ('hero','content','split','cards','cta')),
  eyebrow text,
  title text NOT NULL,
  body_html text NOT NULL DEFAULT '',
  image_path text,
  image_alt text,
  bg_color text NOT NULL DEFAULT '#ffffff',
  text_color text NOT NULL DEFAULT '#0b1f3a',
  accent_color text NOT NULL DEFAULT '#e7b93e',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.about_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.about_sections TO authenticated;
GRANT ALL ON public.about_sections TO service_role;
ALTER TABLE public.about_sections ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='about_sections' AND policyname='Anyone reads active about sections') THEN CREATE POLICY "Anyone reads active about sections" ON public.about_sections FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin(auth.uid())); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='about_sections' AND policyname='Admins manage about sections') THEN CREATE POLICY "Admins manage about sections" ON public.about_sections FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid())); END IF;
END $$;
INSERT INTO public.about_sections (section_key, sort, layout, eyebrow, title, body_html, bg_color, text_color, accent_color)
VALUES
('hero', 1, 'hero', 'About the academy', 'Discipline. Development. Destiny.', '<p>Buruj Sports Academy offers a unique and intensive residential experience that combines top-tier football training, career-building exposure, and a supportive environment for athletic and personal development. We identify and groom elite football talent, opening doors to national recognition and international football trials.</p>', '#0b1f3a', '#ffffff', '#e7b93e'),
('story', 2, 'split', 'Our story', 'Excellence since 2013', '<p>Buruj Sports Academy was founded to give young Nigerian talent a structured, safe and ambitious route into professional football — without sacrificing education. Our commitment is to nurture talent, instill discipline, and create real football opportunities.</p><h3>2013</h3><p>Buruj FC & Sports Academy founded in Ikorodu, Lagos.</p><h3>Growth</h3><p>Residential boarding and the Play & Study model introduced.</p><h3>Today</h3><p>International trial showcases and national team call-ups continue to open pathways for players.</p>', '#ffffff', '#0b1f3a', '#e7b93e'),
('leadership', 3, 'cards', 'Leadership', 'The people behind Buruj', '<h3>Founder — Dr. Salaudeen Waheed Buruj</h3><p>Visionary founder who established the academy in 2013 to develop talent on and off the pitch.</p><h3>Club Patron</h3><p>Champions the academy mission and partnerships across the football community.</p><h3>Academy Matron</h3><p>Leads boarding life and pastoral care for every resident player.</p>', '#f2f4f7', '#0b1f3a', '#e7b93e'),
('philosophy', 4, 'content', 'How we work', 'Coaching philosophy & safety', '<p>Every player is supported by two dedicated teams working side by side — a Coaching Team for development and a 24/7 Welfare Team for care.</p><h3>Certified coaching</h3><p>Structured technical, tactical, physical and mental development.</p><h3>Academic excellence</h3><p>Full Nigerian curriculum from JSS1 to SS3 with qualified teachers.</p><h3>24/7 welfare</h3><p>Round-the-clock pastoral care, health supervision and boarding support.</p>', '#ffffff', '#0b1f3a', '#e7b93e'),
('life', 5, 'content', 'Beyond the pitch', 'A complete environment for growth', '<p>We go beyond sports — nurturing young talents academically, athletically and morally, setting them on a clear path to success.</p><h3>Residential life</h3><p>Clean, secure accommodation, nutritious meals and health checks.</p><h3>Global pathway</h3><p>Professional club trials abroad, scholarships and national team selections.</p>', '#0b1f3a', '#ffffff', '#e7b93e'),
('cta', 6, 'cta', 'Your next chapter', 'Explore our programmes', '<p>Discover a structured route into football, education and personal growth.</p>', '#e7b93e', '#0b1f3a', '#0b1f3a')
ON CONFLICT (section_key) DO NOTHING;
