CREATE TABLE IF NOT EXISTS public.social_feed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id uuid NOT NULL REFERENCES public.social_feeds(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Academy video',
  video_url text NOT NULL,
  thumbnail_url text,
  sort integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_feed_items_feed_sort_idx
  ON public.social_feed_items(feed_id, sort, created_at);

GRANT SELECT ON public.social_feed_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.social_feed_items TO authenticated;
GRANT ALL ON public.social_feed_items TO service_role;
ALTER TABLE public.social_feed_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='social_feed_items' AND policyname='Anyone reads active social feed items') THEN
    CREATE POLICY "Anyone reads active social feed items" ON public.social_feed_items FOR SELECT TO anon, authenticated USING (is_active OR public.is_admin(auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='social_feed_items' AND policyname='Admins manage social feed items') THEN
    CREATE POLICY "Admins manage social feed items" ON public.social_feed_items FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;
