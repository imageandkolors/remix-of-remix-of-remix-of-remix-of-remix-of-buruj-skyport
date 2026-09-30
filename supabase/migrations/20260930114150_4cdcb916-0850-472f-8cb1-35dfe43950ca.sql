revoke execute on function public.has_role(uuid, app_role) from public, anon;
revoke execute on function public.is_staff(uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
drop policy "Public read published news" on public.news_posts;
create policy "Anon read published news" on public.news_posts for select to anon using (published);
create policy "Auth read news" on public.news_posts for select to authenticated using (published or public.is_staff(auth.uid()));