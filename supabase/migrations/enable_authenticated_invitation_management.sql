grant usage on schema public to anon, authenticated;
grant select on public.invitations to anon;
grant select, insert, update, delete on public.invitations to authenticated;
grant usage, select on sequence public.invitations_id_seq to authenticated;

drop policy if exists "Public can read published invitations" on public.invitations;
create policy "Public can read published invitations"
on public.invitations
for select
to anon
using (is_published = true);

drop policy if exists "Authenticated can manage invitations" on public.invitations;
create policy "Authenticated can manage invitations"
on public.invitations
for all
to authenticated
using (true)
with check (true);
