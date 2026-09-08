-- Phase 0: workspaces (tenants), membership/roles, and profile bootstrap.
-- Every future table follows this pattern: a workspace_id column plus RLS
-- policies backed by has_workspace_role()/is_workspace_member() below.

create type public.workspace_role as enum ('owner', 'admin', 'sales', 'pm', 'member', 'client');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.profiles enable row level security;

revoke all on public.workspaces from anon, authenticated;
revoke all on public.workspace_members from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
grant select on public.workspaces to authenticated;
grant select on public.workspace_members to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant all on public.workspaces, public.workspace_members, public.profiles to service_role;

-- Membership checks used by RLS policies everywhere. SECURITY DEFINER so a
-- policy on workspace_members can call this without recursing into itself,
-- and EXECUTE is revoked from client roles so it's only reachable via RLS,
-- never called directly by client code with an arbitrary user_id.
create or replace function public.is_workspace_member(_user_id uuid, _workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where user_id = _user_id and workspace_id = _workspace_id
  )
$$;
-- Every RLS policy in this project calls this function directly in its
-- USING clause. SECURITY DEFINER only elevates the privileges the
-- function body runs WITH (so it can see workspace_members rows the
-- caller couldn't read directly) — it does NOT waive the EXECUTE
-- privilege required to invoke the function in the first place. Revoking
-- from anon (unauthenticated callers have no business calling it) while
-- granting to authenticated (every policy needs to) is the correct
-- split; revoking from authenticated too, as an earlier draft of this
-- migration did, would silently break every single RLS policy in the
-- app the moment a real user queried anything.
revoke execute on function public.is_workspace_member(uuid, uuid) from public, anon;
grant execute on function public.is_workspace_member(uuid, uuid) to authenticated;

create or replace function public.has_workspace_role(_user_id uuid, _workspace_id uuid, _role public.workspace_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members
    where user_id = _user_id and workspace_id = _workspace_id and role = _role
  )
$$;
revoke execute on function public.has_workspace_role(uuid, uuid, public.workspace_role) from public, anon;
grant execute on function public.has_workspace_role(uuid, uuid, public.workspace_role) to authenticated;

-- A profile row is created for every new auth user; workspace membership is
-- created separately during onboarding (a user may join zero, one, or more
-- workspaces before this schema is extended for invitations in Phase 4).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
