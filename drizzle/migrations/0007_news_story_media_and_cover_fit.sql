ALTER TABLE public.news_posts
  ADD COLUMN IF NOT EXISTS cover_fit text NOT NULL DEFAULT 'contain',
  ADD COLUMN IF NOT EXISTS cover_position text NOT NULL DEFAULT 'center';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'news_posts_cover_fit_check'
  ) THEN
    ALTER TABLE public.news_posts
      ADD CONSTRAINT news_posts_cover_fit_check CHECK (cover_fit IN ('contain','cover'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS news_post_media_post_sort_idx
  ON public.news_post_media(post_id, sort, created_at);
