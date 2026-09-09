create or replace function public.shares_workspace(_viewer uuid, _target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members a
    join public.workspace_members b on a.workspace_id = b.workspace_id
    where a.user_id = _viewer and b.user_id = _target
  )
$$;

revoke all on function public.shares_workspace(uuid, uuid) from public, anon;
grant execute on function public.shares_workspace(uuid, uuid) to authenticated;

drop policy if exists "Workspace colleagues are readable" on public.profiles;
create policy "Workspace colleagues are readable"
on public.profiles
for select
to authenticated
using (public.shares_workspace(auth.uid(), id));