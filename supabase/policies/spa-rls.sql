-- SPA conversion — RLS policy set (Phase 2)
-- Apply in the Supabase SQL editor. Review each block before running.

-- 1. PUBLIC PLAYER VIEW (minors' DOB protection) --------------------------
create or replace view public_players_view as
select p.id, p.slug, p.full_name, p.jersey_number, p.position,
       p.secondary_position, p.preferred_foot, p.programme, p.avatar_url,
       p.bio, p.overall_rating, p.pace, p.technical, p.tactical, p.physical,
       p.passing, p.finishing, p.video_cv_url, p.joined_on, p.cv_summary,
       p.updated_at, p.is_published,
       case when p.date_of_birth is null then null
            else date_part('year', age(p.date_of_birth))::int end as age,
       case when p.date_of_birth is null then null
            else extract(year from p.date_of_birth)::int end as birth_year
from player_profiles p
where p.is_published = true;

create or replace view public_squad_view as
select p.slug, p.full_name, p.jersey_number, p.position,
       p.secondary_position, p.preferred_foot, p.programme, p.avatar_url,
       case when p.date_of_birth is null then null
            else date_part('year', age(p.date_of_birth))::int end as age,
       case when p.date_of_birth is null then null
            else extract(year from p.date_of_birth))::int end as birth_year
from player_profiles p
where p.is_published = true;

-- 2. TABLE POLICIES -------------------------------------------------------
alter table programmes enable row level security;
create policy "anon read published programmes" on programmes
  for select using (is_published = true);

alter table site_settings enable row level security;
create policy "anon read settings" on site_settings
  for select using (id = 1);
create policy "admin update settings" on site_settings
  for update using (is_admin()) with check (is_admin());

alter table applications enable row level security;
create policy "anon submit application" on applications
  for insert with check (status = 'submitted');
create policy "staff read applications" on applications
  for select using (is_staff());
create policy "admin review application" on applications
  for update using (is_admin()) with check (is_admin());

-- Parent portal (hardest policy — fallback: Edge Function)
create policy "parent reads own approved applications" on applications
  for select using (
    lower(guardian_email) = lower(auth.jwt() ->> 'email')
    and exists (
      select 1 from parent_access_requests r
      where lower(r.email) = lower(auth.jwt() ->> 'email')
        and r.status = 'sent'
        and r.reference_number = applications.reference_number
    )
  );

alter table application_documents enable row level security;
create policy "staff read application docs" on application_documents
  for select using (is_staff());

alter table player_profiles enable row level security;
create policy "staff manage players" on player_profiles
  for all using (is_staff()) with check (is_staff());

alter table player_season_stats enable row level security;
alter table player_milestones enable row level security;
alter table player_media enable row level security;
alter table player_compliance enable row level security;
alter table player_registration_history enable row level security;
alter table player_documents enable row level security;
create policy "staff stats" on player_season_stats
  for all using (is_staff()) with check (is_staff());
create policy "staff milestones" on player_milestones
  for all using (is_staff()) with check (is_staff());
create policy "staff media" on player_media
  for all using (is_staff()) with check (is_staff());
create policy "staff compliance" on player_compliance
  for all using (is_staff()) with check (is_staff());
create policy "staff registration history" on player_registration_history
  for all using (is_staff()) with check (is_staff());
create policy "staff documents" on player_documents
  for all using (is_staff()) with check (is_staff());

alter table user_roles enable row level security;
create policy "staff read roles" on user_roles
  for select using (is_staff());

alter table profiles enable row level security;
create policy "staff read profiles" on profiles
  for select using (is_staff());

alter table player_cv_requests enable row level security;
create policy "anon request cv" on player_cv_requests
  for insert with check (true);
create policy "staff read cv requests" on player_cv_requests
  for select using (is_staff());
create policy "staff update cv requests" on player_cv_requests
  for update using (is_staff()) with check (is_staff());

alter table parent_access_requests enable row level security;
create policy "parent reads own access requests" on parent_access_requests
  for select using (lower(email) = lower(auth.jwt() ->> 'email'));

-- 3. STORAGE POLICIES -----------------------------------------------------
-- player-profile-media: staff write under playerId/purpose/, signed reads only
create policy "staff upload player media" on storage.objects
  for insert with check (
    bucket_id = 'player-profile-media' and is_staff()
  );
create policy "staff remove player media" on storage.objects
  for delete using (
    bucket_id = 'player-profile-media' and is_staff()
  );

-- player-documents: staff write, signed reads only
create policy "staff upload player documents" on storage.objects
  for insert with check (
    bucket_id = 'player-documents' and is_staff()
  );
create policy "staff remove player documents" on storage.objects
  for delete using (
    bucket_id = 'player-documents' and is_staff()
  );

-- application-documents: NO anon policies — Edge Functions only (Phase 3)

-- 4. REFERENCE NUMBER TRIGGER (verify existing) ---------------------------
-- If applications.reference_number is not DB-generated, add:
-- create function gen_reference() returns trigger as $$
-- begin
--   if new.reference_number is null then
--     new.reference_number := 'BSA-' || upper(substr(md5(random()::text), 1, 8));
--   end if;
--   return new;
-- end $$ language plpgsql security definer set search_path = '';
-- create trigger applications_reference before insert on applications
--   for each row execute function gen_reference();

-- 5. PENETRATION TEST CHECKLIST -------------------------------------------
-- [ ] anon: select date_of_birth from player_profiles        -> must FAIL
-- [ ] anon: select * from applications                        -> must FAIL
-- [ ] anon: select * from user_roles                          -> must FAIL
-- [ ] anon: update site_settings                              -> must FAIL
-- [ ] coach: update applications set status = ...             -> must FAIL
-- [ ] coach: select parent_access_requests                    -> must FAIL
-- [ ] parent (approved email): select own applications         -> must PASS
-- [ ] anon: insert into applications (valid payload)          -> must PASS
