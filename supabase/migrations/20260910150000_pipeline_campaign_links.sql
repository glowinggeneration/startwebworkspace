-- Links a campaign and a quote to a specific project (invoices already have
-- project_id), a per-phase deadline, and an idempotent send-log for the
-- deadline/next-action reminder emails. Every change here is additive —
-- existing rows simply get NULL for the new columns.

alter table public.campaigns
  add column project_id uuid references public.projects(id) on delete set null;
create index campaigns_project_id_idx on public.campaigns (project_id);

alter table public.quotes
  add column project_id uuid references public.projects(id) on delete set null;
create index quotes_project_id_idx on public.quotes (project_id);

alter table public.project_phases
  add column due_date date;

-- One row per reminder actually sent, keyed so the same deadline can never
-- fire twice even if the cron job retries or runs more than once in a day.
create table public.reminder_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  reminder_key text not null,
  recipient_email text not null,
  sent_at timestamptz not null default now(),
  unique (workspace_id, reminder_key, recipient_email)
);

alter table public.reminder_log enable row level security;
revoke all on public.reminder_log from anon, authenticated;
grant select on public.reminder_log to authenticated;
grant all on public.reminder_log to service_role;

create policy "Members can read the reminder log" on public.reminder_log for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
