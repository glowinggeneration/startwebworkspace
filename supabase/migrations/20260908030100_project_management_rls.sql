-- RLS for Phase 3 tables — same workspace-member pattern as before.

create policy "Members can read tasks" on public.tasks for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage tasks" on public.tasks for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read task assignees" on public.task_assignees for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage task assignees" on public.task_assignees for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));

create policy "Members can read resource allocations" on public.resource_allocations for select to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id));
create policy "Members can manage resource allocations" on public.resource_allocations for all to authenticated
  using (public.is_workspace_member(auth.uid(), workspace_id))
  with check (public.is_workspace_member(auth.uid(), workspace_id));
