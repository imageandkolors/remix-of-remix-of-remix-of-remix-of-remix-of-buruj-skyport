DROP POLICY IF EXISTS "Anyone reads article media" ON public.news_post_media;
DROP POLICY IF EXISTS "Anyone reads published article media" ON public.news_post_media;

CREATE POLICY "Anyone reads published article media"
  ON public.news_post_media
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.news_posts AS post
      WHERE post.id = news_post_media.post_id
        AND post.published = true
    )
  );
