-- Phase 2: pipeline -> project automation. A deal moving to 'won' creates
-- a project (with phases copied from the workspace's default template)
-- and a delivery handoff record — see docs/sales-ops/PIPELINE_REQUIREMENTS.md
-- #11: delivery needs scope, logins and what was signed, and must give a
-- same-day acknowledgement so sales can promise a start date.

create table public.project_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- Only one default template per workspace — the trigger below picks it
-- deterministically instead of guessing among several.
create unique index project_templates_one_default_per_workspace
  on public.project_templates (workspace_id)
  where is_default;

create table public.project_template_phases (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.project_templates(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  deal_id uuid unique references public.deals(id) on delete set null,
  name text not null,
  status text not null default 'active' check (status in ('active', 'on_hold', 'completed')),
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_phases (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.deal_handoffs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  deal_id uuid not null unique references public.deals(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  scope text,
  logins_note text,
  signed_document_url text,
  handed_off_by uuid references auth.users(id) on delete set null,
  handed_off_at timestamptz not null default now(),
  acknowledged_by uuid references auth.users(id) on delete set null,
  acknowledged_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.project_templates enable row level security;
alter table public.project_template_phases enable row level security;
alter table public.projects enable row level security;
alter table public.project_phases enable row level security;
alter table public.deal_handoffs enable row level security;

revoke all on
  public.project_templates, public.project_template_phases, public.projects,
  public.project_phases, public.deal_handoffs
from anon, authenticated;

grant select, insert, update, delete on
  public.project_templates, public.project_template_phases, public.projects,
  public.project_phases, public.deal_handoffs
to authenticated;

grant all on
  public.project_templates, public.project_template_phases, public.projects,
  public.project_phases, public.deal_handoffs
to service_role;

create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger project_phases_updated_at before update on public.project_phases
  for each row execute function public.set_updated_at();
create trigger deal_handoffs_updated_at before update on public.deal_handoffs
  for each row execute function public.set_updated_at();

-- Seed a default delivery template for every new workspace, alongside the
-- pipeline seed data from the previous migration.
create or replace function public.seed_default_project_template()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_template_id uuid;
begin
  insert into public.project_templates (workspace_id, name, is_default)
  values (new.id, 'Website delivery', true)
  returning id into v_template_id;

  insert into public.project_template_phases (template_id, name, sort_order) values
    (v_template_id, 'Kickoff', 1),
    (v_template_id, 'Design', 2),
    (v_template_id, 'Build', 3),
    (v_template_id, 'Review', 4),
    (v_template_id, 'Launch', 5);

  return new;
end;
$$;
revoke execute on function public.seed_default_project_template() from public, anon, authenticated;

create trigger on_workspace_created_seed_project_template
  after insert on public.workspaces
  for each row execute function public.seed_default_project_template();

-- The automation itself: a deal moving to 'won' creates a project (named
-- from the account and package), copies phases from the workspace's
-- default template, and opens a handoff record for delivery to acknowledge.
create or replace function public.handle_deal_won()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_name text;
  v_package_name text;
  v_template_id uuid;
  v_project_id uuid;
begin
  if new.status <> 'won' or old.status = 'won' then
    return new;
  end if;

  -- Idempotent per deal: a deal can be reopened and won again (the
  -- Pipeline board's "Reopen" action allows exactly that), and this must
  -- not attempt a second project row against the unique deal_id column.
  select id into v_project_id from public.projects where deal_id = new.id;

  if v_project_id is null then
    select name into v_account_name from public.accounts where id = new.account_id;
    if new.package_id is not null then
      select name into v_package_name from public.packages where id = new.package_id;
    end if;

    insert into public.projects (workspace_id, account_id, deal_id, name, owner_id)
    values (
      new.workspace_id,
      new.account_id,
      new.id,
      coalesce(v_account_name, 'Untitled account') || case when v_package_name is not null then ' — ' || v_package_name else '' end,
      new.owner_id
    )
    returning id into v_project_id;

    select id into v_template_id
    from public.project_templates
    where workspace_id = new.workspace_id and is_default
    limit 1;

    if v_template_id is not null then
      insert into public.project_phases (workspace_id, project_id, name, sort_order)
      select new.workspace_id, v_project_id, name, sort_order
      from public.project_template_phases
      where template_id = v_template_id
      order by sort_order;
    end if;
  end if;

  insert into public.deal_handoffs (workspace_id, deal_id, project_id, handed_off_by)
  values (new.workspace_id, new.id, v_project_id, new.owner_id)
  on conflict (deal_id) do nothing;

  return new;
end;
$$;
revoke execute on function public.handle_deal_won() from public, anon, authenticated;

create trigger on_deal_won_create_project
  after update on public.deals
  for each row execute function public.handle_deal_won();
