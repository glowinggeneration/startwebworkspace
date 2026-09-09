-- Phase 4: RBAC hardening — audit logging, rate limiting, workspace
-- invitations, and the client-role scoping foundation. See
-- src/lib/platform/README.md for how audit-log.server.ts and
-- rate-limit.server.ts expect these tables to be shaped.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_table text not null,
  resource_id text,
  metadata jsonb not null default '{}',
  ip text,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;
revoke all on public.audit_log from anon, authenticated;
grant select on public.audit_log to authenticated;
grant all on public.audit_log to service_role;

-- Every writer goes through this function (no direct INSERT grant to
-- authenticated), so actor_id always comes from the caller's real
-- session, never a client-supplied value.
create or replace function public.log_audit_event(
  _action text,
  _resource_table text,
  _resource_id text default null,
  _metadata jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, action, resource_table, resource_id, metadata)
  values (auth.uid(), _action, _resource_table, _resource_id, coalesce(_metadata, '{}'));
end;
$$;
revoke execute on function public.log_audit_event(text, text, text, jsonb) from public, anon;
grant execute on function public.log_audit_event(text, text, text, jsonb) to authenticated;

create table public.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket_key text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_hits_bucket_key_created_at_idx on public.rate_limit_hits (bucket_key, created_at);

alter table public.rate_limit_hits enable row level security;
revoke all on public.rate_limit_hits from anon, authenticated;
grant all on public.rate_limit_hits to service_role;
-- No authenticated grant at all: this table is only ever touched by the
-- service-role client from a server function (see
-- createSupabaseRateLimitStore), never directly by a signed-in user, and
-- login/signup rate limiting must work for people who aren't signed in
-- yet.

create or replace function public.prune_rate_limit_hits(p_older_than interval default interval '1 day')
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limit_hits where created_at < now() - p_older_than;
$$;
revoke execute on function public.prune_rate_limit_hits(interval) from public, anon, authenticated;

-- Client-role scoping foundation: a client-role member represents one
-- external account, not the whole workspace.
alter table public.workspace_members
  add column client_account_id uuid references public.accounts(id) on delete set null;

alter table public.workspace_members
  add constraint workspace_members_client_role_needs_account
  check (role <> 'client' or client_account_id is not null);

create or replace function public.is_client_role(_user_id uuid, _workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'client' from public.workspace_members
     where user_id = _user_id and workspace_id = _workspace_id),
    false
  )
$$;
revoke execute on function public.is_client_role(uuid, uuid) from public, anon;
grant execute on function public.is_client_role(uuid, uuid) to authenticated;

create or replace function public.client_account_id_for(_user_id uuid, _workspace_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_account_id from public.workspace_members
  where user_id = _user_id and workspace_id = _workspace_id
$$;
revoke execute on function public.client_account_id_for(uuid, uuid) from public, anon, authenticated;

create or replace function public.can_view_account(_user_id uuid, _workspace_id uuid, _account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_workspace_member(_user_id, _workspace_id)
    and (
      not public.is_client_role(_user_id, _workspace_id)
      or public.client_account_id_for(_user_id, _workspace_id) = _account_id
    )
$$;
revoke execute on function public.can_view_account(uuid, uuid, uuid) from public, anon;
grant execute on function public.can_view_account(uuid, uuid, uuid) to authenticated;

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role public.workspace_role not null,
  client_account_id uuid references public.accounts(id) on delete set null,
  token uuid not null default gen_random_uuid() unique,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  constraint workspace_invitations_client_role_needs_account
    check (role <> 'client' or client_account_id is not null)
);

alter table public.workspace_invitations enable row level security;
revoke all on public.workspace_invitations from anon, authenticated;
grant select, insert, update, delete on public.workspace_invitations to authenticated;
grant select on public.workspace_invitations to anon;
grant all on public.workspace_invitations to service_role;

create policy "Owners and admins can read workspace invitations" on public.workspace_invitations
  for select to authenticated
  using (
    public.has_workspace_role(auth.uid(), workspace_id, 'owner')
    or public.has_workspace_role(auth.uid(), workspace_id, 'admin')
  );
create policy "Owners and admins can create invitations" on public.workspace_invitations
  for insert to authenticated
  with check (
    public.has_workspace_role(auth.uid(), workspace_id, 'owner')
    or public.has_workspace_role(auth.uid(), workspace_id, 'admin')
  );
create policy "Owners and admins can revoke invitations" on public.workspace_invitations
  for delete to authenticated
  using (
    public.has_workspace_role(auth.uid(), workspace_id, 'owner')
    or public.has_workspace_role(auth.uid(), workspace_id, 'admin')
  );
create policy "Anyone with the token can read one invitation" on public.workspace_invitations
  for select to anon, authenticated
  using (true);

create or replace function public.accept_workspace_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation public.workspace_invitations%rowtype;
  v_email text;
begin
  select * into v_invitation from public.workspace_invitations where token = p_token;
  if v_invitation.id is null then
    raise exception 'Invitation not found';
  end if;
  if v_invitation.accepted_at is not null then
    raise exception 'Invitation already accepted';
  end if;
  if v_invitation.expires_at < now() then
    raise exception 'Invitation has expired';
  end if;

  select email into v_email from auth.users where id = auth.uid();
  if v_email is null or lower(v_email) <> lower(v_invitation.email) then
    raise exception 'This invitation was sent to a different email address';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role, client_account_id)
  values (v_invitation.workspace_id, auth.uid(), v_invitation.role, v_invitation.client_account_id)
  on conflict (workspace_id, user_id) do nothing;

  update public.workspace_invitations
  set accepted_at = now(), accepted_by = auth.uid()
  where id = v_invitation.id;

  perform public.log_audit_event(
    'role.grant',
    'workspace_members',
    v_invitation.workspace_id::text,
    jsonb_build_object('role', v_invitation.role, 'via', 'invitation')
  );

  return v_invitation.workspace_id;
end;
$$;
revoke execute on function public.accept_workspace_invitation(uuid) from public, anon;
grant execute on function public.accept_workspace_invitation(uuid) to authenticated;

create or replace function public.get_invitation_preview(p_token uuid)
returns table (workspace_name text, role public.workspace_role, email text, is_expired boolean, is_accepted boolean)
language sql
stable
security definer
set search_path = public
as $$
  select w.name, i.role, i.email, i.expires_at < now(), i.accepted_at is not null
  from public.workspace_invitations i
  join public.workspaces w on w.id = i.workspace_id
  where i.token = p_token
$$;
revoke execute on function public.get_invitation_preview(uuid) from public;
grant execute on function public.get_invitation_preview(uuid) to anon, authenticated;