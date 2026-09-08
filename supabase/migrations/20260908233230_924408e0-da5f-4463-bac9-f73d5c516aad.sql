-- Phase 3: tasks under phases, multi-assignee support, resource
-- allocation, and the automated completion cascade (task -> phase ->
-- project), matching the Monday.com-style "automated state transitions"
-- requirement from the original brief.

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  phase_id uuid not null references public.project_phases(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

create table public.resource_allocations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  week_start date not null,
  allocated_hours numeric(5, 2) not null default 0 check (allocated_hours >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id, project_id, week_start)
);

alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.resource_allocations enable row level security;

revoke all on public.tasks, public.task_assignees, public.resource_allocations from anon, authenticated;
grant select, insert, update, delete on public.tasks, public.task_assignees, public.resource_allocations to authenticated;
grant all on public.tasks, public.task_assignees, public.resource_allocations to service_role;

create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger resource_allocations_updated_at before update on public.resource_allocations
  for each row execute function public.set_updated_at();

-- The cascade: recompute one phase's status from its tasks, then that
-- phase's project status from all its phases. Called from the tasks
-- trigger below, and safe to call redundantly (it's a pure recompute,
-- not an increment/decrement, so it can never drift from actual state).
create or replace function public.recompute_phase_and_project_status(p_phase_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project_id uuid;
  v_total int;
  v_done int;
  v_in_progress int;
  v_new_phase_status public.project_phases.status%type;
  v_total_phases int;
  v_done_phases int;
begin
  select project_id into v_project_id from public.project_phases where id = p_phase_id;
  if v_project_id is null then
    return;
  end if;

  select
    count(*),
    count(*) filter (where status = 'done'),
    count(*) filter (where status = 'in_progress')
  into v_total, v_done, v_in_progress
  from public.tasks
  where phase_id = p_phase_id;

  v_new_phase_status := case
    when v_total = 0 then 'not_started'
    when v_done = v_total then 'done'
    when v_done > 0 or v_in_progress > 0 then 'in_progress'
    else 'not_started'
  end;

  update public.project_phases
  set status = v_new_phase_status
  where id = p_phase_id and status <> v_new_phase_status;

  select count(*), count(*) filter (where status = 'done')
  into v_total_phases, v_done_phases
  from public.project_phases
  where project_id = v_project_id;

  if v_total_phases > 0 and v_done_phases = v_total_phases then
    update public.projects set status = 'completed' where id = v_project_id and status <> 'completed';
  elsif v_done_phases < v_total_phases then
    -- A phase was reopened after the project had been marked complete.
    update public.projects set status = 'active' where id = v_project_id and status = 'completed';
  end if;
end;
$$;
revoke execute on function public.recompute_phase_and_project_status(uuid) from public, anon, authenticated;

create or replace function public.handle_task_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'DELETE' then
    perform public.recompute_phase_and_project_status(old.phase_id);
    return old;
  end if;

  perform public.recompute_phase_and_project_status(new.phase_id);
  if TG_OP = 'UPDATE' and old.phase_id is distinct from new.phase_id then
    perform public.recompute_phase_and_project_status(old.phase_id);
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_task_change() from public, anon, authenticated;

create trigger on_task_change_recompute_status
  after insert or update of status, phase_id or delete on public.tasks
  for each row execute function public.handle_task_change();