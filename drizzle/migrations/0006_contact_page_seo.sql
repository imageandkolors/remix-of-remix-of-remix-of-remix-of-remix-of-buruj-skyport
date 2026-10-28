ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_heading text NOT NULL DEFAULT 'Come and see Buruj';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS contact_intro text NOT NULL DEFAULT 'Visit the campus, chat with us on WhatsApp, or send an enquiry — no account needed.';

CREATE TABLE IF NOT EXISTS public.contact_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  phone text,
  email text,
  whatsapp text,
  map_url text,
  sort integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contact_locations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.contact_locations TO authenticated;
GRANT ALL ON public.contact_locations TO service_role;
ALTER TABLE public.contact_locations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_locations' AND policyname='Anyone reads active contact locations') THEN CREATE POLICY "Anyone reads active contact locations" ON public.contact_locations FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin(auth.uid())); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_locations' AND policyname='Admins manage contact locations') THEN CREATE POLICY "Admins manage contact locations" ON public.contact_locations FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid())); END IF;
END $$;
INSERT INTO public.contact_locations (name,address,sort) VALUES ('Buruj Sports Academy Campus','8, Adeniran Oshodi Street, Ogolonto, Ikorodu, Lagos',1) ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.page_seo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key text NOT NULL UNIQUE,
  page_path text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  keywords text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image_path text,
  og_type text NOT NULL DEFAULT 'website',
  twitter_card text NOT NULL DEFAULT 'summary_large_image',
  robots text NOT NULL DEFAULT 'index,follow',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.page_seo TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.page_seo TO authenticated;
GRANT ALL ON public.page_seo TO service_role;
ALTER TABLE public.page_seo ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='page_seo' AND policyname='Anyone reads page SEO') THEN CREATE POLICY "Anyone reads page SEO" ON public.page_seo FOR SELECT TO anon, authenticated USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='page_seo' AND policyname='Admins manage page SEO') THEN CREATE POLICY "Admins manage page SEO" ON public.page_seo FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid())); END IF;
END $$;
INSERT INTO public.page_seo (page_key,page_path,title,description,og_title,og_description) VALUES
('home','/','Buruj Sports Academy — Football, Education & Opportunity','Residential football academy in Ikorodu, Lagos combining elite coaching, education and player welfare.','Buruj Sports Academy','Football, education and opportunity for the next generation.'),
('about','/about','About Buruj Sports Academy — Our Story Since 2013','The story, people, values and complete development environment of Buruj Sports Academy.','About Buruj Sports Academy','Our history, leadership, coaching philosophy and pathway to global success.'),
('contact','/contact','Contact & Campus — Buruj Sports Academy, Ikorodu','Visit Buruj Sports Academy in Ikorodu, Lagos, chat on WhatsApp or send an enquiry.','Contact Buruj Sports Academy','Campus address, WhatsApp and enquiry form.'),
('programmes','/programmes','Programmes — Buruj Sports Academy','Explore football development, education and residential programmes at Buruj Sports Academy.','Buruj Programmes','Find the right football and education pathway.'),
('players','/players','Squad — Buruj Sports Academy','Meet the players developing through Buruj Sports Academy.','Buruj Squad','Meet our academy players.'),
('news','/news','News — Buruj Sports Academy','Academy news, updates and football stories from Buruj Sports Academy.','Buruj News','Academy updates and football stories.'),
('gallery','/gallery','Media & Matchday — Buruj Sports Academy','Photos and videos from Buruj Sports Academy.','Buruj Media','Matchday and campus media.'),
('admissions','/admissions','Admissions — Buruj Sports Academy','Start your application to Buruj Sports Academy.','Buruj Admissions','Apply to join the academy.'),
('portal','/portal','Parent Portal — Buruj Sports Academy','Secure parent access to academy updates.','Buruj Parent Portal','Secure parent access.'),
('privacy','/privacy-policy','Privacy Policy — Buruj Sports Academy','How Buruj Sports Academy handles personal information.','Buruj Privacy Policy','Our privacy policy.')
ON CONFLICT (page_key) DO NOTHING;
