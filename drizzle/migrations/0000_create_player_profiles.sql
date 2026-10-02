CREATE TABLE public.player_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  slug text NOT NULL UNIQUE,
  full_name text NOT NULL,
  jersey_number int,
  position text NOT NULL DEFAULT 'MID' CHECK (position IN ('GK','DEF','MID','FWD')),
  secondary_position text,
  preferred_foot text CHECK (preferred_foot IN ('Left','Right','Both')),
  date_of_birth date,
  height_cm int,
  weight_kg int,
  nationality text DEFAULT 'Nigerian',
  programme text,
  avatar_url text,
  bio text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.player_profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.player_profiles TO authenticated;
GRANT ALL ON public.player_profiles TO service_role;
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published players" ON public.player_profiles FOR SELECT TO anon USING (is_published);
CREATE POLICY "Auth read players" ON public.player_profiles FOR SELECT TO authenticated USING (is_published OR user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "Staff manage players" ON public.player_profiles FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER player_profiles_touch BEFORE UPDATE ON public.player_profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();