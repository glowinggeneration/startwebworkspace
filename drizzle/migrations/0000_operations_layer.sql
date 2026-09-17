-- Operations layer: activity events, calling-list imports, richer nightly close.

-- 1. Where a company sits: targeted prospect or existing client.
alter table public.accounts
  add column if not exists world text not null default 'targeted';

-- 2. Calling lists imported from Excel keep their name so reports can
--    say which sheet produced conversations.
create table if not exists public.calling_list_imports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  file_name text not null,
  list_name text,
  column_mapping jsonb not null default '{}'::jsonb,
  row_count integer not null default 0,
  companies_created integer not null default 0,
  activities_created integer not null default 0,
  imported_at timestamptz not null default now()
);

grant select, insert, update, delete on public.calling_list_imports to authenticated;
grant all on public.calling_list_imports to service_role;
alter table public.calling_list_imports enable row level security;

create policy "Members can read calling list imports" on public.calling_list_imports
  for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));
create policy "Members can write their own calling list imports" on public.calling_list_imports
  for all to authenticated
  using (user_id = auth.uid() and public.is_workspace_member(auth.uid(), workspace_id))
  with check (user_id = auth.uid() and public.is_workspace_member(auth.uid(), workspace_id));

-- 3. Every logged action belongs to a company and a day.
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  account_id uuid references public.accounts(id) on delete cascade,
  event_date date not null default current_date,
  event_type text not null,
  outcome text,
  notes text,
  hours numeric(6,2) not null default 0,
  units integer not null default 1,
  contact_name text,
  list_import_id uuid references public.calling_list_imports(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists activity_events_workspace_date_idx
  on public.activity_events (workspace_id, event_date);
create index if not exists activity_events_account_idx
  on public.activity_events (account_id);

grant select, insert, update, delete on public.activity_events to authenticated;
grant all on public.activity_events to service_role;
alter table public.activity_events enable row level security;

create policy "Members can read the team's activity events" on public.activity_events
  for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id) and not public.is_client_role(auth.uid(), workspace_id));
create policy "A member can write their own activity events" on public.activity_events
  for all to authenticated
  using (user_id = auth.uid() and public.is_workspace_member(auth.uid(), workspace_id))
  with check (user_id = auth.uid() and public.is_workspace_member(auth.uid(), workspace_id));

create trigger activity_events_updated_at
  before update on public.activity_events
  for each row execute function public.set_updated_at();

-- 4. Nightly close fields on the existing daily row.
alter table public.daily_activity_log
  add column if not exists theme text,
  add column if not exists calling_block_kept boolean,
  add column if not exists research_hours numeric(6,2) not null default 0,
  add column if not exists content_units integer not null default 0,
  add column if not exists follow_ups integer not null default 0,
  add column if not exists list_file_name text,
  add column if not exists closed_at timestamptz;
