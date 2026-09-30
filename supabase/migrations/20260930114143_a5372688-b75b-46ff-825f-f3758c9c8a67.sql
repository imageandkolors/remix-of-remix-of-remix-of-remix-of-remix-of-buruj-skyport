create type public.app_role as enum ('parent','player','coach','admin','owner');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role in ('admin','owner')) $$;

create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid()=user_id or public.is_staff(auth.uid()));
create policy "Owner manages roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'owner')) with check (public.has_role(auth.uid(),'owner'));

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text, approved boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "Own profile read" on public.profiles for select to authenticated using (auth.uid()=id or public.is_staff(auth.uid()));
create policy "Own profile update" on public.profiles for update to authenticated using (auth.uid()=id or public.is_staff(auth.uid()));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id, full_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.programmes (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, name text not null,
  age_range text, fee_amount numeric, fee_period text default 'year',
  fee_confirmed boolean not null default false,
  inclusions text[] not null default '{}',
  updated_at timestamptz not null default now()
);
grant select on public.programmes to anon, authenticated;
grant insert, update, delete on public.programmes to authenticated;
grant all on public.programmes to service_role;
alter table public.programmes enable row level security;
create policy "Public read programmes" on public.programmes for select to anon, authenticated using (true);
create policy "Staff manage programmes" on public.programmes for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

insert into public.programmes(slug,name,age_range,inclusions) values
('play-study','Play & Study','Ages 9–18 · JSS 1 – SS 3',array['Academic tuition (JSS 1 – SS 3)','Residential boarding','Daily elite training','Meals & welfare care','International trial pathway']),
('football-camping','Football Camping','Ages 9–22',array['Residential camp','Twice-daily training','Match exposure','Meals & welfare care','International trial pathway']);

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text, phone text, programme text, message text not null,
  status text not null default 'new', created_at timestamptz not null default now()
);
grant insert on public.enquiries to anon, authenticated;
grant select, update on public.enquiries to authenticated;
grant all on public.enquiries to service_role;
alter table public.enquiries enable row level security;
create policy "Anyone can enquire" on public.enquiries for insert to anon, authenticated with check (length(name) between 1 and 120 and length(message) between 1 and 3000);
create policy "Staff read enquiries" on public.enquiries for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff update enquiries" on public.enquiries for update to authenticated using (public.is_staff(auth.uid()));

create table public.trial_registrations (
  id uuid primary key default gen_random_uuid(),
  player_name text not null, date_of_birth date, position text,
  guardian_name text not null, guardian_phone text not null, guardian_email text,
  programme text, status text not null default 'pending', created_at timestamptz not null default now()
);
grant insert on public.trial_registrations to anon, authenticated;
grant select, update on public.trial_registrations to authenticated;
grant all on public.trial_registrations to service_role;
alter table public.trial_registrations enable row level security;
create policy "Anyone can register for trials" on public.trial_registrations for insert to anon, authenticated with check (length(player_name) between 1 and 120 and length(guardian_phone) between 5 and 30);
create policy "Staff read trials" on public.trial_registrations for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff update trials" on public.trial_registrations for update to authenticated using (public.is_staff(auth.uid()));

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null, excerpt text, body text, published boolean not null default false,
  published_at timestamptz default now(), created_at timestamptz not null default now()
);
grant select on public.news_posts to anon, authenticated;
grant insert, update, delete on public.news_posts to authenticated;
grant all on public.news_posts to service_role;
alter table public.news_posts enable row level security;
create policy "Public read published news" on public.news_posts for select to anon, authenticated using (published or public.is_staff(auth.uid()));
create policy "Staff manage news" on public.news_posts for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

insert into public.news_posts(title,excerpt,published) values
('Trial showcase squad announced','Selected players prepare for the upcoming European trial showcase.',true),
('New term resumes for Play & Study','Boarders return to campus in Ikorodu for the new academic term.',true),
('Weekend friendly: Buruj U17 win 3–1','A composed display from our U17 side in Ikorodu.',true);

create policy "Users manage own media" on storage.objects for all to authenticated
  using (bucket_id='player-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff(auth.uid())))
  with check (bucket_id='player-media' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff(auth.uid())));