-- The original seed used ON CONFLICT without a stable unique key, so replaying
-- it could create a second campus row. No duplicate normalized names exist in
-- staging; this expression index makes that seed safe to replay.
CREATE UNIQUE INDEX IF NOT EXISTS contact_locations_name_normalized_uidx
  ON public.contact_locations (lower(btrim(name)));

INSERT INTO public.contact_locations (name, address, sort)
VALUES (
  'Buruj Sports Academy Campus',
  '8, Adeniran Oshodi Street, Ogolonto, Ikorodu, Lagos',
  1
)
ON CONFLICT DO NOTHING;
