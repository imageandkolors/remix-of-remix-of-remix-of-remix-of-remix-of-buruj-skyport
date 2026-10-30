-- Replace an article's media gallery in one transaction. If any row violates
-- the table's source constraint or FK, PostgreSQL rolls back the delete too.
CREATE OR REPLACE FUNCTION public.replace_news_post_media(
  p_post_id uuid,
  p_media jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  IF p_media IS NULL OR jsonb_typeof(p_media) <> 'array' THEN
    RAISE EXCEPTION 'Media must be a JSON array';
  END IF;

  DELETE FROM public.news_post_media
   WHERE post_id = p_post_id;

  INSERT INTO public.news_post_media (
    post_id, sort, kind, storage_path, external_url, alt_text, caption, mime_type
  )
  SELECT
    p_post_id,
    media_item.sort,
    media_item.kind,
    media_item.storage_path,
    media_item.external_url,
    media_item.alt_text,
    media_item.caption,
    media_item.mime_type
  FROM jsonb_to_recordset(p_media) AS media_item(
    sort integer,
    kind text,
    storage_path text,
    external_url text,
    alt_text text,
    caption text,
    mime_type text
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.replace_news_post_media(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_news_post_media(uuid, jsonb) TO authenticated, service_role;
