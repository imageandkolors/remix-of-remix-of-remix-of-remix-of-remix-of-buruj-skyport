ALTER TABLE public.player_profiles
  ADD COLUMN overall_rating int, ADD COLUMN pace int, ADD COLUMN technical int, ADD COLUMN tactical int,
  ADD COLUMN physical int, ADD COLUMN passing int, ADD COLUMN finishing int,
  ADD COLUMN video_cv_url text, ADD COLUMN joined_on date, ADD COLUMN cv_summary text;

CREATE OR REPLACE FUNCTION public.player_is_public(_player uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT EXISTS (SELECT 1 FROM public.player_profiles WHERE id = _player AND is_published) $$;

CREATE TABLE public.player_season_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  season text NOT NULL,
  appearances int NOT NULL DEFAULT 0, minutes int NOT NULL DEFAULT 0,
  goals int NOT NULL DEFAULT 0, assists int NOT NULL DEFAULT 0,
  clean_sheets int NOT NULL DEFAULT 0, yellow_cards int NOT NULL DEFAULT 0,
  red_cards int NOT NULL DEFAULT 0, motm int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_id, season)
);
GRANT SELECT ON public.player_season_stats TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_season_stats TO authenticated;
GRANT ALL ON public.player_season_stats TO service_role;
ALTER TABLE public.player_season_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read stats of public players" ON public.player_season_stats FOR SELECT TO anon, authenticated USING (public.player_is_public(player_id) OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage stats" ON public.player_season_stats FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.player_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('before','now','future')),
  title text NOT NULL,
  description text,
  event_date date,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.player_milestones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_milestones TO authenticated;
GRANT ALL ON public.player_milestones TO service_role;
ALTER TABLE public.player_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read milestones of public players" ON public.player_milestones FOR SELECT TO anon, authenticated USING (public.player_is_public(player_id) OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage milestones" ON public.player_milestones FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.player_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES public.player_profiles(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('photo','video')),
  url text NOT NULL,
  caption text,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.player_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_media TO authenticated;
GRANT ALL ON public.player_media TO service_role;
ALTER TABLE public.player_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read media of public players" ON public.player_media FOR SELECT TO anon, authenticated USING (public.player_is_public(player_id) OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage media" ON public.player_media FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));