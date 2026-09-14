-- Security hardening pass. Two independent fixes, each safe to apply on
-- its own and neither destructive — see the security audit for the full
-- writeup of each finding. (A third fix, audit logging for account
-- deletion and invitation revocation, is application code, not SQL —
-- see the note at the end of this file.)

-- ---------------------------------------------------------------------
-- 1. Auto-join fired before email ownership was ever verified.
--
-- auto_join_invited_workspaces() ran on every `AFTER INSERT ON auth.users`
-- — the instant Supabase creates the row, before the user has clicked a
-- confirmation link. Anyone who knew (or guessed) an invited email address
-- could call signUp() with it and immediately become a workspace member at
-- the invited role, with no proof they control that inbox.
--
-- Fixed two ways: the trigger now only fires once email_confirmed_at is
-- actually set (covers both an AFTER INSERT where Supabase auto-confirms,
-- if "Confirm email" is off, and the AFTER UPDATE moment when a real
-- confirmation link is clicked, if it's on), and the function itself
-- re-checks the same condition so it's safe regardless of how it's
-- invoked. This does NOT replace the dashboard setting — "Confirm email"
-- should also be verified as enabled in Supabase/Lovable Cloud Auth
-- settings; this migration can't read or change that from SQL.
create or replace function public.auto_join_invited_workspaces()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is null then
    return new;
  end if;

  insert into public.workspace_members (workspace_id, user_id, role, client_account_id)
  select i.workspace_id, new.id, i.role, i.client_account_id
  from public.workspace_invitations i
  where lower(i.email) = lower(new.email)
    and i.accepted_at is null
    and i.expires_at > now()
  on conflict do nothing;

  update public.workspace_invitations
  set accepted_at = now(), accepted_by = new.id
  where lower(email) = lower(new.email)
    and accepted_at is null
    and expires_at > now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_auto_join on auth.users;
create trigger on_auth_user_created_auto_join
after insert or update of email_confirmed_at on auth.users
for each row
when (new.email_confirmed_at is not null)
execute function public.auto_join_invited_workspaces();

-- ---------------------------------------------------------------------
-- 2. `profiles` was readable workspace-wide regardless of role.
--
-- The "Workspace colleagues are readable" policy used shares_workspace(),
-- which only checks common membership — a client-role member could query
-- `profiles` directly and get every internal staff member's name, email,
-- job title and avatar. can_view_account() and friends already keep client
-- members scoped to their own account everywhere else; this closes the one
-- table that wasn't covered. A user can still always read their own row.
create or replace function public.can_view_profile(_viewer uuid, _target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select _viewer = _target
    or exists (
      select 1
      from public.workspace_members a
      join public.workspace_members b on a.workspace_id = b.workspace_id
      where a.user_id = _viewer
        and b.user_id = _target
        and not public.is_client_role(_viewer, a.workspace_id)
    )
$$;
revoke all on function public.can_view_profile(uuid, uuid) from public, anon;
grant execute on function public.can_view_profile(uuid, uuid) to authenticated;

drop policy if exists "Workspace colleagues are readable" on public.profiles;
create policy "Workspace colleagues are readable"
on public.profiles
for select
to authenticated
using (public.can_view_profile(auth.uid(), id));

-- Note: audit logging for account deletion and invitation revocation is
-- added in application code (src/hooks/use-accounts.ts,
-- src/hooks/use-invitations.ts) using the existing logAuditEvent() /
-- log_audit_event() RPC, matching how useCreateInvitation already logs
-- role.grant — no schema change needed for that fix.
